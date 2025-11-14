import {
  Controller,
  Post,
  Get,
  Body,
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
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { HeartbeatDto } from './dto/heartbeat.dto';

@ApiTags('Progress')
@Controller('progress')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post('heartbeat')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Salvar progresso de visualização (heartbeat)' })
  @ApiResponse({ status: 200, description: 'Progresso salvo com sucesso' })
  @ApiResponse({ status: 403, description: 'Não matriculado no curso' })
  @ApiResponse({ status: 404, description: 'Aula não encontrada' })
  async heartbeat(@Body() dto: HeartbeatDto, @Request() req: any) {
    return this.progressService.heartbeat(dto, req.user.sub);
  }

  @Get('lesson/:lessonId')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Ver progresso de uma aula' })
  @ApiResponse({ status: 200, description: 'Progresso da aula' })
  @ApiResponse({ status: 403, description: 'Não matriculado no curso' })
  @ApiResponse({ status: 404, description: 'Aula não encontrada' })
  async getLessonProgress(
    @Param('lessonId') lessonId: string,
    @Request() req: any,
  ) {
    return this.progressService.getLessonProgress(lessonId, req.user.sub);
  }

  @Post('lesson/:lessonId/complete')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Marcar aula como concluída' })
  @ApiResponse({ status: 200, description: 'Aula concluída com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Não assistiu % mínima ou sem progresso',
  })
  @ApiResponse({ status: 403, description: 'Não matriculado no curso' })
  @ApiResponse({ status: 404, description: 'Aula não encontrada' })
  async completeLesson(
    @Param('lessonId') lessonId: string,
    @Request() req: any,
  ) {
    return this.progressService.completeLesson(lessonId, req.user.sub);
  }

  @Get('course/:courseId/unlocked')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Listar aulas desbloqueadas de um curso' })
  @ApiResponse({ status: 200, description: 'Lista de aulas desbloqueadas' })
  @ApiResponse({ status: 403, description: 'Não matriculado no curso' })
  async getUnlockedLessons(
    @Param('courseId') courseId: string,
    @Request() req: any,
  ) {
    return this.progressService.getUnlockedLessons(courseId, req.user.sub);
  }
}

