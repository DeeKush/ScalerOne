import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { pingMongo, ensureIndexes } from './mongo.js';
import { registerImageRoutes } from './routes/images.js';
import { registerLostFoundRoutes } from './routes/lostFound.js';

function corsOrigins() {
  const extra = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return [
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:19006',
    'http://127.0.0.1:8081',
    'http://127.0.0.1:8082',
    ...extra,
  ];
}

export function createApp() {
  const inner = new Hono();

  inner.use(
    '*',
    cors({
      origin: corsOrigins(),
      allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Authorization', 'Content-Type'],
    })
  );

  inner.onError((err, c) => {
    console.error('[api]', err);
    const status = err.status && Number.isInteger(err.status) ? err.status : 500;
    return c.json({ error: err.message || 'Server error' }, status);
  });

  inner.get('/v1/health', async (c) => {
    await pingMongo();
    await ensureIndexes();
    return c.json({ ok: true, db: 'ScalerOne' });
  });

  registerImageRoutes(inner);
  registerLostFoundRoutes(inner);

  inner.notFound((c) => c.json({ error: 'Not found' }, 404));

  // Local: /v1/*. Vercel rewrite sends /v1/* → /api/v1/*.
  const app = new Hono();
  app.route('/', inner);
  app.route('/api', inner);
  return app;
}
