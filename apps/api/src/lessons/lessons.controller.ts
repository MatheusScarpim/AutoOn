import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { LessonsService } from './lessons.service';
import { CreateLessonDto, UpdateLessonDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('lessons')
@Controller('lessons')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LessonsController {
  constructor(private lessonsService: LessonsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Criar nova aula' })
  @ApiResponse({
    status: 201,
    description: 'Aula criada com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Módulo ou vídeo não encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Já existe aula com essa ordem no módulo ou vídeo já está associado a outra aula',
  })
  async create(@Body() dto: CreateLessonDto, @Req() req: any) {
    return this.lessonsService.create(dto, req.user.sub);
  }

  @Get('module/:moduleId')
  @ApiOperation({ summary: 'Listar aulas de um módulo' })
  @ApiResponse({
    status: 200,
    description: 'Lista de aulas',
  })
  @ApiResponse({
    status: 404,
    description: 'Módulo não encontrado',
  })
  async findByModule(@Param('moduleId') moduleId: string) {
    return this.lessonsService.findByModule(moduleId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar aula por ID' })
  @ApiResponse({
    status: 200,
    description: 'Detalhes da aula',
  })
  @ApiResponse({
    status: 404,
    description: 'Aula não encontrada',
  })
  async findOne(@Param('id') id: string) {
    return this.lessonsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Atualizar aula' })
  @ApiResponse({
    status: 200,
    description: 'Aula atualizada com sucesso',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para editar esta aula',
  })
  @ApiResponse({
    status: 404,
    description: 'Aula não encontrada',
  })
  @ApiResponse({
    status: 409,
    description: 'Já existe aula com essa ordem no módulo ou vídeo já está associado a outra aula',
  })
  async update(@Param('id') id: string, @Body() dto: UpdateLessonDto, @Req() req: any) {
    return this.lessonsService.update(id, dto, req.user.sub);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Deletar aula' })
  @ApiResponse({
    status: 200,
    description: 'Aula deletada com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Não é possível deletar aula com progresso de alunos',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para deletar esta aula',
  })
  @ApiResponse({
    status: 404,
    description: 'Aula não encontrada',
  })
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.lessonsService.remove(id, req.user.sub);
  }

  @Post('module/:moduleId/reorder')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Reordenar aulas de um módulo' })
  @ApiResponse({
    status: 200,
    description: 'Aulas reordenadas com sucesso',
  })
  async reorder(
    @Param('moduleId') moduleId: string,
    @Body() body: { lessonOrders: { id: string; order: number }[] },
    @Req() req: any,
  ) {
    return this.lessonsService.reorder(moduleId, body.lessonOrders, req.user.sub);
  }
}
