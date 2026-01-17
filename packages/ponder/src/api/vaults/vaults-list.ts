import { Hono } from 'hono';
import { VAULTS_LIST } from '../../vaults/vaults-list';

export const vaultsList = new Hono();

vaultsList.get('/', (c) => {
  return c.json({
    vaults: VAULTS_LIST,
    pagination: {
      currentPage: 1,
      totalPages: 10,
      totalCount: VAULTS_LIST.length,
      hasNext: true,
      hasPrevious: false,
    },
  });
});
