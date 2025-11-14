import { Controller, Get, Post, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreatePaymentDto, WebhookDto } from './dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('create-payment-link')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar link de pagamento' })
  async createPaymentLink(@Req() req: any) {
    return this.paymentsService.createPaymentLink(req.user.sub);
  }

  @Post('webhook/:provider')
  @ApiOperation({ summary: 'Webhook de pagamento' })
  async handleWebhook(@Param('provider') provider: string, @Body() payload: any) {
    return this.paymentsService.processWebhook(provider, payload);
  }

  @Get('my-payments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ver meus pagamentos' })
  async getMyPayments(@Req() req: any) {
    return this.paymentsService.findByUserId(req.user.sub);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos pagamentos (Admin)' })
  async findAll(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.paymentsService.findAll(
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 20,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ver pagamento' })
  async findById(@Param('id') id: string) {
    return this.paymentsService.findById(id);
  }

  @Post(':id/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marcar pagamento como completo (Admin)' })
  async markAsCompleted(@Param('id') id: string, @Body() body: { providerPaymentId?: string }) {
    return this.paymentsService.markAsCompleted(id, body.providerPaymentId);
  }

  @Post(':id/fail')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marcar pagamento como falho (Admin)' })
  async markAsFailed(@Param('id') id: string) {
    return this.paymentsService.markAsFailed(id);
  }
}
