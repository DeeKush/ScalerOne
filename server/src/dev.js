import { serve } from '@hono/node-server';
import { loadEnv } from './loadEnv.js';
import { createApp } from './app.js';

loadEnv();

const port = Number(process.env.PORT) || 3001;
serve({ fetch: createApp().fetch, port }, (info) => {
  console.log(`ScalerOne API http://localhost:${info.port}`);
});
