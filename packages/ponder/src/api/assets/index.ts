import { Hono } from 'hono';
import { ASSETS_LIST } from '../../assets/assets-list';

export const assets = new Hono().basePath('/assets');

assets.get('/', (c) => {
  return c.json({
    assets: ASSETS_LIST,
  });
});
