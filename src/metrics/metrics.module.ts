import { Module } from '@nestjs/common';

import { ValidatorModule } from 'storage/validator';

import { MetricsService } from './metrics.service';

@Module({
  imports: [ValidatorModule],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
