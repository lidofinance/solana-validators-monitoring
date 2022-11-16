import { VoteAccountStatus } from '@solana/web3.js';

export const uniqValidators = (voteAccounts: VoteAccountStatus) => {
  // Merge offline and online arrays and remove duplicates by nodePubkey
  const allValidators = voteAccounts.delinquent.concat(voteAccounts.current);
  return [
    ...new Map(
      allValidators.map((v) => {
        return [v.nodePubkey, v];
      }),
    ).values(),
  ];
};

export const calcSkipRate = (
  blockProduction: readonly number[] | undefined,
): number | undefined => {
  if (!blockProduction || blockProduction.length == 0) return undefined;
  const [slots, blocks] = blockProduction;
  return Number(((100 * (slots - blocks)) / slots).toFixed(2));
};
