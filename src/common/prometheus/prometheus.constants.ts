import { APP_NAME } from 'app';

export const METRICS_URL = '/metrics';
export const METRICS_PREFIX = `${APP_NAME.replace(/[- ]/g, '_')}_`;

export const METRIC_BUILD_INFO = `build_info`;

export const METRIC_OUTGOING_RPC_REQUESTS_DURATION_SECONDS = `outgoing_rpc_requests_duration_seconds`;
export const METRIC_OUTGOING_RPC_REQUESTS_COUNT = `outgoing_rpc_requests_count`;
export const METRIC_TASK_DURATION_SECONDS = `task_duration_seconds`;
export const METRIC_TASK_RESULT_COUNT = `task_result_count`;

export const METRIC_LAST_FETCH_TIMESTAMP = `last_fetch_timestamp`;
export const METRIC_CURRENT_EPOCH = `current_epoch`;
export const METRIC_SKIP_RATE = `skip_rate`;
export const METRIC_DOWN_TIME = `down_time`;
export const METRIC_VOTE_DISTANCE = `vote_distance`;
export const METRIC_OUT_OF_EPOCH = `out_of_epoch`;

export const METRIC_IDENTIFIERS = `identifiers`;
export const METRIC_CLUSTER_AVG_SKIP_RATE = `cluster_avg_skip_rate`;
export const METRIC_CLUSTER_AVG_DOWN_TIME = `cluster_avg_down_time`;
export const METRIC_CLUSTER_AVG_VOTE_DISTANCE = `cluster_avg_vote_distance`;
export const METRIC_CLUSTER_VALIDATORS_COUNT = `cluster_validators_count`;
