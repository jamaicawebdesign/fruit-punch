# fruit-punch
A double-entry bookkeeping system backed by [Supabase](https://supabase.com).

## Setup
1. Apply `supabase/migrations/20260101000000_bookkeeping.sql` (`supabase db push` or the SQL editor).
2. Copy `.env.example` to `.env` and fill in your project URL and anon key.
3. `npm install && npm test`

## Usage
```js
import { createBookkeeping } from './src/index.js'; // after signing in a user
const books = createBookkeeping();
const cash = await books.createAccount({ code: '1000', name: 'Cash', type: 'asset' });
const sales = await books.createAccount({ code: '4000', name: 'Sales', type: 'revenue' });
await books.recordEntry({ description: 'Sale', lines: [
  { account_id: cash.id, debit: 25 }, { account_id: sales.id, credit: 25 } ] });
console.log(await books.trialBalance());
```
Row-level security restricts all data to the authenticated user.
