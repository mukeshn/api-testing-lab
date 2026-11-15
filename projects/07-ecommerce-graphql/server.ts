import http from 'node:http';
import { graphql, buildSchema } from 'graphql';

// A thin GraphQL facade over the storefront REST API - typical BFF setup.
const schema = buildSchema(`
  type Product { id: Int! sku: String! name: String! category: String! price: Float! stock: Int! }
  type Order { id: String! status: String! total: Float! }
  type Query { products(category: String, sort: String): [Product!]! product(id: Int!): Product }
  type Mutation { placeOrder(email: String!, productId: Int!, quantity: Int!): Order! }
`);

export async function startGraphQL(restBase: string) {
  const json = async (path: string, init?: RequestInit) => (await fetch(restBase + path, { headers: { 'content-type': 'application/json' }, ...init })).json();
  const root = {
    products: async ({ category, sort }: { category?: string; sort?: string }) => (await json(`/api/shop/products?${new URLSearchParams({ ...(category ? { category } : {}), ...(sort ? { sort } : {}) })}`)).items,
    product: async ({ id }: { id: number }) => json(`/api/shop/products/${id}`),
    placeOrder: async ({ email, productId, quantity }: { email: string; productId: number; quantity: number }) =>
      json('/api/shop/orders', { method: 'POST', body: JSON.stringify({ customer: { email, firstName: 'Graph', lastName: 'QL', street: 'Query 1', postcode: '86150', country: 'DE' }, items: [{ productId, quantity }], paymentMethod: 'card' }) }),
  };
  const server = http.createServer(async (req, res) => {
    let raw = '';
    for await (const c of req) raw += c;
    const { query, variables } = JSON.parse(raw || '{}');
    const result = await graphql({ schema, source: query, rootValue: root, variableValues: variables });
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(result));
  });
  await new Promise<void>((r) => server.listen(0, r));
  const port = (server.address() as { port: number }).port;
  return { url: `http://localhost:${port}/graphql`, stop: () => new Promise<void>((r) => server.close(() => r())) };
}
