import { handle } from 'hono/vercel';
import { loadEnv } from '../src/loadEnv.js';
import { createApp } from '../src/app.js';

loadEnv();

const app = createApp();

export const config = {
  runtime: 'nodejs',
  maxDuration: 30,
};

const handler = handle(app);

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export default handler;
