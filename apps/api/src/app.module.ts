import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { ModulesModule } from './modules/modules.module';
import { LessonsModule } from './lessons/lessons.module';
import { VideosModule } from './videos/videos.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { ProgressModule } from './progress/progress.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { CertificatesModule } from './certificates/certificates.module';
import { ReportsModule } from './reports/reports.module';
import { AdminModule } from './admin/admin.module';
import { StorageModule } from './storage/storage.module';
import { QueueModule } from './queue/queue.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60', 10) * 1000,
        limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    ModulesModule,
    LessonsModule,
    VideosModule,
    EnrollmentsModule,
    ProgressModule,
    QuizzesModule,
    CertificatesModule,
    ReportsModule,
    AdminModule,
    StorageModule,
    QueueModule,
    SubscriptionsModule,
    PaymentsModule,
  ],
})
export class AppModule {}
