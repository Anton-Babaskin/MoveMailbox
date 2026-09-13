import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGuestClient } from './guest-client.mjs';

const response = (data, status = 200) => ({ ok: status < 400, status, json: async () => data });
const tick = () => new Promise(resolve => setImmediate(resolve));
class Stream {
  static last;
  listeners = {};
  closed = false;
  constructor(url) { this.url = url; Stream.last = this; }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  close() { this.closed = true; }
  emit(name, data, id = '0') {
    this.listeners[name]({ data: JSON.stringify(data), lastEventId: id });
  }
}

test('concurrent actions wait for one session and retain all migration options', async () => {
  let release;
  const calls = [];
  const client = createGuestClient({ fetch: async (path, init) => {
    calls.push({ path, init });
    if (path === '/api/session') return new Promise(resolve => { release = resolve; });
    return response({ id: 'job' });
  } });
  const input = { source: { password: 'test-only' }, options: {
    folders: ['INBOX'], destinationSubfolder: 'Archive', syncFlags: true, preserveDates: true } };
  const first = client.start(input), second = client.check({ host: 'imap.example.com' });
  assert.equal(calls.length, 1);
  release(response({ mode: 'guest', csrfToken: 'csrf' }));
  await Promise.all([first, second]);
  assert.equal(calls.length, 3);
  assert.equal(calls[1].init.headers['X-CSRF-Token'], 'csrf');
  assert.deepEqual(JSON.parse(calls[1].init.body), input);
});

test('session failure prevents submission; failed POST is never replayed', async () => {
  let calls = 0;
  const client = createGuestClient({ fetch: async path => {
    calls++;
    return path === '/api/session' ? response({ mode: 'guest', csrfToken: 'token' })
      : response({ error: { code: 'storage.unavailable', message: 'unavailable' } }, 503);
  } });
  await assert.rejects(client.start({ options: { strictMirror: true } }), { code: 'storage.unavailable' });
  assert.equal(calls, 2);
  const broken = createGuestClient({ fetch: async () => response({ mode: 'guest' }) });
  await assert.rejects(broken.start({}), /Invalid session/);
});

test('named events replace snapshots, deduplicate and accept cursor reset after gap', () => {
  const snapshots = [], events = [];
  const client = createGuestClient({ EventSource: Stream });
  client.watch('one', { snapshot: view => snapshots.push(view), event: value => events.push(value) });
  Stream.last.emit('snapshot', { status: 'running', recentEvents: [] }, '20');
  Stream.last.emit('migration', { type: 'log' }, '20');
  Stream.last.emit('migration', { type: 'log' }, '21');
  Stream.last.emit('migration', { type: 'gap' }, '3');
  Stream.last.emit('snapshot', { status: 'running', recentEvents: [] }, '3');
  Stream.last.emit('migration', { type: 'log' }, '4');
  assert.equal(snapshots.length, 2);
  assert.equal(events.length, 2);
});

test('finished fetches authoritative cancelled status instead of reporting success', async () => {
  let final;
  const client = createGuestClient({ EventSource: Stream,
    fetch: async () => response({ id: 'one', status: 'cancelled' }) });
  client.watch('one', { snapshot: view => { final = view; } });
  Stream.last.emit('migration', { type: 'finished' }, '1');
  await tick();
  assert.equal(final.status, 'cancelled');
  assert.equal(Stream.last.closed, true);
});

test('refresh recovers owned terminal snapshot; lost ownership closes stream', async () => {
  const client = createGuestClient({ EventSource: Stream,
    fetch: async () => response({ error: { code: 'job.not_found' } }, 404) });
  let failure;
  client.watch('one', { error: value => { failure = value; } });
  Stream.last.emit('error', {});
  await tick();
  assert.equal(failure.code, 'job.not_found');
  assert.equal(Stream.last.closed, true);
  client.watch('two');
  Stream.last.emit('snapshot', { id: 'two', status: 'completed' }, '9');
  assert.equal(Stream.last.closed, true);
});

test('cancellation rejection is observable and does not terminate monitoring', async () => {
  const client = createGuestClient({ EventSource: Stream, fetch: async path =>
    path === '/api/session' ? response({ mode: 'local' })
      : response({ error: { code: 'worker.stop_unconfirmed' } }, 503) });
  client.watch('one');
  await assert.rejects(client.cancel('one'), { code: 'worker.stop_unconfirmed' });
  assert.equal(Stream.last.closed, false);
});
