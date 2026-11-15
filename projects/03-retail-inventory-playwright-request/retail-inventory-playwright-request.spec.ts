import { test, expect } from '@playwright/test';

test('adjustments are applied atomically under concurrency', async ({ request }) => {
  const read = async () => (await (await request.get('/api/retail/inventory', { params: { store: 'MUC-02', sku: 'RT-400' } })).json()).items[0].onHand;
  const before = await read();
  await Promise.all(Array.from({ length: 10 }, () => request.post('/api/retail/inventory/adjust', { data: { storeId: 'MUC-02', sku: 'RT-400', delta: 1, reason: 'RECEIPT' } })));
  expect(await read()).toBe(before + 10);
});

for (const [name, body, status] of [
  ['zero delta', { delta: 0, reason: 'SALE' }, 422],
  ['decimal delta', { delta: 1.5, reason: 'SALE' }, 422],
  ['unknown reason', { delta: 1, reason: 'THEFT' }, 422],
  ['unknown sku', { sku: 'NOPE', delta: 1, reason: 'SALE' }, 404],
] as const) {
  test(`rejects ${name}`, async ({ request }) => {
    const res = await request.post('/api/retail/inventory/adjust', { data: { storeId: 'MUC-02', sku: 'RT-400', ...body } });
    expect(res.status()).toBe(status);
  });
}

test('low stock filter only returns items at or below reorder point', async ({ request }) => {
  const { items } = await (await request.get('/api/retail/inventory', { params: { lowStock: 'true' } })).json();
  for (const i of items) expect(i.onHand).toBeLessThanOrEqual(i.reorderPoint);
});
