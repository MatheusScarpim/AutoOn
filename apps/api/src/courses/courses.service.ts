import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto, QueryCourseDto } from './dto';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Cria um novo curso
   */
  async create(dto: CreateCourseDto, userId: string) {
    const course = await this.prisma.course.create({
      data: {
        ...dto,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log de auditoria
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'COURSE_CREATED',
        entity: 'Course',
        entityId: course.id,
        meta: {
          title: course.title,
        },
      },
    });

    return course;
  }

  /**
   * Lista cursos com paginação e filtros
   */
  async findAll(query: QueryCourseDto, userId?: string, userRole?: string) {
    const { page = 1, pageSize = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * pageSize;

    // Constrói filtros
    const where: any = {};

    if (query.query) {
      where.OR = [
        { title: { contains: query.query, mode: 'insensitive' } },
        { description: { contains: query.query, mode: 'insensitive' } },
      ];
    }

    if (query.published !== undefined) {
      where.isPublished = query.published;
    }

    // ADMIN e INSTRUCTOR veem todos os cursos (publicados e rascunhos)
    // STUDENT e usuários não autenticados veem apenas cursos publicados
    const isAdminOrInstructor = userRole === 'ADMIN' || userRole === 'INSTRUCTOR';

    if (!isAdminOrInstructor) {
      where.isPublished = true;
    }

    // Conta total
    const total = await this.prisma.course.count({ where });

    // Busca cursos
    const courses = await this.prisma.course.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            modules: true,
            enrollments: true,
          },
        },
      },
    });

    return {
      data: courses,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Busca curso por ID
   */
  async findOne(id: string, userId?: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        modules: {
          orderBy: { order: 'asc' },
          include: {
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
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Curso não encontrado');
    }

    // Verifica acesso
    if (!course.isPublished) {
      if (!userId) {
        throw new ForbiddenException('Este curso não está publicado');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      const canAccess =
        user?.role === 'ADMIN' ||
        (user?.role === 'INSTRUCTOR' && course.createdById === userId);

      if (!canAccess) {
        throw new ForbiddenException('Este curso não está publicado');
      }
    }

    return course;
  }

  /**
   * Atualiza curso
   */
  async update(id: string, dto: UpdateCourseDto, userId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException('Curso não encontrado');
    }

    // Verifica permissões
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const canUpdate = user?.role === 'ADMIN' || course.createdById === userId;

    if (!canUpdate) {
      throw new ForbiddenException('Você não tem permissão para editar este curso');
    }

    const updated = await this.prisma.course.update({
      where: { id },
      data: dto,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log de auditoria
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'COURSE_UPDATED',
        entity: 'Course',
        entityId: id,
        meta: dto as any,
      },
    });

    return updated;
  }

  /**
   * Deleta curso
   */
  async remove(id: string, userId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Curso não encontrado');
    }

    // Verifica permissões (apenas ADMIN pode deletar)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user?.role !== 'ADMIN') {
      throw new ForbiddenException('Apenas administradores podem deletar cursos');
    }

    // Verifica se há matrículas
    if (course._count.enrollments > 0) {
      throw new BadRequestException(
        'Não é possível deletar curso com alunos matriculados. Despublique o curso primeiro.',
      );
    }

    await this.prisma.course.delete({
      where: { id },
    });

    // Log de auditoria
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'COURSE_DELETED',
        entity: 'Course',
        entityId: id,
        meta: {
          title: course.title,
        },
      },
    });

    return {
      message: 'Curso deletado com sucesso',
    };
  }

  /**
   * Publica ou despublica curso
   */
  async publish(id: string, published: boolean, userId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
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

    // Verifica permissões
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const canPublish = user?.role === 'ADMIN' || course.createdById === userId;

    if (!canPublish) {
      throw new ForbiddenException('Você não tem permissão para publicar este curso');
    }

    // Valida se curso tem conteúdo antes de publicar
    if (published) {
      if (course.modules.length === 0) {
        throw new BadRequestException('Curso precisa ter pelo menos um módulo para ser publicado');
      }

      const hasLessons = course.modules.some((module) => module.lessons.length > 0);
      if (!hasLessons) {
        throw new BadRequestException('Curso precisa ter pelo menos uma aula para ser publicado');
      }
    }

    const updated = await this.prisma.course.update({
      where: { id },
      data: { isPublished: published },
    });

    // Log de auditoria
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: published ? 'COURSE_PUBLISHED' : 'COURSE_UNPUBLISHED',
        entity: 'Course',
        entityId: id,
        meta: {
          title: course.title,
        },
      },
    });

    return updated;
  }

  /**
   * Verifica se usuário é estudante
   */
  private async isStudent(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    return user?.role === 'STUDENT';
  }
}
