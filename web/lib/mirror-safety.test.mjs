import test from 'node:test';
import assert from 'node:assert/strict';
import { bindMirrorReset } from './mirror-safety.mjs';

test('provider, security and port changes invalidate destructive consent', () => {
  const controls = Array.from({length: 3}, () => new EventTarget());
  let armed = true;
  bindMirrorReset(controls, () => { armed = false; });
  for (const control of controls) {
    armed = true;
    control.dispatchEvent(new Event('change'));
    assert.equal(armed, false);
  }
});

test('typed endpoint changes invalidate consent and cleanup detaches listeners', () => {
  const control = new EventTarget();
  let resets = 0;
  const cleanup = bindMirrorReset([control], () => { resets++; });
  control.dispatchEvent(new Event('input'));
  assert.equal(resets, 1);
  cleanup();
  control.dispatchEvent(new Event('change'));
  control.dispatchEvent(new Event('input'));
  assert.equal(resets, 1);
});
