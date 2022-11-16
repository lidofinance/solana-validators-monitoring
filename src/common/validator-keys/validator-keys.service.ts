import { readFile } from 'fs/promises';

import { LOGGER_PROVIDER } from '@lido-nestjs/logger';
import {
  Inject,
  Injectable,
  LoggerService,
  OnModuleInit,
} from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { PublicKey } from '@solana/web3.js';
import { load } from 'js-yaml';

import { uniqValidators } from '../../inspector';
import { ConfigService, ValidatorsListSource } from '../config';
import { PrometheusService, TrackableCron } from '../prometheus';
import { CONFIG_APP_KEY, ParsedProgramAccount, SolanaService } from '../solana';
import {
  Identity,
  ValidatorKeysRegistryService,
} from './validator-keys.registry';

export interface FileContent {
  identities: string[];
}

@Injectable()
export class ValidatorKeysService implements OnModuleInit {
  constructor(
    @Inject(LOGGER_PROVIDER)
    private logger: LoggerService,
    private config: ConfigService,
    private promService: PrometheusService,

    private validatorKeysRegistry: ValidatorKeysRegistryService,
    private solanaService: SolanaService,
  ) {}

  public async onModuleInit(): Promise<void> {
    if (this.validatorKeysRegistry.size == 0) {
      await this.fetch();
    }
  }

  @TrackableCron(CronExpression.EVERY_HOUR, {
    name: 'fetch-user-validator-keys',
  })
  private async fetch() {
    this.logger.log('📥 Start fetching a list of monitored validators');
    let identities: Identity[];
    let configValidators: ParsedProgramAccount[];
    try {
      configValidators = await this.solanaService.getParsedProgramAccounts(
        new PublicKey(CONFIG_APP_KEY),
      );
      switch (this.config.get('VALIDATORS_LIST_SOURCE')) {
        case ValidatorsListSource.Lido:
          identities = await this.fromLido();
          break;
        case ValidatorsListSource.File:
          identities = await this.fromFile();
      }
    } catch (e) {
      this.logger.error(
        'Error while fetching validator keys. Will be used previous',
      );
      this.logger.error(e);
    }
    this.validatorKeysRegistry.clear();
    this.pushToRegistry(identities, configValidators);
  }

  private async fromLido() {
    this.logger.log('💧 Validators from Lido contract');
    const identities: Identity[] = [];
    const voteAccounts = await this.solanaService.getVoteAccounts();
    const lidoValidators = await this.solanaService.getLidoValidators();
    lidoValidators.forEach((lv) => {
      const va = uniqValidators(voteAccounts).find((v) => {
        return v.votePubkey === lv.vote_account_address.toString();
      });
      if (va) identities.push(va.nodePubkey);
    });
    return identities;
  }

  private async fromFile() {
    this.logger.log('📁 Validators from file');
    const fileContent = await readFile(
      this.config.get('VALIDATORS_LIST_FILE_SOURCE_PATH'),
      'utf-8',
    );
    return (await (<FileContent>load(fileContent))).identities;
  }

  private pushToRegistry(
    userValidators: Identity[],
    configValidators: ParsedProgramAccount[],
  ) {
    for (const key of userValidators) {
      for (const cv of configValidators) {
        const parsed = cv.account.data['parsed'] ?? {};
        const isUser = parsed.info?.keys?.find(
          (k) => k.pubkey.toString() == key,
        );
        if (isUser) {
          // Config App contract may not contain alias
          this.validatorKeysRegistry.set(
            key,
            parsed.info.configData.name ?? key,
          );
        }
      }
    }
  }
}
