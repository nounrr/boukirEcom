import test from 'node:test';
import assert from 'node:assert/strict';
import configModule from 'next/dist/server/config.js';
import { AsyncLocalStorage } from 'node:async_hooks';
globalThis.AsyncLocalStorage = AsyncLocalStorage;
const { unstable_getResponseFromNextConfig } = await import('next/experimental/testing/server.js');

test('configured redirects preserve FR/AR paths and query and never redirect apex', async () => {
  process.env.NEXT_PUBLIC_SITE_URL = 'https://boukirdiamond.com';
  const loadConfig = configModule.default || configModule;
  const config = await loadConfig('phase-production-build', process.cwd());
  for (const path of ['/', '/fr', '/ar/shop?category_id=36&utm_source=test', '/fr/product/7035', '/ar/cart']) {
    const response = await unstable_getResponseFromNextConfig({ url: `https://www.boukirdiamond.com${path}`, nextConfig: config });
    assert.equal(response.status, 308, path);
    assert.equal(response.headers.get('location'), `https://boukirdiamond.com${path}`);
    const target = await unstable_getResponseFromNextConfig({ url: response.headers.get('location'), nextConfig: config });
    assert.equal(target.headers.get('location'), null, 'no apex loop');
  }
});
