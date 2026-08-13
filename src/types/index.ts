export type TransactionType = 'income' | 'expense';

export type FrequencyType = 'weekly' | 'monthly' | 'yearly' | 'once';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  max_budget?: number;
  created_at?: string;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  created_at?: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  date: string;
  category_id?: string;
  subcategory_id?: string;
  payment_method?: string;
  is_paid: boolean;
  notes?: string;
  receipt_url?: string;
  receipt_name?: string;
  created_at?: string;
  category?: Category;
  subcategory?: Subcategory;
}

export interface ScheduledTransaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  frequency: FrequencyType;
  due_date: string;
  category_id?: string;
  subcategory_id?: string;
  is_active: boolean;
  created_at?: string;
  category?: Category;
  subcategory?: Subcategory;
}

export interface PeriodFilter {
  year: number;
  month: number; // 1-12 or 0 for all
  type?: 'all' | 'income' | 'expense';
  categoryId?: string;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  savingsRate: number;
  pendingScheduledExpenses: number;
  pendingScheduledIncome: number;
}
