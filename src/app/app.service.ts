import { LOGGER_PROVIDER } from '@lido-nestjs/logger';
import {
  Inject,
  Injectable,
  LoggerService,
  OnModuleInit,
} from '@nestjs/common';
import { OnApplicationBootstrap } from '@nestjs/common/interfaces/hooks/on-application-bootstrap.interface';
import { CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { CronTime } from 'cron';

import * as buildInfo from 'build-info';
import { ConfigService } from 'common/config';
import { PrometheusService } from 'common/prometheus';

import { InspectorService } from '../inspector';
import { APP_NAME } from './app.constants';

@Injectable()
export class AppService implements OnModuleInit, OnApplicationBootstrap {
  constructor(
    @Inject(LOGGER_PROVIDER) protected readonly logger: LoggerService,
    protected readonly schedulerRegistry: SchedulerRegistry,

    protected readonly configService: ConfigService,
    protected readonly promService: PrometheusService,
    protected readonly inspectorService: InspectorService,
  ) {}

  public async onModuleInit(): Promise<void> {
    const env = this.configService.get('NODE_ENV');
    const version = buildInfo.version;
    const commit = buildInfo.commit;
    const branch = buildInfo.branch;
    const name = APP_NAME;

    this.promService.buildInfo
      .labels({ env, name, version, commit, branch })
      .inc();

    this.logger.log('Init app', { env, name, version });
  }

  public async onApplicationBootstrap(): Promise<void> {
    if (this.configService.get('DRY_RUN')) {
      this.logger.log('Dry run is enabled');
      // run once
      await this.inspectorService.inspect();
      // and change schedule time
      for (const [name, job] of this.schedulerRegistry
        .getCronJobs()
        .entries()) {
        job.setTime(new CronTime(CronExpression.EVERY_DAY_AT_NOON));
        job.start();
        this.logger.debug(
          `Cron task '${name}' time changed to ${CronExpression.EVERY_DAY_AT_NOON}`,
        );
      }
    }
  }
}
