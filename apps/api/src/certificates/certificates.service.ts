import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import PDFDocument from 'pdfkit';
import { randomBytes } from 'crypto';

@Injectable()
export class CertificatesService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  /**
   * Gera certificado PDF para um curso concluído
   */
  async generateCertificate(courseId: string, userId: string) {
    // Busca matrícula e valida conclusão
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            title: true,
            workloadHours: true,
          },
        },
        lessonProgress: {
          where: {
            completedAt: {
              not: null,
            },
          },
        },
        certificate: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Matrícula não encontrada');
    }

    // Verifica se já tem certificado
    if (enrollment.certificate) {
      return {
        message: 'Certificado já emitido',
        certificate: enrollment.certificate,
      };
    }

    // Valida se completou o curso
    if (!enrollment.completedAt) {
      // Verifica se completou todas as aulas
      const totalLessons = await this.prisma.lesson.count({
        where: {
          module: {
            courseId,
          },
        },
      });

      const completedLessons = enrollment.lessonProgress.length;

      if (completedLessons < totalLessons) {
        throw new BadRequestException(
          `Você precisa concluir todas as aulas do curso para obter o certificado. Progresso: ${completedLessons}/${totalLessons}`,
        );
      }

      // Atualiza matrícula como concluída
      await this.prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          completedAt: new Date(),
          progressPercent: 100,
        },
      });
    }

    // Gera código único verificável
    const code = this.generateVerificationCode();

    // Gera PDF
    const pdfBuffer = await this.generatePDF({
      studentName: enrollment.user.name,
      courseTitle: enrollment.course.title,
      workloadHours: enrollment.course.workloadHours,
      completedAt: enrollment.completedAt || new Date(),
      code,
    });

    // Upload para S3
    const pdfKey = `certificates/${enrollment.id}/${code}.pdf`;
    await this.storageService.uploadBuffer(
      pdfKey,
      pdfBuffer,
      'application/pdf',
    );

    // Salva certificado no banco
    const certificate = await this.prisma.certificate.create({
      data: {
        enrollmentId: enrollment.id,
        code,
        pdfKey,
      },
    });

    // Log de auditoria
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'CERTIFICATE_ISSUED',
        entity: 'Certificate',
        entityId: certificate.id,
        meta: {
          courseId,
          courseTitle: enrollment.course.title,
          code,
        },
      },
    });

    return {
      message: 'Certificado gerado com sucesso',
      certificate,
    };
  }

  /**
   * Verifica autenticidade de um certificado pelo código
   */
  async verifyCertificate(code: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { code },
      include: {
        enrollment: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            course: {
              select: {
                title: true,
                workloadHours: true,
              },
            },
          },
        },
      },
    });

    if (!certificate) {
      throw new NotFoundException('Certificado não encontrado');
    }

    return {
      valid: true,
      certificate: {
        code: certificate.code,
        issuedAt: certificate.issuedAt,
        student: certificate.enrollment.user.name,
        course: certificate.enrollment.course.title,
        workloadHours: certificate.enrollment.course.workloadHours,
        completedAt: certificate.enrollment.completedAt,
      },
    };
  }

  /**
   * Baixa PDF do certificado
   */
  async downloadCertificate(certificateId: string, userId: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { id: certificateId },
      include: {
        enrollment: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!certificate) {
      throw new NotFoundException('Certificado não encontrado');
    }

    // Verifica se é dono do certificado ou admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const canDownload =
      user?.role === 'ADMIN' || certificate.enrollment.userId === userId;

    if (!canDownload) {
      throw new ForbiddenException(
        'Você não tem permissão para baixar este certificado',
      );
    }

    // Gera URL assinada
    const downloadUrl = await this.storageService.getSignedUrl(
      certificate.pdfKey,
      300, // 5 minutos
    );

    return {
      downloadUrl,
      fileName: `certificado-${certificate.code}.pdf`,
    };
  }

  /**
   * Lista certificados do usuário
   */
  async getMyCertificates(userId: string) {
    const certificates = await this.prisma.certificate.findMany({
      where: {
        enrollment: {
          userId,
        },
      },
      include: {
        enrollment: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                coverImage: true,
                workloadHours: true,
              },
            },
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });

    return certificates;
  }

  /**
   * Gera código de verificação único
   */
  private generateVerificationCode(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = randomBytes(4).toString('hex').toUpperCase();
    return `${timestamp}-${random}`;
  }

  /**
   * Gera PDF do certificado
   */
  private async generatePDF(data: {
    studentName: string;
    courseTitle: string;
    workloadHours: number;
    completedAt: Date;
    code: string;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Borda decorativa
      doc
        .rect(40, 40, doc.page.width - 80, doc.page.height - 80)
        .lineWidth(2)
        .stroke('#1e40af');

      doc
        .rect(50, 50, doc.page.width - 100, doc.page.height - 100)
        .lineWidth(1)
        .stroke('#1e40af');

      // Título
      doc
        .fontSize(36)
        .font('Helvetica-Bold')
        .fillColor('#1e40af')
        .text('CERTIFICADO', 0, 100, { align: 'center' });

      doc
        .fontSize(16)
        .font('Helvetica')
        .fillColor('#000000')
        .text('DE CONCLUSÃO DE CURSO', 0, 145, { align: 'center' });

      // Corpo
      doc.moveDown(2);

      doc
        .fontSize(14)
        .font('Helvetica')
        .text('Certificamos que', 0, 200, { align: 'center' });

      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .fillColor('#1e40af')
        .text(data.studentName.toUpperCase(), 0, 230, { align: 'center' });

      doc
        .fontSize(14)
        .font('Helvetica')
        .fillColor('#000000')
        .text('concluiu com êxito o curso', 0, 270, { align: 'center' });

      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .fillColor('#1e40af')
        .text(data.courseTitle, 100, 300, {
          align: 'center',
          width: doc.page.width - 200,
        });

      doc
        .fontSize(14)
        .font('Helvetica')
        .fillColor('#000000')
        .text(`com carga horária de ${data.workloadHours} horas.`, 0, 350, {
          align: 'center',
        });

      // Data
      const dateStr = data.completedAt.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      doc
        .fontSize(12)
        .text(`Concluído em ${dateStr}`, 0, 400, { align: 'center' });

      // Código de verificação
      doc
        .fontSize(10)
        .fillColor('#666666')
        .text(`Código de verificação: ${data.code}`, 0, doc.page.height - 100, {
          align: 'center',
        });

      doc
        .fontSize(8)
        .text(
          'Valide este certificado em: https://autoon.example.com/certificates/verify',
          0,
          doc.page.height - 80,
          { align: 'center' },
        );

      doc.end();
    });
  }
}
