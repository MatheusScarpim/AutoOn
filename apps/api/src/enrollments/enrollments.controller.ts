import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ActiveSubscriptionGuard } from '../subscriptions/guards/active-subscription.guard';

@ApiTags('Enrollments')
@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard, ActiveSubscriptionGuard)
@ApiBearerAuth()
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post(':courseId')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Matricular-se em um curso' })
  @ApiResponse({ status: 201, description: 'Matrícula criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Curso não disponível ou já matriculado' })
  @ApiResponse({ status: 404, description: 'Curso não encontrado' })
  async enroll(@Param('courseId') courseId: string, @Request() req: any) {
    return this.enrollmentsService.enroll(courseId, req.user.sub);
  }

  @Get('my-courses')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Listar meus cursos' })
  @ApiResponse({ status: 200, description: 'Lista de cursos do aluno' })
  async getMyCourses(@Request() req: any) {
    return this.enrollmentsService.getMyCourses(req.user.sub);
  }

  @Get(':courseId')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Ver progresso detalhado de um curso' })
  @ApiResponse({ status: 200, description: 'Progresso do curso' })
  @ApiResponse({ status: 404, description: 'Matrícula não encontrada' })
  async getCourseProgress(
    @Param('courseId') courseId: string,
    @Request() req: any,
  ) {
    return this.enrollmentsService.getCourseProgress(courseId, req.user.sub);
  }

  @Delete(':courseId')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Cancelar matrícula em um curso' })
  @ApiResponse({ status: 200, description: 'Matrícula cancelada com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Não é possível cancelar matrícula com progresso significativo',
  })
  @ApiResponse({ status: 404, description: 'Matrícula não encontrada' })
  async unenroll(@Param('courseId') courseId: string, @Request() req: any) {
    return this.enrollmentsService.unenroll(courseId, req.user.sub);
  }
}

