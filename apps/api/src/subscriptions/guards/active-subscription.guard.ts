import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionsService } from '../subscriptions.service';

@Injectable()
export class ActiveSubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Admin and instructors bypass subscription check
    if (user.role === 'ADMIN' || user.role === 'INSTRUCTOR') {
      return true;
    }

    const isActive = await this.subscriptionsService.isActive(user.sub);

    if (!isActive) {
      throw new ForbiddenException(
        'Active subscription required. Please subscribe to access this content.',
      );
    }

    return true;
  }
}
