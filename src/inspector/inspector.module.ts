import { Module } from '@nestjs/common';

import { SolanaModule } from 'common/solana';
import { ValidatorKeysModule } from 'common/validator-keys';
import { MetricsModule } from 'metrics';
import { ValidatorModule } from 'storage/validator';

import { InspectorService } from './inspector.service';

@Module({
  imports: [ValidatorModule, ValidatorKeysModule, SolanaModule, MetricsModule],
  providers: [InspectorService],
  exports: [InspectorService],
})
export class InspectorModule {}
