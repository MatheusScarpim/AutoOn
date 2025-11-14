import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar assinatura (Admin)' })
  async create(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(dto);
  }

  @Get('my-subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ver minha assinatura' })
  async getMySubscription(@Req() req: any) {
    return this.subscriptionsService.findByUserId(req.user.sub);
  }

  @Get('check-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verificar status da assinatura' })
  async checkStatus(@Req() req: any) {
    const isActive = await this.subscriptionsService.isActive(req.user.sub);
    return { isActive };
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancelar minha assinatura' })
  async cancelMySubscription(@Req() req: any) {
    return this.subscriptionsService.cancel(req.user.sub);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todas assinaturas (Admin)' })
  async findAll(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.subscriptionsService.findAll(
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 20,
    );
  }

  @Get(':userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ver assinatura de usuário (Admin)' })
  async findByUserId(@Param('userId') userId: string) {
    return this.subscriptionsService.findByUserId(userId);
  }

  @Patch(':userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar assinatura (Admin)' })
  async update(@Param('userId') userId: string, @Body() dto: UpdateSubscriptionDto) {
    return this.subscriptionsService.update(userId, dto);
  }

  @Post(':userId/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ativar assinatura (Admin)' })
  async activate(@Param('userId') userId: string) {
    return this.subscriptionsService.activate(userId);
  }
}
