import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto, QueryCourseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar novo curso' })
  @ApiResponse({
    status: 201,
    description: 'Curso criado com sucesso',
  })
  async create(@Body() dto: CreateCourseDto, @Req() req: any) {
    return this.coursesService.create(dto, req.user.sub);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Listar cursos com paginação e filtros' })
  @ApiResponse({
    status: 200,
    description: 'Lista de cursos',
  })
  async findAll(@Query() query: QueryCourseDto, @Req() req: any) {
    // Passa userId e role para o service decidir quais cursos mostrar
    const userId = req.user?.sub;
    const userRole = req.user?.role;
    return this.coursesService.findAll(query, userId, userRole);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Buscar curso por ID' })
  @ApiResponse({
    status: 200,
    description: 'Detalhes do curso',
  })
  @ApiResponse({
    status: 404,
    description: 'Curso não encontrado',
  })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.sub;
    return this.coursesService.findOne(id, userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar curso' })
  @ApiResponse({
    status: 200,
    description: 'Curso atualizado com sucesso',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para editar este curso',
  })
  @ApiResponse({
    status: 404,
    description: 'Curso não encontrado',
  })
  async update(@Param('id') id: string, @Body() dto: UpdateCourseDto, @Req() req: any) {
    return this.coursesService.update(id, dto, req.user.sub);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deletar curso (apenas ADMIN)' })
  @ApiResponse({
    status: 200,
    description: 'Curso deletado com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Não é possível deletar curso com alunos matriculados',
  })
  @ApiResponse({
    status: 403,
    description: 'Apenas administradores podem deletar cursos',
  })
  @ApiResponse({
    status: 404,
    description: 'Curso não encontrado',
  })
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.coursesService.remove(id, req.user.sub);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publicar ou despublicar curso' })
  @ApiResponse({
    status: 200,
    description: 'Status de publicação atualizado',
  })
  async publish(
    @Param('id') id: string,
    @Body('published') published: boolean,
    @Req() req: any,
  ) {
    return this.coursesService.publish(id, published, req.user.sub);
  }
}
