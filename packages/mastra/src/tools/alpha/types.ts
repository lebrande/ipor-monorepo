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

/** Displays the list of pending fuse actions from working memory */
export type PendingActionsOutput = {
  type: 'pending-actions';
  actions: Array<{
    id: string;
    protocol: string;
    actionType: string;
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
  substrate: string;
  underlyingToken: string;
  underlyingSymbol: string;
  label?: string;
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

/** Action creation result with integrated simulation */
export type ActionWithSimulationOutput = {
  type: 'action-with-simulation';
  success: boolean;
  protocol: string;
  actionType: string;
  description: string;
  fuseActions: Array<{
    fuse: string;
    data: string;
  }>;
  error?: string;
  simulation?: {
    success: boolean;
    message: string;
    actionsCount: number;
    fuseActionsCount: number;
    balancesBefore?: BalanceSnapshot;
    balancesAfter?: BalanceSnapshot;
    error?: string;
  };
};

/** Union of all alpha tool output types */
export type AlphaToolOutput =
  | PendingActionsOutput
  | MarketBalancesOutput
  | ExecuteActionsOutput
  | ActionWithSimulationOutput;
