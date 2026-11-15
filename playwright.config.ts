import { defineConfig } from '@playwright/test';

const PORT = Number(process.env.SUT_PORT ?? 4173);
const baseURL = process.env.BASE_URL ?? `http://localhost:${PORT}`;
const isCI = !!process.env.CI;

export default defineConfig({
  fullyParallel: true,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['list'], ['html', { open: 'never' }], ['junit', { outputFile: 'test-results/junit.xml' }]] : [['list'], ['html', { open: 'never' }]],
  use: { baseURL },
  projects: [
    { name: '03-retail-inventory-playwright-request', testDir: './projects/03-retail-inventory-playwright-request' },
{ name: '04-ecommerce-json-schema-ajv', testDir: './projects/04-ecommerce-json-schema-ajv' },
{ name: '05-salesforce-composite-graph', testDir: './projects/05-salesforce-composite-graph' },
{ name: '06-sap-odata-v4-query-builder', testDir: './projects/06-sap-odata-v4-query-builder' },
{ name: '07-ecommerce-graphql', testDir: './projects/07-ecommerce-graphql' },
  ],
  webServer: process.env.BASE_URL ? undefined : { command: 'node sut/server.mjs', url: `${baseURL}/health`, reuseExistingServer: !isCI, env: { SUT_PORT: String(PORT) } },
});
