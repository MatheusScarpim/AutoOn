import {
  Controller,
  Post,
  Get,
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
import { CertificatesService } from './certificates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Certificates')
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Post('course/:courseId/generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gerar certificado de conclusão de curso' })
  @ApiResponse({ status: 201, description: 'Certificado gerado com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Curso não concluído ou requisitos não atendidos',
  })
  @ApiResponse({ status: 404, description: 'Matrícula não encontrada' })
  async generateCertificate(
    @Param('courseId') courseId: string,
    @Request() req: any,
  ) {
    return this.certificatesService.generateCertificate(
      courseId,
      req.user.sub,
    );
  }

  @Get('verify/:code')
  @ApiOperation({ summary: 'Verificar autenticidade de um certificado' })
  @ApiResponse({ status: 200, description: 'Certificado verificado' })
  @ApiResponse({ status: 404, description: 'Certificado não encontrado' })
  async verifyCertificate(@Param('code') code: string) {
    return this.certificatesService.verifyCertificate(code);
  }

  @Get(':id/download')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Baixar PDF do certificado' })
  @ApiResponse({ status: 200, description: 'URL de download gerada' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Certificado não encontrado' })
  async downloadCertificate(@Param('id') id: string, @Request() req: any) {
    return this.certificatesService.downloadCertificate(id, req.user.sub);
  }

  @Get('my-certificates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar meus certificados' })
  @ApiResponse({ status: 200, description: 'Lista de certificados' })
  async getMyCertificates(@Request() req: any) {
    return this.certificatesService.getMyCertificates(req.user.sub);
  }
}

