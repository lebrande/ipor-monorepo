/** Static token metadata for YO vault underlying assets */
export const YO_UNDERLYING: Record<string, { decimals: number; symbol: string }> = {
  yoUSD: { decimals: 6, symbol: 'USDC' },
  yoETH: { decimals: 18, symbol: 'WETH' },
  yoBTC: { decimals: 8, symbol: 'cbBTC' },
  yoEUR: { decimals: 6, symbol: 'EURC' },
  yoGOLD: { decimals: 6, symbol: 'XAUt' },
  yoUSDT: { decimals: 6, symbol: 'USDT' },
};
