import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Matricula um aluno em um curso
   */
  async enroll(courseId: string, userId: string) {
    // Verifica se curso existe e está publicado
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Curso não encontrado');
    }

    if (!course.isPublished) {
      throw new BadRequestException('Este curso não está disponível para matrícula');
    }

    // Verifica se já está matriculado
    const existing = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Você já está matriculado neste curso');
    }

    // Cria matrícula
    const enrollment = await this.prisma.enrollment.create({
      data: {
        userId,
        courseId,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            coverImage: true,
            workloadHours: true,
          },
        },
      },
    });

    // Log de auditoria
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'ENROLLMENT_CREATED',
        entity: 'Enrollment',
        entityId: enrollment.id,
        meta: {
          courseId,
          courseTitle: course.title,
        },
      },
    });

    return enrollment;
  }

  /**
   * Lista cursos do aluno autenticado
   */
  async getMyCourses(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            modules: {
              orderBy: { order: 'asc' },
              include: {
                lessons: {
                  orderBy: { order: 'asc' },
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        lessonProgress: {
          where: {
            completedAt: { not: null },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Recalcula e atualiza o progresso de cada matrícula
    const enrollmentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const totalLessons = enrollment.course.modules.reduce(
          (acc, module) => acc + module.lessons.length,
          0,
        );

        const completedLessons = enrollment.lessonProgress.length;

        const progressPercent =
          totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

        // Atualiza progresso no banco se mudou
        if (enrollment.progressPercent !== progressPercent) {
          await this.prisma.enrollment.update({
            where: { id: enrollment.id },
            data: { progressPercent },
          });
        }

        return {
          ...enrollment,
          progressPercent,
        };
      }),
    );

    return enrollmentsWithProgress;
  }

  /**
   * Busca progresso detalhado de um curso
   */
  async getCourseProgress(courseId: string, userId: string) {
    // Verifica matrícula
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      include: {
        course: {
          include: {
            modules: {
              orderBy: { order: 'asc' },
              include: {
                lessons: {
                  orderBy: { order: 'asc' },
                  include: {
                    video: {
                      select: {
                        id: true,
                        status: true,
                        durationSec: true,
                        thumbnails: true,
                      },
                    },
                  },
                },
                quizzes: {
                  select: {
                    id: true,
                    title: true,
                    minScore: true,
                    attemptsAllowed: true,
                  },
                },
              },
            },
          },
        },
        lessonProgress: {
          include: {
            lesson: true,
          },
        },
        attempts: {
          include: {
            quiz: true,
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Você não está matriculado neste curso');
    }

    // Calcula progresso
    const totalLessons = enrollment.course.modules.reduce(
      (acc, module) => acc + module.lessons.length,
      0,
    );

    const completedLessons = enrollment.lessonProgress.filter(
      (lp) => lp.completedAt !== null,
    ).length;

    const progressPercent =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Atualiza progresso se mudou
    if (enrollment.progressPercent !== progressPercent) {
      await this.prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { progressPercent },
      });
    }

    return {
      ...enrollment,
      progressPercent,
      stats: {
        totalLessons,
        completedLessons,
      },
    };
  }

  /**
   * Cancela matrícula (apenas se sem progresso significativo)
   */
  async unenroll(courseId: string, userId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      include: {
        course: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Você não está matriculado neste curso');
    }

    // Verifica se tem progresso significativo (>20%) ou já concluiu
    if (enrollment.progressPercent > 20 || enrollment.completedAt) {
      throw new BadRequestException(
        'Não é possível cancelar matrícula com progresso significativo ou curso concluído',
      );
    }

    await this.prisma.enrollment.delete({
      where: { id: enrollment.id },
    });

    // Log de auditoria
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'ENROLLMENT_CANCELLED',
        entity: 'Enrollment',
        entityId: enrollment.id,
        meta: {
          courseId,
          courseTitle: enrollment.course.title,
        },
      },
    });

    return {
      message: 'Matrícula cancelada com sucesso',
    };
  }

  /**
   * Verifica se usuário está matriculado em um curso
   */
  async isEnrolled(userId: string, courseId: string): Promise<boolean> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    return !!enrollment;
  }

  /**
   * Busca matrícula por ID
   */
  async findById(enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Matrícula não encontrada');
    }

    return enrollment;
  }
}
