// Same-origin browser API client. No DOM, credential persistence or POST retries.
export class APIError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const terminal = view => ['completed', 'failed', 'cancelled'].includes(view.status);

export function createGuestClient({ fetch: request = globalThis.fetch,
  EventSource: Stream = globalThis.EventSource } = {}) {
  let sessionPromise;
  async function json(method, path, body, csrf) {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (csrf) headers['X-CSRF-Token'] = csrf;
    const response = await request(path, { method, headers, credentials: 'same-origin',
      cache: 'no-store', ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const data = await response.json();
    if (!response.ok) throw new APIError(response.status, data.error?.code,
      data.error?.message || `HTTP ${response.status}`);
    return data;
  }
  function session() {
    if (!sessionPromise) {
      sessionPromise = json('GET', '/api/session').then(data => {
        if (!['guest', 'local'].includes(data.mode) || (data.mode === 'guest' && !data.csrfToken)) {
          throw new Error('Invalid session response');
        }
        return data;
      }).catch(error => { sessionPromise = undefined; throw error; });
    }
    return sessionPromise;
  }
  async function post(path, body) {
    const { csrfToken } = await session();
    try { return await json('POST', path, body, csrfToken); }
    catch (error) {
      // The next explicit action may obtain a fresh session. Never replay a
      // possibly accepted migration, especially a destructive mirror.
      if (error.status === 403) sessionPromise = undefined;
      throw error;
    }
  }
  function jobPath(id) {
    if (typeof id !== 'string' || !id) throw new Error('Job ID required');
    return '/api/jobs/' + encodeURIComponent(id);
  }
  const get = id => json('GET', jobPath(id));

  function watch(id, { snapshot = () => {}, event = () => {},
    connection = () => {}, error = () => {} } = {}) {
    const stream = new Stream(jobPath(id) + '/events');
    let closed = false, cursor = -1n;
    const close = () => { closed = true; stream.close(); };
    const apply = view => {
      if (closed) return;
      snapshot(view); // Full replacement, including recentEvents.
      if (terminal(view)) close();
    };
    stream.addEventListener('snapshot', message => {
      try {
        // A restored database may legitimately move the cursor backwards.
        cursor = BigInt(message.lastEventId || '0');
        apply(JSON.parse(message.data));
      } catch (cause) { close(); error(cause); }
    });
    stream.addEventListener('migration', message => {
      if (closed) return;
      try {
        const data = JSON.parse(message.data);
        if (data.type === 'gap') return; // Server sends a replacement snapshot next.
        const sequence = BigInt(message.lastEventId);
        if (sequence <= cursor) return;
        cursor = sequence;
        event(data);
        // 'finished' means terminal, not necessarily successful. Read status.
        if (data.type === 'finished') {
          get(id).then(apply).catch(cause => { close(); error(cause); });
        }
      } catch (cause) { close(); error(cause); }
    });
    stream.addEventListener('open', () => { if (!closed) connection('connected'); });
    stream.addEventListener('error', () => {
      if (closed) return;
      connection('reconnecting');
      // Native EventSource carries Last-Event-ID on reconnect. Check ownership
      // and terminal state, but do not interpret a transport loss as job failure.
      get(id).then(view => { if (terminal(view)) apply(view); }).catch(cause => {
        if (cause.status === 404 || cause.status === 403) close();
        if (!closed || cause.status === 404 || cause.status === 403) error(cause);
      });
    });
    return close;
  }
  return {
    session,
    check: endpoint => post('/api/connections/test', endpoint),
    folders: endpoint => post('/api/connections/folders', endpoint),
    start: input => post('/api/jobs', input),
    list: () => json('GET', '/api/jobs'),
    get,
    cancel: id => post(jobPath(id) + '/cancel'),
    watch,
  };
}
