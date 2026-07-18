import { ref } from 'vue'
import type { 
  Transaction, 
  CategoryItem, 
  BudgetItem, 
  AssetItem, 
  SavingsGoal, 
  RecurringTransaction, 
  DebtItem, 
  LegacySavingsGoal, 
  FinanceData, 
  TransactionType 
} from '../types/finance'

export const storageKey = 'finance-app-data-v3'

export const defaultCategories: CategoryItem[] = [
  { id: 1, name: 'Gaji', type: 'income', color: '#16a34a', icon: 'salary' },
  { id: 2, name: 'Freelance', type: 'income', color: '#0d9488', icon: 'freelance' },
  { id: 3, name: 'Makan', type: 'expense', color: '#f59e0b', icon: 'burger' },
  { id: 4, name: 'Transport', type: 'expense', color: '#3b82f6', icon: 'car' },
  { id: 5, name: 'Tagihan', type: 'expense', color: '#ef4444', icon: 'electricity' },
  { id: 6, name: 'Belanja', type: 'expense', color: '#ec4899', icon: 'shopping' },
]

export const categoryPalette = ['#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#ef4444', '#10b981', '#f97316']

export const defaultGoal = (): SavingsGoal => ({ 
  id: Date.now(), 
  name: 'Dana Darurat', 
  targetAmount: 5000000, 
  currentAmount: 0, 
  monthlyContribution: 500000, 
  targetDate: '' 
})

export const defaultRecurring: RecurringTransaction[] = [
  { id: 101, title: 'Gaji Bulanan', type: 'income', category: 'Gaji', amount: 5000000, note: 'Pemasukan rutin bulanan', dayOfMonth: 25, lastAppliedMonth: '' },
  { id: 102, title: 'Tagihan Internet', type: 'expense', category: 'Tagihan', amount: 350000, note: 'Pengeluaran rutin internet', dayOfMonth: 10, lastAppliedMonth: '' },
]

// Re-usable reactive state singleton
export const transactions = ref<Transaction[]>([])
export const categories = ref<CategoryItem[]>([])
export const budgets = ref<BudgetItem[]>([])
export const assets = ref<AssetItem[]>([])
export const savingsGoals = ref<SavingsGoal[]>([])
export const recurringTransactions = ref<RecurringTransaction[]>([])
export const debts = ref<DebtItem[]>([])
export const initialized = ref(false)

// Shared helper functions
export const currentDate = () => new Date().toISOString().slice(0, 10)
export const currentMonth = () => currentDate().slice(0, 7)
export const toTitle = (value: string) => value.trim()
export const safeNumber = (value: number | string) => Math.max(0, Number(value) || 0)

export const normalizeLegacyGoal = (value: number | LegacySavingsGoal | undefined) => {
  if (typeof value === 'number') return { ...defaultGoal(), targetAmount: value < 1000 ? 5000000 : value, monthlyContribution: 500000 }
  return {
    ...defaultGoal(),
    targetAmount: value?.targetAmount && value.targetAmount > 0 ? value.targetAmount : 5000000,
    monthlyContribution: value?.monthlyContribution && value.monthlyContribution > 0 ? value.monthlyContribution : 500000,
  }
}

export const normalizeAsset = (item: AssetItem | Omit<AssetItem, 'id'>) => {
  const date = 'date' in item && item.date ? item.date : currentDate()
  const initialAmount = 'initialAmount' in item && typeof item.initialAmount === 'number' ? item.initialAmount : item.amount
  const adjustments = 'adjustments' in item && Array.isArray(item.adjustments) ? item.adjustments : []
  return {
    ...item,
    date,
    initialAmount,
    adjustments
  }
}

export const ensureCategory = (name: string, type: TransactionType, color?: string, icon?: string) => {
  const categoryName = toTitle(name)
  if (!categoryName) return false
  const exists = categories.value.some((item) => item.name.toLowerCase() === categoryName.toLowerCase() && item.type === type)
  if (exists) return false
  const randomColor = categoryPalette[Math.floor(Math.random() * categoryPalette.length)]
  categories.value.push({
    id: Date.now() + Math.floor(Math.random() * 1000),
    name: categoryName,
    type,
    color: color || randomColor,
    icon: icon || (type === 'income' ? 'investment' : 'tag'),
  })
  return true
}

export const loadData = () => {
  const saved = localStorage.getItem(storageKey) || localStorage.getItem('finance-app-data-v2')
  if (!saved) {
    categories.value = defaultCategories
    savingsGoals.value = []
    recurringTransactions.value = []
    return
  }

  try {
    const parsed = JSON.parse(saved) as FinanceData
    transactions.value = parsed.transactions || []
    categories.value = parsed.categories?.length ? parsed.categories : defaultCategories
    budgets.value = parsed.budgets || []
    assets.value = (parsed.assets || []).map((item, index) => ({
      ...normalizeAsset(item as AssetItem | Omit<AssetItem, 'id'>),
      id: 'id' in item && typeof item.id === 'number' ? item.id : Date.now() + index,
    }))
    debts.value = parsed.debts || []
    recurringTransactions.value = parsed.recurringTransactions || []
    savingsGoals.value = parsed.savingsGoals || (parsed.savingsGoal ? [normalizeLegacyGoal(parsed.savingsGoal)] : [])
  } catch {
    categories.value = defaultCategories
    savingsGoals.value = []
    recurringTransactions.value = []
  }
}

export const saveData = () => {
  const payload: FinanceData = {
    transactions: transactions.value,
    categories: categories.value,
    budgets: budgets.value,
    assets: assets.value,
    savingsGoals: savingsGoals.value,
    recurringTransactions: recurringTransactions.value,
    debts: debts.value,
  }
  localStorage.setItem(storageKey, JSON.stringify(payload))
}
