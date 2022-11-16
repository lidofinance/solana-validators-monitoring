import { LOGGER_PROVIDER } from '@lido-nestjs/logger';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InsertResult, Repository } from 'typeorm';

import { ConfigService } from 'common/config';

import { Status, Validator } from './validator.entity';

@Injectable()
export class ValidatorService {
  private readonly keepDays;

  constructor(
    @Inject(LOGGER_PROVIDER)
    private logger: LoggerService,
    private configService: ConfigService,
    @InjectRepository(Validator)
    private validatorModel: Repository<Validator>,
  ) {
    this.keepDays = configService.get('KEEP_IN_STORAGE_DAYS');
  }

  public async pruneOldRows(): Promise<any> {
    if (!this.keepDays || this.keepDays == 0) return;
    const result = await this.validatorModel
      .createQueryBuilder()
      .delete()
      .where(
        `"fetchTimestamp" <= ${
          new Date().getTime() - this.keepDays * 86400000
        }::bigint`,
      )
      .execute();
    this.logger.log(`🗑️ Prune old rows from DB: ${result.affected}`);
  }

  public async save(entity: Validator | Validator[]): Promise<InsertResult> {
    return await this.validatorModel.insert(entity);
  }

  public async lastValidatorsInfo(): Promise<Validator[]> {
    const currentFetchTimestamp = await this.validatorModel
      .createQueryBuilder()
      .select('"fetchTimestamp"')
      .orderBy(`"fetchTimestamp"`, 'DESC')
      .limit(1)
      .getRawOne();
    if (currentFetchTimestamp) {
      return await this.allValidators(currentFetchTimestamp.fetchTimestamp);
    }
    return [];
  }

  public async getOneLastInserted(pubkey: string): Promise<Validator> {
    return await this.validatorModel
      .createQueryBuilder()
      .select('*')
      .where(`pubkey = '${pubkey}'`)
      .orderBy(`"fetchTimestamp"`, 'DESC')
      .limit(1)
      .getRawOne();
  }

  public async allValidators(fetchTimestamp: number): Promise<Validator[]> {
    return await this.validatorModel
      .createQueryBuilder()
      .select('*')
      .where(`"fetchTimestamp" = ${fetchTimestamp}::bigint`)
      .getRawMany();
  }

  public async userValidators(fetchTimestamp: number): Promise<Validator[]> {
    return await this.validatorModel
      .createQueryBuilder()
      .select('*')
      .where(`"fetchTimestamp" = ${fetchTimestamp}::bigint`)
      .andWhere(`operator != 'unknown'`)
      .getRawMany();
  }

  public async userStatusCount(
    fetchTimestamp: number,
    status: string,
  ): Promise<{ count: string }> {
    return await this.validatorModel
      .createQueryBuilder()
      .select('count(*)')
      .where(`"fetchTimestamp" = ${fetchTimestamp}::bigint`)
      .andWhere(`status = '${status}'`)
      .andWhere(`operator != 'unknown'`)
      .getRawOne();
  }

  public async otherStatusCount(
    fetchTimestamp: number,
    status: string,
  ): Promise<{ count: string }> {
    return await this.validatorModel
      .createQueryBuilder()
      .select('count(*)')
      .where(`"fetchTimestamp" = ${fetchTimestamp}::bigint`)
      .andWhere(`status = '${status}'`)
      .andWhere(`operator = 'unknown'`)
      .getRawOne();
  }

  public async clusterAvgSkipRate(
    fetchTimestamp: number,
  ): Promise<{ avg: string }> {
    return await this.validatorModel
      .createQueryBuilder()
      .select('avg("skipRate")')
      .where(`"fetchTimestamp" = ${fetchTimestamp}::bigint`)
      .getRawOne();
  }

  public async clusterAvgDownTime(
    fetchTimestamp: number,
  ): Promise<{ avg: string }> {
    return await this.validatorModel
      .createQueryBuilder()
      .select('avg("downtime")')
      .where(`"fetchTimestamp" = ${fetchTimestamp}::bigint`)
      .getRawOne();
  }

  public async clusterAvgVoteDistance(
    fetchTimestamp: number,
  ): Promise<{ avg: string }> {
    return await this.validatorModel
      .createQueryBuilder()
      .select('avg("voteDistance")')
      .where(`"fetchTimestamp" = ${fetchTimestamp}::bigint`)
      .andWhere(`status != '${Status.OUT_OF_EPOCH}'`)
      .getRawOne();
  }
}
