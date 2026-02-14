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

/** Displays the vault's ERC20 token holdings */
export type VaultAssetsOutput = {
  type: 'vault-assets';
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
  totalValueUsd: string;
  message: string;
  error?: string;
};

/** Union of all alpha tool output types */
export type AlphaToolOutput =
  | TransactionsToSignOutput
  | PendingActionsOutput
  | VaultAssetsOutput;
