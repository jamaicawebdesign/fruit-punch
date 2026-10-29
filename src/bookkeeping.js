const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'revenue', 'expense'];

const cents = (n) => Math.round(Number(n) * 100);

function unwrap({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

export function validateLines(lines) {
  if (!Array.isArray(lines) || lines.length < 2) {
    throw new Error('A journal entry needs at least two lines');
  }
  let debit = 0;
  let credit = 0;
  for (const l of lines) {
    const d = cents(l.debit ?? 0);
    const c = cents(l.credit ?? 0);
    if (!l.account_id) throw new Error('Each line needs an account_id');
    if (!Number.isFinite(d) || !Number.isFinite(c) || d < 0 || c < 0 || (d === 0) === (c === 0)) {
      throw new Error('Each line must have exactly one positive debit or credit');
    }
    debit += d;
    credit += c;
  }
  if (debit !== credit) throw new Error('Journal entry is not balanced');
}

export class Bookkeeping {
  constructor(supabase) {
    this.db = supabase;
  }

  async createAccount({ code, name, type }) {
    if (!ACCOUNT_TYPES.includes(type)) throw new Error(`Invalid account type: ${type}`);
    return unwrap(await this.db.from('accounts').insert({ code, name, type }).select().single());
  }

  async listAccounts() {
    return unwrap(await this.db.from('accounts').select('*').order('code'));
  }

  async recordEntry({ date, description, lines }) {
    validateLines(lines);
    return unwrap(
      await this.db.rpc('create_journal_entry', {
        p_date: date ?? null,
        p_description: description,
        p_lines: lines,
      })
    );
  }

  async listEntries() {
    return unwrap(
      await this.db
        .from('journal_entries')
        .select('*, journal_lines(*)')
        .order('entry_date', { ascending: false })
    );
  }

  async trialBalance() {
    const rows = unwrap(await this.db.from('trial_balance').select('*').order('code'));
    const debit = rows.reduce((s, r) => s + cents(r.debit), 0);
    const credit = rows.reduce((s, r) => s + cents(r.credit), 0);
    return { rows, totalDebit: debit / 100, totalCredit: credit / 100, balanced: debit === credit };
  }
}
