import { before, describe, it, after } from 'node:test';
import { expect } from 'chai';
import {
  PlasmaVault,
  fusionFactoryAbi,
  plasmaVaultFactoryAbi,
  yoErc4626SupplyFuseAbi,
  swapRouter02Abi,
  yoUniversalTokenSwapperFuseAbi,
  FUSION_FACTORY_ADDRESS,
  ERC4626_SUPPLY_FUSE_SLOT1_ADDRESS,
  ERC4626_SUPPLY_FUSE_SLOT2_ADDRESS,
  ERC4626_SUPPLY_FUSE_SLOT3_ADDRESS,
  ERC4626_SUPPLY_FUSE_SLOT4_ADDRESS,
  ERC4626_BALANCE_FUSE_SLOT1_ADDRESS,
  ERC4626_BALANCE_FUSE_SLOT2_ADDRESS,
  ERC4626_BALANCE_FUSE_SLOT3_ADDRESS,
  ERC4626_BALANCE_FUSE_SLOT4_ADDRESS,
  UNIVERSAL_TOKEN_SWAPPER_FUSE_ADDRESS,
  UNISWAP_SWAP_ROUTER_02_ADDRESS,
  YO_TREASURY_ROLES,
  YO_VAULT_SLOTS,
  SWAP_MARKET_ID,
  YO_USD_ADDRESS,
  YO_ETH_ADDRESS,
  YO_USDC_ADDRESS,
  YO_WETH_ADDRESS,
} from '@ipor/fusion-sdk';
import { NetworkConnection } from 'hardhat/types/network';
import { network } from 'hardhat';
import { env } from '../../lib/env';
import { ANVIL_TEST_ACCOUNT } from '../../lib/test-accounts';
import { base } from 'viem/chains';
import {
  pad,
  erc20Abi,
  erc4626Abi,
  encodeFunctionData,
  decodeEventLog,
  keccak256,
  encodeAbiParameters,
  toHex,
  type Address,
  type Hex,
} from 'viem';

import '@nomicfoundation/hardhat-toolbox-viem';

describe(
  'YO Treasury - vault creation and allocation lifecycle',
  { timeout: 180_000 },
  () => {
    const BLOCK_NUMBER = 42755236;
    const CHAIN_ID = base.id;
    const OWNER_ADDRESS = ANVIL_TEST_ACCOUNT[0].address;

    let connection: NetworkConnection<'op'>;
    let vaultAddress: Address;
    let plasmaVault: PlasmaVault;
    let publicClient: Awaited<ReturnType<NetworkConnection<'op'>['viem']['getPublicClient']>>;
    let testClient: Awaited<ReturnType<NetworkConnection<'op'>['viem']['getTestClient']>>;
    let ownerClient: Awaited<ReturnType<NetworkConnection<'op'>['viem']['getWalletClient']>>;

    const usdcAddress = YO_USDC_ADDRESS[CHAIN_ID];
    const yoUsdAddress = YO_USD_ADDRESS[CHAIN_ID];
    const wethAddress = YO_WETH_ADDRESS[CHAIN_ID];
    const yoEthAddress = YO_ETH_ADDRESS[CHAIN_ID];

    before(async () => {
      connection = await network.connect({
        network: 'hardhatBase',
        chainType: 'op',
        override: {
          chainId: CHAIN_ID,
          forking: {
            url: env.RPC_URL_BASE,
            blockNumber: BLOCK_NUMBER,
          },
        },
      });

      const { viem } = connection;
      publicClient = await viem.getPublicClient();
      testClient = await viem.getTestClient();

      // Fund owner with ETH for gas
      await testClient.setBalance({
        address: OWNER_ADDRESS,
        value: BigInt(10e18),
      });

      ownerClient = await viem.getWalletClient(OWNER_ADDRESS);

      // ─── Step 1: Clone vault via FusionFactory ───

      const factoryAddress = FUSION_FACTORY_ADDRESS[CHAIN_ID];
      const cloneTxHash = await ownerClient.writeContract({
        address: factoryAddress,
        abi: fusionFactoryAbi,
        functionName: 'clone',
        args: ['YO Treasury Test', 'yoTEST', usdcAddress, 1n, OWNER_ADDRESS, 0n],
      });

      const cloneReceipt = await publicClient.waitForTransactionReceipt({
        hash: cloneTxHash,
      });

      // Parse PlasmaVaultCreated event to get vault address
      let parsedVaultAddress: Address | undefined;
      for (const log of cloneReceipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: plasmaVaultFactoryAbi,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === 'PlasmaVaultCreated') {
            parsedVaultAddress = decoded.args.plasmaVault;
          }
        } catch {
          // not this event, skip
        }
      }

      if (!parsedVaultAddress) throw new Error('PlasmaVaultCreated event not found');
      vaultAddress = parsedVaultAddress;
      console.log('Vault created:', vaultAddress);

      plasmaVault = await PlasmaVault.create(publicClient, vaultAddress);
      console.log('PriceOracleMiddleware:', plasmaVault.priceOracle);

      // ─── Step 2: Grant roles ───

      const roles = [
        YO_TREASURY_ROLES.ATOMIST,
        YO_TREASURY_ROLES.FUSE_MANAGER,
        YO_TREASURY_ROLES.ALPHA,
        YO_TREASURY_ROLES.WHITELIST,
      ];

      for (const role of roles) {
        await plasmaVault.grantRole(ownerClient, role, OWNER_ADDRESS, 0);
      }
      console.log('Roles granted');

      // ─── Step 3: Add supply fuses ───

      const supplyFuses: Address[] = [
        ERC4626_SUPPLY_FUSE_SLOT1_ADDRESS[CHAIN_ID],
        ERC4626_SUPPLY_FUSE_SLOT2_ADDRESS[CHAIN_ID],
        ERC4626_SUPPLY_FUSE_SLOT3_ADDRESS[CHAIN_ID],
        ERC4626_SUPPLY_FUSE_SLOT4_ADDRESS[CHAIN_ID],
        UNIVERSAL_TOKEN_SWAPPER_FUSE_ADDRESS[CHAIN_ID],
      ];

      await plasmaVault.addFuses(ownerClient, supplyFuses);
      console.log('Fuses added');

      // ─── Step 4: Add balance fuses ───

      const balanceFuseConfigs = [
        { fuse: ERC4626_BALANCE_FUSE_SLOT1_ADDRESS[CHAIN_ID], marketId: YO_VAULT_SLOTS.yoUSD.marketId },
        { fuse: ERC4626_BALANCE_FUSE_SLOT2_ADDRESS[CHAIN_ID], marketId: YO_VAULT_SLOTS.yoETH.marketId },
        { fuse: ERC4626_BALANCE_FUSE_SLOT3_ADDRESS[CHAIN_ID], marketId: YO_VAULT_SLOTS.yoBTC.marketId },
        { fuse: ERC4626_BALANCE_FUSE_SLOT4_ADDRESS[CHAIN_ID], marketId: YO_VAULT_SLOTS.yoEUR.marketId },
      ];

      for (const { fuse, marketId } of balanceFuseConfigs) {
        await plasmaVault.addBalanceFuse(ownerClient, fuse, marketId);
      }

      // ─── Step 4b: Deploy ZeroBalanceFuse for swap market ───
      // The swap market (MARKET_ID=12) needs a balance fuse that returns 0,
      // since swaps don't hold persistent positions.
      // Runtime bytecode: responds to MARKET_ID() with 12, balanceOf() with 0
      const ZERO_BALANCE_FUSE_ADDRESS = '0x0000000000000000000000000000000000AB12CF' as Address;
      await testClient.setCode({
        address: ZERO_BALANCE_FUSE_ADDRESS,
        bytecode:
          '0x60003560e01c8063454dab2314601d5763722713f714602857600080fd5b600c60005260206000f35b600060005260206000f3',
      });
      await plasmaVault.addBalanceFuse(ownerClient, ZERO_BALANCE_FUSE_ADDRESS, SWAP_MARKET_ID);

      console.log('Balance fuses added (including ZeroBalanceFuse for swap market)');

      // ─── Step 5: Configure substrates for yoUSD ───

      const yoUsdSubstrate = pad(yoUsdAddress, { size: 32 }).toLowerCase() as Hex;
      await plasmaVault.grantMarketSubstrates(
        ownerClient,
        YO_VAULT_SLOTS.yoUSD.marketId,
        [yoUsdSubstrate],
      );

      // ─── Step 6: Update dependency balance graph for yoUSD ───

      await plasmaVault.updateDependencyBalanceGraph(
        ownerClient,
        YO_VAULT_SLOTS.yoUSD.marketId,
        [],
      );

      // ─── Step 7: Fund owner with USDC and deposit ───

      const depositAmount = 100_000000n; // 100 USDC

      // Deal USDC via storage manipulation (FiatTokenV2 balances mapping at slot 9)
      const balanceSlot = keccak256(
        encodeAbiParameters(
          [{ type: 'address' }, { type: 'uint256' }],
          [OWNER_ADDRESS, 9n],
        ),
      );

      await testClient.setStorageAt({
        address: usdcAddress,
        index: balanceSlot,
        value: pad(toHex(depositAmount), { size: 32 }),
      });

      // Approve and deposit
      await ownerClient.writeContract({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [vaultAddress, depositAmount],
      });

      await ownerClient.writeContract({
        address: vaultAddress,
        abi: erc4626Abi,
        functionName: 'deposit',
        args: [depositAmount, OWNER_ADDRESS],
      });

      console.log('Deposited', depositAmount, 'USDC into vault');

      // ─── Step 8: Allocate 50 USDC to yoUSD ───

      const allocateAmount = 50_000000n; // 50 USDC
      const supplyFuseSlot1 = ERC4626_SUPPLY_FUSE_SLOT1_ADDRESS[CHAIN_ID];

      const enterAction = {
        fuse: supplyFuseSlot1,
        data: encodeFunctionData({
          abi: yoErc4626SupplyFuseAbi,
          functionName: 'enter',
          args: [{ vault: yoUsdAddress, vaultAssetAmount: allocateAmount }],
        }),
      };

      await plasmaVault.execute(ownerClient, [[enterAction]]);
      console.log('Allocated 50 USDC to yoUSD');
    });

    after(async () => {
      await connection.close();
    });

    // ─── Verify initial state ───

    it('should have vault with yoUSD allocation', async () => {
      // Vault holds 50 USDC (100 deposited - 50 allocated)
      const vaultUsdc = await publicClient.readContract({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [vaultAddress],
      });
      expect(vaultUsdc).to.equal(50_000000n);
      console.log('Vault USDC:', vaultUsdc);

      // Vault holds yoUSD shares
      const yoUsdShares = await publicClient.readContract({
        address: yoUsdAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [vaultAddress],
      });
      expect(yoUsdShares > 0n).to.equal(true);
      console.log('Vault yoUSD shares:', yoUsdShares);

      // yoUSD shares are worth approximately 50 USDC
      const shareValue = await publicClient.readContract({
        address: yoUsdAddress,
        abi: erc4626Abi,
        functionName: 'convertToAssets',
        args: [yoUsdShares],
      });
      expect(shareValue > 49_000000n).to.equal(true);
      console.log('yoUSD shares worth:', shareValue, 'USDC');
    });

    // ─── Phase 1: Withdraw from yoUSD via requestRedeem ───

    it('should withdraw from yoUSD via requestRedeem (impersonated)', async () => {
      const { viem } = connection;

      // Read vault's yoUSD share balance
      const yoUsdShares = await publicClient.readContract({
        address: yoUsdAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [vaultAddress],
      });
      expect(yoUsdShares > 0n).to.equal(true);

      // Record USDC balance before
      const vaultUsdcBefore = await publicClient.readContract({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [vaultAddress],
      });

      // Impersonate the PlasmaVault to call yoUSD.redeem() directly
      // This proves: msg.sender = PlasmaVault = owner → satisfies requestRedeem check
      await testClient.impersonateAccount({ address: vaultAddress });
      await testClient.setBalance({ address: vaultAddress, value: BigInt(1e18) });

      const vaultWalletClient = await viem.getWalletClient(vaultAddress);

      // Call redeem() which delegates to requestRedeem()
      // For small amounts (50 USDC << vault TVL), this is instant
      await vaultWalletClient.writeContract({
        address: yoUsdAddress,
        abi: erc4626Abi,
        functionName: 'redeem',
        args: [yoUsdShares, vaultAddress, vaultAddress],
      });

      await testClient.stopImpersonatingAccount({ address: vaultAddress });

      // Verify yoUSD shares burned
      const yoUsdSharesAfter = await publicClient.readContract({
        address: yoUsdAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [vaultAddress],
      });
      expect(yoUsdSharesAfter).to.equal(0n);

      // Verify USDC returned to vault
      const vaultUsdcAfter = await publicClient.readContract({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [vaultAddress],
      });
      expect(vaultUsdcAfter > vaultUsdcBefore).to.equal(true);
      console.log('Withdrew from yoUSD:', vaultUsdcAfter - vaultUsdcBefore, 'USDC returned');
      console.log('Vault USDC after withdraw:', vaultUsdcAfter);
    });

    // ─── Phase 2: Swap USDC → WETH via UniversalTokenSwapperFuse ───

    it('should swap USDC to WETH via UniversalTokenSwapperFuse', async () => {
      const swapRouter02Address = UNISWAP_SWAP_ROUTER_02_ADDRESS[CHAIN_ID];
      const swapFuseAddress = UNIVERSAL_TOKEN_SWAPPER_FUSE_ADDRESS[CHAIN_ID];
      const swapAmount = 10_000000n; // 10 USDC

      // The SwapExecutor receives WETH from the router and sweeps it back to the vault
      const EXECUTOR_ADDRESS = '0x591435c065fce9713c8B112fcBf5Af98b8975cB3' as Address;

      // ─── Configure swap substrates ───
      // Need: USDC (tokenIn), WETH (tokenOut), SwapRouter02 (target)
      const swapSubstrates = [
        pad(usdcAddress, { size: 32 }).toLowerCase() as Hex,
        pad(wethAddress, { size: 32 }).toLowerCase() as Hex,
        pad(swapRouter02Address, { size: 32 }).toLowerCase() as Hex,
      ];
      await plasmaVault.grantMarketSubstrates(ownerClient, SWAP_MARKET_ID, swapSubstrates);

      // ─── Encode swap calldata ───
      // Step 1: USDC.approve(SwapRouter02, amount) — executor approves router
      // Step 2: SwapRouter02.exactInputSingle({...}) — router pulls USDC, sends WETH
      const targets: Address[] = [usdcAddress, swapRouter02Address];
      const swapData: Hex[] = [
        encodeFunctionData({
          abi: erc20Abi,
          functionName: 'approve',
          args: [swapRouter02Address, swapAmount],
        }),
        encodeFunctionData({
          abi: swapRouter02Abi,
          functionName: 'exactInputSingle',
          args: [
            {
              tokenIn: usdcAddress,
              tokenOut: wethAddress,
              fee: 500, // 0.05% pool
              recipient: EXECUTOR_ADDRESS, // executor receives WETH, sweeps back to vault
              amountIn: swapAmount,
              amountOutMinimum: 0n,
              sqrtPriceLimitX96: 0n,
            },
          ],
        }),
      ];

      // ─── Build FuseAction ───
      const fuseCalldata = encodeFunctionData({
        abi: yoUniversalTokenSwapperFuseAbi,
        functionName: 'enter',
        args: [
          {
            tokenIn: usdcAddress,
            tokenOut: wethAddress,
            amountIn: swapAmount,
            data: { targets, data: swapData },
          },
        ],
      });

      const swapAction = {
        fuse: swapFuseAddress,
        data: fuseCalldata,
      };

      // Record balances before
      const vaultUsdcBefore = await publicClient.readContract({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [vaultAddress],
      });

      // ─── Execute swap via fuse ───
      await plasmaVault.execute(ownerClient, [[swapAction]]);

      // Verify USDC decreased
      const vaultUsdcAfter = await publicClient.readContract({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [vaultAddress],
      });
      expect(vaultUsdcAfter).to.equal(vaultUsdcBefore - swapAmount);

      // Verify WETH received
      const vaultWethBalance = await publicClient.readContract({
        address: wethAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [vaultAddress],
      });
      expect(vaultWethBalance > 0n).to.equal(true);
      console.log('Swapped', swapAmount, 'USDC →', vaultWethBalance, 'WETH');
    });

    // ─── Phase 3: Allocate WETH to yoETH ───

    it('should allocate WETH to yoETH', async () => {
      const supplyFuseSlot2 = ERC4626_SUPPLY_FUSE_SLOT2_ADDRESS[CHAIN_ID];

      // ─── Configure yoETH substrate + dependency graph ───
      const yoEthSubstrate = pad(yoEthAddress, { size: 32 }).toLowerCase() as Hex;
      await plasmaVault.grantMarketSubstrates(
        ownerClient,
        YO_VAULT_SLOTS.yoETH.marketId,
        [yoEthSubstrate],
      );
      await plasmaVault.updateDependencyBalanceGraph(
        ownerClient,
        YO_VAULT_SLOTS.yoETH.marketId,
        [],
      );

      // Read available WETH
      const wethBalance = await publicClient.readContract({
        address: wethAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [vaultAddress],
      });
      expect(wethBalance > 0n).to.equal(true);

      // ─── Allocate all WETH to yoETH ───
      const enterAction = {
        fuse: supplyFuseSlot2,
        data: encodeFunctionData({
          abi: yoErc4626SupplyFuseAbi,
          functionName: 'enter',
          args: [{ vault: yoEthAddress, vaultAssetAmount: wethBalance }],
        }),
      };

      await plasmaVault.execute(ownerClient, [[enterAction]]);

      // Verify yoETH shares > 0
      const yoEthShares = await publicClient.readContract({
        address: yoEthAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [vaultAddress],
      });
      expect(yoEthShares > 0n).to.equal(true);

      // Verify WETH balance is 0 (all allocated)
      const wethAfter = await publicClient.readContract({
        address: wethAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [vaultAddress],
      });
      expect(wethAfter).to.equal(0n);

      console.log('Allocated', wethBalance, 'WETH → yoETH shares:', yoEthShares);
    });

    // ─── Phase 4: Compound swap+allocate in single execute ───

    it('should compound swap+allocate in single execute', async () => {
      const swapRouter02Address = UNISWAP_SWAP_ROUTER_02_ADDRESS[CHAIN_ID];
      const swapFuseAddress = UNIVERSAL_TOKEN_SWAPPER_FUSE_ADDRESS[CHAIN_ID];
      const supplyFuseSlot2 = ERC4626_SUPPLY_FUSE_SLOT2_ADDRESS[CHAIN_ID];
      const EXECUTOR_ADDRESS = '0x591435c065fce9713c8B112fcBf5Af98b8975cB3' as Address;

      // Use remaining USDC in vault
      const vaultUsdc = await publicClient.readContract({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [vaultAddress],
      });
      expect(vaultUsdc > 0n).to.equal(true);
      const swapAmount = vaultUsdc; // swap all remaining USDC

      // Record yoETH shares before
      const yoEthSharesBefore = await publicClient.readContract({
        address: yoEthAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [vaultAddress],
      });

      // ─── Action 1: Swap USDC → WETH ───
      const swapAction = {
        fuse: swapFuseAddress,
        data: encodeFunctionData({
          abi: yoUniversalTokenSwapperFuseAbi,
          functionName: 'enter',
          args: [
            {
              tokenIn: usdcAddress,
              tokenOut: wethAddress,
              amountIn: swapAmount,
              data: {
                targets: [usdcAddress, swapRouter02Address] as Address[],
                data: [
                  encodeFunctionData({
                    abi: erc20Abi,
                    functionName: 'approve',
                    args: [swapRouter02Address, swapAmount],
                  }),
                  encodeFunctionData({
                    abi: swapRouter02Abi,
                    functionName: 'exactInputSingle',
                    args: [
                      {
                        tokenIn: usdcAddress,
                        tokenOut: wethAddress,
                        fee: 500,
                        recipient: EXECUTOR_ADDRESS,
                        amountIn: swapAmount,
                        amountOutMinimum: 0n,
                        sqrtPriceLimitX96: 0n,
                      },
                    ],
                  }),
                ] as Hex[],
              },
            },
          ],
        }),
      };

      // ─── Action 2: Allocate ALL WETH to yoETH ───
      // Use max uint256 — the ERC4626 deposit will cap at available balance
      const allocateAction = {
        fuse: supplyFuseSlot2,
        data: encodeFunctionData({
          abi: yoErc4626SupplyFuseAbi,
          functionName: 'enter',
          args: [
            {
              vault: yoEthAddress,
              vaultAssetAmount: BigInt(
                '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
              ),
            },
          ],
        }),
      };

      // ─── Execute both actions atomically ───
      // Each FuseAction[] in the outer array runs sequentially
      await plasmaVault.execute(ownerClient, [[swapAction], [allocateAction]]);

      // Verify: no USDC remaining
      const usdcAfter = await publicClient.readContract({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [vaultAddress],
      });
      expect(usdcAfter).to.equal(0n);

      // Verify: no WETH remaining (all went to yoETH)
      const wethAfter = await publicClient.readContract({
        address: wethAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [vaultAddress],
      });
      expect(wethAfter).to.equal(0n);

      // Verify: yoETH shares increased
      const yoEthSharesAfter = await publicClient.readContract({
        address: yoEthAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [vaultAddress],
      });
      expect(yoEthSharesAfter > yoEthSharesBefore).to.equal(true);

      console.log(
        'Compound swap+allocate:',
        swapAmount,
        'USDC → yoETH shares:',
        yoEthSharesAfter,
        '(was',
        yoEthSharesBefore,
        ')',
      );
    });
  },
);
