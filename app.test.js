import request from 'supertest';
import app from './server.js';

describe('Nyaya Saarthi Judicial Engine - Unit Tests', () => {

  it('GET /health returns HTTP 200 and UP status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.service).toBe('nyaya-saarthi');
  });

  it('POST /api/consult/stream returns HTTP 400 when inquiry prompt is missing', async () => {
    const res = await request(app)
      .post('/api/consult/stream')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('A valid legal inquiry is required.');
  });

  it('POST /api/consult/stream returns HTTP 400 for empty string input', async () => {
    const res = await request(app)
      .post('/api/consult/stream')
      .send({ prompt: '   ' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('A valid legal inquiry is required.');
  });
});