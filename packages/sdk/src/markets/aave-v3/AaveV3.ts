import { Address, encodeFunctionData } from 'viem';
import { PlasmaVault } from '../../PlasmaVault';
import { FuseAction } from '../../fusion.types';
import { aaveV3SupplyFuseAbi } from './abi/aave-v3-supply-fuse.abi';
import { aaveV3BorrowFuseAbi } from './abi/aave-v3-borrow-fuse.abi';
import {
  AAVE_V3_SUPPLY_FUSE_ADDRESS,
  AAVE_V3_BORROW_FUSE_ADDRESS,
} from './aave-v3.addresses';

interface AaveV3Options {
  supplyFuse?: Address;
  borrowFuse?: Address;
}

export class AaveV3 {
  private readonly supplyFuseAddress: Address;
  private readonly borrowFuseAddress: Address | undefined;

  constructor(
    private readonly plasmaVault: PlasmaVault,
    options?: AaveV3Options,
  ) {
    const supplyFuse =
      options?.supplyFuse ??
      AAVE_V3_SUPPLY_FUSE_ADDRESS[plasmaVault.chainId];

    if (!supplyFuse) {
      throw new Error(
        `AaveV3 supply fuse not available on chain ${plasmaVault.chainId}`,
      );
    }

    this.supplyFuseAddress = supplyFuse;
    this.borrowFuseAddress =
      options?.borrowFuse ??
      AAVE_V3_BORROW_FUSE_ADDRESS[plasmaVault.chainId];
  }

  supply(assetAddress: Address, amount: bigint): FuseAction[] {
    const data = encodeFunctionData({
      abi: aaveV3SupplyFuseAbi,
      functionName: 'enter',
      args: [{ asset: assetAddress, amount, userEModeCategoryId: 0n }],
    });
    return [{ fuse: this.supplyFuseAddress, data }];
  }

  withdraw(assetAddress: Address, amount: bigint): FuseAction[] {
    const data = encodeFunctionData({
      abi: aaveV3SupplyFuseAbi,
      functionName: 'exit',
      args: [{ asset: assetAddress, amount }],
    });
    return [{ fuse: this.supplyFuseAddress, data }];
  }

  borrow(assetAddress: Address, amount: bigint): FuseAction[] {
    if (!this.borrowFuseAddress) {
      throw new Error(
        `AaveV3 borrow fuse not available on chain ${this.plasmaVault.chainId}`,
      );
    }
    const data = encodeFunctionData({
      abi: aaveV3BorrowFuseAbi,
      functionName: 'enter',
      args: [{ asset: assetAddress, amount }],
    });
    return [{ fuse: this.borrowFuseAddress, data }];
  }

  repay(assetAddress: Address, amount: bigint): FuseAction[] {
    if (!this.borrowFuseAddress) {
      throw new Error(
        `AaveV3 borrow fuse not available on chain ${this.plasmaVault.chainId}`,
      );
    }
    const data = encodeFunctionData({
      abi: aaveV3BorrowFuseAbi,
      functionName: 'exit',
      args: [{ asset: assetAddress, amount }],
    });
    return [{ fuse: this.borrowFuseAddress, data }];
  }
}
