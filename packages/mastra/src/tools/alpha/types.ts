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

// Future output types (do NOT implement yet):
// - 'single-transaction': details of one transaction
// - 'balances': token/position balances
// - 'execute-button': action button to execute transactions
// - 'transaction-receipt': result after execution
// - 'simulation-result': simulation output before execution

/** Union of all alpha tool output types */
export type AlphaToolOutput = TransactionsToSignOutput;
