import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
  executeScheduledTransaction: (stx: ScheduledTransaction) => Promise<void>;
  
  // Category CRUD
  addCategory: (cat: Omit<Category, 'id' | 'created_at'>) => Promise<void>;
  updateCategory: (id: string, cat: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Subcategory CRUD
  addSubcategory: (catId: string, name: string) => Promise<void>;
  deleteSubcategory: (subId: string) => Promise<void>;

  // Data Actions
  resetToMockData: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const LOCAL_STORAGE_PREFIX = 'finthigas_';

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentDate = new Date();
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1,
    type: 'all',
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'transactions');
    return saved ? JSON.parse(saved) : MOCK_TRANSACTIONS;
  });

  const [scheduledTransactions, setScheduledTransactions] = useState<ScheduledTransaction[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'scheduled');
    return saved ? JSON.parse(saved) : MOCK_SCHEDULED;
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);

  // Save to LocalStorage whenever state changes (as backup / offline support)
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'scheduled', JSON.stringify(scheduledTransactions));
  }, [scheduledTransactions]);

  // Initial Fetch from Supabase
  useEffect(() => {
    async function loadFromSupabase() {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch Categories
        const { data: dbCategories, error: catError } = await supabase
          .from('categories')
          .select('*, subcategories(*)');

        if (!catError && dbCategories && dbCategories.length > 0) {
          setCategories(dbCategories);
          setSupabaseConnected(true);
        }

        // Fetch Transactions
        const { data: dbTransactions, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false });

        if (!txError && dbTransactions) {
          setTransactions(dbTransactions);
          setSupabaseConnected(true);
        }

        // Fetch Scheduled
        const { data: dbScheduled, error: schError } = await supabase
          .from('scheduled_transactions')
          .select('*')
          .order('due_date', { ascending: true });

        if (!schError && dbScheduled) {
          setScheduledTransactions(dbScheduled);
          setSupabaseConnected(true);
        }
      } catch (err) {
        console.warn('Supabase connection error, fallback to LocalStorage:', err);
      } finally {
        setLoading(false);
      }
    }

    loadFromSupabase();
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
  const addTransaction = async (txData: Omit<Transaction, 'id' | 'created_at'>) => {
    const newId = 'tx-' + Date.now();
    const newTx: Transaction = {
      ...txData,
      id: newId,
      created_at: new Date().toISOString(),
    };

    setTransactions((prev) => [newTx, ...prev]);

    if (supabaseConnected) {
      try {
        const { error } = await supabase.from('transactions').insert([
          {
            description: txData.description,
            amount: txData.amount,
            type: txData.type,
            date: txData.date,
            category_id: txData.category_id || null,
            subcategory_id: txData.subcategory_id || null,
            payment_method: txData.payment_method || 'Pix',
            is_paid: txData.is_paid,
            notes: txData.notes || null,
          },
        ]);
        if (error) console.error('Supabase transaction insert error:', error);
      } catch (err) {
        console.error('Supabase insert failed:', err);
      }
    }
  };

  const updateTransaction = async (id: string, updatedData: Partial<Transaction>) => {
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
  };

  const deleteTransaction = async (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));

    if (supabaseConnected) {
      try {
        await supabase.from('transactions').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase delete failed:', err);
      }
    }
  };

  // --- CRUD SCHEDULED TRANSACTIONS ---
  const addScheduledTransaction = async (stxData: Omit<ScheduledTransaction, 'id' | 'created_at'>) => {
    const newId = 'sch-' + Date.now();
    const newStx: ScheduledTransaction = {
      ...stxData,
      id: newId,
      created_at: new Date().toISOString(),
    };

    setScheduledTransactions((prev) => [...prev, newStx]);

    if (supabaseConnected) {
      try {
        await supabase.from('scheduled_transactions').insert([
          {
            description: stxData.description,
            amount: stxData.amount,
            type: stxData.type,
            frequency: stxData.frequency,
            due_date: stxData.due_date,
            category_id: stxData.category_id || null,
            subcategory_id: stxData.subcategory_id || null,
            is_active: stxData.is_active,
          },
        ]);
      } catch (err) {
        console.error('Supabase scheduled insert failed:', err);
      }
    }
  };

  const updateScheduledTransaction = async (id: string, stxData: Partial<ScheduledTransaction>) => {
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
  };

  const deleteScheduledTransaction = async (id: string) => {
    setScheduledTransactions((prev) => prev.filter((stx) => stx.id !== id));

    if (supabaseConnected) {
      try {
        await supabase.from('scheduled_transactions').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase scheduled delete failed:', err);
      }
    }
  };

  const executeScheduledTransaction = async (stx: ScheduledTransaction) => {
    // 1. Create real transaction
    await addTransaction({
      description: stx.description,
      amount: stx.amount,
      type: stx.type,
      date: new Date().toISOString().split('T')[0],
      category_id: stx.category_id,
      subcategory_id: stx.subcategory_id,
      payment_method: 'Pix',
      is_paid: true,
      notes: `Efetivado de agendamento (${stx.frequency})`,
    });

    // 2. If 'once', mark inactive/delete; if recurring, advance due_date by 1 month
    if (stx.frequency === 'once') {
      await updateScheduledTransaction(stx.id, { is_active: false });
    } else if (stx.frequency === 'monthly') {
      const d = new Date(stx.due_date);
      d.setMonth(d.getMonth() + 1);
      const nextDueDate = d.toISOString().split('T')[0];
      await updateScheduledTransaction(stx.id, { due_date: nextDueDate });
    }
  };

  // --- CRUD CATEGORIES ---
  const addCategory = async (catData: Omit<Category, 'id' | 'created_at'>) => {
    const newId = 'cat-' + Date.now();
    const newCat: Category = {
      ...catData,
      id: newId,
      subcategories: [],
    };

    setCategories((prev) => [...prev, newCat]);

    if (supabaseConnected) {
      try {
        await supabase.from('categories').insert([
          {
            name: catData.name,
            type: catData.type,
            color: catData.color,
            icon: catData.icon,
            max_budget: catData.max_budget || 0,
          },
        ]);
      } catch (err) {
        console.error('Supabase category insert failed:', err);
      }
    }
  };

  const updateCategory = async (id: string, catData: Partial<Category>) => {
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
  };

  const deleteCategory = async (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));

    if (supabaseConnected) {
      try {
        await supabase.from('categories').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase category delete failed:', err);
      }
    }
  };

  // --- CRUD SUBCATEGORIES ---
  const addSubcategory = async (categoryId: string, name: string) => {
    const subId = 'sub-' + Date.now();
    const newSub: Subcategory = {
      id: subId,
      category_id: categoryId,
      name,
    };

    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            subcategories: [...(cat.subcategories || []), newSub],
          };
        }
        return cat;
      })
    );

    if (supabaseConnected) {
      try {
        await supabase.from('subcategories').insert([
          {
            category_id: categoryId,
            name,
          },
        ]);
      } catch (err) {
        console.error('Supabase subcategory insert failed:', err);
      }
    }
  };

  const deleteSubcategory = async (subId: string) => {
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
  };

  const resetToMockData = () => {
    setCategories(DEFAULT_CATEGORIES);
    setTransactions(MOCK_TRANSACTIONS);
    setScheduledTransactions(MOCK_SCHEDULED);
    localStorage.clear();
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
