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
import { ModulesService } from './modules.service';
import { CreateModuleDto, UpdateModuleDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('modules')
@Controller('modules')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ModulesController {
  constructor(private modulesService: ModulesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Criar novo módulo' })
  @ApiResponse({
    status: 201,
    description: 'Módulo criado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Curso não encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Já existe módulo com essa ordem no curso',
  })
  async create(@Body() dto: CreateModuleDto, @Req() req: any) {
    return this.modulesService.create(dto, req.user.sub);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Listar módulos de um curso' })
  @ApiResponse({
    status: 200,
    description: 'Lista de módulos',
  })
  @ApiResponse({
    status: 404,
    description: 'Curso não encontrado',
  })
  async findByCourse(@Param('courseId') courseId: string) {
    return this.modulesService.findByCourse(courseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar módulo por ID' })
  @ApiResponse({
    status: 200,
    description: 'Detalhes do módulo',
  })
  @ApiResponse({
    status: 404,
    description: 'Módulo não encontrado',
  })
  async findOne(@Param('id') id: string) {
    return this.modulesService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Atualizar módulo' })
  @ApiResponse({
    status: 200,
    description: 'Módulo atualizado com sucesso',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para editar este módulo',
  })
  @ApiResponse({
    status: 404,
    description: 'Módulo não encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Já existe módulo com essa ordem no curso',
  })
  async update(@Param('id') id: string, @Body() dto: UpdateModuleDto, @Req() req: any) {
    return this.modulesService.update(id, dto, req.user.sub);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Deletar módulo' })
  @ApiResponse({
    status: 200,
    description: 'Módulo deletado com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Não é possível deletar módulo com aulas ou quizzes',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para deletar este módulo',
  })
  @ApiResponse({
    status: 404,
    description: 'Módulo não encontrado',
  })
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.modulesService.remove(id, req.user.sub);
  }

  @Post('course/:courseId/reorder')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Reordenar módulos de um curso' })
  @ApiResponse({
    status: 200,
    description: 'Módulos reordenados com sucesso',
  })
  async reorder(
    @Param('courseId') courseId: string,
    @Body() body: { moduleOrders: { id: string; order: number }[] },
    @Req() req: any,
  ) {
    return this.modulesService.reorder(courseId, body.moduleOrders, req.user.sub);
  }
}
