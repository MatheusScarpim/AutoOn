import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('course/:id/engagement')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Relatório de engajamento do curso' })
  @ApiResponse({
    status: 200,
    description: 'Relatório com métricas de engajamento',
  })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Curso não encontrado' })
  async getCourseEngagement(@Param('id') id: string, @Request() req: any) {
    return this.reportsService.getCourseEngagement(id, req.user.sub);
  }

  @Get('video/:id/retention')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Relatório de retenção do vídeo' })
  @ApiResponse({
    status: 200,
    description: 'Relatório com métricas de retenção',
  })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Vídeo não encontrado' })
  async getVideoRetention(@Param('id') id: string, @Request() req: any) {
    return this.reportsService.getVideoRetention(id, req.user.sub);
  }

  @Get('student/:id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT)
  @ApiOperation({ summary: 'Relatório individual do aluno' })
  @ApiResponse({
    status: 200,
    description: 'Relatório completo do aluno',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão (apenas próprio aluno ou admin)',
  })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado' })
  async getStudentReport(@Param('id') id: string, @Request() req: any) {
    return this.reportsService.getStudentReport(id, req.user.sub);
  }

  @Get('course/:id/quizzes')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Relatório de quizzes do curso' })
  @ApiResponse({
    status: 200,
    description: 'Relatório com estatísticas de quizzes',
  })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Curso não encontrado' })
  async getCourseQuizReport(@Param('id') id: string, @Request() req: any) {
    return this.reportsService.getCourseQuizReport(id, req.user.sub);
  }
}

