import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreatePaymentDto, PaymentProvider } from './dto';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async create(dto: CreatePaymentDto) {
    const payment = await this.prisma.payment.create({
      data: {
        userId: dto.userId,
        amount: dto.amount,
        currency: dto.currency || 'BRL',
        provider: dto.provider,
        status: 'PENDING',
        metadata: dto.metadata || {},
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

    return payment;
  }

  async findById(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
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

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async findByUserId(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsCompleted(paymentId: string, providerPaymentId?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'COMPLETED',
        paidAt: new Date(),
        providerPaymentId,
      },
    });

    // Activate subscription when payment is completed
    await this.subscriptionsService.activate(payment.userId);

    return updatedPayment;
  }

  async markAsFailed(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'FAILED',
      },
    });
  }

  async createPaymentLink(userId: string) {
    // Create subscription first
    const subscription = await this.subscriptionsService.create({
      userId,
      planId: 'autoon-premium',
      planName: 'Plano Premium AutoOn',
      planPrice: 99.99,
      autoRenew: true,
    });

    // Create payment
    const payment = await this.create({
      userId,
      amount: 99.99,
      currency: 'BRL',
      provider: PaymentProvider.MERCADO_PAGO, // Default provider
      metadata: {
        subscriptionId: subscription.id,
        planName: 'Plano Premium AutoOn',
      },
    });

    // In production, this would integrate with Stripe/Mercado Pago to generate real payment link
    const paymentLink = `${process.env.WEB_URL}/checkout/${payment.id}`;

    return {
      payment,
      subscription,
      paymentLink,
    };
  }

  async processWebhook(provider: string, payload: any) {
    // This is a simplified webhook handler
    // In production, implement proper signature verification for each provider

    if (provider === 'MERCADO_PAGO') {
      return this.processMercadoPagoWebhook(payload);
    } else if (provider === 'STRIPE') {
      return this.processStripeWebhook(payload);
    }

    throw new BadRequestException('Invalid payment provider');
  }

  private async processMercadoPagoWebhook(payload: any) {
    const paymentId = payload.data?.id;
    const status = payload.type;

    if (status === 'payment' && payload.action === 'payment.created') {
      const payment = await this.prisma.payment.findFirst({
        where: { providerPaymentId: paymentId },
      });

      if (payment) {
        await this.markAsCompleted(payment.id, paymentId);
      }
    }

    return { received: true };
  }

  private async processStripeWebhook(payload: any) {
    const event = payload;

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const payment = await this.prisma.payment.findFirst({
        where: { providerPaymentId: paymentIntent.id },
      });

      if (payment) {
        await this.markAsCompleted(payment.id, paymentIntent.id);
      }
    }

    return { received: true };
  }

  async findAll(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
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
      this.prisma.payment.count(),
    ]);

    return {
      data: payments,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
