import { describe, it, expect, beforeEach } from 'vitest';
import { buildServer } from '../server.js';

describe('Wallet Routes', () => {
  let app: Awaited<ReturnType<typeof buildServer>>;

  beforeEach(async () => {
    app = await buildServer();
  });

  it('should return health check', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('ok');
  });

  it('should validate portfolio query parameters', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/portfolio?address=invalid',
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.code).toBe('VALIDATION_ERROR');
  });
});

