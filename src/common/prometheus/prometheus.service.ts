import { Injectable } from '@nestjs/common';
import { Metrics, getOrCreateMetric } from '@willsoto/nestjs-prometheus';

import { Metric, Options } from './interfaces';
import {
  METRICS_PREFIX,
  METRIC_BUILD_INFO,
  METRIC_CLUSTER_AVG_DOWN_TIME,
  METRIC_CLUSTER_AVG_SKIP_RATE,
  METRIC_CLUSTER_AVG_VOTE_DISTANCE,
  METRIC_CLUSTER_VALIDATORS_COUNT,
  METRIC_CURRENT_EPOCH,
  METRIC_DOWN_TIME,
  METRIC_LAST_FETCH_TIMESTAMP,
  METRIC_OUTGOING_RPC_REQUESTS_COUNT,
  METRIC_OUTGOING_RPC_REQUESTS_DURATION_SECONDS,
  METRIC_OUT_OF_EPOCH,
  METRIC_SKIP_RATE,
  METRIC_TASK_DURATION_SECONDS,
  METRIC_TASK_RESULT_COUNT,
  METRIC_VOTE_DISTANCE,
} from './prometheus.constants';

@Injectable()
export class PrometheusService {
  private prefix = METRICS_PREFIX;

  private getOrCreateMetric<T extends Metrics, L extends string>(
    type: T,
    options: Options<L>,
  ): Metric<T, L> {
    const nameWithPrefix = this.prefix + options.name;

    return getOrCreateMetric(type, {
      ...options,
      name: nameWithPrefix,
    }) as Metric<T, L>;
  }

  public outgoingRPCRequestsDuration = this.getOrCreateMetric('Histogram', {
    name: METRIC_OUTGOING_RPC_REQUESTS_DURATION_SECONDS,
    help: 'Duration of outgoing json-rpc requests',
    buckets: [0.01, 0.1, 0.2, 0.5, 1, 1.5, 2, 5],
    labelNames: ['name', 'target', 'status'] as const,
  });

  public outgoingRPCRequestsCount = this.getOrCreateMetric('Counter', {
    name: METRIC_OUTGOING_RPC_REQUESTS_COUNT,
    help: 'Count of outgoing json-rpc requests',
    labelNames: ['name', 'target', 'status'] as const,
  });

  public buildInfo = this.getOrCreateMetric('Counter', {
    name: METRIC_BUILD_INFO,
    help: 'Build information',
    labelNames: ['name', 'version', 'commit', 'branch', 'env', 'network'],
  });

  public taskDuration = this.getOrCreateMetric('Histogram', {
    name: METRIC_TASK_DURATION_SECONDS,
    help: 'Duration of task execution',
    buckets: [30, 60, 90, 120, 150, 180, 210, 300, 400],
    labelNames: ['name'],
  });

  public taskCount = this.getOrCreateMetric('Counter', {
    name: METRIC_TASK_RESULT_COUNT,
    help: 'Count of passed or failed tasks',
    labelNames: ['name', 'status'],
  });

  public lastFetchTimestamp = this.getOrCreateMetric('Gauge', {
    name: METRIC_LAST_FETCH_TIMESTAMP,
    help: 'Last fetch timestamp',
  });

  public currentEpoch = this.getOrCreateMetric('Gauge', {
    name: METRIC_CURRENT_EPOCH,
    help: 'Last epoch column value in DB',
  });

  public clusterAvgSkipRate = this.getOrCreateMetric('Gauge', {
    name: METRIC_CLUSTER_AVG_SKIP_RATE,
    help: 'Cluster average skip rate',
  });

  public clusterAvgDownTime = this.getOrCreateMetric('Gauge', {
    name: METRIC_CLUSTER_AVG_DOWN_TIME,
    help: 'Cluster average downtime',
  });

  public clusterAvgVoteDistance = this.getOrCreateMetric('Gauge', {
    name: METRIC_CLUSTER_AVG_VOTE_DISTANCE,
    help: 'Cluster average vote distance',
  });

  public clusterValidatorsCount = this.getOrCreateMetric('Gauge', {
    name: METRIC_CLUSTER_VALIDATORS_COUNT,
    help: 'Cluster validators count',
    labelNames: ['owner', 'status'],
  });

  public skipRate = this.getOrCreateMetric('Gauge', {
    name: METRIC_SKIP_RATE,
    help: 'Operator skip rate',
    labelNames: ['operator'] as const,
  });

  public downTime = this.getOrCreateMetric('Gauge', {
    name: METRIC_DOWN_TIME,
    help: 'Operator downtime',
    labelNames: ['operator'] as const,
  });

  public voteDistance = this.getOrCreateMetric('Gauge', {
    name: METRIC_VOTE_DISTANCE,
    help: 'Operator vote distance',
    labelNames: ['operator'] as const,
  });

  public outOfEpoch = this.getOrCreateMetric('Gauge', {
    name: METRIC_OUT_OF_EPOCH,
    help: 'Operator out of epoch or not',
    labelNames: ['operator'] as const,
  });
}
