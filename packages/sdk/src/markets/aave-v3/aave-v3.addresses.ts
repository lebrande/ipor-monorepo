import { mainnet, arbitrum, base, plasma, avalanche } from 'viem/chains';
import { createChainAddresses } from '../../utils/create-chain-addresses';

export const AAVE_V3_SUPPLY_FUSE_ADDRESS = createChainAddresses({
  [mainnet.id]: '0x7b3957B38b1c91057755D71701247905b48D6063',
  [arbitrum.id]: '0x304756cD719382281fBD640f5F7932465eD663D6',
  [base.id]: '0x26fD6EF391E98C78CfCA27e00c3d15be4D941625',
  [plasma.id]: '0x9B64e01c16CbFfB0D42d89a5Df73B7f8909dff05',
  [avalanche.id]: '0x97e36bA4d86824738c83b91b7b983d36c75a1946',
});

export const AAVE_V3_BORROW_FUSE_ADDRESS = createChainAddresses({
  [mainnet.id]: '0x820D879Ef89356B93A7c71ADDBf45c40a0dDE453',
  [arbitrum.id]: '0x28264E8b70902f6C55420EAF66AeeE12b602302E',
  [base.id]: '0x1Df60F2A046F3Dce8102427e091C1Ea99aE1d774',
  [plasma.id]: '0xA072E8ff01fec4e09808968220bFF4DD2262e320',
  [avalanche.id]: '0x27049822E8F40D194Ac5A0b0107255Ec12cd4e82',
});
