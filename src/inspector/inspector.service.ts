import { LOGGER_PROVIDER } from '@lido-nestjs/logger';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import {
  BlockProduction,
  ContactInfo,
  EpochInfo,
  RpcResponseAndContext,
  VoteAccountInfo,
  VoteAccountStatus,
} from '@solana/web3.js';

import { ConfigService } from 'common/config';
import { PrometheusService, TrackableCron } from 'common/prometheus';
import { SolanaService } from 'common/solana';
import {ValidatorKeysRegistryService, ValidatorKeysService} from 'common/validator-keys';
import { Status, Validator, ValidatorService } from 'storage/validator';

import { MetricsService } from '../metrics';
import { calcSkipRate, uniqValidators } from './inspector.helpers';

export interface ClusterInfo {
  epochInfo: EpochInfo;
  voteAccounts: VoteAccountStatus;
  blockProduction: RpcResponseAndContext<BlockProduction>;
  clusterNodes: ContactInfo[];
}

@Injectable()
export class InspectorService {
  constructor(
    @Inject(LOGGER_PROVIDER)
    private logger: LoggerService,
    private config: ConfigService,
    private promService: PrometheusService,

    private validatorKeys: ValidatorKeysRegistryService,
    private validatorKeysService: ValidatorKeysService,
    private validatorStorage: ValidatorService,
    private solanaService: SolanaService,
    private metricsService: MetricsService,
  ) {}

  @TrackableCron(CronExpression.EVERY_MINUTE, { name: 'inspect' })
  public async inspect() {
    this.logger.log('📥 Start validators info inspection');
    if (this.validatorKeys.size == 0) {
      await this.validatorKeysService.fetch();
    }
    const fetchTimestamp = new Date().getTime();
    const clusterInfo = await this.fetchClusterInfo();
    const prevValidatorsInfo = await this.validatorStorage.lastValidatorsInfo();
    const validatorsInfo = await this.processValidatorsInfo(
      fetchTimestamp,
      this.validatorKeys,
      clusterInfo,
      prevValidatorsInfo,
    );
    this.logger.log('🔘️ Put validators info in the storage...');
    await this.validatorStorage.save(validatorsInfo);
    this.logger.log('🔘️ Set metrics...');
    await this.metricsService.setMetrics(
      fetchTimestamp,
      clusterInfo.epochInfo.epoch,
    );
    this.logger.log(
      `👌 Inspection cycle is complete! Epoch: ${clusterInfo.epochInfo.epoch}`,
    );
    this.logger.log('⏳ Wait for the next iteration...');
  }

  @TrackableCron(CronExpression.EVERY_DAY_AT_3AM, { name: 'prune-old-rows' })
  private async pruneOldRows() {
    await this.validatorStorage.pruneOldRows();
  }

  public async fetchClusterInfo(): Promise<ClusterInfo> {
    this.logger.log('🔘️ Fetching cluster information...');
    const [voteAccounts, blockProduction, clusterNodes] = await Promise.all([
      this.solanaService.getVoteAccounts(),
      this.solanaService.getBlockProduction(),
      this.solanaService.getClusterNodes(),
    ]);
    // While we are fetching validators, epochInfo.absoluteSlot may be outdated
    // and makes voteDistance metric invalid. We should fetch epoch info last
    const epochInfo = await this.solanaService.getEpochInfo();
    return { epochInfo, voteAccounts, blockProduction, clusterNodes };
  }

  private async processValidatorsInfo(
    startFetchTimestamp: number,
    userKeys: ValidatorKeysRegistryService,
    clusterInfo: ClusterInfo,
    prevValidatorsInfo: Validator[],
  ) {
    // Calc info for all validators
    this.logger.log('🔘️ Processing validators info...');
    return uniqValidators(clusterInfo.voteAccounts).map((vInfo) =>
      processValidator(vInfo),
    );

    function processValidator(info: VoteAccountInfo) {
      const v = new Validator();
      v.fetchTimestamp = startFetchTimestamp;
      v.epoch = clusterInfo.epochInfo.epoch;
      v.pubkey = info.nodePubkey;
      v.operatorId = userKeys.get(v.pubkey)?.keybaseUsername ?? 'unknown';
      v.operator = userKeys.get(v.pubkey)?.name ?? 'unknown';
      v.lastVote = info.lastVote;
      v.voteDistance = getVoteDistance(info);
      v.status = getStatus(info);
      v.skipRate = getSkipRate(info);
      v.version = getVersion(info);
      v.prevVersion = v.version;
      v.updateTime = undefined;
      const prev = getPreviousValidatorInfo(info);
      v.downtime = getDowntime(info, prev);
      if (prev) {
        v.prevVersion = prev.version;
        v.updateTime = prev.downtime;
      }
      return v;
    }

    function getStatus(info: VoteAccountInfo) {
      let status = Status.OUT_OF_EPOCH;
      if (info.lastVote >= clusterInfo.blockProduction.value.range.firstSlot) {
        status = clusterInfo.voteAccounts.current.find(
          (vd) => info.nodePubkey == vd.nodePubkey,
        )
          ? Status.ONLINE
          : Status.OFFLINE;
      }
      return status;
    }

    function getSkipRate(info: VoteAccountInfo) {
      return calcSkipRate(
        clusterInfo.blockProduction.value.byIdentity[info.nodePubkey],
      );
    }

    function getVoteDistance(info: VoteAccountInfo) {
      return clusterInfo.epochInfo.absoluteSlot - info.lastVote;
    }

    function getVersion(info: VoteAccountInfo) {
      return clusterInfo.clusterNodes.find((n) => n.pubkey === info.nodePubkey)
        ?.version;
    }

    function getPreviousValidatorInfo(info: VoteAccountInfo) {
      return prevValidatorsInfo.find((v) => info.nodePubkey == v.pubkey);
    }

    function getDowntime(info: VoteAccountInfo, prev: Validator) {
      let downtime;
      const status = getStatus(info);
      switch (status) {
        case Status.OFFLINE:
          downtime = 60; // default downtime for offline validators = 1 minute
          break;
        case Status.ONLINE:
          downtime = 0;
          break;
      }
      if (prev && prev.status == Status.OFFLINE && status == Status.OFFLINE) {
        downtime =
          Number(prev.downtime) +
          Math.floor(Number(startFetchTimestamp - prev.fetchTimestamp) / 1000);
      }
      return downtime;
    }
  }
}
