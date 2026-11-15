import { test, expect, type APIRequestContext } from '@playwright/test';

const V = '/services/data/v60.0';
async function token(request: APIRequestContext) {
  const res = await request.post('/services/oauth2/token', { form: { grant_type: 'client_credentials', client_id: 'connected-app-qa', client_secret: 'c0nn3cted-s3cret' } });
  return (await res.json()).access_token as string;
}

test('account -> contact -> opportunity in one round trip', async ({ request }) => {
  const auth = { authorization: `Bearer ${await token(request)}` };
  const name = `Graph AG ${Date.now()}`;
  const res = await request.post(`${V}/composite`, { headers: auth, data: { allOrNone: true, compositeRequest: [
    { method: 'POST', url: `${V}/sobjects/Account`, referenceId: 'acc', body: { Name: name } },
    { method: 'POST', url: `${V}/sobjects/Contact`, referenceId: 'con', body: { LastName: 'Graph', AccountId: '@{acc.id}' } },
    { method: 'POST', url: `${V}/sobjects/Opportunity`, referenceId: 'opp', body: { Name: `${name} - Deal`, StageName: 'Prospecting', CloseDate: '2027-04-30', AccountId: '@{acc.id}' } },
  ] } });
  const { compositeResponse } = await res.json();
  expect(compositeResponse.map((r: { referenceId: string; httpStatusCode: number }) => `${r.referenceId}:${r.httpStatusCode}`)).toEqual(['acc:201', 'con:201', 'opp:201']);

  const accId = compositeResponse[0].body.id;
  const q = await request.get(`${V}/query`, { headers: auth, params: { q: `SELECT Id, Name FROM Opportunity WHERE AccountId = '${accId}'` } });
  expect((await q.json()).totalSize).toBe(1);
});

test('more than 25 subrequests is rejected', async ({ request }) => {
  const auth = { authorization: `Bearer ${await token(request)}` };
  const compositeRequest = Array.from({ length: 26 }, (_, i) => ({ method: 'POST', url: `${V}/sobjects/Lead`, referenceId: `l${i}`, body: { LastName: 'x', Company: 'y' } }));
  const res = await request.post(`${V}/composite`, { headers: auth, data: { compositeRequest } });
  expect(res.status()).toBe(400);
});
