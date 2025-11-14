import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import {
  CreateQuizDto,
  UpdateQuizDto,
  CreateQuestionDto,
  UpdateQuestionDto,
  SubmitQuizDto,
} from './dto';

@Injectable()
export class QuizzesService {
  constructor(
    private prisma: PrismaService,
    private enrollmentsService: EnrollmentsService,
  ) {}

  /**
   * Cria um quiz
   */
  async createQuiz(moduleId: string, dto: CreateQuizDto, userId: string) {
    // Verifica se módulo existe e permissões
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        course: true,
      },
    });

    if (!module) {
      throw new NotFoundException('Módulo não encontrado');
    }

    await this.validateInstructorAccess(module.course.createdById, userId);

    const quiz = await this.prisma.quiz.create({
      data: {
        moduleId,
        ...dto,
      },
    });

    // Log de auditoria
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'QUIZ_CREATED',
        entity: 'Quiz',
        entityId: quiz.id,
        meta: {
          title: quiz.title,
          moduleId,
        },
      },
    });

    return quiz;
  }

  /**
   * Lista quizzes de um módulo
   */
  async findByModule(moduleId: string) {
    return this.prisma.quiz.findMany({
      where: { moduleId },
      include: {
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Busca quiz por ID
   */
  async findOne(quizId: string, includeAnswers = false) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        module: {
          include: {
            course: true,
          },
        },
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            type: true,
            statement: true,
            options: true,
            answerKey: includeAnswers,
            order: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz não encontrado');
    }

    return quiz;
  }

  /**
   * Atualiza quiz
   */
  async updateQuiz(quizId: string, dto: UpdateQuizDto, userId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        module: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz não encontrado');
    }

    await this.validateInstructorAccess(quiz.module.course.createdById, userId);

    const updated = await this.prisma.quiz.update({
      where: { id: quizId },
      data: dto,
    });

    // Log de auditoria
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'QUIZ_UPDATED',
        entity: 'Quiz',
        entityId: quizId,
        meta: dto as any,
      },
    });

    return updated;
  }

  /**
   * Deleta quiz
   */
  async deleteQuiz(quizId: string, userId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        module: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz não encontrado');
    }

    await this.validateInstructorAccess(quiz.module.course.createdById, userId);

    await this.prisma.quiz.delete({
      where: { id: quizId },
    });

    // Log de auditoria
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'QUIZ_DELETED',
        entity: 'Quiz',
        entityId: quizId,
        meta: {
          title: quiz.title,
        },
      },
    });

    return { message: 'Quiz deletado com sucesso' };
  }

  /**
   * Cria uma questão
   */
  async createQuestion(quizId: string, dto: CreateQuestionDto, userId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        module: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz não encontrado');
    }

    await this.validateInstructorAccess(quiz.module.course.createdById, userId);

    const question = await this.prisma.question.create({
      data: {
        quizId,
        ...dto,
      },
    });

    return question;
  }

  /**
   * Atualiza questão
   */
  async updateQuestion(
    questionId: string,
    dto: UpdateQuestionDto,
    userId: string,
  ) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        quiz: {
          include: {
            module: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundException('Questão não encontrada');
    }

    await this.validateInstructorAccess(
      question.quiz.module.course.createdById,
      userId,
    );

    return this.prisma.question.update({
      where: { id: questionId },
      data: dto,
    });
  }

  /**
   * Deleta questão
   */
  async deleteQuestion(questionId: string, userId: string) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        quiz: {
          include: {
            module: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundException('Questão não encontrada');
    }

    await this.validateInstructorAccess(
      question.quiz.module.course.createdById,
      userId,
    );

    await this.prisma.question.delete({
      where: { id: questionId },
    });

    return { message: 'Questão deletada com sucesso' };
  }

  /**
   * Inicia tentativa de quiz
   */
  async startQuiz(quizId: string, userId: string) {
    const quiz = await this.findOne(quizId, false);

    // Verifica se está matriculado no curso
    const isEnrolled = await this.enrollmentsService.isEnrolled(
      userId,
      quiz.module.courseId,
    );

    if (!isEnrolled) {
      throw new ForbiddenException('Você não está matriculado neste curso');
    }

    // Busca matrícula
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: quiz.module.courseId,
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Matrícula não encontrada');
    }

    // Conta tentativas anteriores
    const attempts = await this.prisma.attempt.count({
      where: {
        quizId,
        enrollmentId: enrollment.id,
      },
    });

    if (attempts >= quiz.attemptsAllowed) {
      throw new BadRequestException(
        `Você já utilizou todas as ${quiz.attemptsAllowed} tentativas permitidas`,
      );
    }

    return {
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        minScore: quiz.minScore,
        attemptsRemaining: quiz.attemptsAllowed - attempts,
        questions: quiz.questions,
      },
    };
  }

  /**
   * Submete respostas e calcula nota
   */
  async submitQuiz(quizId: string, dto: SubmitQuizDto, userId: string) {
    const quiz = await this.findOne(quizId, true);

    // Verifica matrícula
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: quiz.module.courseId,
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('Você não está matriculado neste curso');
    }

    // Conta tentativas
    const attempts = await this.prisma.attempt.count({
      where: {
        quizId,
        enrollmentId: enrollment.id,
      },
    });

    if (attempts >= quiz.attemptsAllowed) {
      throw new BadRequestException('Você já utilizou todas as tentativas');
    }

    // Calcula nota
    let correctAnswers = 0;
    const totalQuestions = quiz.questions.length;
    const answerMap = new Map(dto.answers.map((a) => [a.questionId, a.answers]));

    const results = quiz.questions.map((question) => {
      const userAnswers = answerMap.get(question.id) || [];
      const isCorrect = this.compareAnswers(
        userAnswers,
        question.answerKey as string[],
      );

      if (isCorrect) {
        correctAnswers++;
      }

      return {
        questionId: question.id,
        userAnswers,
        correctAnswers: question.answerKey,
        isCorrect,
      };
    });

    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const passed = score >= quiz.minScore;

    // Cria tentativa
    const attempt = await this.prisma.attempt.create({
      data: {
        quizId,
        enrollmentId: enrollment.id,
        score,
        answers: dto.answers as any,
        finishedAt: new Date(),
      },
    });

    return {
      attemptId: attempt.id,
      score,
      minScore: quiz.minScore,
      passed,
      correctAnswers,
      totalQuestions,
      results,
    };
  }

  /**
   * Lista tentativas de um quiz
   */
  async getAttempts(quizId: string, userId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        module: true,
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz não encontrado');
    }

    // Busca matrícula
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: quiz.module.courseId,
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('Você não está matriculado neste curso');
    }

    const attempts = await this.prisma.attempt.findMany({
      where: {
        quizId,
        enrollmentId: enrollment.id,
      },
      orderBy: { startedAt: 'desc' },
    });

    return {
      attempts,
      attemptsRemaining: quiz.attemptsAllowed - attempts.length,
    };
  }

  /**
   * Compara respostas do usuário com gabarito
   */
  private compareAnswers(userAnswers: string[], correctAnswers: string[]): boolean {
    if (userAnswers.length !== correctAnswers.length) {
      return false;
    }

    const userSet = new Set(userAnswers);
    const correctSet = new Set(correctAnswers);

    return (
      userSet.size === correctSet.size &&
      [...userSet].every((answer) => correctSet.has(answer))
    );
  }

  /**
   * Valida acesso de instrutor/admin
   */
  private async validateInstructorAccess(creatorId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const canAccess = user?.role === 'ADMIN' || creatorId === userId;

    if (!canAccess) {
      throw new ForbiddenException(
        'Você não tem permissão para realizar esta ação',
      );
    }
  }
}
