import { db } from 'ponder:api';
import schema from 'ponder:schema';
import { Hono } from 'hono';
import { graphql } from 'ponder';

import { vaults } from './vaults';
import { assets } from './assets';
import { activityRouter } from './activity';

const app = new Hono();

if (process.env.NODE_ENV === 'development') {
  app.use('/', graphql({ db, schema }));
}

const api = app.basePath('/api');

api.route('/', vaults);
api.route('/', assets);
api.route('/', activityRouter);

export default app;
