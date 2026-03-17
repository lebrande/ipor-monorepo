import type { Meta, StoryObj } from '@storybook/react';
import { ActionWithSimulation } from './action-with-simulation';
import { withAppProviders } from '@/app/app-providers-decorator';

/**
 * Shows the result of creating a fuse action (supply, withdraw, swap, borrow,
 * repay) with optional simulation results showing before/after balance changes.
 * Rendered after any action creation tool call (createAaveV3ActionTool,
 * createMorphoActionTool, createYoAllocationActionTool, etc.).
 */
const meta: Meta<typeof ActionWithSimulation> = {
  title: 'Alpha Tools / ActionWithSimulation',
  component: ActionWithSimulation,
  decorators: [withAppProviders],
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof ActionWithSimulation>;

/** Successful action with passing simulation and balance changes */
export const SuccessWithSimulation: Story = {
  args: {
    chainId: 8453,
    success: true,
    protocol: 'aave-v3',
    actionType: 'supply',
    description: 'Aave V3 supply 1000 USDC',
    simulation: {
      success: true,
      message: 'Simulation passed on Anvil fork',
      actionsCount: 1,
      fuseActionsCount: 1,
      balancesBefore: {
        totalValueUsd: '5000.00',
        assets: [
          {
            address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            name: 'USD Coin',
            symbol: 'USDC',
            decimals: 6,
            balance: '2000000000',
            balanceFormatted: '2000.00',
            priceUsd: '1.00',
            valueUsd: '2000.00',
          },
        ],
        markets: [
          {
            marketId: 'aave-v3-usdc',
            protocol: 'aave-v3',
            totalValueUsd: '3000.00',
            positions: [
              {
                underlyingToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                underlyingSymbol: 'USDC',
                substrate: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                supplyFormatted: '3000.00',
                supplyValueUsd: '3000.00',
                borrowFormatted: '0',
                borrowValueUsd: '0',
                totalValueUsd: '3000.00',
              },
            ],
          },
        ],
      },
      balancesAfter: {
        totalValueUsd: '5000.00',
        assets: [
          {
            address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            name: 'USD Coin',
            symbol: 'USDC',
            decimals: 6,
            balance: '1000000000',
            balanceFormatted: '1000.00',
            priceUsd: '1.00',
            valueUsd: '1000.00',
          },
        ],
        markets: [
          {
            marketId: 'aave-v3-usdc',
            protocol: 'aave-v3',
            totalValueUsd: '4000.00',
            positions: [
              {
                underlyingToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                underlyingSymbol: 'USDC',
                substrate: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                supplyFormatted: '4000.00',
                supplyValueUsd: '4000.00',
                borrowFormatted: '0',
                borrowValueUsd: '0',
                totalValueUsd: '4000.00',
              },
            ],
          },
        ],
      },
    },
  },
};

/** Successful action created but no simulation data */
export const SuccessNoSimulation: Story = {
  args: {
    chainId: 8453,
    success: true,
    protocol: 'yo-erc4626',
    actionType: 'supply',
    description: 'Allocate 500 USDC to yoUSD',
  },
};

/** Action creation failed with error */
export const ActionFailed: Story = {
  args: {
    chainId: 8453,
    success: false,
    protocol: 'morpho',
    actionType: 'supply',
    description: 'Morpho supply 1000 USDC to WETH/USDC market',
    error: 'Insufficient balance: vault has 250 USDC but tried to supply 1000 USDC',
  },
};

/** Action succeeded but simulation failed */
export const SimulationFailed: Story = {
  args: {
    chainId: 8453,
    success: true,
    protocol: 'aave-v3',
    actionType: 'borrow',
    description: 'Aave V3 borrow 5000 USDC',
    simulation: {
      success: false,
      message: 'Simulation failed on Anvil fork',
      error: 'execution reverted: HEALTH_FACTOR_LOWER_THAN_LIQUIDATION_THRESHOLD',
      actionsCount: 1,
      fuseActionsCount: 1,
    },
  },
};
