import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { HeartbeatDto } from './dto/heartbeat.dto';

@Injectable()
export class ProgressService {
  constructor(
    private prisma: PrismaService,
    private enrollmentsService: EnrollmentsService,
  ) {}

  /**
   * Salva progresso via heartbeat
   */
  async heartbeat(dto: HeartbeatDto, userId: string) {
    // Busca a aula e valida
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: dto.lessonId },
      include: {
        module: {
          include: {
            course: true,
          },
        },
        video: {
          select: {
            durationSec: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Aula não encontrada');
    }

    // Verifica se está matriculado
    const isEnrolled = await this.enrollmentsService.isEnrolled(
      userId,
      lesson.module.courseId,
    );

    if (!isEnrolled) {
      throw new ForbiddenException('Você não está matriculado neste curso');
    }

    // Busca ou cria matrícula
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: lesson.module.courseId,
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Matrícula não encontrada');
    }

    // Busca ou cria progresso da aula
    let lessonProgress = await this.prisma.lessonProgress.findUnique({
      where: {
        enrollmentId_lessonId: {
          enrollmentId: enrollment.id,
          lessonId: dto.lessonId,
        },
      },
    });

    if (!lessonProgress) {
      lessonProgress = await this.prisma.lessonProgress.create({
        data: {
          enrollmentId: enrollment.id,
          lessonId: dto.lessonId,
          watchedSeconds: 0,
          lastPositionSec: 0,
        },
      });
    }

    // Atualiza progresso
    const newWatchedSeconds = lessonProgress.watchedSeconds + dto.watchedDeltaSec;

    // Verifica se completou (assistiu % mínima)
    let completedAt = lessonProgress.completedAt;
    if (!completedAt && lesson.video?.durationSec) {
      const watchPercent = (newWatchedSeconds / lesson.video.durationSec) * 100;
      if (watchPercent >= lesson.minWatchPercent) {
        completedAt = new Date();
      }
    }

    const updated = await this.prisma.lessonProgress.update({
      where: { id: lessonProgress.id },
      data: {
        watchedSeconds: newWatchedSeconds,
        lastPositionSec: dto.positionSec,
        completedAt,
      },
    });

    return {
      lessonProgress: updated,
      completed: !!completedAt,
    };
  }

  /**
   * Busca progresso de uma aula
   */
  async getLessonProgress(lessonId: string, userId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: true,
        video: {
          select: {
            id: true,
            durationSec: true,
            status: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Aula não encontrada');
    }

    // Verifica matrícula
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: lesson.module.courseId,
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('Você não está matriculado neste curso');
    }

    // Busca progresso
    const progress = await this.prisma.lessonProgress.findUnique({
      where: {
        enrollmentId_lessonId: {
          enrollmentId: enrollment.id,
          lessonId,
        },
      },
    });

    return {
      lesson: {
        id: lesson.id,
        title: lesson.title,
        minWatchPercent: lesson.minWatchPercent,
        video: lesson.video,
      },
      progress: progress || {
        watchedSeconds: 0,
        lastPositionSec: 0,
        completedAt: null,
      },
    };
  }

  /**
   * Marca aula como concluída (verificando minWatchPercent)
   */
  async completeLesson(lessonId: string, userId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: true,
        video: {
          select: {
            durationSec: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Aula não encontrada');
    }

    // Verifica matrícula
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: lesson.module.courseId,
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('Você não está matriculado neste curso');
    }

    // Busca progresso
    const progress = await this.prisma.lessonProgress.findUnique({
      where: {
        enrollmentId_lessonId: {
          enrollmentId: enrollment.id,
          lessonId,
        },
      },
    });

    if (!progress) {
      throw new BadRequestException('Nenhum progresso registrado para esta aula');
    }

    // Verifica se já completou
    if (progress.completedAt) {
      return {
        message: 'Aula já concluída',
        lessonProgress: progress,
      };
    }

    // Verifica se assistiu % mínima
    if (lesson.video?.durationSec) {
      const watchPercent = (progress.watchedSeconds / lesson.video.durationSec) * 100;
      if (watchPercent < lesson.minWatchPercent) {
        throw new BadRequestException(
          `Você precisa assistir pelo menos ${lesson.minWatchPercent}% da aula para concluí-la`,
        );
      }
    }

    // Marca como concluída
    const updated = await this.prisma.lessonProgress.update({
      where: { id: progress.id },
      data: {
        completedAt: new Date(),
      },
    });

    return {
      message: 'Aula concluída com sucesso',
      lessonProgress: updated,
    };
  }

  /**
   * Verifica se próxima aula está desbloqueada
   */
  async isNextLessonUnlocked(
    currentLessonId: string,
    _nextLessonId: string,
    userId: string,
  ): Promise<boolean> {
    // Busca progresso da aula atual
    const currentLesson = await this.prisma.lesson.findUnique({
      where: { id: currentLessonId },
      include: {
        module: true,
      },
    });

    if (!currentLesson) {
      return false;
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: currentLesson.module.courseId,
        },
      },
    });

    if (!enrollment) {
      return false;
    }

    const progress = await this.prisma.lessonProgress.findUnique({
      where: {
        enrollmentId_lessonId: {
          enrollmentId: enrollment.id,
          lessonId: currentLessonId,
        },
      },
    });

    // Se a aula atual foi concluída, próxima está desbloqueada
    return !!progress?.completedAt;
  }

  /**
   * Lista todas as aulas desbloqueadas de um curso
   */
  async getUnlockedLessons(courseId: string, userId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      include: {
        lessonProgress: {
          where: {
            completedAt: {
              not: null,
            },
          },
          select: {
            lessonId: true,
          },
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('Você não está matriculado neste curso');
    }

    // Busca todos os módulos e aulas do curso
    const modules = await this.prisma.module.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            order: true,
          },
        },
      },
    });

    const completedLessonIds = new Set(
      enrollment.lessonProgress.map((lp) => lp.lessonId),
    );

    // Primeira aula sempre desbloqueada
    const unlockedLessonIds = new Set<string>();
    let previousCompleted = true;

    for (const module of modules) {
      for (const lesson of module.lessons) {
        if (previousCompleted) {
          unlockedLessonIds.add(lesson.id);
        }
        previousCompleted = completedLessonIds.has(lesson.id);
      }
    }

    return {
      unlockedLessonIds: Array.from(unlockedLessonIds),
      completedLessonIds: Array.from(completedLessonIds),
    };
  }
}
