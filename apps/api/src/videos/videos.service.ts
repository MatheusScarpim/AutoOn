import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { QueueService } from '../queue/queue.service';
import { InitiateUploadDto, CompleteUploadDto } from './dto';
import * as path from 'path';
import { signUrl, verifySignedUrl } from '@autoon/utils';

@Injectable()
export class VideosService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private queue: QueueService,
  ) {}

  /**
   * Inicia upload multipart de vídeo
   */
  async initiateUpload(dto: InitiateUploadDto, _userId: string) {
    // Cria registro do vídeo no banco
    const video = await this.prisma.video.create({
      data: {
        originalKey: '', // Será definido após complete
        sizeBytes: dto.fileSize,
        status: 'UPLOADING',
      },
    });

    // Calcula estratégia de upload
    const { partSize, partsCount } = this.storage.calculateUploadStrategy(dto.fileSize);

    // Define key no S3
    const originalKey = `uploads/originals/${video.id}/${dto.fileName}`;

    // Inicia upload multipart no S3
    const uploadId = await this.storage.initiateMultipartUpload(originalKey, dto.contentType);

    // Gera URLs presignadas para cada parte
    const uploadUrls = await this.storage.generatePresignedUploadUrls(
      originalKey,
      uploadId,
      partsCount,
    );

    // Atualiza vídeo com uploadId e originalKey
    await this.prisma.video.update({
      where: { id: video.id },
      data: {
        uploadId,
        originalKey,
      },
    });

    return {
      videoId: video.id,
      uploadId,
      key: originalKey,
      partSize,
      partsCount,
      uploadUrls,
      storageProvider: this.storage.provider,
    };
  }

  /**
   * Completa upload multipart e inicia transcodificação
   */
  async completeUpload(videoId: string, dto: CompleteUploadDto, userId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundException('Vídeo não encontrado');
    }

    if (video.status !== 'UPLOADING') {
      throw new BadRequestException('Vídeo não está em estado de upload');
    }

    if (!video.uploadId || !video.originalKey) {
      throw new BadRequestException('Upload não foi iniciado corretamente');
    }

    // Completa upload no S3
    await this.storage.completeMultipartUpload(video.originalKey, video.uploadId, dto.parts);

    // Atualiza status do vídeo
    await this.prisma.video.update({
      where: { id: videoId },
      data: {
        status: 'PROCESSING',
        uploadId: null, // Limpa uploadId após completar
      },
    });

    // Adiciona job de transcodificação à fila
    await this.queue.addTranscodeJob(videoId, video.originalKey);

    // Registra log de auditoria
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'VIDEO_UPLOAD_COMPLETED',
        entity: 'Video',
        entityId: videoId,
        meta: {
          originalKey: video.originalKey,
          sizeBytes: video.sizeBytes.toString(),
        },
      },
    });

    return {
      videoId,
      status: 'PROCESSING',
      message: 'Upload concluído. Vídeo em processamento.',
    };
  }

  /**
   * Obtém status do vídeo
   */
  async getVideoStatus(videoId: string, _userId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      select: {
        id: true,
        status: true,
        durationSec: true,
        thumbnails: true,
        createdAt: true,
        updatedAt: true,
        lesson: {
          select: {
            id: true,
            title: true,
            module: {
              select: {
                courseId: true,
              },
            },
          },
        },
      },
    });

    if (!video) {
      throw new NotFoundException('Vídeo não encontrado');
    }

    return video;
  }

  /**
   * Gera URL assinada para streaming do vídeo
   * Verifica permissões do usuário antes de gerar URL
   */
  async getStreamUrl(videoId: string, userId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });

    if (!video) {
      throw new NotFoundException('Vídeo não encontrado');
    }

    if (video.status !== 'READY') {
      throw new BadRequestException('Vídeo ainda não está pronto para streaming');
    }

    if (!video.hlsKeyPrefix) {
      throw new BadRequestException('Vídeo não possui HLS configurado');
    }

    // Verifica se o vídeo está associado a uma aula
    if (!video.lesson) {
      throw new BadRequestException('Vídeo não está associado a nenhuma aula');
    }

    // Verifica se o usuário tem acesso ao curso
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: video.lesson.module.course.id,
        },
      },
    });

    // Se não for admin/instrutor, precisa estar matriculado
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user?.role === 'STUDENT' && !enrollment) {
      throw new ForbiddenException('Você não tem acesso a este vídeo');
    }

    // Gera URLs assinadas para o master playlist e suas variantes
    const masterPlaylistKey = `${video.hlsKeyPrefix}/master.m3u8`;
    const expiresIn = 300; // 5 minutos

    const masterUrl = await this.storage.generatePresignedUrl(masterPlaylistKey, expiresIn);

    // Registra acesso no log de auditoria
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'VIDEO_STREAM_ACCESS',
        entity: 'Video',
        entityId: videoId,
        meta: {
          lessonId: video.lesson.id,
          courseId: video.lesson.module.course.id,
        },
      },
    });

    return {
      videoId,
      masterPlaylistUrl: masterUrl,
      expiresIn,
      durationSec: video.durationSec,
      thumbnails: video.thumbnails,
    };
  }

  /**
   * Deleta vídeo e seus arquivos
   */
  async deleteVideo(videoId: string, userId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });

    if (!video) {
      throw new NotFoundException('Vídeo não encontrado');
    }

    // Verifica permissões
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const canDelete =
      user?.role === 'ADMIN' ||
      (user?.role === 'INSTRUCTOR' && video.lesson?.module.course.createdById === userId);

    if (!canDelete) {
      throw new ForbiddenException('Você não tem permissão para deletar este vídeo');
    }

    // Lista arquivos para deletar
    const keysToDelete: string[] = [];

    // Arquivo original
    if (video.originalKey) {
      keysToDelete.push(video.originalKey);
    }

    // Arquivos HLS (aproximação - deleta pasta inteira)
    if (video.hlsKeyPrefix) {
      // Nota: MinIO não tem deleção de "pasta", então precisamos listar e deletar
      // Por simplicidade, vamos deletar os arquivos conhecidos
      const hlsFiles = [
        `${video.hlsKeyPrefix}/master.m3u8`,
        `${video.hlsKeyPrefix}/1080p/playlist.m3u8`,
        `${video.hlsKeyPrefix}/720p/playlist.m3u8`,
        `${video.hlsKeyPrefix}/480p/playlist.m3u8`,
      ];
      keysToDelete.push(...hlsFiles);
    }

    // Thumbnails
    if (video.thumbnails.length > 0) {
      keysToDelete.push(...video.thumbnails);
    }

    // Deleta arquivos do S3
    if (keysToDelete.length > 0) {
      await this.storage.deleteFiles(keysToDelete);
    }

    // Deleta registro do banco
    await this.prisma.video.delete({
      where: { id: videoId },
    });

    // Log de auditoria
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'VIDEO_DELETED',
        entity: 'Video',
        entityId: videoId,
        meta: {
          originalKey: video.originalKey,
        },
      },
    });

    return {
      message: 'Vídeo deletado com sucesso',
    };
  }
}
