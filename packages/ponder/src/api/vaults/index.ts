import { Hono } from 'hono';
import { flowChart } from './flow-chart';
import { metrics } from './metrics';
import { depositors } from './depositors';
import { vault } from './vault';
import { vaultsList } from './vaults-list';

export const vaults = new Hono().basePath('/vaults');

vaults.route('/', vaultsList);
vaults.route('/', vault);
vaults.route('/', depositors);
vaults.route('/', metrics);
vaults.route('/', flowChart);
