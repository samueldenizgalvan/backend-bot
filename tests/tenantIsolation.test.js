process.env.TEST_ENV = '1';
const request = require('supertest');
const assert = require('assert');
const { app, server } = require('../server');
const whatsappService = require('../services/whatsappService');

describe('Aislamiento de inquilinos', function() {
  let agenteA, agenteB;

  before(() => {
    agenteA = request.agent(app);
    agenteB = request.agent(app);
  });

  after(done => {
    server.close(done);
  });

  it('Usuario A crea una cita y Usuario B no la ve', async function() {
    await agenteA.post('/api/login').send({ username: 'userA', password: 'a' });
    await agenteB.post('/api/login').send({ username: 'userB', password: 'b' });

    await agenteA.post('/api/citas/pendientes').send({ telefono: '123', nombre: 'A' });
    const resA = await agenteA.get('/api/citas/pendientes');
    assert.strictEqual(resA.body.length, 1);

    const resB = await agenteB.get('/api/citas/pendientes');
    assert.strictEqual(resB.body.length, 0);
  });

  it('Usuario A arranca su bot y Usuario B no puede pararlo', async function() {
    await agenteA.post('/api/bot/start');
    let activos = whatsappService.getBotsActivos();
    assert(activos.some(b => b.username === 'userA'));

    await agenteB.post('/api/bot/stop');
    activos = whatsappService.getBotsActivos();
    assert(activos.some(b => b.username === 'userA'));
  });
});
