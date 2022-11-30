import { Buffer } from 'buffer';

import { LOGGER_PROVIDER } from '@lido-nestjs/logger';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import {
  AccountInfo,
  BlockProduction,
  Connection,
  ContactInfo,
  EpochInfo,
  ParsedAccountData,
  PublicKey,
  RpcResponseAndContext,
  VoteAccountStatus,
} from '@solana/web3.js';
import { deserializeUnchecked } from 'borsh';
import * as fetch from 'node-fetch';
import { BackOffPolicy, Retryable } from 'typescript-retry-decorator';

import { ConfigService } from 'common/config';
import { PrometheusService, TrackableRequest } from 'common/prometheus';

import { LidoProgramAddresses } from './solido/solido.constants';
import {
  AccountInfoV1,
  AccountInfoV2,
  AccountList,
  Lido,
  ValidatorsList,
  accountInfoV1Scheme,
  accountInfoV2Scheme,
  validatorsSchema,
} from './solido/solido.schema';

const retryPolicy = {
  maxAttempts: 1,
  backOffPolicy: BackOffPolicy.FixedBackOffPolicy,
  backOff: 500,
};

/**
 * Decorator for RPC health check before main request
 */
function WithHealthCheck(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  const originalValue = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    // "this" here will refer to the class instance
    if (!this.configService)
      throw Error(
        `'${this.constructor.name}' class object must contain 'configService' property`,
      );

    if (!this.configService.get('RPC_HEALTH_CHECK')) {
      return originalValue.apply(this, args);
    }

    return originalValue.apply(this, args).then(async (originalResult) => {
      const connection = args.at(-1)?.connection ?? this.connection;
      const hostname = new URL(connection.rpcEndpoint).hostname;
      const health = await fetch(connection.rpcEndpoint + '/health');
      const status = await health.text();
      if (status != 'ok') {
        throw Error(
          `RPC provider '${hostname}' has unexpected health status: ${status}`,
        );
      }
      return originalResult;
    });
  };
}

/**
 * Decorator for rerunning requests with another URL if it's failed
 */
function WithFallback(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  const originalValue = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    // "this" here will refer to the class instance
    if (!this.configService)
      throw Error(
        `'${this.constructor.name}' class object must contain 'configService' property`,
      );
    const urls = this.configService.get('RPC_URLS');
    let i = 0;
    const wrappedFunc = async function (...args: any[]) {
      const options = { connection: new Connection(urls[i]) };
      args.push(options);
      return originalValue.apply(this, args).catch((e) => {
        i++;
        if (i < urls.length) {
          this.logger.error(
            `${e.message}. Error while doing RPC request. Will try to switch to another URL`,
          );
          args.pop();
          return wrappedFunc.apply(this, args);
        }
        e.message = `${e.message}. Error while doing CL API request on all passed URLs`;
        throw e;
      });
    };
    return wrappedFunc.apply(this, args);
  };
}

export interface ParsedProgramAccount {
  pubkey: PublicKey;
  account: AccountInfo<Buffer | ParsedAccountData>;
}

@Injectable()
export class SolanaService {
  private connection: Connection;

  constructor(
    @Inject(LOGGER_PROVIDER) protected readonly logger: LoggerService,
    private configService: ConfigService, // used by WithFallback decorator
    private promService: PrometheusService, // used by TrackableRequest decorator
  ) {}

  @WithFallback
  @Retryable(retryPolicy)
  @TrackableRequest
  @WithHealthCheck
  public getEpochInfo(options?: {
    connection?: Connection;
  }): Promise<EpochInfo> {
    const connection = options?.connection ?? this.connection;
    return connection.getEpochInfo();
  }

  @WithFallback
  @Retryable(retryPolicy)
  @TrackableRequest
  @WithHealthCheck
  public getVoteAccounts(options?: {
    connection?: Connection;
  }): Promise<VoteAccountStatus> {
    const connection = options?.connection ?? this.connection;
    return connection.getVoteAccounts();
  }

  @WithFallback
  @Retryable(retryPolicy)
  @TrackableRequest
  @WithHealthCheck
  public getBlockProduction(options?: {
    connection?: Connection;
  }): Promise<RpcResponseAndContext<BlockProduction>> {
    const connection = options?.connection ?? this.connection;
    return connection.getBlockProduction();
  }

  @WithFallback
  @Retryable(retryPolicy)
  @TrackableRequest
  @WithHealthCheck
  public getClusterNodes(options?: {
    connection?: Connection;
  }): Promise<Array<ContactInfo>> {
    const connection = options?.connection ?? this.connection;
    return connection.getClusterNodes();
  }

  @WithFallback
  @Retryable(retryPolicy)
  @TrackableRequest
  @WithHealthCheck
  public getAccountInfo(
    key: PublicKey,
    options?: {
      connection?: Connection;
    },
  ): Promise<AccountInfo<Buffer> | null> {
    const connection = options?.connection ?? this.connection;
    return connection.getAccountInfo(key);
  }

  @WithFallback
  @Retryable(retryPolicy)
  @TrackableRequest
  @WithHealthCheck
  public getParsedProgramAccounts(
    pubkey: PublicKey,
    options?: {
      connection?: Connection;
    },
  ): Promise<ParsedProgramAccount[]> {
    const connection = options?.connection ?? this.connection;
    return connection.getParsedProgramAccounts(pubkey);
  }

  @WithFallback
  @Retryable(retryPolicy)
  @TrackableRequest
  @WithHealthCheck
  public getBlocks(
    startSlot: number,
    endSlot: number,
    options?: {
      connection?: Connection;
    },
  ): Promise<number[]> {
    const connection = options?.connection ?? this.connection;
    return connection.getBlocks(startSlot, endSlot);
  }

  @WithFallback
  @Retryable(retryPolicy)
  @TrackableRequest
  @WithHealthCheck
  public getBlockTime(
    slot: number,
    options?: {
      connection?: Connection;
    },
  ): Promise<number | null> {
    const connection = options?.connection ?? this.connection;
    return connection.getBlockTime(slot);
  }

  public async getLidoValidators(): Promise<any> {
    const solidoKey = new PublicKey(
      LidoProgramAddresses[
        this.configService.get('VALIDATORS_LIST_LIDO_PROGRAM_INSTANCE')
      ],
    );
    const solidoAccountInfo = await this.getAccountInfo(solidoKey);
    try {
      const deserializedAccountInfo = deserializeUnchecked(
        accountInfoV1Scheme,
        Lido,
        solidoAccountInfo.data,
      ) as any as AccountInfoV1;

      return deserializedAccountInfo.validators.entries.map(
        ({ entry, pubkey }) => ({
          vote_account_address: new PublicKey(pubkey),
          ...entry,
          // effective_stake_balance doesn't exist in first version of protocol as a property
          // https://github.com/lidofinance/solido/blob/4a5fe34b2ecf937344a9dfcd389ffe120e587cfd/program/src/state.rs#L705-L708
          effective_stake_balance:
            entry.stake_accounts_balance - entry.unstake_accounts_balance,
        }),
      );
    } catch {
      // support transition to V2 while deploy
      const deserializedAccountInfo = deserializeUnchecked(
        accountInfoV2Scheme,
        Lido,
        solidoAccountInfo.data,
      ) as any as AccountInfoV2;

      const validatorsList = new PublicKey(
        deserializedAccountInfo.validator_list,
      );
      const validators = await this.getAccountInfo(validatorsList);

      const deserializedValidators = deserializeUnchecked(
        validatorsSchema,
        AccountList,
        validators.data,
      ) as any as ValidatorsList;
      deserializedValidators.entries.forEach(
        (v) => (v.vote_account_address = new PublicKey(v.vote_account_address)),
      );

      return deserializedValidators.entries;
    }
  }
}
