'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import {
  useDeposit,
  useVaultState,
  useTokenBalance,
  useUserPosition,
  usePreviewDeposit,
} from '@yo-protocol/react';
import { formatUnits, parseUnits, type Address } from 'viem';
import { Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { TokenIcon } from '@/components/token-icon';
import { StepProgress } from './step-progress';

interface Props {
  chainId: number;
  vaultAddress: Address;
}

const DEPOSIT_STEPS = [
  { key: 'switching-chain', label: 'Switch' },
  { key: 'approving', label: 'Approve' },
  { key: 'depositing', label: 'Deposit' },
  { key: 'waiting', label: 'Confirm' },
];

export function YoDepositForm({ chainId, vaultAddress }: Props) {
  const { address: rawUserAddress, chain } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [inputValue, setInputValue] = useState('');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const userAddress = mounted ? rawUserAddress : undefined;
  const isWrongChain = !!userAddress && chain?.id !== chainId;

  // ─── YO Protocol hooks ───

  const { vaultState } = useVaultState(vaultAddress);
  const assetAddress = vaultState?.asset;
  const decimals = vaultState?.assetDecimals ?? 6;
  const symbol = vaultState?.symbol ?? '...';

  const { balance: tokenBalance } = useTokenBalance(assetAddress, userAddress);
  const walletBalance = tokenBalance?.balance;

  const { position } = useUserPosition(vaultAddress, userAddress);

  // ─── Derived values ───

  let depositAmount = 0n;
  let parseError = false;
  if (inputValue && inputValue !== '0') {
    try {
      depositAmount = parseUnits(inputValue, decimals);
    } catch {
      parseError = true;
    }
  }

  const { shares: previewShares } = usePreviewDeposit(
    vaultAddress,
    depositAmount > 0n ? depositAmount : undefined,
  );

  const walletFormatted =
    walletBalance !== undefined ? formatUnits(walletBalance, decimals) : undefined;

  const hasEnoughBalance =
    walletBalance !== undefined && depositAmount > 0n && depositAmount <= walletBalance;

  // ─── Deposit action ───

  const { deposit, step, isError, error, isSuccess, reset } = useDeposit({
    vault: vaultAddress,
    onConfirmed: () => {
      setInputValue('');
    },
  });

  const isActive = step !== 'idle' && step !== 'success' && step !== 'error';

  // ─── Handlers ───

  const handleDeposit = useCallback(async () => {
    if (!assetAddress || depositAmount === 0n) return;
    await deposit({ token: assetAddress, amount: depositAmount, chainId });
  }, [assetAddress, depositAmount, chainId, deposit]);

  const handleMax = useCallback(() => {
    if (walletBalance !== undefined) {
      setInputValue(formatUnits(walletBalance, decimals));
    }
  }, [walletBalance, decimals]);

  // ─── Button state ───

  const buttonLabel = (() => {
    if (!userAddress) return 'Connect Wallet';
    if (isActive) return 'Processing...';
    if (parseError) return 'Invalid amount';
    if (depositAmount === 0n) return 'Enter amount';
    if (!hasEnoughBalance) return 'Insufficient balance';
    return 'Deposit';
  })();

  const buttonDisabled =
    !userAddress || depositAmount === 0n || parseError || !hasEnoughBalance || isActive;

  // ─── Format helpers ───

  const formatNum = (val: string | number) =>
    Number(val).toLocaleString(undefined, { maximumFractionDigits: 4 });

  const positionFormatted =
    position?.assets !== undefined ? formatUnits(position.assets, decimals) : undefined;

  // ─── Render ───

  return (
    <div className="space-y-4">
      {/* Amount input */}
      <div className="bg-yo-dark rounded-xl p-4 border border-white/5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium tracking-wider uppercase text-yo-muted">
            You deposit
          </span>
          {assetAddress && (
            <div className="flex items-center gap-1.5">
              <TokenIcon chainId={chainId} address={assetAddress} className="w-4 h-4" />
              <span className="text-xs font-medium text-white">{symbol}</span>
            </div>
          )}
        </div>
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={inputValue}
          onChange={(e) => {
            const v = e.target.value;
            if (v === '' || /^\d*\.?\d*$/.test(v)) setInputValue(v);
          }}
          disabled={isActive}
          className="w-full bg-transparent text-2xl font-semibold text-white outline-none placeholder:text-white/20"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-yo-muted">
            {walletFormatted !== undefined
              ? `Balance: ${formatNum(walletFormatted)}`
              : 'Balance: ...'}
          </span>
          <button
            type="button"
            onClick={handleMax}
            disabled={isActive || !walletBalance}
            className="text-[10px] font-semibold tracking-wider uppercase text-yo-neon hover:text-yo-neon/80 disabled:text-yo-muted disabled:cursor-not-allowed transition-colors"
          >
            Max
          </button>
        </div>
      </div>

      {/* Preview */}
      {depositAmount > 0n && previewShares !== undefined && (
        <div className="bg-yo-dark rounded-xl p-3 border border-white/5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-yo-muted">You receive (est.)</span>
            <span className="text-white font-mono">
              {formatNum(formatUnits(previewShares, vaultState?.decimals ?? 18))}{' '}
              <span className="text-yo-muted">{vaultState?.name ?? 'shares'}</span>
            </span>
          </div>
        </div>
      )}

      {/* Position */}
      <div className="flex items-center justify-between text-xs px-1">
        <span className="text-yo-muted">Your position</span>
        <span className="text-white font-mono">
          {positionFormatted !== undefined ? `${formatNum(positionFormatted)} ${symbol}` : '-'}
        </span>
      </div>

      {/* Step progress (visible during active flow) */}
      {isActive && (
        <div className="bg-yo-dark rounded-xl p-3 border border-white/5">
          <StepProgress steps={DEPOSIT_STEPS} currentStep={step} />
        </div>
      )}

      {/* Success */}
      {isSuccess && (
        <div className="bg-yo-neon/10 rounded-xl p-3 border border-yo-neon/20 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-yo-neon shrink-0" />
          <span className="text-xs text-yo-neon font-medium">Deposit successful!</span>
          <button
            type="button"
            onClick={reset}
            className="ml-auto text-[10px] text-yo-neon/60 hover:text-yo-neon"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error */}
      {isError && error && (
        <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/20 space-y-1.5">
          <p className="text-xs text-red-400">{error.message.slice(0, 150)}</p>
          <button
            type="button"
            onClick={reset}
            className="text-[10px] text-red-400/60 hover:text-red-400"
          >
            Try again
          </button>
        </div>
      )}

      {/* CTA */}
      {isWrongChain ? (
        <button
          onClick={() => switchChain({ chainId })}
          disabled={isSwitching}
          className="w-full py-3 rounded-xl font-medium text-sm bg-yo-dark text-white border border-white/10 hover:border-white/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSwitching && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSwitching ? 'Switching...' : 'Switch Network'}
        </button>
      ) : (
        <button
          onClick={handleDeposit}
          disabled={buttonDisabled}
          className="w-full py-3 rounded-xl font-semibold text-sm bg-yo-neon text-black hover:brightness-110 transition-all disabled:opacity-40 disabled:hover:brightness-100 flex items-center justify-center gap-2"
        >
          {isActive && <Loader2 className="w-4 h-4 animate-spin" />}
          {buttonLabel}
          {!buttonDisabled && !isActive && <ArrowRight className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}
