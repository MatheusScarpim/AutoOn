import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { TranscodeJobData } from '../queue.service';

interface Resolution {
  name: string;
  width: number;
  height: number;
  videoBitrate: string;
  audioBitrate: string;
}

@Processor('video-transcoding', {
  /**
   * Transcoding can take a while, so extend the lock duration to prevent BullMQ
   * from retrying the job while ffmpeg is still running.
   */
  lockDuration: 600000, // 10 minutes
  concurrency: 1,
})
export class VideoProcessor extends WorkerHost {
  private readonly logger = new Logger(VideoProcessor.name);

  // Ladder de qualidades para HLS
  private readonly resolutions: Resolution[] = [
    { name: '1080p', width: 1920, height: 1080, videoBitrate: '5000k', audioBitrate: '192k' },
    { name: '720p', width: 1280, height: 720, videoBitrate: '2500k', audioBitrate: '128k' },
    { name: '480p', width: 854, height: 480, videoBitrate: '1000k', audioBitrate: '96k' },
  ];

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {
    super();
  }

  async process(job: Job<TranscodeJobData>): Promise<void> {
    const { videoId, originalKey } = job.data;
    this.logger.log(`Iniciando transcodificação do vídeo ${videoId}`);

    try {
      // Atualiza status para PROCESSING
      await this.prisma.video.update({
        where: { id: videoId },
        data: { status: 'PROCESSING' },
      });

      // Cria diretório temporário
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'video-'));
      const inputPath = path.join(tempDir, 'input.mp4');
      const outputDir = path.join(tempDir, 'output');
      await fs.mkdir(outputDir, { recursive: true });

      try {
        // 1. Download do vídeo original
        await job.updateProgress(10);
        this.logger.log(`Baixando vídeo original: ${originalKey}`);
        const videoBuffer = await this.storage.downloadFile(originalKey);
        await fs.writeFile(inputPath, videoBuffer);

        // 2. Extrai metadados do vídeo
        await job.updateProgress(20);
        const metadata = await this.getVideoMetadata(inputPath);
        this.logger.log(`Duração do vídeo: ${metadata.duration}s`);

        // 3. Gera thumbnail
        await job.updateProgress(30);
        this.logger.log('Gerando thumbnails...');
        const thumbnails = await this.generateThumbnails(inputPath, tempDir, videoId);

        // 4. Transcodifica para HLS com múltiplas resoluções
        await job.updateProgress(40);
        this.logger.log('Transcodificando para HLS...');
        await this.transcodeToHLS(inputPath, outputDir, (progress) => {
          const jobProgress = 40 + Math.floor(progress * 0.5); // 40-90%
          job.updateProgress(jobProgress);
        });

        // 5. Upload dos arquivos HLS para S3
        await job.updateProgress(90);
        this.logger.log('Fazendo upload dos arquivos HLS...');
        const hlsKeyPrefix = `videos/${videoId}/hls`;
        await this.uploadHLSFiles(outputDir, hlsKeyPrefix);

        // 6. Atualiza banco de dados
        await job.updateProgress(95);
        await this.prisma.video.update({
          where: { id: videoId },
          data: {
            status: 'READY',
            hlsKeyPrefix,
            durationSec: Math.floor(metadata.duration),
            thumbnails,
          },
        });

        await job.updateProgress(100);
        this.logger.log(`Transcodificação concluída para vídeo ${videoId}`);
      } finally {
        // Limpa arquivos temporários
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    } catch (error) {
      this.logger.error(`Erro ao transcodificar vídeo ${videoId}:`, error);

      // Atualiza status para ERROR
      await this.prisma.video.update({
        where: { id: videoId },
        data: { status: 'ERROR' },
      });

      throw error;
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`Processando job ${job.id} para vídeo ${job.data.videoId}`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completado com sucesso`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} falhou:`, error);
  }

  /**
   * Extrai metadados do vídeo usando FFprobe
   */
  private getVideoMetadata(inputPath: string): Promise<{ duration: number }> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          return reject(err);
        }
        resolve({
          duration: metadata.format.duration || 0,
        });
      });
    });
  }

  /**
   * Gera thumbnails do vídeo
   */
  private async generateThumbnails(
    inputPath: string,
    tempDir: string,
    videoId: string,
  ): Promise<string[]> {
    const thumbnailsDir = path.join(tempDir, 'thumbnails');
    await fs.mkdir(thumbnailsDir, { recursive: true });

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .screenshots({
          count: 3,
          folder: thumbnailsDir,
          filename: 'thumb-%i.jpg',
          size: '320x180',
        })
        .on('end', async () => {
          try {
            // Upload thumbnails para S3
            const files = await fs.readdir(thumbnailsDir);
            const uploadPromises = files.map(async (file) => {
              const filePath = path.join(thumbnailsDir, file);
              const buffer = await fs.readFile(filePath);
              const key = `videos/${videoId}/thumbnails/${file}`;
              await this.storage.uploadFile(key, buffer, 'image/jpeg');
              return key;
            });

            const keys = await Promise.all(uploadPromises);
            resolve(keys);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  }

  /**
   * Transcodifica vídeo para HLS com múltiplas resoluções
   */
  private async transcodeToHLS(
    inputPath: string,
    outputDir: string,
    onProgress?: (progress: number) => void,
  ): Promise<void> {
    // Gera versões em diferentes resoluções
    const transcodePromises = this.resolutions.map((resolution) => {
      return this.transcodeResolution(inputPath, outputDir, resolution, onProgress);
    });

    await Promise.all(transcodePromises);

    // Gera master playlist
    await this.generateMasterPlaylist(outputDir);
  }

  /**
   * Transcodifica para uma resolução específica
   */
  private transcodeResolution(
    inputPath: string,
    outputDir: string,
    resolution: Resolution,
    onProgress?: (progress: number) => void,
  ): Promise<void> {
    const resolutionDir = path.join(outputDir, resolution.name);
    const playlistPath = path.join(resolutionDir, 'playlist.m3u8');

    return new Promise((resolve, reject) => {
      fs.mkdir(resolutionDir, { recursive: true })
        .then(() => {
          ffmpeg(inputPath)
            .outputOptions([
              '-c:v libx264', // Codec de vídeo
              '-preset fast', // Preset de encoding
              `-b:v ${resolution.videoBitrate}`, // Bitrate de vídeo
              `-maxrate ${resolution.videoBitrate}`,
              `-bufsize ${parseInt(resolution.videoBitrate) * 2}k`,
              `-vf scale=${resolution.width}:${resolution.height}`, // Resolução
              '-c:a aac', // Codec de áudio
              `-b:a ${resolution.audioBitrate}`, // Bitrate de áudio
              '-f hls', // Formato HLS
              '-hls_time 6', // Duração de cada segmento
              '-hls_playlist_type vod', // Tipo de playlist
              '-hls_segment_filename', path.join(resolutionDir, 'segment%03d.ts'),
            ])
            .output(playlistPath)
            .on('progress', (progress) => {
              if (onProgress && progress.percent) {
                onProgress(progress.percent / 100);
              }
            })
            .on('end', () => resolve())
            .on('error', (err) => reject(err))
            .run();
        })
        .catch(reject);
    });
  }

  /**
   * Gera master playlist que lista todas as variantes
   */
  private async generateMasterPlaylist(outputDir: string): Promise<void> {
    const masterPlaylist = ['#EXTM3U', '#EXT-X-VERSION:3'];

    for (const resolution of this.resolutions) {
      const bandwidth = parseInt(resolution.videoBitrate) * 1000 + parseInt(resolution.audioBitrate) * 1000;
      masterPlaylist.push(
        `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolution.width}x${resolution.height}`,
        `${resolution.name}/playlist.m3u8`,
      );
    }

    const masterPath = path.join(outputDir, 'master.m3u8');
    await fs.writeFile(masterPath, masterPlaylist.join('\n'));
  }

  /**
   * Faz upload de todos os arquivos HLS para S3
   */
  private async uploadHLSFiles(outputDir: string, hlsKeyPrefix: string): Promise<void> {
    const uploadFile = async (filePath: string, relativePath: string) => {
      const buffer = await fs.readFile(filePath);
      const key = `${hlsKeyPrefix}/${relativePath}`;
      const contentType = filePath.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/mp2t';
      await this.storage.uploadFile(key, buffer, contentType);
    };

    const processDirectory = async (dirPath: string, baseDir: string) => {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(baseDir, fullPath);

        if (entry.isDirectory()) {
          await processDirectory(fullPath, baseDir);
        } else {
          await uploadFile(fullPath, relativePath);
        }
      }
    };

    await processDirectory(outputDir, outputDir);
  }
}
