import { Module } from '@nestjs/common';

import { SolanaModule } from '../solana';
import { ValidatorKeysRegistryService } from './validator-keys.registry';
import { ValidatorKeysService } from './validator-keys.service';

@Module({
  imports: [SolanaModule],
  exports: [ValidatorKeysService, ValidatorKeysRegistryService],
  providers: [ValidatorKeysService, ValidatorKeysRegistryService],
})
export class ValidatorKeysModule {}
