import { Module } from '@nestjs/common';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';

@Module({
  imports: [PrismaModule, EnrollmentsModule],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
