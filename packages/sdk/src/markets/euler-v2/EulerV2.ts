import { Address, Hex, encodeFunctionData } from 'viem';
import { PlasmaVault } from '../../PlasmaVault';
import { FuseAction } from '../../fusion.types';
import { eulerV2SupplyFuseAbi } from './abi/euler-v2-supply-fuse.abi';
import { EULER_V2_SUPPLY_FUSE_ADDRESS } from './euler-v2.addresses';

interface EulerV2Options {
  supplyFuse?: Address;
}

export class EulerV2 {
  private readonly supplyFuseAddress: Address;

  constructor(
    private readonly plasmaVault: PlasmaVault,
    options?: EulerV2Options,
  ) {
    const supplyFuse =
      options?.supplyFuse ??
      EULER_V2_SUPPLY_FUSE_ADDRESS[plasmaVault.chainId];

    if (!supplyFuse) {
      throw new Error(
        `EulerV2 supply fuse not available on chain ${plasmaVault.chainId}`,
      );
    }

    this.supplyFuseAddress = supplyFuse;
  }

  supply(
    eulerVault: Address,
    maxAmount: bigint,
    subAccount: Hex = '0x00',
  ): FuseAction[] {
    const data = encodeFunctionData({
      abi: eulerV2SupplyFuseAbi,
      functionName: 'enter',
      args: [{ eulerVault, maxAmount, subAccount }],
    });
    return [{ fuse: this.supplyFuseAddress, data }];
  }

  withdraw(
    eulerVault: Address,
    maxAmount: bigint,
    subAccount: Hex = '0x00',
  ): FuseAction[] {
    const data = encodeFunctionData({
      abi: eulerV2SupplyFuseAbi,
      functionName: 'exit',
      args: [{ eulerVault, maxAmount, subAccount }],
    });
    return [{ fuse: this.supplyFuseAddress, data }];
  }
}
