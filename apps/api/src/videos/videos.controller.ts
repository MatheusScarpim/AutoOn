import { Controller, Post, Get, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { VideosService } from './videos.service';
import { InitiateUploadDto, CompleteUploadDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('videos')
@Controller('videos')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class VideosController {
  constructor(private videosService: VideosService) {}

  @Post('initiate-upload')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Iniciar upload multipart de vídeo' })
  @ApiResponse({
    status: 201,
    description: 'Upload iniciado com sucesso',
    schema: {
      type: 'object',
      properties: {
        videoId: { type: 'string' },
        uploadId: { type: 'string' },
        key: { type: 'string' },
        partSize: { type: 'number' },
        partsCount: { type: 'number' },
        storageProvider: { type: 'string', enum: ['s3', 'azure'] },
        uploadUrls: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              partNumber: { type: 'number' },
              uploadUrl: { type: 'string' },
              blockId: { type: 'string', nullable: true },
            },
          },
        },
      },
    },
  })
  async initiateUpload(@Body() dto: InitiateUploadDto, @Req() req: any) {
    return this.videosService.initiateUpload(dto, req.user.sub);
  }

  @Post(':id/complete-upload')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Completar upload multipart e iniciar transcodificação' })
  @ApiResponse({
    status: 200,
    description: 'Upload completado, vídeo em processamento',
  })
  async completeUpload(
    @Param('id') videoId: string,
    @Body() dto: CompleteUploadDto,
    @Req() req: any,
  ) {
    return this.videosService.completeUpload(videoId, dto, req.user.sub);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Obter status do vídeo' })
  @ApiResponse({
    status: 200,
    description: 'Status do vídeo',
  })
  async getVideoStatus(@Param('id') videoId: string, @Req() req: any) {
    return this.videosService.getVideoStatus(videoId, req.user.sub);
  }

  @Get(':id/stream')
  @ApiOperation({ summary: 'Obter URL assinada para streaming do vídeo' })
  @ApiResponse({
    status: 200,
    description: 'URL assinada gerada',
    schema: {
      type: 'object',
      properties: {
        videoId: { type: 'string' },
        masterPlaylistUrl: { type: 'string' },
        expiresIn: { type: 'number' },
        durationSec: { type: 'number' },
        thumbnails: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async getStreamUrl(@Param('id') videoId: string, @Req() req: any) {
    return this.videosService.getStreamUrl(videoId, req.user.sub);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Deletar vídeo e seus arquivos' })
  @ApiResponse({
    status: 200,
    description: 'Vídeo deletado com sucesso',
  })
  async deleteVideo(@Param('id') videoId: string, @Req() req: any) {
    return this.videosService.deleteVideo(videoId, req.user.sub);
  }
}
