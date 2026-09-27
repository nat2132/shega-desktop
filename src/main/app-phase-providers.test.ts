import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Guards a regression where the onboarding "Pay Now" phase rendered
 * <SubscriptionPayment> (a useSubscription() consumer) without a
 * SubscriptionProvider above it, so the phase crashed at runtime with
 * "useSubscription must be used within SubscriptionProvider".
 *
 * There is no DOM test environment in this project (vitest runs in `node` and
 * no testing-library is installed), so this asserts the structural invariant
 * directly on the source: any phase branch that mounts a subscription context
 * consumer must also mount the provider.
 */

const appSource = readFileSync(join(__dirname, '..', 'renderer', 'src', 'App.tsx'), 'utf8');

/** Return the body of `if (phase === '<name>') { ... }` up to its closing brace. */
function phaseBlock(phase: string): string {
  const start = appSource.indexOf(`phase === '${phase}'`);
  expect(start, `phase branch '${phase}' not found in App.tsx`).toBeGreaterThan(-1);
  const open = appSource.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < appSource.length; i++) {
    if (appSource[i] === '{') depth++;
    else if (appSource[i] === '}') {
      depth--;
      if (depth === 0) return appSource.slice(open, i + 1);
    }
  }
  throw new Error(`unbalanced braces in phase branch '${phase}'`);
}

describe('App phase provider wiring', () => {
  it('the onboarding Pay Now phase mounts SubscriptionProvider', () => {
    const block = phaseBlock('subscription-payment');
    expect(block).toContain('<SubscriptionPayment');
    expect(block).toContain('<SubscriptionProvider>');
  });

  it('the ready phase (the full app) mounts SubscriptionProvider', () => {
    // The ready phase is the fall-through return rather than a phase branch.
    const ready = appSource.slice(appSource.indexOf('// Phase: Ready'));
    expect(ready).toContain('<SubscriptionProvider>');
  });

  it('every phase that mounts a subscription consumer is provider-wrapped', () => {
    // Components that call useSubscription() must never be mounted bare.
    const consumers = ['<SubscriptionPayment', '<SubscriptionDashboard'];
    for (const phase of ['subscription-payment', 'subscription-welcome']) {
      const block = phaseBlock(phase);
      for (const consumer of consumers) {
        if (block.includes(consumer)) {
          expect(block, `${phase} mounts ${consumer} without SubscriptionProvider`).toContain(
            '<SubscriptionProvider>',
          );
        }
      }
    }
  });

  it('the router path for the payment page lives inside the provider-wrapped ready tree', () => {
    // /subscription/payment is also a normal route, so it must stay in the
    // ready tree rather than being reachable from a bare phase.
    const ready = appSource.slice(appSource.indexOf('// Phase: Ready'));
    expect(ready).toContain('path="/subscription/payment"');
    const providerAt = appSource.indexOf('<SubscriptionProvider>');
    const routeAt = appSource.indexOf('path="/subscription/payment"');
    expect(providerAt).toBeLessThan(routeAt);
  });
});
