import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto, UpdateLessonDto } from './dto';

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Cria uma nova aula
   */
  async create(dto: CreateLessonDto, userId: string) {
    // Verifica se módulo existe
    const module = await this.prisma.module.findUnique({
      where: { id: dto.moduleId },
      include: {
        course: true,
      },
    });

    if (!module) {
      throw new NotFoundException('Módulo não encontrado');
    }

    // Verifica permissões
    await this.checkPermissions(module.course.id, userId);

    // Se videoId foi fornecido, verifica se vídeo existe e está pronto
    if (dto.videoId) {
      const video = await this.prisma.video.findUnique({
        where: { id: dto.videoId },
      });

      if (!video) {
        throw new NotFoundException('Vídeo não encontrado');
      }

      // Verifica se vídeo já está associado a outra aula
      const existingLesson = await this.prisma.lesson.findUnique({
        where: { videoId: dto.videoId },
      });

      if (existingLesson) {
        throw new ConflictException('Este vídeo já está associado a outra aula');
      }
    }

    // Verifica se já existe aula com essa ordem no módulo
    const existingLesson = await this.prisma.lesson.findUnique({
      where: {
        moduleId_order: {
          moduleId: dto.moduleId,
          order: dto.order,
        },
      },
    });

    if (existingLesson) {
      throw new ConflictException(
        `Já existe uma aula com ordem ${dto.order} neste módulo. Use uma ordem diferente.`,
      );
    }

    const lesson = await this.prisma.lesson.create({
      data: dto,
      include: {
        module: {
          select: {
            id: true,
            title: true,
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        video: {
          select: {
            id: true,
            status: true,
            durationSec: true,
            thumbnails: true,
          },
        },
      },
    });

    // Log de auditoria
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'LESSON_CREATED',
        entity: 'Lesson',
        entityId: lesson.id,
        meta: {
          moduleId: dto.moduleId,
          title: lesson.title,
          order: lesson.order,
        },
      },
    });

    return lesson;
  }

  /**
   * Lista aulas de um módulo
   */
  async findByModule(moduleId: string) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      throw new NotFoundException('Módulo não encontrado');
    }

    const lessons = await this.prisma.lesson.findMany({
      where: { moduleId },
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
    });

    return lessons;
  }

  /**
   * Busca aula por ID
   */
  async findOne(id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        module: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                createdById: true,
              },
            },
          },
        },
        video: {
          select: {
            id: true,
            status: true,
            durationSec: true,
            thumbnails: true,
            hlsKeyPrefix: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Aula não encontrada');
    }

    return lesson;
  }

  /**
   * Atualiza aula
   */
  async update(id: string, dto: UpdateLessonDto, userId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        module: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Aula não encontrada');
    }

    // Verifica permissões
    await this.checkPermissions(lesson.module.course.id, userId);

    // Se está alterando videoId, verifica conflitos
    if (dto.videoId !== undefined && dto.videoId !== lesson.videoId) {
      if (dto.videoId) {
        const video = await this.prisma.video.findUnique({
          where: { id: dto.videoId },
        });

        if (!video) {
          throw new NotFoundException('Vídeo não encontrado');
        }

        // Verifica se vídeo já está associado a outra aula
        const existingLesson = await this.prisma.lesson.findUnique({
          where: { videoId: dto.videoId },
        });

        if (existingLesson && existingLesson.id !== id) {
          throw new ConflictException('Este vídeo já está associado a outra aula');
        }
      }
    }

    // Se está alterando a ordem, verifica conflitos
    if (dto.order !== undefined && dto.order !== lesson.order) {
      const existingLesson = await this.prisma.lesson.findUnique({
        where: {
          moduleId_order: {
            moduleId: lesson.moduleId,
            order: dto.order,
          },
        },
      });

      if (existingLesson && existingLesson.id !== id) {
        throw new ConflictException(
          `Já existe uma aula com ordem ${dto.order} neste módulo. Use uma ordem diferente.`,
        );
      }
    }

    const updated = await this.prisma.lesson.update({
      where: { id },
      data: dto,
      include: {
        module: {
          select: {
            id: true,
            title: true,
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        video: {
          select: {
            id: true,
            status: true,
            durationSec: true,
            thumbnails: true,
          },
        },
      },
    });

    // Log de auditoria
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'LESSON_UPDATED',
        entity: 'Lesson',
        entityId: id,
        meta: dto as any,
      },
    });

    return updated;
  }

  /**
   * Deleta aula
   */
  async remove(id: string, userId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        module: {
          include: {
            course: true,
          },
        },
        _count: {
          select: {
            progress: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Aula não encontrada');
    }

    // Verifica permissões
    await this.checkPermissions(lesson.module.course.id, userId);

    // Avisa se aula tem progresso de alunos
    if (lesson._count.progress > 0) {
      throw new BadRequestException(
        'Não é possível deletar aula com progresso de alunos. Considere despublicar o curso.',
      );
    }

    await this.prisma.lesson.delete({
      where: { id },
    });

    // Log de auditoria
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'LESSON_DELETED',
        entity: 'Lesson',
        entityId: id,
        meta: {
          moduleId: lesson.moduleId,
          title: lesson.title,
        },
      },
    });

    return {
      message: 'Aula deletada com sucesso',
    };
  }

  /**
   * Reordena aulas de um módulo
   */
  async reorder(moduleId: string, lessonOrders: { id: string; order: number }[], userId: string) {
    // Verifica se módulo existe
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        course: true,
      },
    });

    if (!module) {
      throw new NotFoundException('Módulo não encontrado');
    }

    // Verifica permissões
    await this.checkPermissions(module.course.id, userId);

    // Verifica se todas as aulas pertencem ao módulo
    const lessonIds = lessonOrders.map((l) => l.id);
    const lessons = await this.prisma.lesson.findMany({
      where: {
        id: { in: lessonIds },
        moduleId,
      },
    });

    if (lessons.length !== lessonIds.length) {
      throw new BadRequestException('Uma ou mais aulas não pertencem a este módulo');
    }

    // Verifica duplicatas de ordem
    const orders = lessonOrders.map((l) => l.order);
    const uniqueOrders = new Set(orders);
    if (uniqueOrders.size !== orders.length) {
      throw new BadRequestException('Ordens duplicadas não são permitidas');
    }

    // Atualiza ordens em uma transação
    await this.prisma.$transaction(
      lessonOrders.map(({ id, order }) =>
        this.prisma.lesson.update({
          where: { id },
          data: { order },
        }),
      ),
    );

    // Log de auditoria
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'LESSONS_REORDERED',
        entity: 'Lesson',
        entityId: moduleId,
        meta: {
          moduleId,
          lessonOrders,
        },
      },
    });

    return {
      message: 'Aulas reordenadas com sucesso',
    };
  }

  /**
   * Verifica se usuário tem permissão para gerenciar aulas do curso
   */
  private async checkPermissions(courseId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ForbiddenException('Usuário não encontrado');
    }

    if (user.role === 'ADMIN') {
      return; // Admin pode tudo
    }

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (user.role === 'INSTRUCTOR' && course?.createdById === userId) {
      return; // Instrutor pode gerenciar seus próprios cursos
    }

    throw new ForbiddenException('Você não tem permissão para gerenciar aulas deste curso');
  }
}
