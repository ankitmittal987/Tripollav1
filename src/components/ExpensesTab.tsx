import { useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, Check, Copy, Plus, Trash2, UserPlus, Users } from "lucide-react";
import type { ExpenseItem, TripCurrencyConfig, TripPlan } from "../types/trip";
import {
  WORLD_CURRENCIES,
  computeExpenseSettlements,
  convertBetweenCurrencies,
  convertToHomeCurrency,
  formatMoney
} from "../data/tripBuilder";

interface ExpensesTabProps {
  trip: TripPlan;
  onChangeCurrencyConfig: (next: TripCurrencyConfig) => void;
  onChangeMembers: (members: string[]) => void;
  onAddExpense: (item: Omit<ExpenseItem, "id">) => void;
  onDeleteExpense: (id: string) => void;
  onCopy: (text: string, label: string) => void;
  onNotify: (msg: string) => void;
}

const CATEGORIES = ["Food", "Transport", "Stay", "Drinks", "Activities", "Shopping"];

export function ExpensesTab({
  trip,
  onChangeCurrencyConfig,
  onChangeMembers,
  onAddExpense,
  onDeleteExpense,
  onCopy,
  onNotify
}: ExpensesTabProps) {
  const { currency, members, expenses } = trip;
  const currencyChoices = useMemo(() => {
    const codes = [currency.local, currency.home, "USD"];
    return Array.from(new Set(codes.map((c) => c.toUpperCase()).filter(Boolean)));
  }, [currency.local, currency.home]);

  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("Food");
  const [cur, setCur] = useState<string>(currency.local || "USD");
  const [amtInput, setAmtInput] = useState("");
  const [by, setBy] = useState<number>(0);
  const [splitAmong, setSplitAmong] = useState<number[]>(() => members.map((_, idx) => idx));
  const [filterCat, setFilterCat] = useState<string>("All");
  const [convCur, setConvCur] = useState<string>(currency.local || "USD");
  const [convAmt, setConvAmt] = useState<string>("100");

  // Keep splitAmong synchronized when trip or member list changes
  useEffect(() => {
    setSplitAmong(members.map((_, idx) => idx));
    setBy(0);
  }, [trip.id, members.length]);

  const activeCur = currencyChoices.includes(cur) ? cur : currencyChoices[0] || currency.home;
  const activeConvCur = currencyChoices.includes(convCur) ? convCur : currencyChoices[0] || currency.home;
  const safeBy = by < members.length ? by : 0;

  const validSplitIndices = useMemo(() => {
    const filtered = splitAmong.filter((idx) => idx >= 0 && idx < members.length);
    return filtered.length > 0 ? filtered : members.map((_, idx) => idx);
  }, [splitAmong, members]);

  const { paidTotals, shareTotals, transfers } = useMemo(
    () => computeExpenseSettlements(members, expenses, currency),
    [members, expenses, currency]
  );

  const totalHome = paidTotals.reduce((a, b) => a + b, 0);

  const primarySettlementText =
    transfers.length === 0
      ? `All settled up in ${currency.home}`
      : transfers.length === 1
        ? `${transfers[0].from} owes ${transfers[0].to} ${formatMoney(transfers[0].amount, currency.home, 2)}`
        : `${transfers.length} transfers settle the trip (${currency.home})`;

  const parsedPreviewAmt = parseFloat(amtInput);
  const livePreviewHome =
    parsedPreviewAmt > 0
      ? convertToHomeCurrency(parsedPreviewAmt, activeCur, currency)
      : null;

  const toggleSplitMember = (idx: number) => {
    setSplitAmong((prev) => {
      if (prev.includes(idx)) {
        if (prev.length <= 1) return prev; // Keep at least 1 selected
        return prev.filter((x) => x !== idx);
      }
      return [...prev, idx].sort((a, b) => a - b);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amtInput);
    if (!(amt > 0)) {
      onNotify("Please enter a valid positive amount");
      return;
    }
    onAddExpense({
      desc: desc.trim() || "Shared Expense",
      cat,
      cur: activeCur,
      amt,
      by: safeBy,
      splitAmong: validSplitIndices
    });
    setDesc("");
    setAmtInput("");
  };

  const handleShareWhatsapp = () => {
    const settleLines =
      transfers.length === 0
        ? ["Settlement: All settled up!"]
        : transfers.map((t) => `• ${t.from} owes ${t.to} ${formatMoney(t.amount, currency.home, 2)}`);

    const summary = [
      `${trip.name} Expenses (${trip.destination})`,
      `Rates: 1 ${currency.home} = ${currency.homeToLocal} ${currency.local} | 1 USD = ${formatMoney(currency.usdToHome, currency.home, 2)}`,
      `Total Trip: ${formatMoney(totalHome, currency.home, 2)}`,
      ...members.map(
        (m, idx) =>
          `• ${m}: paid ${formatMoney(paidTotals[idx] || 0, currency.home, 0)} (share ${formatMoney(
            shareTotals[idx] || 0,
            currency.home,
            0
          )})`
      ),
      ...settleLines
    ].join("\n");
    onCopy(summary, `${currency.home} summary copied`);
  };

  const handleRenameMember = (idx: number, val: string) => {
    const next = [...members];
    next[idx] = val;
    onChangeMembers(next);
  };

  const handleAddMember = () => {
    if (members.length >= 12) return;
    onChangeMembers([...members, `Traveler ${members.length + 1}`]);
  };

  const handleRemoveMember = (idx: number) => {
    if (members.length <= 1) return;
    onChangeMembers(members.filter((_, i) => i !== idx));
  };

  const visibleExpenses =
    filterCat === "All" ? expenses : expenses.filter((item) => (item.cat || "Food") === filterCat);

  const ratioColors = ["bg-emerald-300", "bg-amber-300", "bg-sky-300", "bg-rose-300", "bg-violet-300", "bg-teal-200"];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-slate-900 dark:text-white">
          Multi-Currency Expense Splitter
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Log expenses in {currencyChoices.join(", ")} and choose exactly which travelers split each bill.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column */}
        <div className="lg:col-span-5 space-y-4">
          {/* Settlement Hero Card */}
          <section className="rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 text-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2 text-xs text-brand-100">
              <span className="font-semibold">Custom Group Split ({currency.home})</span>
              {currency.local !== currency.home && (
                <span className="font-mono font-bold tabular-nums">
                  1 {currency.home} = {currency.homeToLocal} {currency.local}
                </span>
              )}
            </div>

            <div className="font-display font-extrabold text-2xl mt-2 tracking-tight tabular-nums">
              {primarySettlementText}
            </div>

            {transfers.length > 1 && (
              <ul className="mt-2 space-y-1 text-xs text-brand-100 tabular-nums">
                {transfers.map((t, i) => (
                  <li key={`${t.from}_${t.to}_${i}`}>
                    {t.from} → {t.to}: <strong className="text-white">{formatMoney(t.amount, currency.home, 2)}</strong>
                  </li>
                ))}
              </ul>
            )}

            {/* Visual Split Ratio Bar */}
            {totalHome > 0 && (
              <div className="mt-3.5">
                <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden flex">
                  {members.map((m, idx) => {
                    const pct = ((paidTotals[idx] || 0) / totalHome) * 100;
                    if (pct <= 0) return null;
                    return (
                      <div
                        key={`${m}_${idx}`}
                        className={`h-full transition-all duration-300 ${ratioColors[idx % ratioColors.length]}`}
                        style={{ width: `${pct}%` }}
                        title={`${m}: ${Math.round(pct)}%`}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4 pt-3.5 border-t border-white/15 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-brand-200">Total Trip Spend</span>
                <span className="font-bold text-sm tabular-nums">
                  {formatMoney(Math.round(totalHome), currency.home)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {members.map((m, idx) => (
                  <div key={`${m}_${idx}`} className="bg-white/10 rounded-xl px-2.5 py-1.5 min-w-0">
                    <div className="text-brand-100 font-semibold truncate">{m}</div>
                    <div className="text-[11px] text-white/90 tabular-nums mt-0.5">
                      Paid {formatMoney(Math.round(paidTotals[idx] || 0), currency.home)} · Share{" "}
                      {formatMoney(Math.round(shareTotals[idx] || 0), currency.home)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleShareWhatsapp}
              className="mt-4 w-full min-h-[44px] py-2.5 px-4 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy {currency.home} Summary</span>
            </button>
          </section>

          {/* Log Expense Form */}
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-sand-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 space-y-3"
          >
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              Log Expense ({currencyChoices.join(", ")})
            </h3>

            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="e.g. Hotel / Dinner / Taxi"
                aria-label="Expense description"
                className="col-span-2 min-h-[44px] px-3 py-2 rounded-xl text-sm bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
              />
              <select
                value={cat}
                onChange={(e) => setCat(e.target.value)}
                aria-label="Category"
                className="min-h-[44px] px-2.5 py-2 rounded-xl text-xs font-semibold bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <select
                value={activeCur}
                onChange={(e) => setCur(e.target.value)}
                aria-label="Expense currency"
                className="min-h-[44px] px-2.5 py-2 rounded-xl text-sm font-bold bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
              >
                {currencyChoices.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                value={amtInput}
                onChange={(e) => setAmtInput(e.target.value)}
                placeholder="Amount"
                aria-label="Expense amount"
                className="col-span-2 min-h-[44px] px-3 py-2 rounded-xl text-sm font-bold tabular-nums bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
              />
            </div>

            <div>
              <label htmlFor="expensePaidBy" className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Paid by
              </label>
              <select
                id="expensePaidBy"
                value={safeBy}
                onChange={(e) => setBy(Number(e.target.value))}
                className="w-full min-h-[42px] px-3 py-2 rounded-xl text-sm font-semibold bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
              >
                {members.map((m, idx) => (
                  <option key={`${m}_${idx}`} value={idx}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Divide Among Checkboxes */}
            <div className="p-3 rounded-2xl bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Divide among which travelers?
                </span>
                <div className="flex items-center gap-2 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setSplitAmong(members.map((_, i) => i))}
                    className="text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    All ({members.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitAmong([safeBy])}
                    className="text-slate-500 dark:text-slate-400 hover:underline"
                  >
                    Only {members[safeBy] || "payer"}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {members.map((m, idx) => {
                  const included = validSplitIndices.includes(idx);
                  return (
                    <label
                      key={`${m}_${idx}`}
                      className={`min-h-[36px] px-3 py-1.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer select-none transition-colors ${
                        included
                          ? "bg-brand-600 text-white border-brand-600"
                          : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-sand-200 dark:border-slate-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={included}
                        onChange={() => toggleSplitMember(idx)}
                        className="sr-only"
                      />
                      {included && <Check className="w-3 h-3 shrink-0" />}
                      <span>{m}</span>
                    </label>
                  );
                })}
              </div>

              {livePreviewHome !== null && (
                <div className="text-[11px] font-medium text-brand-700 dark:text-brand-400 tabular-nums pt-0.5">
                  {activeCur !== currency.home ? `≈ ${formatMoney(Math.round(livePreviewHome), currency.home)} total · ` : ""}
                  Split among {validSplitIndices.length} (
                  {formatMoney(Math.round(livePreviewHome / validSplitIndices.length), currency.home)} each)
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full min-h-[44px] py-2 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-display font-bold text-sm inline-flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </button>
          </form>

          {/* Travelers & Exchange Rates */}
          <section className="rounded-3xl border border-sand-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white inline-flex items-center gap-1.5">
                <Users className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>Travelers ({members.length}) &amp; Currencies</span>
              </h3>
              {members.length < 12 && (
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 inline-flex items-center gap-1 hover:underline"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add person</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {members.map((m, idx) => (
                <div key={idx} className="relative flex items-center">
                  <input
                    type="text"
                    value={m}
                    onChange={(e) => handleRenameMember(idx, e.target.value)}
                    aria-label={`Traveler ${idx + 1} name`}
                    className="w-full min-h-[40px] px-3 py-2 pr-8 rounded-xl text-xs font-semibold bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                  {members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(idx)}
                      aria-label={`Remove ${m}`}
                      className="absolute right-1.5 text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Settlement Currency
                </label>
                <select
                  value={currency.home}
                  onChange={(e) => onChangeCurrencyConfig({ ...currency, home: e.target.value })}
                  className="w-full min-h-[38px] px-2.5 rounded-xl text-xs font-bold bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {WORLD_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} · {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Destination Currency
                </label>
                <select
                  value={currency.local}
                  onChange={(e) => onChangeCurrencyConfig({ ...currency, local: e.target.value })}
                  className="w-full min-h-[38px] px-2.5 rounded-xl text-xs font-bold bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {WORLD_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} · {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between gap-2 bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-800 rounded-xl px-3 py-2">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">1 {currency.home} =</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.01"
                    value={currency.homeToLocal}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (v > 0) onChangeCurrencyConfig({ ...currency, homeToLocal: v });
                    }}
                    aria-label={`${currency.home} to ${currency.local} rate`}
                    className="w-16 text-right font-mono font-bold text-xs tabular-nums bg-white dark:bg-slate-800 border border-sand-200 dark:border-slate-700 rounded-lg px-1.5 py-1 text-slate-900 dark:text-white"
                  />
                  <span className="text-xs font-semibold text-slate-500">{currency.local}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-800 rounded-xl px-3 py-2">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">1 USD =</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.01"
                    value={currency.usdToHome}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (v > 0) onChangeCurrencyConfig({ ...currency, usdToHome: v });
                    }}
                    aria-label={`USD to ${currency.home} rate`}
                    className="w-16 text-right font-mono font-bold text-xs tabular-nums bg-white dark:bg-slate-800 border border-sand-200 dark:border-slate-700 rounded-lg px-1.5 py-1 text-slate-900 dark:text-white"
                  />
                  <span className="text-xs font-semibold text-slate-500">{currency.home}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Offline Pocket Currency Converter */}
          <section className="rounded-3xl border border-sand-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                  Offline Pocket Converter
                </h3>
              </div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Zero internet</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <select
                value={activeConvCur}
                onChange={(e) => setConvCur(e.target.value)}
                aria-label="Converter source currency"
                className="min-h-[42px] px-2.5 py-1.5 rounded-xl text-sm font-bold bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                {currencyChoices.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                value={convAmt}
                onChange={(e) => setConvAmt(e.target.value)}
                aria-label="Amount to convert"
                className="col-span-2 min-h-[42px] px-3 py-1.5 rounded-xl text-sm font-bold tabular-nums bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center tabular-nums">
              {currencyChoices.map((targetCode) => {
                const num = parseFloat(convAmt) || 0;
                const val = convertBetweenCurrencies(num, activeConvCur, targetCode, currency);
                return (
                  <div
                    key={targetCode}
                    className="p-2.5 rounded-xl bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-800"
                  >
                    <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{targetCode}</div>
                    <div className="font-display font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                      {formatMoney(val, targetCode, targetCode === "USD" || targetCode === "EUR" ? 2 : 0)}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Column: Expense Ledger */}
        <section className="lg:col-span-7 rounded-3xl border border-sand-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                Expense History ({visibleExpenses.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                Each expense splits strictly among its selected travelers
              </p>
            </div>

            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              aria-label="Filter expense category"
              className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {visibleExpenses.length > 0 ? (
            <div className="divide-y divide-sand-200 dark:divide-slate-800">
              {visibleExpenses.map((item) => {
                const homeEq = convertToHomeCurrency(Number(item.amt) || 0, item.cur, currency);
                const payerName = members[item.by] || members[0] || "Traveler";
                const participants =
                  Array.isArray(item.splitAmong) && item.splitAmong.length > 0
                    ? item.splitAmong
                        .filter((idx) => idx >= 0 && idx < members.length)
                        .map((idx) => members[idx])
                    : members;
                const splitText =
                  participants.length === members.length
                    ? `All ${members.length}`
                    : participants.join(", ");

                return (
                  <div key={item.id} className="flex items-center justify-between gap-3 py-3.5 first:pt-1 last:pb-1">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                        {item.desc || "Shared Expense"}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>{item.cat || "Food"}</span>
                        <span aria-hidden="true" className="mx-1.5">
                          ·
                        </span>
                        <span>Paid by {payerName}</span>
                        <span aria-hidden="true" className="mx-1.5">
                          ·
                        </span>
                        <span className="text-brand-700 dark:text-brand-400 font-medium">Split: {splitText}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right tabular-nums">
                        <div className="font-display font-bold text-sm text-slate-900 dark:text-white">
                          {item.cur}{" "}
                          {Number(item.amt).toLocaleString("en-US", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2
                          })}
                        </div>
                        {item.cur !== currency.home && (
                          <div className="text-xs font-medium text-brand-700 dark:text-brand-400">
                            ≈ {formatMoney(Math.round(homeEq), currency.home)}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteExpense(item.id)}
                        aria-label={`Delete ${item.desc}`}
                        className="min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {expenses.length === 0
                  ? `No expenses logged yet. Add ${currencyChoices.join(", ")} expenses on the left — everything settles in ${currency.home}.`
                  : "No expenses match this category filter."}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
