import { Hono } from 'hono';
import { activity } from './activity';
import { inflows } from './inflows';
import { metadata } from './metadata';

export const activityRouter = new Hono().basePath('/activity');

activityRouter.route('/', activity);
activityRouter.route('/', inflows);
activityRouter.route('/', metadata);
