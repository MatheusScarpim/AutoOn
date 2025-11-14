import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateModuleDto, UpdateModuleDto } from './dto';

@Injectable()
export class ModulesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Cria um novo módulo
   */
  async create(dto: CreateModuleDto, userId: string) {
    // Verifica se curso existe
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Curso não encontrado');
    }

    // Verifica permissões
    await this.checkPermissions(course.id, userId);

    // Verifica se já existe módulo com essa ordem
    const existingModule = await this.prisma.module.findUnique({
      where: {
        courseId_order: {
          courseId: dto.courseId,
          order: dto.order,
        },
      },
    });

    if (existingModule) {
      throw new ConflictException(
        `Já existe um módulo com ordem ${dto.order} neste curso. Use uma ordem diferente.`,
      );
    }

    const module = await this.prisma.module.create({
      data: dto,
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            lessons: true,
            quizzes: true,
          },
        },
      },
    });

    // Log de auditoria
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'MODULE_CREATED',
        entity: 'Module',
        entityId: module.id,
        meta: {
          courseId: dto.courseId,
          title: module.title,
          order: module.order,
        },
      },
    });

    return module;
  }

  /**
   * Lista módulos de um curso
   */
  async findByCourse(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Curso não encontrado');
    }

    const modules = await this.prisma.module.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: {
            lessons: true,
            quizzes: true,
          },
        },
        lessons: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            order: true,
            videoId: true,
            video: {
              select: {
                id: true,
                status: true,
                durationSec: true,
              },
            },
          },
        },
      },
    });

    return modules;
  }

  /**
   * Busca módulo por ID
   */
  async findOne(id: string) {
    const module = await this.prisma.module.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            createdById: true,
          },
        },
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
    });

    if (!module) {
      throw new NotFoundException('Módulo não encontrado');
    }

    return module;
  }

  /**
   * Atualiza módulo
   */
  async update(id: string, dto: UpdateModuleDto, userId: string) {
    const module = await this.prisma.module.findUnique({
      where: { id },
      include: {
        course: true,
      },
    });

    if (!module) {
      throw new NotFoundException('Módulo não encontrado');
    }

    // Verifica permissões
    await this.checkPermissions(module.courseId, userId);

    // Se está alterando a ordem, verifica conflitos
    if (dto.order !== undefined && dto.order !== module.order) {
      const existingModule = await this.prisma.module.findUnique({
        where: {
          courseId_order: {
            courseId: module.courseId,
            order: dto.order,
          },
        },
      });

      if (existingModule && existingModule.id !== id) {
        throw new ConflictException(
          `Já existe um módulo com ordem ${dto.order} neste curso. Use uma ordem diferente.`,
        );
      }
    }

    const updated = await this.prisma.module.update({
      where: { id },
      data: dto,
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Log de auditoria
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'MODULE_UPDATED',
        entity: 'Module',
        entityId: id,
        meta: dto as any,
      },
    });

    return updated;
  }

  /**
   * Deleta módulo
   */
  async remove(id: string, userId: string) {
    const module = await this.prisma.module.findUnique({
      where: { id },
      include: {
        course: true,
        _count: {
          select: {
            lessons: true,
            quizzes: true,
          },
        },
      },
    });

    if (!module) {
      throw new NotFoundException('Módulo não encontrado');
    }

    // Verifica permissões
    await this.checkPermissions(module.courseId, userId);

    // Avisa se módulo tem conteúdo
    if (module._count.lessons > 0 || module._count.quizzes > 0) {
      throw new BadRequestException(
        'Não é possível deletar módulo com aulas ou quizzes. Delete o conteúdo primeiro.',
      );
    }

    await this.prisma.module.delete({
      where: { id },
    });

    // Log de auditoria
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'MODULE_DELETED',
        entity: 'Module',
        entityId: id,
        meta: {
          courseId: module.courseId,
          title: module.title,
        },
      },
    });

    return {
      message: 'Módulo deletado com sucesso',
    };
  }

  /**
   * Reordena módulos de um curso
   */
  async reorder(courseId: string, moduleOrders: { id: string; order: number }[], userId: string) {
    // Verifica se curso existe
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Curso não encontrado');
    }

    // Verifica permissões
    await this.checkPermissions(courseId, userId);

    // Verifica se todos os módulos pertencem ao curso
    const moduleIds = moduleOrders.map((m) => m.id);
    const modules = await this.prisma.module.findMany({
      where: {
        id: { in: moduleIds },
        courseId,
      },
    });

    if (modules.length !== moduleIds.length) {
      throw new BadRequestException('Um ou mais módulos não pertencem a este curso');
    }

    // Verifica duplicatas de ordem
    const orders = moduleOrders.map((m) => m.order);
    const uniqueOrders = new Set(orders);
    if (uniqueOrders.size !== orders.length) {
      throw new BadRequestException('Ordens duplicadas não são permitidas');
    }

    // Atualiza ordens em uma transação
    await this.prisma.$transaction(
      moduleOrders.map(({ id, order }) =>
        this.prisma.module.update({
          where: { id },
          data: { order },
        }),
      ),
    );

    // Log de auditoria
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'MODULES_REORDERED',
        entity: 'Module',
        entityId: courseId,
        meta: {
          courseId,
          moduleOrders,
        },
      },
    });

    return {
      message: 'Módulos reordenados com sucesso',
    };
  }

  /**
   * Verifica se usuário tem permissão para gerenciar módulos do curso
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

    throw new ForbiddenException('Você não tem permissão para gerenciar módulos deste curso');
  }
}
