import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
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
import { QuizzesService } from './quizzes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  CreateQuizDto,
  UpdateQuizDto,
  CreateQuestionDto,
  UpdateQuestionDto,
  SubmitQuizDto,
} from './dto';

@ApiTags('Quizzes')
@Controller('quizzes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  // CRUD de Quizzes (Admin/Instructor)

  @Post('module/:moduleId')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Criar quiz em um módulo' })
  @ApiResponse({ status: 201, description: 'Quiz criado com sucesso' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Módulo não encontrado' })
  async createQuiz(
    @Param('moduleId') moduleId: string,
    @Body() dto: CreateQuizDto,
    @Request() req: any,
  ) {
    return this.quizzesService.createQuiz(moduleId, dto, req.user.sub);
  }

  @Get('module/:moduleId')
  @ApiOperation({ summary: 'Listar quizzes de um módulo' })
  @ApiResponse({ status: 200, description: 'Lista de quizzes' })
  async findByModule(@Param('moduleId') moduleId: string) {
    return this.quizzesService.findByModule(moduleId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar quiz por ID' })
  @ApiResponse({ status: 200, description: 'Quiz encontrado' })
  @ApiResponse({ status: 404, description: 'Quiz não encontrado' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    // Admin/Instructor vê respostas, aluno não
    const user = await this.getUserRole(req.user.sub);
    const includeAnswers = user.role === 'ADMIN' || user.role === 'INSTRUCTOR';
    return this.quizzesService.findOne(id, includeAnswers);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Atualizar quiz' })
  @ApiResponse({ status: 200, description: 'Quiz atualizado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Quiz não encontrado' })
  async updateQuiz(
    @Param('id') id: string,
    @Body() dto: UpdateQuizDto,
    @Request() req: any,
  ) {
    return this.quizzesService.updateQuiz(id, dto, req.user.sub);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Deletar quiz' })
  @ApiResponse({ status: 200, description: 'Quiz deletado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Quiz não encontrado' })
  async deleteQuiz(@Param('id') id: string, @Request() req: any) {
    return this.quizzesService.deleteQuiz(id, req.user.sub);
  }

  // CRUD de Questões (Admin/Instructor)

  @Post(':quizId/questions')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Criar questão em um quiz' })
  @ApiResponse({ status: 201, description: 'Questão criada' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Quiz não encontrado' })
  async createQuestion(
    @Param('quizId') quizId: string,
    @Body() dto: CreateQuestionDto,
    @Request() req: any,
  ) {
    return this.quizzesService.createQuestion(quizId, dto, req.user.sub);
  }

  @Patch('questions/:id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Atualizar questão' })
  @ApiResponse({ status: 200, description: 'Questão atualizada' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Questão não encontrada' })
  async updateQuestion(
    @Param('id') id: string,
    @Body() dto: UpdateQuestionDto,
    @Request() req: any,
  ) {
    return this.quizzesService.updateQuestion(id, dto, req.user.sub);
  }

  @Delete('questions/:id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Deletar questão' })
  @ApiResponse({ status: 200, description: 'Questão deletada' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Questão não encontrada' })
  async deleteQuestion(@Param('id') id: string, @Request() req: any) {
    return this.quizzesService.deleteQuestion(id, req.user.sub);
  }

  // Tentativas de Quiz (Student)

  @Post(':id/start')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Iniciar tentativa de quiz' })
  @ApiResponse({ status: 200, description: 'Quiz iniciado' })
  @ApiResponse({ status: 400, description: 'Sem tentativas disponíveis' })
  @ApiResponse({ status: 403, description: 'Não matriculado' })
  @ApiResponse({ status: 404, description: 'Quiz não encontrado' })
  async startQuiz(@Param('id') id: string, @Request() req: any) {
    return this.quizzesService.startQuiz(id, req.user.sub);
  }

  @Post(':id/submit')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Submeter respostas do quiz' })
  @ApiResponse({ status: 201, description: 'Quiz submetido e avaliado' })
  @ApiResponse({ status: 400, description: 'Sem tentativas disponíveis' })
  @ApiResponse({ status: 403, description: 'Não matriculado' })
  @ApiResponse({ status: 404, description: 'Quiz não encontrado' })
  async submitQuiz(
    @Param('id') id: string,
    @Body() dto: SubmitQuizDto,
    @Request() req: any,
  ) {
    return this.quizzesService.submitQuiz(id, dto, req.user.sub);
  }

  @Get(':id/attempts')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Listar tentativas de um quiz' })
  @ApiResponse({ status: 200, description: 'Lista de tentativas' })
  @ApiResponse({ status: 403, description: 'Não matriculado' })
  @ApiResponse({ status: 404, description: 'Quiz não encontrado' })
  async getAttempts(@Param('id') id: string, @Request() req: any) {
    return this.quizzesService.getAttempts(id, req.user.sub);
  }

  // Helper
  private async getUserRole(userId: string) {
    // Implementar lógica para buscar role do usuário
    // Por simplicidade, usando service do Prisma diretamente
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    await prisma.$disconnect();
    return user!;
  }
}

