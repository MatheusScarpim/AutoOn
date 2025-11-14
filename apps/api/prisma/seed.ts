import { PrismaClient, UserRole, VideoStatus, QuestionType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar dados existentes (apenas em desenvolvimento!)
  if (process.env.NODE_ENV !== 'production') {
    await prisma.auditLog.deleteMany();
    await prisma.certificate.deleteMany();
    await prisma.attempt.deleteMany();
    await prisma.question.deleteMany();
    await prisma.quiz.deleteMany();
    await prisma.lessonProgress.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.video.deleteMany();
    await prisma.module.deleteMany();
    await prisma.course.deleteMany();
    await prisma.user.deleteMany();
    console.log('✓ Dados antigos removidos');
  }

  // Criar usuários
  const passwordHash = await bcrypt.hash('senha123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin AutoOn',
      email: 'admin@autoon.com',
      passwordHash,
      role: UserRole.ADMIN,
      agreedToTerms: true,
      agreedToPrivacy: true,
    },
  });
  console.log('✓ Usuário admin criado');

  const instructor = await prisma.user.create({
    data: {
      name: 'Carlos Instrutor',
      email: 'instrutor@autoon.com',
      passwordHash,
      role: UserRole.INSTRUCTOR,
      agreedToTerms: true,
      agreedToPrivacy: true,
    },
  });
  console.log('✓ Usuário instrutor criado');

  const student = await prisma.user.create({
    data: {
      name: 'Maria Aluna',
      email: 'aluna@autoon.com',
      passwordHash,
      role: UserRole.STUDENT,
      agreedToTerms: true,
      agreedToPrivacy: true,
    },
  });
  console.log('✓ Usuário aluno criado');

  // Criar curso de exemplo
  const course = await prisma.course.create({
    data: {
      title: 'Curso de Legislação de Trânsito',
      description:
        'Curso completo sobre legislação de trânsito brasileiro, incluindo regras, sinalizações, multas e direitos e deveres do condutor. Essencial para quem deseja obter a CNH.',
      coverImage: 'https://via.placeholder.com/800x450?text=Curso+de+Legislacao',
      workloadHours: 45,
      isPublished: true,
      createdById: instructor.id,
    },
  });
  console.log('✓ Curso criado');

  // Módulo 1: Introdução
  const module1 = await prisma.module.create({
    data: {
      courseId: course.id,
      title: 'Módulo 1: Introdução ao Trânsito Brasileiro',
      order: 1,
    },
  });

  // Criar vídeo de exemplo (simulado - em produção seria upload real)
  const video1 = await prisma.video.create({
    data: {
      originalKey: 'uploads/originals/video-exemplo-1.mp4',
      hlsKeyPrefix: 'videos/video-exemplo-1/hls',
      durationSec: 600, // 10 minutos
      status: VideoStatus.READY,
      sizeBytes: 52428800n, // 50MB
      thumbnails: [
        'videos/video-exemplo-1/thumbnails/thumb-1.jpg',
        'videos/video-exemplo-1/thumbnails/thumb-2.jpg',
        'videos/video-exemplo-1/thumbnails/thumb-3.jpg',
      ],
      subtitles: [
        {
          language: 'pt-BR',
          url: 'videos/video-exemplo-1/subtitles/pt-BR.vtt',
          label: 'Português',
        },
      ],
    },
  });

  const lesson1 = await prisma.lesson.create({
    data: {
      moduleId: module1.id,
      title: 'Aula 1: O que é o Código de Trânsito Brasileiro',
      order: 1,
      videoId: video1.id,
      minWatchPercent: 80,
    },
  });

  const lesson2 = await prisma.lesson.create({
    data: {
      moduleId: module1.id,
      title: 'Aula 2: Sistema Nacional de Trânsito',
      order: 2,
      minWatchPercent: 80,
    },
  });

  console.log('✓ Módulo 1 e aulas criados');

  // Módulo 2: Sinalização
  const module2 = await prisma.module.create({
    data: {
      courseId: course.id,
      title: 'Módulo 2: Sinalização de Trânsito',
      order: 2,
    },
  });

  await prisma.lesson.create({
    data: {
      moduleId: module2.id,
      title: 'Aula 1: Placas de Regulamentação',
      order: 1,
      minWatchPercent: 80,
    },
  });

  await prisma.lesson.create({
    data: {
      moduleId: module2.id,
      title: 'Aula 2: Placas de Advertência',
      order: 2,
      minWatchPercent: 80,
    },
  });

  await prisma.lesson.create({
    data: {
      moduleId: module2.id,
      title: 'Aula 3: Placas de Indicação',
      order: 3,
      minWatchPercent: 80,
    },
  });

  console.log('✓ Módulo 2 e aulas criados');

  // Criar quiz de exemplo
  const quiz = await prisma.quiz.create({
    data: {
      moduleId: module1.id,
      title: 'Avaliação do Módulo 1',
      description: 'Teste seus conhecimentos sobre o Código de Trânsito Brasileiro',
      minScore: 70,
      attemptsAllowed: 3,
    },
  });

  // Questão 1
  await prisma.question.create({
    data: {
      quizId: quiz.id,
      type: QuestionType.SINGLE_CHOICE,
      statement: 'O que significa a sigla CTB?',
      options: [
        { id: 'opt1', text: 'Código de Trânsito Brasileiro', order: 1 },
        { id: 'opt2', text: 'Central de Trânsito do Brasil', order: 2 },
        { id: 'opt3', text: 'Conselho de Trânsito Brasileiro', order: 3 },
        { id: 'opt4', text: 'Cadastro de Trânsito do Brasil', order: 4 },
      ],
      answerKey: ['opt1'],
      order: 1,
    },
  });

  // Questão 2
  await prisma.question.create({
    data: {
      quizId: quiz.id,
      type: QuestionType.SINGLE_CHOICE,
      statement: 'Qual órgão é responsável por fiscalizar o trânsito nas rodovias federais?',
      options: [
        { id: 'opt1', text: 'DETRAN', order: 1 },
        { id: 'opt2', text: 'PRF (Polícia Rodoviária Federal)', order: 2 },
        { id: 'opt3', text: 'DENATRAN', order: 3 },
        { id: 'opt4', text: 'CONTRAN', order: 4 },
      ],
      answerKey: ['opt2'],
      order: 2,
    },
  });

  // Questão 3
  await prisma.question.create({
    data: {
      quizId: quiz.id,
      type: QuestionType.MULTIPLE_CHOICE,
      statement:
        'Quais são deveres do condutor? (Selecione todas as corretas)',
      options: [
        { id: 'opt1', text: 'Usar cinto de segurança', order: 1 },
        { id: 'opt2', text: 'Respeitar a sinalização', order: 2 },
        { id: 'opt3', text: 'Dirigir acima da velocidade se necessário', order: 3 },
        { id: 'opt4', text: 'Dar preferência aos pedestres', order: 4 },
      ],
      answerKey: ['opt1', 'opt2', 'opt4'],
      order: 3,
    },
  });

  // Questão 4
  await prisma.question.create({
    data: {
      quizId: quiz.id,
      type: QuestionType.TRUE_FALSE,
      statement: 'É permitido dirigir usando fones de ouvido.',
      options: [
        { id: 'opt1', text: 'Verdadeiro', order: 1 },
        { id: 'opt2', text: 'Falso', order: 2 },
      ],
      answerKey: ['opt2'],
      order: 4,
    },
  });

  console.log('✓ Quiz e questões criados');

  // Matricular o aluno de exemplo no curso
  await prisma.enrollment.create({
    data: {
      userId: student.id,
      courseId: course.id,
      progressPercent: 0,
    },
  });

  console.log('✓ Matrícula criada');

  // Criar logs de auditoria
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'SEED_DATABASE',
      entity: 'Database',
      meta: {
        message: 'Banco de dados populado com dados de exemplo',
      },
    },
  });

  console.log('✓ Log de auditoria criado');

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📧 Credenciais de acesso:');
  console.log('   Admin: admin@autoon.com / senha123');
  console.log('   Instrutor: instrutor@autoon.com / senha123');
  console.log('   Aluno: aluna@autoon.com / senha123');
  console.log('\n📚 Curso criado: "Curso de Legislação de Trânsito"');
  console.log('   - 2 módulos');
  console.log('   - 5 aulas');
  console.log('   - 1 quiz com 4 questões');
}

main()
  .catch(e => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
