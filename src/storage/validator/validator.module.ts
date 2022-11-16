import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Validator } from './validator.entity';
import { ValidatorService } from './validator.service';

@Module({
  imports: [TypeOrmModule.forFeature([Validator])],
  providers: [ValidatorService],
  exports: [ValidatorService],
})
export class ValidatorModule {}
