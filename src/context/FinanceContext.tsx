import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type {
  Category,
  Subcategory,
  Transaction,
  ScheduledTransaction,
  PeriodFilter,
  FinanceSummary,
} from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DEFAULT_CATEGORIES } from '../utils/defaultCategories';
import { MOCK_TRANSACTIONS, MOCK_SCHEDULED } from '../utils/mockData';
import { useAuth } from './AuthContext';

interface FinanceContextType {
  categories: Category[];
  transactions: Transaction[];
  scheduledTransactions: ScheduledTransaction[];
  periodFilter: PeriodFilter;
  setPeriodFilter: React.Dispatch<React.SetStateAction<PeriodFilter>>;
  loading: boolean;
  isOnline: boolean;
  supabaseConnected: boolean;
  summary: FinanceSummary;
  filteredTransactions: Transaction[];
  
  // Transaction CRUD
  addTransaction: (tx: Omit<Transaction, 'id' | 'created_at'>) => Promise<void>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  // Scheduled Transaction CRUD & Processing
  addScheduledTransaction: (stx: Omit<ScheduledTransaction, 'id' | 'created_at'>) => Promise<void>;
  updateScheduledTransaction: (id: string, stx: Partial<ScheduledTransaction>) => Promise<void>;
  deleteScheduledTransaction: (id: string) => Promise<void>;
  executeScheduledTransaction: (
    stx: ScheduledTransaction,
    details?: {
      amount?: number;
      payment_method?: string;
      notes?: string;
      receipt_url?: string;
      receipt_name?: string;
      date?: string;
    }
  ) => Promise<void>;
  
  // Category CRUD
  addCategory: (cat: Omit<Category, 'id' | 'created_at'>) => Promise<void>;
  updateCategory: (id: string, cat: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Subcategory CRUD
  addSubcategory: (catId: string, name: string) => Promise<void>;
  deleteSubcategory: (subId: string) => Promise<void>;

  // Data Actions
  resetToMockData: () => void;
  resetToBlank: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const BASE_LS_PREFIX = 'finthigas_';

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  // Namespace localStorage by user so different accounts on same device don't share data
  const LOCAL_STORAGE_PREFIX = userId ? `${BASE_LS_PREFIX}${userId}_` : BASE_LS_PREFIX;

  const currentDate = new Date();
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1,
    type: 'all',
  });

  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [scheduledTransactions, setScheduledTransactions] = useState<ScheduledTransaction[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);

  // Clear state when user logs out
  useEffect(() => {
    if (!userId) {
      setCategories(DEFAULT_CATEGORIES);
      setTransactions([]);
      setScheduledTransactions([]);
      setSupabaseConnected(false);
    }
  }, [userId]);

  // Save to LocalStorage whenever state changes (as backup / offline support)
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'categories', JSON.stringify(categories));
  }, [categories, LOCAL_STORAGE_PREFIX]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'transactions', JSON.stringify(transactions));
  }, [transactions, LOCAL_STORAGE_PREFIX]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'scheduled', JSON.stringify(scheduledTransactions));
  }, [scheduledTransactions, LOCAL_STORAGE_PREFIX]);

  // Initial Fetch from Supabase
  // Fetch function to sync with Supabase
  const loadFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Don't load if user not authenticated yet
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch Categories — filtered by user_id (RLS also enforces this)
      const { data: dbCategories, error: catError } = await supabase
        .from('categories')
        .select('*, subcategories(*)');

      if (!catError) {
        setSupabaseConnected(true);
        if (dbCategories !== null) {
          setCategories(dbCategories.length > 0 ? dbCategories : DEFAULT_CATEGORIES);
        }
      }

      // Fetch Transactions
      const { data: dbTransactions, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (!txError && dbTransactions !== null) {
        setTransactions(dbTransactions);
      }

      // Fetch Scheduled
      const { data: dbScheduled, error: schError } = await supabase
        .from('scheduled_transactions')
        .select('*')
        .order('due_date', { ascending: true });

      if (!schError && dbScheduled !== null) {
        setScheduledTransactions(dbScheduled);
      }
    } catch (err) {
      console.warn('Supabase connection error, fallback to LocalStorage:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial Fetch when user logs in + Auto-sync on window focus
  useEffect(() => {
    if (userId) {
      loadFromSupabase();
    }

    const handleFocus = () => { if (userId) loadFromSupabase(); };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && userId) loadFromSupabase();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadFromSupabase, userId]);

  // Realtime subscriptions for cross-device sync
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const txChannel = supabase
      .channel('realtime:transactions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTransactions((prev) => {
              // Avoid duplicates (our own optimistic insert)
              if (prev.find((t) => t.id === payload.new.id)) {
                return prev.map((t) => t.id === payload.new.id ? { ...t, ...payload.new } as Transaction : t);
              }
              return [payload.new as Transaction, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            setTransactions((prev) =>
              prev.map((t) => t.id === payload.new.id ? { ...t, ...payload.new } as Transaction : t)
            );
          } else if (payload.eventType === 'DELETE') {
            setTransactions((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const schChannel = supabase
      .channel('realtime:scheduled_transactions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scheduled_transactions' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setScheduledTransactions((prev) => {
              if (prev.find((s) => s.id === payload.new.id)) {
                return prev.map((s) => s.id === payload.new.id ? { ...s, ...payload.new } as ScheduledTransaction : s);
              }
              return [...prev, payload.new as ScheduledTransaction];
            });
          } else if (payload.eventType === 'UPDATE') {
            setScheduledTransactions((prev) =>
              prev.map((s) => s.id === payload.new.id ? { ...s, ...payload.new } as ScheduledTransaction : s)
            );
          } else if (payload.eventType === 'DELETE') {
            setScheduledTransactions((prev) => prev.filter((s) => s.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(txChannel);
      supabase.removeChannel(schChannel);
    };
  }, []);

  // Filtered transactions based on periodFilter
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (!tx.date) return true;
      const [y, m] = tx.date.split('-').map(Number);
      
      const matchYear = periodFilter.year ? y === periodFilter.year : true;
      const matchMonth = periodFilter.month ? m === periodFilter.month : true;
      const matchType = periodFilter.type && periodFilter.type !== 'all' ? tx.type === periodFilter.type : true;
      const matchCategory = periodFilter.categoryId ? tx.category_id === periodFilter.categoryId : true;

      return matchYear && matchMonth && matchType && matchCategory;
    });
  }, [transactions, periodFilter]);

  // Summary Metrics
  const summary = useMemo<FinanceSummary>(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    filteredTransactions.forEach((tx) => {
      const val = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        totalIncome += val;
      } else {
        totalExpense += val;
      }
    });

    const balance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    let pendingScheduledExpenses = 0;
    let pendingScheduledIncome = 0;

    scheduledTransactions.forEach((stx) => {
      if (stx.is_active) {
        const val = Number(stx.amount) || 0;
        if (stx.type === 'expense') pendingScheduledExpenses += val;
        if (stx.type === 'income') pendingScheduledIncome += val;
      }
    });

    return {
      totalIncome,
      totalExpense,
      balance,
      savingsRate: Math.max(0, Math.round(savingsRate * 10) / 10),
      pendingScheduledExpenses,
      pendingScheduledIncome,
    };
  }, [filteredTransactions, scheduledTransactions]);

  // --- CRUD TRANSACTIONS ---
  const addTransaction = useCallback(async (txData: Omit<Transaction, 'id' | 'created_at'>) => {
    if (isSupabaseConfigured && userId) {
      try {
        const { data, error } = await supabase.from('transactions').insert([
          {
            user_id: userId,
            description: txData.description,
            amount: txData.amount,
            type: txData.type,
            date: txData.date,
            category_id: txData.category_id || null,
            subcategory_id: txData.subcategory_id || null,
            payment_method: txData.payment_method || 'Pix',
            is_paid: txData.is_paid,
            notes: txData.notes || null,
            receipt_url: txData.receipt_url || null,
            receipt_name: txData.receipt_name || null,
          },
        ]).select().single();

        if (error) {
          console.error('Supabase transaction insert failed:', error.message);
          const newTx: Transaction = { ...txData, id: 'tx-' + Date.now(), created_at: new Date().toISOString() };
          setTransactions((prev) => [newTx, ...prev]);
        } else if (data) {
          setSupabaseConnected(true);
          setTransactions((prev) => [data as Transaction, ...prev.filter((t) => t.id !== data.id)]);
        }
      } catch (err) {
        console.error('Supabase insert failed:', err);
        const newTx: Transaction = { ...txData, id: 'tx-' + Date.now(), created_at: new Date().toISOString() };
        setTransactions((prev) => [newTx, ...prev]);
      }
    } else {
      const newTx: Transaction = { ...txData, id: 'tx-' + Date.now(), created_at: new Date().toISOString() };
      setTransactions((prev) => [newTx, ...prev]);
    }
  }, []);

  const updateTransaction = useCallback(async (id: string, updatedData: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, ...updatedData } : tx))
    );

    if (supabaseConnected) {
      try {
        await supabase.from('transactions').update(updatedData).eq('id', id);
      } catch (err) {
        console.error('Supabase update failed:', err);
      }
    }
  }, [supabaseConnected]);

  const deleteTransaction = useCallback(async (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));

    if (supabaseConnected) {
      try {
        await supabase.from('transactions').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase delete failed:', err);
      }
    }
  }, [supabaseConnected]);

  // --- CRUD SCHEDULED TRANSACTIONS ---
  const addScheduledTransaction = useCallback(async (stxData: Omit<ScheduledTransaction, 'id' | 'created_at'>) => {
    if (supabaseConnected && userId) {
      try {
        const { data, error } = await supabase.from('scheduled_transactions').insert([
          {
            user_id: userId,
            description: stxData.description,
            amount: stxData.amount,
            type: stxData.type,
            frequency: stxData.frequency,
            due_date: stxData.due_date,
            category_id: stxData.category_id || null,
            subcategory_id: stxData.subcategory_id || null,
            is_active: stxData.is_active,
          },
        ]).select().single();

        if (error) {
          console.error('Supabase scheduled insert error:', error);
          const newStx: ScheduledTransaction = { ...stxData, id: 'sch-' + Date.now(), created_at: new Date().toISOString() };
          setScheduledTransactions((prev) => [...prev, newStx]);
        } else if (data) {
          setScheduledTransactions((prev) => {
            if (prev.find((s) => s.id === data.id)) return prev;
            return [...prev, data as ScheduledTransaction];
          });
        }
      } catch (err) {
        console.error('Supabase scheduled insert failed:', err);
        const newStx: ScheduledTransaction = { ...stxData, id: 'sch-' + Date.now(), created_at: new Date().toISOString() };
        setScheduledTransactions((prev) => [...prev, newStx]);
      }
    } else {
      const newStx: ScheduledTransaction = { ...stxData, id: 'sch-' + Date.now(), created_at: new Date().toISOString() };
      setScheduledTransactions((prev) => [...prev, newStx]);
    }
  }, [supabaseConnected, userId]);

  const updateScheduledTransaction = useCallback(async (id: string, stxData: Partial<ScheduledTransaction>) => {
    setScheduledTransactions((prev) =>
      prev.map((stx) => (stx.id === id ? { ...stx, ...stxData } : stx))
    );

    if (supabaseConnected) {
      try {
        await supabase.from('scheduled_transactions').update(stxData).eq('id', id);
      } catch (err) {
        console.error('Supabase scheduled update failed:', err);
      }
    }
  }, [supabaseConnected]);

  const deleteScheduledTransaction = useCallback(async (id: string) => {
    setScheduledTransactions((prev) => prev.filter((stx) => stx.id !== id));

    if (supabaseConnected) {
      try {
        await supabase.from('scheduled_transactions').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase scheduled delete failed:', err);
      }
    }
  }, [supabaseConnected]);

  const executeScheduledTransaction = useCallback(async (
    stx: ScheduledTransaction,
    details?: {
      amount?: number;
      payment_method?: string;
      notes?: string;
      receipt_url?: string;
      receipt_name?: string;
      date?: string;
    }
  ) => {
    const finalAmount = details?.amount !== undefined ? details.amount : Number(stx.amount);

    // 1. Create real transaction (marked as paid)
    await addTransaction({
      description: stx.description,
      amount: finalAmount,
      type: stx.type,
      date: details?.date || new Date().toISOString().split('T')[0],
      category_id: stx.category_id,
      subcategory_id: stx.subcategory_id,
      payment_method: details?.payment_method || 'Pix',
      is_paid: true,
      notes: details?.notes || `Efetivado de agendamento (${stx.frequency})`,
      receipt_url: details?.receipt_url,
      receipt_name: details?.receipt_name,
    });

    // 2. For 'once': DELETE the scheduled item so it disappears from Programados
    //    For recurring: advance due_date by the appropriate period so it stays visible with next date
    if (stx.frequency === 'once') {
      await deleteScheduledTransaction(stx.id);
    } else if (stx.frequency === 'monthly') {
      const d = new Date(stx.due_date);
      d.setMonth(d.getMonth() + 1);
      const nextDueDate = d.toISOString().split('T')[0];
      await updateScheduledTransaction(stx.id, { due_date: nextDueDate });
    } else if (stx.frequency === 'weekly') {
      const d = new Date(stx.due_date);
      d.setDate(d.getDate() + 7);
      const nextDueDate = d.toISOString().split('T')[0];
      await updateScheduledTransaction(stx.id, { due_date: nextDueDate });
    } else if (stx.frequency === 'yearly') {
      const d = new Date(stx.due_date);
      d.setFullYear(d.getFullYear() + 1);
      const nextDueDate = d.toISOString().split('T')[0];
      await updateScheduledTransaction(stx.id, { due_date: nextDueDate });
    }
  }, [addTransaction, deleteScheduledTransaction, updateScheduledTransaction]);

  // --- CRUD CATEGORIES ---
  const addCategory = useCallback(async (catData: Omit<Category, 'id' | 'created_at'>) => {
    if (supabaseConnected && userId) {
      try {
        const { data, error } = await supabase.from('categories').insert([
          {
            user_id: userId,
            name: catData.name,
            type: catData.type,
            color: catData.color,
            icon: catData.icon,
            max_budget: catData.max_budget || 0,
          },
        ]).select().single();

        if (error) {
          console.error('Supabase category insert error:', error);
          const newCat: Category = { ...catData, id: 'cat-' + Date.now(), subcategories: [] };
          setCategories((prev) => [...prev, newCat]);
        } else if (data) {
          setCategories((prev) => [...prev, { ...data, subcategories: [] } as Category]);
        }
      } catch (err) {
        console.error('Supabase category insert failed:', err);
        const newCat: Category = { ...catData, id: 'cat-' + Date.now(), subcategories: [] };
        setCategories((prev) => [...prev, newCat]);
      }
    } else {
      const newCat: Category = { ...catData, id: 'cat-' + Date.now(), subcategories: [] };
      setCategories((prev) => [...prev, newCat]);
    }
  }, [supabaseConnected, userId]);

  const updateCategory = useCallback(async (id: string, catData: Partial<Category>) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...catData } : c))
    );

    if (supabaseConnected) {
      try {
        await supabase.from('categories').update(catData).eq('id', id);
      } catch (err) {
        console.error('Supabase category update failed:', err);
      }
    }
  }, [supabaseConnected]);

  const deleteCategory = useCallback(async (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));

    if (supabaseConnected) {
      try {
        await supabase.from('categories').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase category delete failed:', err);
      }
    }
  }, [supabaseConnected]);

  // --- CRUD SUBCATEGORIES ---
  const addSubcategory = useCallback(async (categoryId: string, name: string) => {
    if (supabaseConnected && userId) {
      try {
        const { data, error } = await supabase.from('subcategories').insert([
          { user_id: userId, category_id: categoryId, name },
        ]).select().single();

        if (error) {
          console.error('Supabase subcategory insert error:', error);
          const subId = 'sub-' + Date.now();
          const newSub: Subcategory = { id: subId, category_id: categoryId, name };
          setCategories((prev) =>
            prev.map((cat) => {
              if (cat.id === categoryId) {
                return { ...cat, subcategories: [...(cat.subcategories || []), newSub] };
              }
              return cat;
            })
          );
        } else if (data) {
          const newSub = data as Subcategory;
          setCategories((prev) =>
            prev.map((cat) => {
              if (cat.id === categoryId) {
                return { ...cat, subcategories: [...(cat.subcategories || []), newSub] };
              }
              return cat;
            })
          );
        }
      } catch (err) {
        console.error('Supabase subcategory insert failed:', err);
      }
    } else {
      const subId = 'sub-' + Date.now();
      const newSub: Subcategory = { id: subId, category_id: categoryId, name };
      setCategories((prev) =>
        prev.map((cat) => {
          if (cat.id === categoryId) {
            return { ...cat, subcategories: [...(cat.subcategories || []), newSub] };
          }
          return cat;
        })
      );
    }
  }, [supabaseConnected]);

  const deleteSubcategory = useCallback(async (subId: string) => {
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        subcategories: (cat.subcategories || []).filter((sub) => sub.id !== subId),
      }))
    );

    if (supabaseConnected) {
      try {
        await supabase.from('subcategories').delete().eq('id', subId);
      } catch (err) {
        console.error('Supabase subcategory delete failed:', err);
      }
    }
  }, [supabaseConnected]);

  const resetToMockData = () => {
    setCategories(DEFAULT_CATEGORIES);
    setTransactions(MOCK_TRANSACTIONS);
    setScheduledTransactions(MOCK_SCHEDULED);
    localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'categories');
    localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'transactions');
    localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'scheduled');
  };

  const resetToBlank = () => {
    setCategories([]);
    setTransactions([]);
    setScheduledTransactions([]);
    localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'categories');
    localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'transactions');
    localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'scheduled');
  };

  return (
    <FinanceContext.Provider
      value={{
        categories,
        transactions,
        scheduledTransactions,
        periodFilter,
        setPeriodFilter,
        loading,
        isOnline: navigator.onLine,
        supabaseConnected,
        summary,
        filteredTransactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addScheduledTransaction,
        updateScheduledTransaction,
        deleteScheduledTransaction,
        executeScheduledTransaction,
        addCategory,
        updateCategory,
        deleteCategory,
        addSubcategory,
        deleteSubcategory,
        resetToMockData,
        resetToBlank,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance deve ser usado dentro de um FinanceProvider');
  }
  return context;
};
