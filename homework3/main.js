import { createElement, renderToDOM } from '../mini-react.js';
import { setupEventDelegation } from '../delegation.js';
import { FlashSaleEngine } from './inventory-engine.js';
import { createAntiDriftTimer, formatRemaining } from './anti-drift-timer.js';
import { INITIAL_CUSTOMER_STATE, transitionCustomer } from './reservation-fsm.js';

const h = createElement;
const root = document.getElementById('app');
if (!root) throw new Error('Missing #app mount target');

// This in-memory engine is the authority for this *single browser tab* only.
const engine = new FlashSaleEngine({ stock: 5, ttlMs: 15000 });
const SALE_DURATION_MS = 5 * 60 * 1000;
const saleDeadline = Date.now() + SALE_DURATION_MS;
let customer = INITIAL_CUSTOMER_STATE;
let saleOver = false;
let stressResult = null;
let stressBusy = false;
let disposed = false;
let lastError = '';

const stopDelegation = setupEventDelegation(root);

function updateUI(next) { customer = next; render(); }
function transition(event) { updateUI(transitionCustomer(customer, event)); }
function stateLabel(status) {
  return ({ IDLE: 'Ready', RESERVING: 'Reserving...', RESERVED: 'Reserved',
    CHECKING_OUT: 'Checking out...', PURCHASED: 'Order placed', FAILED: 'Failed',
    EXPIRED: 'Lock expired', CANCELLED: 'Released' })[status] || status;
}
function remainingHoldMs() {
  return customer.expiresAt ? Math.max(0, customer.expiresAt - Date.now()) : 0;
}
function checkExpiration() {
  if (disposed) return;
  engine.expireLocks();
  if ((customer.status === 'RESERVED' || customer.status === 'CHECKING_OUT') &&
      Date.now() >= customer.expiresAt) {
    transition({ type: 'EXPIRE' });
    return;
  }
  const holdLabel = root.querySelector('#hold-remaining');
  if (holdLabel) holdLabel.textContent = `${formatRemaining(remainingHoldMs())} remaining`;
}

async function reserveItem() {
  if (disposed || saleOver || Date.now() >= saleDeadline ||
      !['IDLE','FAILED','EXPIRED','CANCELLED'].includes(customer.status)) return;
  transition({ type: 'BEGIN_RESERVE' });
  try {
    const result = await engine.reserve();
    if (disposed) return;
    if (customer.status !== 'RESERVING') {
      if (result.ok) engine.release(result.token);
      return;
    }
    if (Date.now() >= saleDeadline) {
      if (result.ok) engine.release(result.token);
      saleOver = true;
      transition({ type: 'RESERVE_FAIL', reason: 'Flash sale has ended.' });
    } else if (result.ok) {
      transition({ type: 'RESERVE_OK', token: result.token, expiresAt: result.expiresAt });
    } else {
      transition({ type: 'RESERVE_FAIL', reason: result.reason });
    }
  } catch (error) {
    lastError = String(error);
    if (!disposed && customer.status === 'RESERVING') {
      transition({ type: 'RESERVE_FAIL', reason: 'Reservation engine error.' });
    }
  }
}

async function checkoutItem() {
  if (disposed || customer.status !== 'RESERVED') return;
  const token = customer.token;
  if (Date.now() >= customer.expiresAt) {
    engine.expireLocks();
    transition({ type: 'EXPIRE' });
    return;
  }
  transition({ type: 'BEGIN_CHECKOUT' });
  try {
    const result = await engine.checkout(token);
    if (disposed || customer.status !== 'CHECKING_OUT') return;
    if (result.ok) transition({ type: 'CHECKOUT_OK' });
    else if (result.reason === 'LOCK_EXPIRED' || result.reason === 'LOCK_NOT_FOUND') {
      transition({ type: 'EXPIRE' });
    } else transition({ type: 'CHECKOUT_FAIL', reason: result.reason });
  } catch (error) {
    lastError = String(error);
    if (!disposed && customer.status === 'CHECKING_OUT') {
      transition({ type: 'CHECKOUT_FAIL', reason: 'Checkout simulation failed.' });
    }
  }
}
function releaseItem() {
  if (disposed || customer.status !== 'RESERVED') return;
  const token = customer.token;
  const result = engine.release(token);
  transition({ type: result.ok ? 'CANCEL' : 'EXPIRE' });
}

async function runConcurrencyDemo() {
  if (disposed || stressBusy) return;
  stressBusy = true;
  stressResult = null;
  render();
  try {
    const testEngine = new FlashSaleEngine({ stock: 5, ttlMs: 60000 });
    const attempts = 40;
    const results = await Promise.all(Array.from({ length: attempts }, () => testEngine.reserve()));
    const granted = results.filter(result => result.ok).length;
    const state = testEngine.snapshot();
    stressResult = {
      attempts, granted, rejected: attempts - granted,
      conflicts: testEngine.conflictCount, available: state.available,
      reserved: state.reserved, sold: state.sold,
      valid: state.available + state.reserved + state.sold === state.initialStock &&
        granted <= state.initialStock && state.available >= 0
    };
  } catch (error) {
    lastError = String(error);
  } finally {
    stressBusy = false;
    if (!disposed) render();
  }
}

function StatCard(label, value, hint, modifier='') {
  return h('div', { className: `metric ${modifier}` },
    h('p', { className: 'metric-name' }, label),
    h('strong', { className: 'metric-number' }, String(value)),
    h('p', { className: 'metric-hint' }, hint)
  );
}

function App() {
  const stock = engine.snapshot();
  const canReserve = !saleOver && stock.available > 0 && ['IDLE','FAILED','EXPIRED','CANCELLED'].includes(customer.status);
  const holding = customer.status === 'RESERVED';
  const busy = ['RESERVING','CHECKING_OUT'].includes(customer.status);
  const saleMs = Math.max(0, saleDeadline - Date.now());
  return h('main', { className: 'layout' },
    h('header', { className: 'topbar' },
      h('div', { className: 'brand' }, h('span', { className: 'brand-mark', 'aria-hidden': 'true' }, '◆'), 'DROP', h('span', { className: 'brand-light' }, 'LAB')),
      h('span', { className: 'course-label' }, 'UIT / LAB 02 / HOMEWORK 3'),
      h('span', { className: 'demo-badge' }, 'SIMULATED CHECKOUT')
    ),
    h('section', { className: 'hero', 'aria-labelledby': 'hero-title' },
      h('div', { className: 'hero-copy' },
        h('p', { className: 'eyebrow' }, 'HIGH-CONCURRENCY COMMERCE ENGINE'),
        h('h1', { id: 'hero-title' }, 'The Midnight', h('span', { className: 'text-gradient' }, ' Drop.')),
        h('p', { className: 'hero-subtitle' }, 'A limited-stock flash sale built with the Lab 02 Mini-React engine. Reserve fast. Checkout before your lock expires.'),
        h('div', { className: 'hero-tags' },
          h('span', null, '11.11 DEMO'), h('span', null, 'OPTIMISTIC LOCKING'), h('span', null, 'NO REAL PAYMENTS')
        )
      ),
      h('div', { className: 'countdown-panel' },
        h('p', { className: 'eyebrow' }, 'FLASH SALE ENDS IN'),
        h('div', { id: 'sale-countdown', className: 'countdown-number', role: 'timer', 'aria-label': 'Time remaining' }, formatRemaining(saleMs)),
        h('p', { id: 'sale-progress', className: 'countdown-note' }, saleOver ? 'Sale closed' : 'Real deadline, not an interval counter'),
        h('span', { className: 'countdown-trace', 'aria-hidden': 'true' })
      )
    ),
    h('section', { className: 'main-grid', 'aria-label': 'Flash sale workspace' },
      h('article', { className: 'product-card' },
        h('div', { className: 'product-illustration', role: 'img', 'aria-label': 'Stylized over-ear wireless headphones' },
          h('span', { className: 'product-ring', 'aria-hidden': 'true' }),
          h('span', { className: 'headphone-band', 'aria-hidden': 'true' }),
          h('span', { className: 'headphone-left', 'aria-hidden': 'true' }),
          h('span', { className: 'headphone-right', 'aria-hidden': 'true' }),
          h('span', { className: 'illustration-caption' }, 'DROP / 001')
        ),
        h('div', { className: 'product-copy' },
          h('span', { className: 'product-label' }, 'EXCLUSIVE RELEASE · LIMITED EDITION'),
          h('h2', null, 'Pulse One Wireless Headphones'),
          h('p', { className: 'product-description' }, 'Over-ear design, wireless freedom, immersive sound. Simulated product for concurrency demonstrations.'),
          h('div', { className: 'price-row' },
            h('strong', { className: 'sale-price' }, '₫499,000'),
            h('s', { className: 'old-price' }, '₫1,299,000'),
            h('span', { className: 'discount-badge' }, '−62%')
          ),
          h('p', { className: 'fine-print' }, 'Example prices only · No payment gateway')
        )
      ),
      h('aside', { className: 'checkout-card', 'aria-labelledby': 'reserve-title' },
        h('p', { className: 'eyebrow' }, '01 / RESERVATION STATION'),
        h('h2', { id: 'reserve-title' }, 'Secure your unit.'),
        h('div', { className: 'inventory-metrics' },
          StatCard('Available', stock.available, 'ready to reserve', 'metric-accent'),
          StatCard('Reserved', stock.reserved, 'temporary holds'),
          StatCard('Sold', stock.sold, 'completed demos')
        ),
        h('div', { className: 'stock-meter', 'aria-label': `${stock.available} out of ${stock.initialStock} units available` },
          h('span', { className: 'stock-meter-fill', style: { width: `${stock.initialStock ? stock.available / stock.initialStock * 100 : 0}%` } })
        ),
        h('p', { className: 'stock-note' }, `Total inventory: ${stock.initialStock} · Version: ${stock.version}`),
        h('div', { className: `customer-state ${customer.status === 'FAILED' || customer.status === 'EXPIRED' ? 'state-warning' : ''}`, role: 'status', 'aria-live': 'polite' },
          h('strong', null, stateLabel(customer.status)),
          h('p', null, customer.message),
          holding || customer.status === 'CHECKING_OUT'
            ? h('p', { id: 'hold-remaining', className: 'hold-remaining' }, `${formatRemaining(remainingHoldMs())} remaining`)
            : null
        ),
        h('div', { className: 'action-stack' },
          h('button', { type: 'button', className: 'btn btn-primary', onClick: reserveItem,
            disabled: canReserve ? null : true, 'data-focus-key': 'reserve' },
            busy ? 'Processing...' : saleOver ? 'Sale ended' : stock.available === 0 ? 'Out of stock' : 'Reserve 1 unit'
          ),
          h('button', { type: 'button', className: 'btn btn-secondary', onClick: checkoutItem,
            disabled: holding ? null : true, 'data-focus-key': 'checkout' }, 'Confirm demo checkout'),
          h('button', { type: 'button', className: 'btn btn-ghost', onClick: releaseItem,
            disabled: holding ? null : true, 'data-focus-key': 'release' }, 'Release my reservation')
        ),
        h('p', { className: 'checkout-tip' }, 'A reservation lasts 15 seconds. Once the deadline passes, stock returns automatically.')
      )
    ),
    h('section', { className: 'stress-card', 'aria-labelledby': 'stress-title' },
      h('div', { className: 'stress-header' },
        h('div', null, h('p', { className: 'eyebrow' }, '02 / CONCURRENCY TEST'),
          h('h2', { id: 'stress-title' }, '40 buyers. Only 5 units.'),
          h('p', { className: 'stress-description' }, 'Simulate simultaneous reserve calls using an isolated in-memory inventory. Main checkout stock will not change.')
        ),
        h('button', { type: 'button', className: 'btn btn-dark', disabled: stressBusy ? true : null,
          onClick: runConcurrencyDemo, 'data-focus-key': 'stress' },
          stressBusy ? 'Running...' : 'Run stress test →'
        )
      ),
      stressResult
        ? h('div', { className: 'stress-results', role: 'status', 'aria-live': 'polite' },
          StatCard('Requests', stressResult.attempts, 'simultaneous customers'),
          StatCard('Success', stressResult.granted, 'reservations accepted', 'metric-success'),
          StatCard('Rejected', stressResult.rejected, 'no stock available'),
          StatCard('CAS conflicts', stressResult.conflicts, 'resolved through retries'),
          h('p', { className: `stress-verdict ${stressResult.valid ? 'valid' : 'invalid'}` },
            stressResult.valid ? '✓ Inventory invariant preserved — no overselling' : '✕ Inventory invariant violation'
          )
        )
        : h('p', { className: 'stress-placeholder' }, 'Run the test to see accepted reservations, rejected requests, and optimistic-lock conflicts.')
    ),
    h('footer', { className: 'footer' },
      h('span', null, 'LAB 02 · HIGH-CONCURRENCY FLASH SALE'),
      h('span', null, 'Single-tab demonstration only · Multi-client consistency requires a server'),
      lastError ? h('span', { className: 'footer-error' }, `Diagnostic: ${lastError}`) : null
    )
  );
}

function render() {
  if (disposed) return;
  const active = document.activeElement;
  const key = active && root.contains(active) ? active.dataset.focusKey : null;
  root.replaceChildren(renderToDOM(App(), { delegateEvents: true }));
  if (key) {
    const replacement = [...root.querySelectorAll('[data-focus-key]')].find(el => el.dataset.focusKey === key);
    if (replacement && !replacement.disabled) replacement.focus({ preventScroll: true });
  }
}

render();
const stopSaleTimer = createAntiDriftTimer(SALE_DURATION_MS, (remainingMs) => {
  if (disposed) return;
  const display = root.querySelector('#sale-countdown');
  if (display) display.textContent = formatRemaining(remainingMs);
  if (remainingMs === 0 && !saleOver) {
    saleOver = true;
    render();
  }
});
const expiryHandle = setInterval(checkExpiration, 250);
function onVisibilityChange() {
  if (document.visibilityState !== 'visible') return;
  if (Date.now() >= saleDeadline && !saleOver) { saleOver = true; render(); }
  checkExpiration();
  const display = root.querySelector('#sale-countdown');
  if (display) display.textContent = formatRemaining(saleDeadline - Date.now());
}
document.addEventListener('visibilitychange', onVisibilityChange);
window.addEventListener('pagehide', dispose, { once: true });
function dispose() {
  if (disposed) return;
  disposed = true;
  stopSaleTimer();
  clearInterval(expiryHandle);
  stopDelegation();
  document.removeEventListener('visibilitychange', onVisibilityChange);
}
