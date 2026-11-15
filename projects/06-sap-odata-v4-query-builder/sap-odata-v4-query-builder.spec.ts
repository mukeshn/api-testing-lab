import { test, expect } from '@playwright/test';

type Product = { ID: number; Name: string; Category: string; Price: number; Stock: number; SupplierID: number };

class ODataQuery<T> {
  private parts: Record<string, string> = {};
  filter(expr: string) { this.parts.$filter = expr; return this; }
  select(...f: (keyof T & string)[]) { this.parts.$select = f.join(','); return this; }
  orderBy(f: keyof T & string, dir: 'asc' | 'desc' = 'asc') { this.parts.$orderby = `${String(f)} ${dir}`; return this; }
  top(n: number) { this.parts.$top = String(n); return this; }
  count() { this.parts.$count = 'true'; return this; }
  toString() { return '?' + Object.entries(this.parts).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&'); }
}

test('builder produces a valid query and typed results', async ({ request }) => {
  const query = new ODataQuery<Product>().filter('Stock lt 20 and Price ge 10').select('ID', 'Name', 'Stock', 'Price').orderBy('Stock').count();
  const body = await (await request.get(`/odata/v4/catalog/Products${query}`)).json();
  const value = body.value as Pick<Product, 'ID' | 'Name' | 'Stock' | 'Price'>[];
  expect(body['@odata.count']).toBe(value.length);
  for (const p of value) { expect(p.Stock).toBeLessThan(20); expect(p.Price).toBeGreaterThanOrEqual(10); }
  expect(value.map((p) => p.Stock)).toEqual([...value.map((p) => p.Stock)].sort((a, b) => a - b));
});

test('out-of-stock products', async ({ request }) => {
  const body = await (await request.get(`/odata/v4/catalog/Products${new ODataQuery<Product>().filter('Stock eq 0').select('Name')}`)).json();
  expect(body.value).toEqual([{ Name: 'Laugenbrezel' }]);
});
