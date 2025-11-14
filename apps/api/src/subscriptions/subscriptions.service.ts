import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSubscriptionDto) {
    const existingSubscription = await this.prisma.subscription.findUnique({
      where: { userId: dto.userId },
    });

    if (existingSubscription && existingSubscription.status === 'ACTIVE') {
      throw new BadRequestException('User already has an active subscription');
    }

    return this.prisma.subscription.create({
      data: {
        userId: dto.userId,
        planId: dto.planId,
        planName: dto.planName || 'Plano Premium AutoOn',
        planPrice: dto.planPrice || 99.99,
        autoRenew: dto.autoRenew ?? true,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async activate(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 30 days subscription

    return this.prisma.subscription.update({
      where: { userId },
      data: {
        status: 'ACTIVE',
        startDate,
        endDate,
      },
    });
  }

  async cancel(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return this.prisma.subscription.update({
      where: { userId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        autoRenew: false,
      },
    });
  }

  async findByUserId(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return subscription;
  }

  async isActive(userId: string): Promise<boolean> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return false;
    }

    if (subscription.status !== 'ACTIVE') {
      return false;
    }

    if (subscription.endDate && subscription.endDate < new Date()) {
      await this.prisma.subscription.update({
        where: { userId },
        data: { status: 'EXPIRED' },
      });
      return false;
    }

    return true;
  }

  async update(userId: string, dto: UpdateSubscriptionDto) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return this.prisma.subscription.update({
      where: { userId },
      data: dto,
    });
  }

  async findAll(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;

    const [subscriptions, total] = await Promise.all([
      this.prisma.subscription.findMany({
        skip,
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subscription.count(),
    ]);

    return {
      data: subscriptions,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
