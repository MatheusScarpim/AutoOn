import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Relatório de engajamento de um curso
   */
  async getCourseEngagement(courseId: string, userId: string) {
    await this.validateInstructorAccess(courseId, userId);

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            lessonProgress: {
              where: {
                completedAt: {
                  not: null,
                },
              },
            },
          },
        },
        modules: {
          include: {
            lessons: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Curso não encontrado');
    }

    const totalLessons = course.modules.reduce(
      (acc, module) => acc + module.lessons.length,
      0,
    );

    const totalEnrollments = course.enrollments.length;
    const completedEnrollments = course.enrollments.filter(
      (e) => e.completedAt !== null,
    ).length;
    const inProgressEnrollments = totalEnrollments - completedEnrollments;

    const averageProgress =
      totalEnrollments > 0
        ? course.enrollments.reduce((acc, e) => acc + e.progressPercent, 0) /
          totalEnrollments
        : 0;

    const studentsProgress = course.enrollments.map((enrollment) => ({
      student: enrollment.user,
      progressPercent: enrollment.progressPercent,
      completedLessons: enrollment.lessonProgress.length,
      totalLessons,
      completedAt: enrollment.completedAt,
      enrolledAt: enrollment.createdAt,
    }));

    return {
      course: {
        id: course.id,
        title: course.title,
      },
      stats: {
        totalEnrollments,
        completedEnrollments,
        inProgressEnrollments,
        completionRate:
          totalEnrollments > 0
            ? (completedEnrollments / totalEnrollments) * 100
            : 0,
        averageProgress: Math.round(averageProgress),
        totalLessons,
      },
      students: studentsProgress,
    };
  }

  /**
   * Relatório de retenção de um vídeo
   */
  async getVideoRetention(videoId: string, userId: string) {
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
            progress: {
              select: {
                watchedSeconds: true,
                completedAt: true,
              },
            },
          },
        },
      },
    });

    if (!video || !video.lesson) {
      throw new NotFoundException('Vídeo ou aula não encontrado');
    }

    await this.validateInstructorAccess(
      video.lesson.module.course.id,
      userId,
    );

    const totalViews = video.lesson.progress.length;
    const completedViews = video.lesson.progress.filter(
      (p) => p.completedAt !== null,
    ).length;

    const averageWatchTime =
      totalViews > 0
        ? video.lesson.progress.reduce((acc, p) => acc + p.watchedSeconds, 0) /
          totalViews
        : 0;

    const retentionRate =
      video.durationSec && totalViews > 0
        ? (averageWatchTime / video.durationSec) * 100
        : 0;

    const completionRate =
      totalViews > 0 ? (completedViews / totalViews) * 100 : 0;

    return {
      video: {
        id: video.id,
        lesson: video.lesson.title,
        module: video.lesson.module.title,
        course: video.lesson.module.course.title,
        durationSec: video.durationSec,
      },
      stats: {
        totalViews,
        completedViews,
        averageWatchTimeSec: Math.round(averageWatchTime),
        retentionRate: Math.round(retentionRate),
        completionRate: Math.round(completionRate),
      },
    };
  }

  /**
   * Relatório individual do aluno
   */
  async getStudentReport(studentId: string, requesterId: string) {
    // Verifica permissões
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
    });

    const canAccess =
      requester?.role === 'ADMIN' || requesterId === studentId;

    if (!canAccess) {
      throw new ForbiddenException(
        'Você não tem permissão para visualizar este relatório',
      );
    }

    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                workloadHours: true,
              },
            },
            lessonProgress: {
              where: {
                completedAt: {
                  not: null,
                },
              },
            },
            attempts: {
              include: {
                quiz: {
                  select: {
                    title: true,
                  },
                },
              },
            },
            certificate: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Aluno não encontrado');
    }

    const coursesProgress = student.enrollments.map((enrollment) => {
      const totalQuizzes = enrollment.attempts.length;
      const passedQuizzes = enrollment.attempts.filter(
        (a) => a.score >= 70, // Assumindo nota mínima de 70
      ).length;

      return {
        course: enrollment.course,
        progressPercent: enrollment.progressPercent,
        completedLessons: enrollment.lessonProgress.length,
        completedAt: enrollment.completedAt,
        enrolledAt: enrollment.createdAt,
        quizzesAttempted: totalQuizzes,
        quizzesPassed: passedQuizzes,
        hasCertificate: !!enrollment.certificate,
      };
    });

    const totalCourses = student.enrollments.length;
    const completedCourses = student.enrollments.filter(
      (e) => e.completedAt !== null,
    ).length;
    const totalWatchTime = await this.getTotalWatchTime(studentId);

    return {
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        role: student.role,
      },
      stats: {
        totalCourses,
        completedCourses,
        inProgressCourses: totalCourses - completedCourses,
        totalWatchTimeMinutes: Math.round(totalWatchTime / 60),
      },
      courses: coursesProgress,
    };
  }

  /**
   * Relatório geral de quizzes de um curso
   */
  async getCourseQuizReport(courseId: string, userId: string) {
    await this.validateInstructorAccess(courseId, userId);

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            quizzes: {
              include: {
                attempts: {
                  include: {
                    enrollment: {
                      include: {
                        user: {
                          select: {
                            id: true,
                            name: true,
                            email: true,
                          },
                        },
                      },
                    },
                  },
                },
                _count: {
                  select: {
                    questions: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Curso não encontrado');
    }

    const quizzes = course.modules.flatMap((module) =>
      module.quizzes.map((quiz) => {
        const totalAttempts = quiz.attempts.length;
        const passedAttempts = quiz.attempts.filter(
          (a) => a.score >= quiz.minScore,
        ).length;
        const averageScore =
          totalAttempts > 0
            ? quiz.attempts.reduce((acc, a) => acc + a.score, 0) / totalAttempts
            : 0;

        return {
          quiz: {
            id: quiz.id,
            title: quiz.title,
            module: module.title,
            minScore: quiz.minScore,
            questionsCount: quiz._count.questions,
          },
          stats: {
            totalAttempts,
            passedAttempts,
            failedAttempts: totalAttempts - passedAttempts,
            passRate:
              totalAttempts > 0 ? (passedAttempts / totalAttempts) * 100 : 0,
            averageScore: Math.round(averageScore),
          },
        };
      }),
    );

    return {
      course: {
        id: course.id,
        title: course.title,
      },
      quizzes,
    };
  }

  /**
   * Calcula tempo total assistido pelo aluno
   */
  private async getTotalWatchTime(userId: string): Promise<number> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        lessonProgress: {
          select: {
            watchedSeconds: true,
          },
        },
      },
    });

    return enrollments.reduce(
      (total, enrollment) =>
        total +
        enrollment.lessonProgress.reduce(
          (acc, lp) => acc + lp.watchedSeconds,
          0,
        ),
      0,
    );
  }

  /**
   * Valida acesso de instrutor/admin ao curso
   */
  private async validateInstructorAccess(courseId: string, userId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Curso não encontrado');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const canAccess = user?.role === 'ADMIN' || course.createdById === userId;

    if (!canAccess) {
      throw new ForbiddenException(
        'Você não tem permissão para visualizar este relatório',
      );
    }
  }
}
