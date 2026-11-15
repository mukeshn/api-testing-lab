import { test, expect } from '@playwright/test';
import { startGraphQL } from './server';

let url: string;
let stop: () => Promise<void>;
test.beforeAll(async () => ({ url, stop } = await startGraphQL(process.env.BASE_URL ?? 'http://localhost:4173')));
test.afterAll(async () => stop());

const gql = async (request: import('@playwright/test').APIRequestContext, query: string, variables = {}) =>
  (await request.post(url, { data: { query, variables } })).json();

test('query products with field selection and arguments', async ({ request }) => {
  const { data, errors } = await gql(request, '{ products(category: "Footwear", sort: "price-asc") { sku name price } }');
  expect(errors).toBeUndefined();
  expect(data.products.length).toBeGreaterThan(0);
  expect(Object.keys(data.products[0])).toEqual(['sku', 'name', 'price']);
});

test('mutation places an order and returns totals', async ({ request }) => {
  const { data } = await gql(request, `mutation($email: String!) { placeOrder(email: $email, productId: 4, quantity: 2) { id status total } }`, { email: 'gql@example.com' });
  expect(data.placeOrder).toMatchObject({ status: 'CONFIRMED' });
  expect(data.placeOrder.id).toMatch(/^ORD-/);
});

test('unknown field is a validation error, not a 500', async ({ request }) => {
  const res = await request.post(url, { data: { query: '{ products { secretMargin } }' } });
  expect(res.status()).toBe(200);
  expect((await res.json()).errors[0].message).toContain('Cannot query field "secretMargin"');
});
