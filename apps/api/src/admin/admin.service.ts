import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryUsersDto, UpdateUserRoleDto, QueryAuditDto } from './dto';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
  ) {}

  /**
   * Lista usuários com filtros e paginação
   */
  async getUsers(query: QueryUsersDto) {
    const { page = 1, pageSize = 10 } = query;
    const skip = (page - 1) * pageSize;

    // Constrói filtros
    const where: any = {};

    if (query.query) {
      where.OR = [
        { name: { contains: query.query, mode: 'insensitive' } },
        { email: { contains: query.query, mode: 'insensitive' } },
      ];
    }

    if (query.role) {
      where.role = query.role;
    }

    // Conta total
    const total = await this.prisma.user.count({ where });

    // Busca usuários
    const users = await this.prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        agreedToTerms: true,
        agreedToPrivacy: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            enrollments: true,
            createdCourses: true,
          },
        },
        subscription: {
          select: {
            id: true,
            status: true,
            planId: true,
            planName: true,
            planPrice: true,
            autoRenew: true,
            startDate: true,
            endDate: true,
            cancelledAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: users,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Atualiza role de um usuário
   */
  async updateUserRole(userId: string, dto: UpdateUserRoleDto, adminId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Impede admin de remover próprio cargo de admin
    if (userId === adminId && dto.role !== 'ADMIN') {
      throw new BadRequestException(
        'Você não pode remover seu próprio cargo de administrador',
      );
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role: dto.role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log de auditoria
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'USER_ROLE_UPDATED',
        entity: 'User',
        entityId: userId,
        meta: {
          oldRole: user.role,
          newRole: dto.role,
        },
      },
    });

    return updated;
  }

  /**
   * Lista logs de auditoria
   */
  async getAuditLogs(query: QueryAuditDto) {
    const { page = 1, pageSize = 10 } = query;
    const skip = (page - 1) * pageSize;

    // Constrói filtros
    const where: any = {};

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.entity) {
      where.entity = query.entity;
    }

    if (query.action) {
      where.action = query.action;
    }

    // Conta total
    const total = await this.prisma.auditLog.count({ where });

    // Busca logs
    const logs = await this.prisma.auditLog.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: logs,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Estatísticas de uso de armazenamento
   */
  async getStorageUsage() {
    // Busca todos os vídeos
    const videos = await this.prisma.video.findMany({
      select: {
        sizeBytes: true,
        status: true,
      },
    });

    const totalVideos = videos.length;
    const totalSizeBytes = videos.reduce(
      (acc, video) => acc + Number(video.sizeBytes),
      0,
    );

    const videosByStatus = videos.reduce((acc, video) => {
      acc[video.status] = (acc[video.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Busca todos os certificados
    const certificates = await this.prisma.certificate.count();

    return {
      videos: {
        total: totalVideos,
        totalSizeBytes,
        totalSizeMB: Math.round(totalSizeBytes / (1024 * 1024)),
        totalSizeGB: (totalSizeBytes / (1024 * 1024 * 1024)).toFixed(2),
        byStatus: videosByStatus,
      },
      certificates: {
        total: certificates,
      },
    };
  }

  /**
   * Dashboard com estatísticas gerais
   */
  async getStats() {
    const [
      totalUsers,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      completedEnrollments,
      totalVideos,
      totalCertificates,
      recentEnrollments,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.course.count(),
      this.prisma.course.count({ where: { isPublished: true } }),
      this.prisma.enrollment.count(),
      this.prisma.enrollment.count({ where: { completedAt: { not: null } } }),
      this.prisma.video.count(),
      this.prisma.certificate.count(),
      this.prisma.enrollment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          course: {
            select: {
              title: true,
            },
          },
        },
      }),
    ]);

    const usersByRole = await this.prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    const videosByStatus = await this.prisma.video.groupBy({
      by: ['status'],
      _count: true,
    });

    return {
      users: {
        total: totalUsers,
        byRole: usersByRole.reduce((acc, item) => {
          acc[item.role] = item._count;
          return acc;
        }, {} as Record<string, number>),
      },
      courses: {
        total: totalCourses,
        published: publishedCourses,
        draft: totalCourses - publishedCourses,
      },
      enrollments: {
        total: totalEnrollments,
        completed: completedEnrollments,
        inProgress: totalEnrollments - completedEnrollments,
        completionRate:
          totalEnrollments > 0
            ? Math.round((completedEnrollments / totalEnrollments) * 100)
            : 0,
      },
      videos: {
        total: totalVideos,
        byStatus: videosByStatus.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
      },
      certificates: {
        total: totalCertificates,
      },
      recent: {
        enrollments: recentEnrollments.map((e) => ({
          student: e.user.name,
          course: e.course.title,
          enrolledAt: e.createdAt,
        })),
      },
    };
  }

  /**
   * Lista todas as ações disponíveis no sistema (para filtros)
   */
  async getAvailableActions() {
    const actions = await this.prisma.auditLog.groupBy({
      by: ['action'],
      _count: true,
    });

    return actions.map((a) => ({
      action: a.action,
      count: a._count,
    }));
  }

  /**
   * Lista todas as entidades disponíveis no sistema (para filtros)
   */
  async getAvailableEntities() {
    const entities = await this.prisma.auditLog.groupBy({
      by: ['entity'],
      _count: true,
    });

    return entities.map((e) => ({
      entity: e.entity,
      count: e._count,
    }));
  }
}
