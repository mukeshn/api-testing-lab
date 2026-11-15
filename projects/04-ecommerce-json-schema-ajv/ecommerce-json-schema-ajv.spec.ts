import { test, expect } from '@playwright/test';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
ajv.addSchema({ $id: 'money', type: 'number', multipleOf: 0.01 });
const order = ajv.compile({
  type: 'object',
  required: ['id', 'status', 'createdAt', 'total', 'lines'],
  properties: {
    id: { type: 'string', pattern: '^ORD-' },
    status: { enum: ['CONFIRMED', 'CANCELLED'] },
    createdAt: { type: 'string', format: 'date-time' },
    total: { $ref: 'money' },
    customer: { type: 'object', properties: { email: { type: 'string', format: 'email' } } },
    lines: { type: 'array', minItems: 1, items: { type: 'object', required: ['sku', 'quantity'], properties: { quantity: { type: 'integer', minimum: 1 }, unitPrice: { $ref: 'money' } } } },
  },
});

test('order response satisfies the published contract', async ({ request }) => {
  const res = await request.post('/api/shop/orders', { data: { customer: { email: 'ajv@example.com', firstName: 'A', lastName: 'J', street: 'S 1', postcode: '10115', country: 'DE' }, items: [{ productId: 9, quantity: 2 }], paymentMethod: 'card' } });
  const body = await res.json();
  const ok = order(body);
  expect(ok, ajv.errorsText(order.errors)).toBe(true);
});

test('schema catches a broken payload', () => {
  expect(order({ id: 'X', status: 'NEW', createdAt: 'yesterday', total: 1.234, lines: [] })).toBe(false);
  expect(order.errors!.map((e) => e.instancePath).sort()).toEqual(['/createdAt', '/id', '/lines', '/status', '/total']);
});
