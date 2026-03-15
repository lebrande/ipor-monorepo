'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import {
  useRedeem,
  useVaultState,
  useUserPosition,
  useShareBalance,
} from '@yo-protocol/react';
import { formatUnits, parseUnits, type Address } from 'viem';
import { Loader2, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { TokenIcon } from '@/components/token-icon';
import { StepProgress } from './step-progress';
import { PendingRedemptionBanner } from './pending-redemption-banner';

interface Props {
  chainId: number;
  vaultAddress: Address;
}

const REDEEM_STEPS = [
  { key: 'approving', label: 'Approve' },
  { key: 'redeeming', label: 'Redeem' },
  { key: 'waiting', label: 'Confirm' },
];

export function YoWithdrawForm({ chainId, vaultAddress }: Props) {
  const { address: rawUserAddress, chain } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [inputValue, setInputValue] = useState('');
  const [isMax, setIsMax] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const userAddress = mounted ? rawUserAddress : undefined;
  const isWrongChain = !!userAddress && chain?.id !== chainId;

  // ─── YO Protocol hooks ───

  const { vaultState } = useVaultState(vaultAddress);
  const decimals = vaultState?.assetDecimals ?? 6;
  const vaultDecimals = vaultState?.decimals ?? 18;
  const symbol = vaultState?.symbol ?? '...';
  const assetAddress = vaultState?.asset;

  const { position } = useUserPosition(vaultAddress, userAddress);
  const { shares: currentShares } = useShareBalance(vaultAddress, userAddress);

  // ─── Derived values ───

  let withdrawAmount = 0n;
  let parseError = false;
  if (inputValue && inputValue !== '0') {
    try {
      withdrawAmount = parseUnits(inputValue, decimals);
    } catch {
      parseError = true;
    }
  }

  const positionAssets = position?.assets;
  const hasEnoughPosition =
    positionAssets !== undefined && withdrawAmount > 0n && withdrawAmount <= positionAssets;

  // Convert asset amount → shares proportionally
  const sharesToRedeem = isMax
    ? currentShares
    : positionAssets && positionAssets > 0n && currentShares
      ? (withdrawAmount * currentShares) / positionAssets
      : undefined;

  const sharesReady = sharesToRedeem !== undefined && sharesToRedeem > 0n;

  // ─── Redeem action ───

  const { redeem, step, isError, error, isSuccess, instant, assetsOrRequestId, reset } =
    useRedeem({
      vault: vaultAddress,
      onConfirmed: () => {
        setInputValue('');
        setIsMax(false);
      },
    });

  const isActive = step !== 'idle' && step !== 'success' && step !== 'error';

  // ─── Handlers ───

  const handleRedeem = useCallback(async () => {
    if (!sharesToRedeem || sharesToRedeem === 0n) return;
    await redeem(sharesToRedeem);
  }, [sharesToRedeem, redeem]);

  const handleMax = useCallback(() => {
    if (positionAssets !== undefined) {
      setInputValue(formatUnits(positionAssets, decimals));
      setIsMax(true);
    }
  }, [positionAssets, decimals]);

  // ─── Button state ───

  const buttonLabel = (() => {
    if (!userAddress) return 'Connect Wallet';
    if (isActive) return 'Processing...';
    if (parseError) return 'Invalid amount';
    if (withdrawAmount === 0n) return 'Enter amount';
    if (!hasEnoughPosition) return 'Exceeds position';
    return 'Withdraw';
  })();

  const buttonDisabled =
    !userAddress ||
    withdrawAmount === 0n ||
    parseError ||
    !hasEnoughPosition ||
    !sharesReady ||
    isActive;

  const formatNum = (val: string | number) =>
    Number(val).toLocaleString(undefined, { maximumFractionDigits: 4 });

  const positionFormatted =
    positionAssets !== undefined ? formatUnits(positionAssets, decimals) : undefined;

  // ─── Render ───

  return (
    <div className="space-y-4">
      {/* Pending redemption banner */}
      {userAddress && <PendingRedemptionBanner vaultAddress={vaultAddress} />}

      {/* Amount input */}
      <div className="bg-yo-dark rounded-xl p-4 border border-white/5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium tracking-wider uppercase text-yo-muted">
            You withdraw
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
            if (v === '' || /^\d*\.?\d*$/.test(v)) {
              setInputValue(v);
              setIsMax(false);
            }
          }}
          disabled={isActive}
          className="w-full bg-transparent text-2xl font-semibold text-white outline-none placeholder:text-white/20"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-yo-muted">
            {positionFormatted !== undefined
              ? `Position: ${formatNum(positionFormatted)}`
              : 'Position: ...'}
          </span>
          <button
            type="button"
            onClick={handleMax}
            disabled={isActive || !positionAssets || positionAssets === 0n}
            className="text-[10px] font-semibold tracking-wider uppercase text-yo-neon hover:text-yo-neon/80 disabled:text-yo-muted disabled:cursor-not-allowed transition-colors"
          >
            Max
          </button>
        </div>
      </div>

      {/* Shares info */}
      {sharesToRedeem && sharesToRedeem > 0n && (
        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-yo-muted">Shares to redeem</span>
          <span className="text-white font-mono">
            {formatNum(formatUnits(sharesToRedeem, vaultDecimals))}
          </span>
        </div>
      )}

      {/* Step progress */}
      {isActive && (
        <div className="bg-yo-dark rounded-xl p-3 border border-white/5">
          <StepProgress steps={REDEEM_STEPS} currentStep={step} />
        </div>
      )}

      {/* Success — instant */}
      {isSuccess && instant === true && (
        <div className="bg-yo-neon/10 rounded-xl p-3 border border-yo-neon/20 space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-yo-neon shrink-0" />
            <span className="text-xs text-yo-neon font-medium">Withdrawal complete!</span>
            <button
              type="button"
              onClick={reset}
              className="ml-auto text-[10px] text-yo-neon/60 hover:text-yo-neon"
            >
              Dismiss
            </button>
          </div>
          {assetsOrRequestId && (
            <p className="text-[11px] text-yo-neon/70 pl-6 font-mono">
              Received: {assetsOrRequestId}
            </p>
          )}
        </div>
      )}

      {/* Success — queued */}
      {isSuccess && instant === false && (
        <div className="bg-yellow-500/10 rounded-xl p-3 border border-yellow-500/20 space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-400 shrink-0" />
            <span className="text-xs text-yellow-400 font-medium">Redemption queued</span>
            <button
              type="button"
              onClick={reset}
              className="ml-auto text-[10px] text-yellow-400/60 hover:text-yellow-400"
            >
              Dismiss
            </button>
          </div>
          {assetsOrRequestId && (
            <p className="text-[11px] text-yellow-400/70 pl-6 font-mono">
              Request ID: {assetsOrRequestId}
            </p>
          )}
          <p className="text-[11px] text-yellow-400/60 pl-6">
            Your withdrawal is being processed. Assets will be available once fulfilled.
          </p>
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
          onClick={handleRedeem}
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
