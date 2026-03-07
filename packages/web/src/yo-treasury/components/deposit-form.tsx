'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { erc20Abi, erc4626Abi, formatUnits, parseUnits, type Address } from 'viem';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TokenIcon } from '@/components/token-icon';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface Props {
  chainId: number;
  vaultAddress: Address;
}

export function DepositForm({ chainId, vaultAddress }: Props) {
  const { address: userAddress } = useAccount();
  const [inputValue, setInputValue] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // ─── On-chain reads ───

  const { data: assetAddress } = useReadContract({
    chainId,
    address: vaultAddress,
    abi: erc4626Abi,
    functionName: 'asset',
  });

  const { data: assetDecimals } = useReadContract({
    chainId,
    address: assetAddress!,
    abi: erc20Abi,
    functionName: 'decimals',
    query: { enabled: !!assetAddress },
  });

  const { data: assetSymbol } = useReadContract({
    chainId,
    address: assetAddress!,
    abi: erc20Abi,
    functionName: 'symbol',
    query: { enabled: !!assetAddress },
  });

  const { data: walletBalance, refetch: refetchBalance } = useReadContract({
    chainId,
    address: assetAddress!,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [userAddress!],
    query: { enabled: !!userAddress && !!assetAddress },
  });

  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    chainId,
    address: assetAddress!,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [userAddress!, vaultAddress],
    query: { enabled: !!userAddress && !!assetAddress },
  });

  const { data: shareBalance, refetch: refetchShares } = useReadContract({
    chainId,
    address: vaultAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [userAddress!],
    query: { enabled: !!userAddress },
  });

  const { data: positionAssets, refetch: refetchPosition } = useReadContract({
    chainId,
    address: vaultAddress,
    abi: erc4626Abi,
    functionName: 'convertToAssets',
    args: [shareBalance!],
    query: { enabled: shareBalance !== undefined && shareBalance > 0n },
  });

  // ─── Derived values ───

  const decimals = assetDecimals ?? 6;
  const symbol = assetSymbol ?? 'USDC';

  let depositAmount = 0n;
  let parseError = false;
  if (inputValue && inputValue !== '0') {
    try {
      depositAmount = parseUnits(inputValue, decimals);
    } catch {
      parseError = true;
    }
  }

  const walletFormatted = walletBalance !== undefined
    ? formatUnits(walletBalance, decimals)
    : undefined;

  const positionFormatted = positionAssets !== undefined
    ? formatUnits(positionAssets, decimals)
    : shareBalance === 0n
      ? '0'
      : undefined;

  const depositUsd = depositAmount > 0n
    ? `$${Number(formatUnits(depositAmount, decimals)).toFixed(2)}`
    : '$0';

  const positionUsd = positionAssets !== undefined
    ? `$${Number(formatUnits(positionAssets, decimals)).toFixed(2)}`
    : shareBalance === 0n
      ? '$0.00'
      : '-';

  const needsApproval =
    currentAllowance !== undefined &&
    depositAmount > 0n &&
    currentAllowance < depositAmount;

  const hasEnoughBalance =
    walletBalance !== undefined && depositAmount > 0n && depositAmount <= walletBalance;

  // ─── Approve transaction ───

  const {
    writeContract: writeApprove,
    data: approveTxHash,
    isPending: isApproving,
    error: approveError,
    reset: resetApprove,
  } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } =
    useWaitForTransactionReceipt({ hash: approveTxHash });

  // ─── Deposit transaction ───

  const {
    writeContract: writeDeposit,
    data: depositTxHash,
    isPending: isDepositing,
    error: depositError,
    reset: resetDeposit,
  } = useWriteContract();

  const { isLoading: isDepositConfirming, isSuccess: isDepositConfirmed } =
    useWaitForTransactionReceipt({ hash: depositTxHash });

  // ─── Effects ───

  useEffect(() => {
    if (isApproveConfirmed) {
      refetchAllowance();
      resetApprove();
    }
  }, [isApproveConfirmed, refetchAllowance, resetApprove]);

  useEffect(() => {
    if (isDepositConfirmed) {
      refetchBalance();
      refetchAllowance();
      refetchShares();
      refetchPosition();
      resetDeposit();
      setInputValue('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  }, [isDepositConfirmed, refetchBalance, refetchAllowance, refetchShares, refetchPosition, resetDeposit]);

  // ─── Handlers ───

  const handleApprove = useCallback(() => {
    if (!assetAddress) return;
    writeApprove({
      address: assetAddress,
      abi: erc20Abi,
      functionName: 'approve',
      args: [vaultAddress, depositAmount],
      chainId,
    });
  }, [assetAddress, vaultAddress, depositAmount, chainId, writeApprove]);

  const handleDeposit = useCallback(() => {
    if (!userAddress) return;
    writeDeposit({
      address: vaultAddress,
      abi: erc4626Abi,
      functionName: 'deposit',
      args: [depositAmount, userAddress],
      chainId,
    });
  }, [vaultAddress, depositAmount, userAddress, chainId, writeDeposit]);

  const handleMax = useCallback(() => {
    if (walletBalance !== undefined) {
      setInputValue(formatUnits(walletBalance, decimals));
    }
  }, [walletBalance, decimals]);

  // ─── State flags ───

  const isBusy =
    isApproving || isApproveConfirming || isDepositing || isDepositConfirming;
  const error = approveError || depositError;

  const buttonLabel = (() => {
    if (!userAddress) return 'Connect Wallet';
    if (isApproving) return 'Confirm in wallet...';
    if (isApproveConfirming) return 'Approving...';
    if (isDepositing) return 'Confirm in wallet...';
    if (isDepositConfirming) return 'Depositing...';
    if (parseError) return 'Invalid amount';
    if (depositAmount === 0n) return 'Enter amount';
    if (!hasEnoughBalance) return 'Insufficient balance';
    if (needsApproval) return `Approve ${symbol}`;
    return 'Deposit';
  })();

  const buttonDisabled =
    !userAddress ||
    depositAmount === 0n ||
    parseError ||
    !hasEnoughBalance ||
    isBusy;

  const handleClick = needsApproval ? handleApprove : handleDeposit;

  // ─── Render ───

  return (
    <Card className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Deposit {symbol}</span>
        {assetAddress && (
          <TokenIcon chainId={chainId} address={assetAddress} className="w-5 h-5" />
        )}
      </div>

      {/* Amount input */}
      <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={inputValue}
          onChange={(e) => {
            const v = e.target.value;
            if (v === '' || /^\d*\.?\d*$/.test(v)) setInputValue(v);
          }}
          disabled={isBusy}
          className="w-full bg-transparent text-lg font-mono outline-none placeholder:text-muted-foreground"
        />
        <div className="text-xs text-muted-foreground">{depositUsd}</div>
      </div>

      {/* Wallet balance */}
      {userAddress && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Balance: {walletFormatted !== undefined
              ? `${Number(walletFormatted).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${symbol}`
              : '...'
            }
          </span>
          <button
            type="button"
            onClick={handleMax}
            disabled={isBusy || !walletBalance}
            className="text-primary font-medium hover:underline disabled:opacity-50"
          >
            Max
          </button>
        </div>
      )}

      {/* Summary */}
      <div className="border-t pt-3 space-y-1.5 text-xs">
        {depositAmount > 0n && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Deposit ({symbol})</span>
            <span className="font-mono">
              {Number(formatUnits(depositAmount, decimals)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Your Position</span>
          <span className="font-mono">
            {positionFormatted !== undefined
              ? `${Number(positionFormatted).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${symbol} (${positionUsd})`
              : '-'
            }
          </span>
        </div>
      </div>

      {/* Success banner */}
      {showSuccess && (
        <div className="flex items-center gap-2 text-green-500 text-xs">
          <CheckCircle2 className="w-4 h-4" />
          <span>Deposit successful!</span>
        </div>
      )}

      {/* Error */}
      {error && !isBusy && (
        <div className="space-y-1">
          <p className="text-xs text-destructive">
            {error.message.slice(0, 150)}
          </p>
          <button
            type="button"
            onClick={() => { resetApprove(); resetDeposit(); }}
            className="text-xs text-muted-foreground hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Action button */}
      <Button
        onClick={handleClick}
        disabled={buttonDisabled}
        size="sm"
        className="w-full"
      >
        {isBusy && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        {buttonLabel}
      </Button>
    </Card>
  );
}
