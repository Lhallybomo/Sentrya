import { useState, useEffect } from "react";
import { Wallet, Plus, Trash2, ShieldCheck, Wifi, FileText, Car, Plane, Hotel, HeartPulse, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "insurance", label: "Travel Insurance", icon: ShieldCheck, color: "bg-blue-500/10 text-blue-600" },
  { id: "roaming", label: "Roaming / Data", icon: Wifi, color: "bg-purple-500/10 text-purple-600" },
  { id: "transport", label: "Transport", icon: Car, color: "bg-green-500/10 text-green-600" },
  { id: "flights", label: "Flights", icon: Plane, color: "bg-sky-500/10 text-sky-600" },
  { id: "hotel", label: "Accommodation", icon: Hotel, color: "bg-orange-500/10 text-orange-600" },
  { id: "health", label: "Health / Meds", icon: HeartPulse, color: "bg-red-500/10 text-red-600" },
  { id: "visa", label: "Visa / Docs", icon: FileText, color: "bg-yellow-500/10 text-yellow-700" },
  { id: "other", label: "Other", icon: MoreHorizontal, color: "bg-muted text-muted-foreground" },
];

const STORAGE_KEY = "sentrya_travel_budget";

function loadExpenses() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

function saveExpenses(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export default function TravelBudgetTracker() {
  const [expenses, setExpenses] = useState(loadExpenses);
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("insurance");
  const [filterCat, setFilterCat] = useState("all");

  useEffect(() => { saveExpenses(expenses); }, [expenses]);

  function addExpense() {
    if (!description.trim() || !amount || isNaN(parseFloat(amount))) return;
    const item = {
      id: Date.now().toString(),
      description: description.trim(),
      amount: parseFloat(amount),
      category,
      date: new Date().toISOString(),
    };
    setExpenses(prev => [item, ...prev]);
    setDescription("");
    setAmount("");
    setCategory("insurance");
    setShowForm(false);
  }

  function removeExpense(id) {
    setExpenses(prev => prev.filter(e => e.id !== id));
  }

  const filtered = filterCat === "all" ? expenses : expenses.filter(e => e.category === filterCat);
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const filteredTotal = filtered.reduce((s, e) => s + e.amount, 0);

  // Spending by category for summary
  const byCategory = CATEGORIES.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.id).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.total > 0);

  const getCatConfig = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold">Trip Budget Summary</span>
        </div>
        <p className="text-3xl font-black text-primary mb-1">₦{total.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">{expenses.length} expense{expenses.length !== 1 ? "s" : ""} logged</p>

        {byCategory.length > 0 && (
          <div className="mt-3 space-y-2">
            {byCategory.map(cat => {
              const Icon = cat.icon;
              const pct = total > 0 ? (cat.total / total) * 100 : 0;
              return (
                <div key={cat.id}>
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Icon className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{cat.label}</span>
                    </div>
                    <span className="text-xs font-semibold">₦{cat.total.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1">
                    <div className="h-1 rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add expense button */}
      <Button onClick={() => setShowForm(v => !v)} className="w-full rounded-xl gap-2" variant={showForm ? "outline" : "default"}>
        <Plus className={cn("w-4 h-4 transition-transform", showForm && "rotate-45")} />
        {showForm ? "Cancel" : "Log New Expense"}
      </Button>

      {/* Add expense form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <p className="text-sm font-semibold">New Expense</p>

            {/* Category selector */}
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                return (
                  <button key={cat.id} onClick={() => setCategory(cat.id)}
                    className={cn("flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all",
                      category === cat.id ? "border-primary bg-primary/5" : "border-border bg-muted/30"
                    )}>
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", cat.color)}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[9px] font-medium leading-tight">{cat.label.split("/")[0].trim()}</span>
                  </button>
                );
              })}
            </div>

            <Input placeholder="Description (e.g. Airtel roaming plan)" value={description}
              onChange={e => setDescription(e.target.value)} className="rounded-xl" />

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">₦</span>
              <Input type="number" placeholder="Amount" value={amount}
                onChange={e => setAmount(e.target.value)} className="rounded-xl pl-8"
                onKeyDown={e => e.key === "Enter" && addExpense()} />
            </div>

            <Button onClick={addExpense} disabled={!description.trim() || !amount} className="w-full rounded-xl gap-2">
              <Plus className="w-4 h-4" /> Add Expense
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter chips */}
      {expenses.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button onClick={() => setFilterCat("all")}
            className={cn("shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
              filterCat === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
            All ({expenses.length})
          </button>
          {byCategory.map(cat => (
            <button key={cat.id} onClick={() => setFilterCat(cat.id)}
              className={cn("shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                filterCat === cat.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
              {cat.label.split("/")[0].trim()}
            </button>
          ))}
        </div>
      )}

      {/* Expense list */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Wallet className="w-10 h-10 mx-auto mb-2 opacity-20" />
          <p className="text-sm">No expenses logged yet</p>
          <p className="text-xs mt-1">Track insurance, data plans, transport & more</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filterCat !== "all" && (
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-muted-foreground">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</span>
              <span className="text-xs font-bold">Subtotal: ₦{filteredTotal.toLocaleString()}</span>
            </div>
          )}
          <AnimatePresence>
            {filtered.map((expense) => {
              const cat = getCatConfig(expense.category);
              const Icon = cat.icon;
              return (
                <motion.div key={expense.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", cat.color)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{expense.description}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {cat.label} · {new Date(expense.date).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-primary">₦{expense.amount.toLocaleString()}</span>
                    <button onClick={() => removeExpense(expense.id)}
                      className="w-7 h-7 rounded-lg bg-danger/10 flex items-center justify-center text-danger hover:bg-danger/20 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}