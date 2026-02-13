import { Address, Hex, encodeFunctionData } from 'viem';
import { PlasmaVault } from '../../PlasmaVault';
import { FuseAction } from '../../fusion.types';
import { morphoSupplyFuseAbi } from './abi/morpho-supply-fuse.abi';
import { morphoBorrowFuseAbi } from './abi/morpho-borrow-fuse.abi';
import {
  MORPHO_SUPPLY_FUSE_ADDRESS,
  MORPHO_BORROW_FUSE_ADDRESS,
} from './morpho-fuse.addresses';

interface MorphoOptions {
  supplyFuse?: Address;
  borrowFuse?: Address;
}

export class Morpho {
  private readonly supplyFuseAddress: Address;
  private readonly borrowFuseAddress: Address | undefined;

  constructor(
    private readonly plasmaVault: PlasmaVault,
    options?: MorphoOptions,
  ) {
    const supplyFuse =
      options?.supplyFuse ??
      MORPHO_SUPPLY_FUSE_ADDRESS[plasmaVault.chainId];

    if (!supplyFuse) {
      throw new Error(
        `Morpho supply fuse not available on chain ${plasmaVault.chainId}`,
      );
    }

    this.supplyFuseAddress = supplyFuse;
    this.borrowFuseAddress =
      options?.borrowFuse ??
      MORPHO_BORROW_FUSE_ADDRESS[plasmaVault.chainId];
  }

  supply(morphoMarketId: Hex, amount: bigint): FuseAction[] {
    const data = encodeFunctionData({
      abi: morphoSupplyFuseAbi,
      functionName: 'enter',
      args: [{ morphoMarketId, amount }],
    });
    return [{ fuse: this.supplyFuseAddress, data }];
  }

  withdraw(morphoMarketId: Hex, amount: bigint): FuseAction[] {
    const data = encodeFunctionData({
      abi: morphoSupplyFuseAbi,
      functionName: 'exit',
      args: [{ morphoMarketId, amount }],
    });
    return [{ fuse: this.supplyFuseAddress, data }];
  }

  borrow(morphoMarketId: Hex, amountToBorrow: bigint): FuseAction[] {
    if (!this.borrowFuseAddress) {
      throw new Error(
        `Morpho borrow fuse not available on chain ${this.plasmaVault.chainId}`,
      );
    }
    const data = encodeFunctionData({
      abi: morphoBorrowFuseAbi,
      functionName: 'enter',
      args: [{ morphoMarketId, amountToBorrow, sharesToBorrow: 0n }],
    });
    return [{ fuse: this.borrowFuseAddress, data }];
  }

  repay(morphoMarketId: Hex, amountToRepay: bigint): FuseAction[] {
    if (!this.borrowFuseAddress) {
      throw new Error(
        `Morpho borrow fuse not available on chain ${this.plasmaVault.chainId}`,
      );
    }
    const data = encodeFunctionData({
      abi: morphoBorrowFuseAbi,
      functionName: 'exit',
      args: [{ morphoMarketId, amountToRepay, sharesToRepay: 0n }],
    });
    return [{ fuse: this.borrowFuseAddress, data }];
  }
}
