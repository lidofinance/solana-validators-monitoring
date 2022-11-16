import { PublicKey } from '@solana/web3.js';

export enum LidoVersion {
  v1,
  v2,
}

export type ValidatorV2 = {
  // Validator vote account address
  vote_account_address: PublicKey;
  // Seeds for active stake accounts
  stake_seeds: SeedRange;
  // Seeds for inactive stake accounts
  unstake_seeds: SeedRange;
  // Sum of the balances of the stake accounts and unstake accounts
  stake_accounts_balance: number;
  // Sum of the balances of the unstake accounts
  unstake_accounts_balance: number;
  // Effective stake balance is stake_accounts_balance - unstake_accounts_balance.
  // The result is stored on-chain to optimize compute budget
  effective_stake_balance: number;
  // Controls if a validator is allowed to have new stake deposits
  active: boolean;
};

export type Validator = ValidatorV2;

export type AccountInfoMetrics = {
  // Fees paid to the treasury, in total since we started tracking, before conversion to stSOL
  fee_treasury_sol_total: number;
  // Fees paid to validators, in total since we started tracking, before conversion to stSOL
  fee_validation_sol_total: number;
  // Fees paid to the developer, in total since we started tracking, before conversion to stSOL
  fee_developer_sol_total: number;
  // Total rewards that benefited stSOL holders, in total, since we started tracking
  st_sol_appreciation_sol_total: number;
  // Fees paid to the treasury, in total since we started tracking
  fee_treasury_st_sol_total: number;
  // Fees paid to validators, in total since we started tracking
  fee_validation_st_sol_total: number;
  // Fees paid to the developer, in total since we started tracking
  fee_developer_st_sol_total: number;
  // Histogram of deposits, including the total amount deposited since we started tracking
  deposit_amount: LamportsHistogram;
  // Total amount withdrawn since the beginning
  withdraw_amount: WithdrawMetric;
};

export type ValidatorV1 = {
  entry: Omit<ValidatorV2, 'vote_account_address'>;
  pubkey: PublicKey;
};

export type AccountInfoV1 = {
  lido_version: LidoVersion;
  validators: {
    entries: ValidatorV1[];
  };
  exchange_rate: {
    sol_balance: number;
    st_sol_supply: number;
  };
  metrics: AccountInfoMetrics;
};

enum AccountType {
  Uninitialized,
  Lido,
  Validator,
  Maintainer,
}

export type ValidatorsList = {
  header: ListHeader;
  entries: ValidatorV2[];
  account_type: AccountType;
};

export type AccountInfoV2 = {
  // Solido version
  lido_version: LidoVersion;

  // Account type, must be Lido
  account_type: AccountType;

  // Manager of the Lido program, able to execute administrative functions
  manager: PublicKey;

  // The SPL Token mint address for stSOL
  st_sol_mint: PublicKey;

  // Exchange rate to use when depositing.
  exchange_rate: ExchangeRate;

  // Bump seeds for signing messages on behalf of the authority
  sol_reserve_account_bump_seed: number;
  stake_authority_bump_seed: number;
  mint_authority_bump_seed: number;

  // How rewards are distributed.
  reward_distribution: RewardDistribution;

  // Accounts of the fee recipients
  fee_recipients: FeeRecipients;

  // Metrics for informational purposes
  metrics: AccountInfoMetrics;

  // Validator list account
  validator_list: PublicKey;
  // Maintainer list account
  maintainer_list: PublicKey;

  // Maximum validation commission percentage in [0, 100]
  max_commission_percentage: number;
};

export class Lido {
  constructor(data) {
    Object.assign(this, data);
  }
}

export class SeedRange {
  constructor(data) {
    Object.assign(this, data);
  }
}

export class ValidatorClass {
  constructor(data) {
    Object.assign(this, data);
  }
}

export class PubKeyAndEntry {
  constructor(data) {
    Object.assign(this, data);
  }
}

export class PubKeyAndEntryMaintainer {
  constructor(data) {
    Object.assign(this, data);
  }
}

export class RewardDistribution {
  constructor(data) {
    Object.assign(this, data);
  }
}

export class FeeRecipients {
  constructor(data) {
    Object.assign(this, data);
  }
}

export class Validators {
  constructor(data) {
    Object.assign(this, data);
  }
}

export class Maintainers {
  constructor(data) {
    Object.assign(this, data);
  }
}

export class ExchangeRate {
  constructor(data) {
    Object.assign(this, data);
  }
}

export class Metrics {
  constructor(data) {
    Object.assign(this, data);
  }
}

export class LamportsHistogram {
  constructor(data) {
    Object.assign(this, data);
  }
}

export class WithdrawMetric {
  constructor(data) {
    Object.assign(this, data);
  }
}

export class AccountList {
  constructor(data) {
    Object.assign(this, data);
  }
}

export class ListHeader {
  constructor(data) {
    Object.assign(this, data);
  }
}

export const accountInfoV1Scheme = new Map([
  [
    ExchangeRate,
    {
      kind: 'struct',
      fields: [
        ['computed_in_epoch', 'u64'],
        ['st_sol_supply', 'u64'],
        ['sol_balance', 'u64'],
      ],
    },
  ],
  [
    LamportsHistogram,
    {
      kind: 'struct',
      fields: [
        ['counts1', 'u64'],
        ['counts2', 'u64'],
        ['counts3', 'u64'],
        ['counts4', 'u64'],
        ['counts5', 'u64'],
        ['counts6', 'u64'],
        ['counts7', 'u64'],
        ['counts8', 'u64'],
        ['counts9', 'u64'],
        ['counts10', 'u64'],
        ['counts11', 'u64'],
        ['counts12', 'u64'],
        ['total', 'u64'],
      ],
    },
  ],
  [
    WithdrawMetric,
    {
      kind: 'struct',
      fields: [
        ['total_st_sol_amount', 'u64'],
        ['total_sol_amount', 'u64'],
        ['count', 'u64'],
      ],
    },
  ],
  [
    Metrics,
    {
      kind: 'struct',
      fields: [
        ['fee_treasury_sol_total', 'u64'],
        ['fee_validation_sol_total', 'u64'],
        ['fee_developer_sol_total', 'u64'],
        ['st_sol_appreciation_sol_total', 'u64'],
        ['fee_treasury_st_sol_total', 'u64'],
        ['fee_validation_st_sol_total', 'u64'],
        ['fee_developer_st_sol_total', 'u64'],
        ['deposit_amount', LamportsHistogram],
        ['withdraw_amount', WithdrawMetric],
      ],
    },
  ],
  [
    SeedRange,
    {
      kind: 'struct',
      fields: [
        ['begin', 'u64'],
        ['end', 'u64'],
      ],
    },
  ],
  [
    ValidatorClass,
    {
      kind: 'struct',
      fields: [
        ['fee_credit', 'u64'],
        ['fee_address', [32]],
        ['stake_seeds', SeedRange],
        ['unstake_seeds', SeedRange],
        ['stake_accounts_balance', 'u64'],
        ['unstake_accounts_balance', 'u64'],
        ['active', 'u8'],
      ],
    },
  ],
  [
    PubKeyAndEntry,
    {
      kind: 'struct',
      fields: [
        ['pubkey', [32]],
        ['entry', ValidatorClass],
      ],
    },
  ],
  [
    PubKeyAndEntryMaintainer,
    {
      kind: 'struct',
      fields: [
        ['pubkey', [32]],
        ['entry', [0]],
      ],
    },
  ],
  [
    RewardDistribution,
    {
      kind: 'struct',
      fields: [
        ['treasury_fee', 'u32'],
        ['validation_fee', 'u32'],
        ['developer_fee', 'u32'],
        ['st_sol_appreciation', 'u32'],
      ],
    },
  ],
  [
    FeeRecipients,
    {
      kind: 'struct',
      fields: [
        ['treasury_account', [32]],
        ['developer_account', [32]],
      ],
    },
  ],
  [
    Validators,
    {
      kind: 'struct',
      fields: [
        ['entries', [PubKeyAndEntry]],
        ['maximum_entries', 'u32'],
      ],
    },
  ],
  [
    Maintainers,
    {
      kind: 'struct',
      fields: [
        ['entries', [PubKeyAndEntryMaintainer]],
        ['maximum_entries', 'u32'],
      ],
    },
  ],
  [
    Lido,
    {
      kind: 'struct',
      fields: [
        ['lido_version', 'u8'],

        ['manager', [32]],

        ['st_sol_mint', [32]],

        ['exchange_rate', ExchangeRate],

        ['sol_reserve_authority_bump_seed', 'u8'],
        ['stake_authority_bump_seed', 'u8'],
        ['mint_authority_bump_seed', 'u8'],
        ['rewards_withdraw_authority_bump_seed', 'u8'],

        ['reward_distribution', RewardDistribution],

        ['fee_recipients', FeeRecipients],

        ['metrics', Metrics],

        ['validators', Validators],

        ['maintainers', Maintainers],
      ],
    },
  ],
]);

export const accountInfoV2Scheme = new Map([
  [
    ExchangeRate,
    {
      kind: 'struct',
      fields: [
        ['computed_in_epoch', 'u64'],
        ['st_sol_supply', 'u64'],
        ['sol_balance', 'u64'],
      ],
    },
  ],
  [
    LamportsHistogram,
    {
      kind: 'struct',
      fields: [
        ['counts1', 'u64'],
        ['counts2', 'u64'],
        ['counts3', 'u64'],
        ['counts4', 'u64'],
        ['counts5', 'u64'],
        ['counts6', 'u64'],
        ['counts7', 'u64'],
        ['counts8', 'u64'],
        ['counts9', 'u64'],
        ['counts10', 'u64'],
        ['counts11', 'u64'],
        ['counts12', 'u64'],
        ['total', 'u64'],
      ],
    },
  ],
  [
    WithdrawMetric,
    {
      kind: 'struct',
      fields: [
        ['total_st_sol_amount', 'u64'],
        ['total_sol_amount', 'u64'],
        ['count', 'u64'],
      ],
    },
  ],
  [
    Metrics,
    {
      kind: 'struct',
      fields: [
        ['fee_treasury_sol_total', 'u64'],
        ['fee_validation_sol_total', 'u64'],
        ['fee_developer_sol_total', 'u64'],
        ['st_sol_appreciation_sol_total', 'u64'],
        ['fee_treasury_st_sol_total', 'u64'],
        ['fee_validation_st_sol_total', 'u64'],
        ['fee_developer_st_sol_total', 'u64'],
        ['deposit_amount', LamportsHistogram],
        ['withdraw_amount', WithdrawMetric],
      ],
    },
  ],
  [
    RewardDistribution,
    {
      kind: 'struct',
      fields: [
        ['treasury_fee', 'u32'],
        ['developer_fee', 'u32'],
        ['st_sol_appreciation', 'u32'],
      ],
    },
  ],
  [
    FeeRecipients,
    {
      kind: 'struct',
      fields: [
        ['treasury_account', [32]],
        ['developer_account', [32]],
      ],
    },
  ],
  [
    Lido,
    {
      kind: 'struct',
      fields: [
        ['account_type', 'u8'],

        ['lido_version', 'u8'],

        ['manager', [32]],

        ['st_sol_mint', [32]],

        ['exchange_rate', ExchangeRate],

        ['sol_reserve_authority_bump_seed', 'u8'],
        ['stake_authority_bump_seed', 'u8'],
        ['mint_authority_bump_seed', 'u8'],

        ['reward_distribution', RewardDistribution],

        ['fee_recipients', FeeRecipients],

        ['metrics', Metrics],

        ['validator_list', [32]],

        ['maintainer_list', [32]],

        ['max_commission_percentage', 'u8'],
      ],
    },
  ],
]);

export const validatorsSchema = new Map([
  [
    ListHeader,
    {
      kind: 'struct',
      fields: [
        ['account_type', 'u8'],
        ['lido_version', 'u8'],
        ['max_entries', 'u32'],
      ],
    },
  ],
  [
    SeedRange,
    {
      kind: 'struct',
      fields: [
        ['begin', 'u64'],
        ['end', 'u64'],
      ],
    },
  ],
  [
    ValidatorClass,
    {
      kind: 'struct',
      fields: [
        ['vote_account_address', [32]],
        ['stake_seeds', SeedRange],
        ['unstake_seeds', SeedRange],
        ['stake_accounts_balance', 'u64'],
        ['unstake_accounts_balance', 'u64'],
        ['effective_stake_balance', 'u64'],
        ['active', 'u8'],
      ],
    },
  ],
  [
    AccountList,
    {
      kind: 'struct',
      fields: [
        ['header', ListHeader],
        ['entries', [ValidatorClass]],
      ],
    },
  ],
]);
