import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './infra/database/prisma.service';
import { TitleModule } from './presentation/modules/title.module';
import { PublisherModule } from './presentation/modules/publisher.module';
import { AuthModule } from './presentation/modules/auth.module';
import { UserModule } from './presentation/modules/user.module';
import { NotificationModule } from './presentation/modules/notification.module';
import { HttpLoggerMiddleware } from './presentation/middleware/http-logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TitleModule,
    PublisherModule,
    AuthModule,
    UserModule,
    NotificationModule,
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}
