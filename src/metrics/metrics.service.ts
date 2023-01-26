import { Injectable } from '@nestjs/common';

import { PrometheusService } from 'common/prometheus';
import {Status, Validator, ValidatorService} from 'storage/validator';
import {Metric} from "prom-client";

enum Owner {
  USER = 'user',
  OTHER = 'other',
}

@Injectable()
export class MetricsService {

  userValidators: Validator[] = [];
  constructor(
    private promService: PrometheusService,
    private validator: ValidatorService,
  ) {}

  /**
   * Set all metrics
   */
  public async setMetrics(fetchTimestamp: number, epoch: number) {
    // Cluster validators count metrics
    for (const status of Object.values(Status)) {
      this.promService.clusterValidatorsCount
        .labels({ owner: Owner.USER, status: status })
        .set(
          Number(
            (await this.validator.userStatusCount(fetchTimestamp, status))
              .count,
          ),
        );
      this.promService.clusterValidatorsCount
        .labels({ owner: Owner.OTHER, status: status })
        .set(
          Number(
            (await this.validator.otherStatusCount(fetchTimestamp, status))
              .count,
          ),
        );
    }
    // Cluster avg skip rate
    const clusterAvgSkipRate = await this.validator.clusterAvgSkipRate(
      fetchTimestamp,
    );
    this.promService.clusterAvgSkipRate.set(Number(clusterAvgSkipRate.avg));
    const clusterAvgDownTime = await this.validator.clusterAvgDownTime(
      fetchTimestamp,
    );
    // Cluster avg downtime
    this.promService.clusterAvgDownTime.set(Number(clusterAvgDownTime.avg));
    const clusterAvgVoteDistance = await this.validator.clusterAvgVoteDistance(
      fetchTimestamp,
    );
    this.promService.clusterAvgVoteDistance.set(
      Number(clusterAvgVoteDistance.avg),
    );
    // User validators metrics
    this.userValidators = await this.validator.userValidators(fetchTimestamp);
    for (const v of this.userValidators) {
      this.promService.outOfEpoch
        .labels(v.operator)
        .set(v.status == Status.OUT_OF_EPOCH ? 1 : 0);
      this.promService.skipRate.labels(v.operator).set(Number(v.skipRate));
      this.promService.downTime.labels(v.operator).set(Number(v.downtime));
      this.promService.voteDistance
        .labels(v.operator)
        .set(Number(v.voteDistance));
      this.promService.identifiers.labels({ operator: v.operator, operatorId: v.operatorId }).set(1);
    }
    // Remove outdated metrics
    [this.promService.outOfEpoch, this.promService.skipRate, this.promService.downTime, this.promService.voteDistance, this.promService.identifiers].forEach((metric) => this.removeOutdatedMetrics(metric));
    // Common metrics
    this.promService.currentEpoch.set(epoch);
    this.promService.lastFetchTimestamp.set(fetchTimestamp);
  }

  private removeOutdatedMetrics(metric: Metric) {
    // remove metrics for validators that are not in the list anymore
    const registry = Object.values(metric['hashMap']).map((m: any) => m.labels);
    registry.forEach((labels) => {
      if (!this.userValidators.find((o) => o.operator == labels.operator)) metric.remove(labels);
    });
  }
}
