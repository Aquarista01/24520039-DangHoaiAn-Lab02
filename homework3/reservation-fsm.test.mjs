import test from 'node:test';
import assert from 'node:assert/strict';
import {INITIAL_CUSTOMER_STATE, transitionCustomer as t} from './reservation-fsm.js';

test('valid reservation followed by checkout reaches PURCHASED',()=>{
  let state=t(INITIAL_CUSTOMER_STATE,{type:'BEGIN_RESERVE'});
  state=t(state,{type:'RESERVE_OK',token:'x',expiresAt:2000});
  assert.equal(state.status,'RESERVED');
  state=t(state,{type:'BEGIN_CHECKOUT'});
  state=t(state,{type:'CHECKOUT_OK'});
  assert.equal(state.status,'PURCHASED');
});

test('rejects invalid transition e.g. checkout before lock',()=>{
  assert.throws(()=>t(INITIAL_CUSTOMER_STATE,{type:'BEGIN_CHECKOUT'}),/Invalid transition/);
});

test('failed reservation can be retried',()=>{
  let s=t(INITIAL_CUSTOMER_STATE,{type:'BEGIN_RESERVE'});
  s=t(s,{type:'RESERVE_FAIL',reason:'OUT_OF_STOCK'});
  assert.equal(t(s,{type:'BEGIN_RESERVE'}).status,'RESERVING');
});

test('expired lock cannot checkout',()=>{
  let s=t(INITIAL_CUSTOMER_STATE,{type:'BEGIN_RESERVE'});
  s=t(s,{type:'RESERVE_OK',token:'x',expiresAt:1000});
  s=t(s,{type:'EXPIRE'});
  assert.throws(()=>t(s,{type:'BEGIN_CHECKOUT'}),/Invalid transition/);
});

test('cancellation loses old token and allows new attempt',()=>{
  let s=t(INITIAL_CUSTOMER_STATE,{type:'BEGIN_RESERVE'});
  s=t(s,{type:'RESERVE_OK',token:'x',expiresAt:1000});
  s=t(s,{type:'CANCEL'});
  assert.equal(s.token,null);
  assert.equal(t(s,{type:'BEGIN_RESERVE'}).status,'RESERVING');
});
