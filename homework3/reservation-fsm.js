/** Explicit customer-side finite-state machine, separate from inventory truth. */
export const INITIAL_CUSTOMER_STATE = Object.freeze({ status: 'IDLE', token: null, message: 'Ready to reserve.' });
const allowed = {
  IDLE: ['BEGIN_RESERVE'],
  RESERVING: ['RESERVE_OK', 'RESERVE_FAIL'],
  RESERVED: ['BEGIN_CHECKOUT', 'CANCEL', 'EXPIRE'],
  CHECKING_OUT: ['CHECKOUT_OK', 'CHECKOUT_FAIL', 'EXPIRE'],
  PURCHASED: [],
  FAILED: ['BEGIN_RESERVE'],
  EXPIRED: ['BEGIN_RESERVE'],
  CANCELLED: ['BEGIN_RESERVE']
};

export function transitionCustomer(state, event) {
  if (!state || !Object.hasOwn(allowed, state.status)) throw new Error('Unknown customer state');
  if (!event || typeof event.type !== 'string' || !allowed[state.status].includes(event.type)) {
    throw new Error(`Invalid transition ${state.status} -> ${event?.type}`);
  }
  switch (event.type) {
    case 'BEGIN_RESERVE': return { status: 'RESERVING', token: null, message: 'Reserving inventory...' };
    case 'RESERVE_OK': {
      if (typeof event.token !== 'string' || !Number.isFinite(event.expiresAt)) throw new Error('Missing lock contract');
      return { status: 'RESERVED', token: event.token, expiresAt: event.expiresAt, message: 'Item held. Complete checkout before the lock expires.' };
    }
    case 'RESERVE_FAIL': return { status: 'FAILED', token: null, message: event.reason || 'Reservation failed.' };
    case 'BEGIN_CHECKOUT': return { ...state, status: 'CHECKING_OUT', message: 'Confirming checkout...' };
    case 'CHECKOUT_OK': return { status: 'PURCHASED', token: null, message: 'Demo order confirmed (no real payment).' };
    case 'CHECKOUT_FAIL': return { ...state, status: 'RESERVED', message: event.reason || 'Checkout rejected.' };
    case 'EXPIRE': return { status: 'EXPIRED', token: null, message: 'Reservation expired. Inventory was released.' };
    case 'CANCEL': return { status: 'CANCELLED', token: null, message: 'Reservation cancelled.' };
    default: throw new Error('Unsupported event');
  }
}
