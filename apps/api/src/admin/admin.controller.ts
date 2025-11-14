import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { QueryUsersDto, UpdateUserRoleDto, QueryAuditDto } from './dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'Listar usuários com filtros' })
  @ApiResponse({ status: 200, description: 'Lista de usuários' })
  async getUsers(@Query() query: QueryUsersDto) {
    return this.adminService.getUsers(query);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Alterar role de um usuário' })
  @ApiResponse({ status: 200, description: 'Role atualizada com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Não pode remover próprio cargo de admin',
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @Request() req: any,
  ) {
    return this.adminService.updateUserRole(id, dto, req.user.sub);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Listar logs de auditoria' })
  @ApiResponse({ status: 200, description: 'Lista de logs' })
  async getAuditLogs(@Query() query: QueryAuditDto) {
    return this.adminService.getAuditLogs(query);
  }

  @Get('storage/usage')
  @ApiOperation({ summary: 'Estatísticas de uso de armazenamento' })
  @ApiResponse({ status: 200, description: 'Estatísticas de armazenamento' })
  async getStorageUsage() {
    return this.adminService.getStorageUsage();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Dashboard com estatísticas gerais' })
  @ApiResponse({ status: 200, description: 'Estatísticas gerais do sistema' })
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('audit-logs/actions')
  @ApiOperation({ summary: 'Listar ações disponíveis para filtros' })
  @ApiResponse({ status: 200, description: 'Lista de ações' })
  async getAvailableActions() {
    return this.adminService.getAvailableActions();
  }

  @Get('audit-logs/entities')
  @ApiOperation({ summary: 'Listar entidades disponíveis para filtros' })
  @ApiResponse({ status: 200, description: 'Lista de entidades' })
  async getAvailableEntities() {
    return this.adminService.getAvailableEntities();
  }
}

