export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: number
  type: TransactionType
  amount: number
  category: string
  subCategory?: string
  note: string
  date: string
}

export interface CategoryItem {
  id: number
  name: string
  type: TransactionType
  color?: string
  icon?: string
}

export interface BudgetItem {
  id: number
  category: string
  amount: number
  month: string
}

export interface AssetAdjustment {
  id: number
  date: string
  type: 'appreciation' | 'depreciation'
  amount: number
  note: string
}

export interface AssetItem {
  id: number
  name: string
  amount: number
  type: 'cash' | 'bank' | 'investment'
  date: string
  initialAmount?: number
  adjustments?: AssetAdjustment[]
}

export interface SavingsGoal {
  id: number
  name: string
  targetAmount: number
  currentAmount: number
  monthlyContribution: number
  targetDate: string
}

export interface RecurringTransaction {
  id: number
  title: string
  type: TransactionType
  category: string
  amount: number
  note: string
  dayOfMonth: number
  lastAppliedMonth: string
}

export interface DebtItem {
  id: number
  name: string
  counterpart: string
  amount: number
  dueDate: string
  kind: 'debt' | 'receivable'
  status: 'open' | 'paid'
}

export interface LegacySavingsGoal {
  targetAmount: number
  monthlyContribution: number
}

export interface FinanceData {
  transactions: Transaction[]
  categories: CategoryItem[]
  budgets: BudgetItem[]
  assets: AssetItem[]
  savingsGoal?: number | LegacySavingsGoal
  savingsGoals?: SavingsGoal[]
  recurringTransactions?: RecurringTransaction[]
  debts?: DebtItem[]
}
