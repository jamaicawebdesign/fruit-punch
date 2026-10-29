import test from 'node:test';
import assert from 'node:assert/strict';
import { Bookkeeping, validateLines } from '../src/bookkeeping.js';

test('rejects unbalanced entries', () => {
  assert.throws(() => validateLines([{ account_id: 'a', debit: 10 }, { account_id: 'b', credit: 9.99 }]), /balanced/);
});

test('rejects single line and mixed lines', () => {
  assert.throws(() => validateLines([{ account_id: 'a', debit: 1 }]), /two lines/);
  assert.throws(() => validateLines([{ account_id: 'a', debit: 1, credit: 1 }, { account_id: 'b', credit: 0 }]), /exactly one/);
});

test('accepts balanced entries with float amounts', () => {
  validateLines([{ account_id: 'a', debit: 0.1 }, { account_id: 'b', debit: 0.2 }, { account_id: 'c', credit: 0.3 }]);
});

test('recordEntry calls rpc', async () => {
  let call;
  const db = { rpc: async (n, a) => ((call = [n, a]), { data: 'id1', error: null }) };
  const id = await new Bookkeeping(db).recordEntry({
    description: 'Sale',
    lines: [{ account_id: 'a', debit: 5 }, { account_id: 'b', credit: 5 }],
  });
  assert.equal(id, 'id1');
  assert.equal(call[0], 'create_journal_entry');
});

test('trialBalance totals', async () => {
  const rows = [{ debit: 5, credit: 0 }, { debit: 0, credit: 5 }];
  const q = { select: () => q, order: async () => ({ data: rows, error: null }) };
  const tb = await new Bookkeeping({ from: () => q }).trialBalance();
  assert.deepEqual([tb.totalDebit, tb.balanced], [5, true]);
});
