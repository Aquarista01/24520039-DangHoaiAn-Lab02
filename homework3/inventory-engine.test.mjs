import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryInventoryStore, FlashSaleEngine } from './inventory-engine.js';

function makeEngine(stock=3, ttlMs=2000) {
  let time=1000; let nextId=0;
  const engine=new FlashSaleEngine({stock, ttlMs, now:()=>time, tokenFactory:()=>`unit-${++nextId}`});
  return { engine, advance:ms=>{time+=ms;}, now:()=>time };
}
function assertInvariant(snapshot){
  assert.equal(snapshot.available+snapshot.reserved+snapshot.sold,snapshot.initialStock);
  assert.ok(snapshot.available>=0 && snapshot.sold>=0 && snapshot.reserved>=0);
}

test('initial stock snapshot is conserved',()=>{
  const {engine}=makeEngine(5);const s=engine.snapshot();
  assert.equal(s.available,5);assert.equal(s.reserved,0);assertInvariant(s);
});

test('reserve reduces available and creates a lock',async()=>{
  const {engine}=makeEngine(2); const r=await engine.reserve();
  assert.equal(r.ok,true);assert.equal(engine.snapshot().available,1);
  assert.equal(engine.snapshot().reserved,1);assertInvariant(engine.snapshot());
});

test('out-of-stock never creates a negative inventory',async()=>{
  const {engine}=makeEngine(1);await engine.reserve();
  assert.deepEqual(await engine.reserve(),{ok:false,reason:'OUT_OF_STOCK'});
  assertInvariant(engine.snapshot());
});

test('40 simultaneous reservations for 5 units produce exactly 5 winners',async()=>{
  const {engine}=makeEngine(5);
  const results=await Promise.all(Array.from({length:40},()=>engine.reserve()));
  assert.equal(results.filter(r=>r.ok).length,5);
  assert.equal(new Set(results.filter(r=>r.ok).map(r=>r.token)).size,5);
  assertInvariant(engine.snapshot());
  assert.equal(engine.snapshot().available,0);
  assert.ok(engine.conflictCount>0);
});

test('checkout consumes a reservation, increments sold, retains invariant',async()=>{
  const {engine}=makeEngine(2);const r=await engine.reserve();
  const out=await engine.checkout(r.token);
  assert.equal(out.ok,true);assert.equal(out.alreadyCompleted,false);
  const s=engine.snapshot();assert.equal(s.sold,1);assert.equal(s.reserved,0);assertInvariant(s);
});

test('checkout idempotency cannot sell twice',async()=>{
  const {engine}=makeEngine(1);const r=await engine.reserve();
  const [a,b]=await Promise.all([engine.checkout(r.token),engine.checkout(r.token)]);
  assert.equal(a.ok,true);assert.equal(b.ok,true);
  assert.equal(engine.snapshot().sold,1);assertInvariant(engine.snapshot());
});

test('expired lock releases stock and cannot be checked out',async()=>{
  const {engine,advance}=makeEngine(1,1000);const r=await engine.reserve();advance(1001);
  const out=await engine.checkout(r.token);
  assert.deepEqual(out,{ok:false,reason:'LOCK_EXPIRED'});
  assert.equal(engine.snapshot().available,1); assertInvariant(engine.snapshot());
});

test('expiration happens exactly once even across repeated snapshots',async()=>{
  const {engine,advance}=makeEngine(1,1000);await engine.reserve();advance(1000);
  assert.equal(engine.snapshot().available,1);
  assert.equal(engine.snapshot().available,1);
  assertInvariant(engine.snapshot());
});

test('explicit release restores stock; repeated releases do not duplicate it',async()=>{
  const {engine}=makeEngine(2);const r=await engine.reserve();
  assert.deepEqual(engine.release(r.token),{ok:true});
  assert.equal(engine.release(r.token).ok,false);
  assert.equal(engine.snapshot().available,2);assertInvariant(engine.snapshot());
});

test('cancelled or nonexistent token cannot checkout',async()=>{
  const {engine}=makeEngine(1);const r=await engine.reserve();engine.release(r.token);
  assert.equal((await engine.checkout(r.token)).ok,false);
  assert.equal((await engine.checkout('wrong')).ok,false);
});

test('CAS rejects stale revisions and guards inventory conservation',()=>{
  const store=new MemoryInventoryStore(2);
  const before=store.read();
  assert.equal(store.compareAndSwap(50,before),false);
  assert.throws(()=>store.compareAndSwap(0,{...before,available:-1}),/negative/);
  assert.throws(()=>store.compareAndSwap(0,{...before,available:1}),/conservation/);
});

test('zero stock immediately rejects reservation',async()=>{
  const {engine}=makeEngine(0);
  assert.equal((await engine.reserve()).reason,'OUT_OF_STOCK');assertInvariant(engine.snapshot());
});

test('reservations use isolated unique tokens for each concurrent winner',async()=>{
  const {engine}=makeEngine(3);const xs=await Promise.all(Array.from({length:3},()=>engine.reserve()));
  assert.equal(new Set(xs.map(x=>x.token)).size,3);
});

test('invalid stock and TTL inputs are rejected',()=>{
  assert.throws(()=>new MemoryInventoryStore(-1),RangeError);
  assert.throws(()=>new FlashSaleEngine({ttlMs:0}),RangeError);
});

test('AI audit A: lock TTL must start at successful commit, not before an await',async()=>{
  let now=100; const engine=new FlashSaleEngine({stock:1,ttlMs:1000,now:()=>now,tokenFactory:()=> 'token-a'});
  const pending=engine.reserve();
  now=1200; // one async pause happened before the optimistic CAS
  const result=await pending;
  assert.equal(result.ok,true);
  assert.ok(result.expiresAt>now,'new lock must not already be expired on success');
});

test('AI audit B: unknown prototype-named lock IDs must fail cleanly',async()=>{
  const {engine}=makeEngine(2);
  assert.deepEqual(engine.release('toString'),{ok:false,reason:'LOCK_NOT_FOUND'});
  assert.deepEqual(await engine.checkout('constructor'),{ok:false,reason:'LOCK_NOT_FOUND'});
});

test('AI audit C: duplicate token factory cannot crash or corrupt inventory',async()=>{
  const engine=new FlashSaleEngine({stock:2,tokenFactory:()=> 'same-token'});
  assert.equal((await engine.reserve()).ok,true);
  const second=await engine.reserve();
  assert.equal(second.ok,false);
  assertInvariant(engine.snapshot());
});
