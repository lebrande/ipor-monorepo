/**
 * Discriminated union for all Alpha Agent tool outputs.
 *
 * The `type` field is the discriminator — the web app uses it to decide
 * which React component to render for each tool output.
 *
 * Adding a new output type:
 * 1. Add the type to this union
 * 2. Create a tool in this directory that returns it
 * 3. Add a case in the web app's AlphaToolRenderer
 */

/** Placeholder: displays a list of transactions to sign */
export type TransactionsToSignOutput = {
  type: 'transactions-to-sign';
  message: string;
  placeholder: true;
};

/** Displays the list of pending fuse actions from working memory */
export type PendingActionsOutput = {
  type: 'pending-actions';
  actions: Array<{
    id: string;
    protocol: 'aave-v3' | 'morpho' | 'euler-v2';
    actionType: 'supply' | 'withdraw' | 'borrow' | 'repay';
    description: string;
    fuseActions: Array<{
      fuse: string;
      data: string;
    }>;
  }>;
  message: string;
};

/** A position in a DeFi market */
export interface MarketPosition {
  underlyingToken: string;
  underlyingSymbol: string;
  supplyFormatted: string;
  supplyValueUsd: string;
  borrowFormatted: string;
  borrowValueUsd: string;
  totalValueUsd: string;
}

/** A DeFi market with its positions */
export interface MarketAllocation {
  marketId: string;
  protocol: string;
  positions: MarketPosition[];
  totalValueUsd: string;
}

/** Displays the vault's ERC20 token holdings AND market allocations */
export type MarketBalancesOutput = {
  type: 'market-balances';
  success: boolean;
  assets: Array<{
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    balance: string;
    balanceFormatted: string;
    priceUsd: string;
    valueUsd: string;
  }>;
  markets: MarketAllocation[];
  totalValueUsd: string;
  message: string;
  error?: string;
};

/** Balance snapshot for a vault — ERC20 tokens + market positions */
export interface BalanceSnapshot {
  assets: Array<{
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    balance: string;
    balanceFormatted: string;
    priceUsd: string;
    valueUsd: string;
  }>;
  markets: MarketAllocation[];
  totalValueUsd: string;
}

/** Displays simulation result with before/after balance comparison */
export type SimulationResultOutput = {
  type: 'simulation-result';
  success: boolean;
  message: string;
  vaultAddress: string;
  chainId: number;
  callerAddress: string;
  actionsCount: number;
  fuseActionsCount: number;
  error?: string;
  flatFuseActions: Array<{
    fuse: string;
    data: string;
  }>;
  balancesBefore?: BalanceSnapshot;
  balancesAfter?: BalanceSnapshot;
};

/** Passes pending actions to the UI for the full connect → role check → simulate → execute flow */
export type ExecuteActionsOutput = {
  type: 'execute-actions';
  vaultAddress: string;
  chainId: number;
  flatFuseActions: Array<{
    fuse: string;
    data: string;
  }>;
  actionsCount: number;
  fuseActionsCount: number;
  actionsSummary: string;
};

/** Union of all alpha tool output types */
export type AlphaToolOutput =
  | TransactionsToSignOutput
  | PendingActionsOutput
  | MarketBalancesOutput
  | SimulationResultOutput
  | ExecuteActionsOutput;
