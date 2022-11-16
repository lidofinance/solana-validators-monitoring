import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ConfigModule, ConfigService } from 'common/config';
import { HealthModule } from 'common/health';
import { LoggerModule } from 'common/logger';
import { PrometheusModule } from 'common/prometheus';

import { InspectorModule } from '../inspector';
import { dbFactory } from './app.connection';
import { AppService } from './app.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: dbFactory,
      inject: [ConfigService],
    }),
    HealthModule,
    LoggerModule,
    PrometheusModule,
    ConfigModule,
    InspectorModule,
  ],
  providers: [AppService],
})
export class AppModule {}
