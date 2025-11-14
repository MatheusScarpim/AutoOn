import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface TranscodeJobData {
  videoId: string;
  originalKey: string;
}

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('video-transcoding') private videoQueue: Queue<TranscodeJobData>,
  ) {}

  /**
   * Adiciona job de transcodificação à fila
   */
  async addTranscodeJob(videoId: string, originalKey: string): Promise<void> {
    await this.videoQueue.add(
      'transcode-video',
      { videoId, originalKey },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: {
          age: 86400, // Mantém por 1 dia
          count: 100,
        },
        removeOnFail: {
          age: 604800, // Mantém por 7 dias
        },
      },
    );
  }

  /**
   * Obtém status de um job
   */
  async getJobStatus(jobId: string) {
    const job = await this.videoQueue.getJob(jobId);
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      state: await job.getState(),
      progress: job.progress,
      failedReason: job.failedReason,
      finishedOn: job.finishedOn,
    };
  }

  /**
   * Retorna métricas da fila
   */
  async getQueueMetrics() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.videoQueue.getWaitingCount(),
      this.videoQueue.getActiveCount(),
      this.videoQueue.getCompletedCount(),
      this.videoQueue.getFailedCount(),
      this.videoQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }
}
