import { createClient } from '@supabase/supabase-js';
import { Bookkeeping } from './bookkeeping.js';

export { Bookkeeping, validateLines } from './bookkeeping.js';

export function createBookkeeping(
  url = process.env.SUPABASE_URL,
  key = process.env.SUPABASE_ANON_KEY
) {
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required');
  return new Bookkeeping(createClient(url, key));
}
