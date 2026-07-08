import { computed, onMounted, ref, watch } from 'vue'

export type TransactionType = 'income' | 'expense'

export type Transaction = {
  id: number
  type: TransactionType
  amount: number
  category: string
  note: string
  date: string
}

export type CategoryItem = {
  id: number
  name: string
  type: TransactionType
}

export type BudgetItem = {
  id: number
  category: string
  amount: number
  month: string
}

export type AssetItem = {
  id: number
  name: string
  amount: number
  type: 'cash' | 'bank' | 'investment'
}

type FinanceData = {
  transactions: Transaction[]
  categories: CategoryItem[]
  budgets: BudgetItem[]
  assets: AssetItem[]
  savingsGoal: number
}

const storageKey = 'finance-app-data-v2'

const defaultCategories: CategoryItem[] = [
  { id: 1, name: 'Gaji', type: 'income' },
  { id: 2, name: 'Freelance', type: 'income' },
  { id: 3, name: 'Makan', type: 'expense' },
  { id: 4, name: 'Transport', type: 'expense' },
  { id: 5, name: 'Tagihan', type: 'expense' },
  { id: 6, name: 'Belanja', type: 'expense' },
]

const transactions = ref<Transaction[]>([])
const categories = ref<CategoryItem[]>([])
const budgets = ref<BudgetItem[]>([])
const assets = ref<AssetItem[]>([])
const savingsGoal = ref(50)

const loadData = () => {
  const saved = localStorage.getItem(storageKey)
  if (!saved) {
    categories.value = defaultCategories
    return
  }

  try {
    const parsed = JSON.parse(saved) as FinanceData
    transactions.value = parsed.transactions || []
    categories.value = parsed.categories?.length ? parsed.categories : defaultCategories
    budgets.value = parsed.budgets || []
    assets.value = parsed.assets || []
    savingsGoal.value = parsed.savingsGoal ?? 50
  } catch {
    categories.value = defaultCategories
  }
}

const saveData = () => {
  const payload: FinanceData = {
    transactions: transactions.value,
    categories: categories.value,
    budgets: budgets.value,
    assets: assets.value,
    savingsGoal: savingsGoal.value,
  }
  localStorage.setItem(storageKey, JSON.stringify(payload))
}

export function useFinance() {
  const addTransaction = (payload: Omit<Transaction, 'id'>) => {
    const amount = Number(payload.amount)
    if (!amount || amount <= 0) return

    const categoryName = payload.category.trim()
    if (!categoryName) return

    if (!categories.value.some((item) => item.name.toLowerCase() === categoryName.toLowerCase() && item.type === payload.type)) {
      categories.value.push({
        id: Date.now(),
        name: categoryName,
        type: payload.type,
      })
    }

    transactions.value.unshift({
      id: Date.now(),
      ...payload,
      amount,
      category: categoryName,
      note: payload.note.trim(),
    })
  }

  const addCategory = (name: string, type: TransactionType) => {
    const categoryName = name.trim()
    if (!categoryName) return

    const exists = categories.value.some((item) => item.name.toLowerCase() === categoryName.toLowerCase())
    if (!exists) {
      categories.value.push({
        id: Date.now(),
        name: categoryName,
        type,
      })
    }
  }

  const addBudget = (payload: Omit<BudgetItem, 'id'>) => {
    const amount = Number(payload.amount)
    if (!amount || amount <= 0 || !payload.category) return

    budgets.value.unshift({
      id: Date.now(),
      ...payload,
      amount,
    })
  }

  const addAsset = (payload: Omit<AssetItem, 'id'>) => {
    const amount = Number(payload.amount)
    if (!amount || amount <= 0 || !payload.name) return

    assets.value.unshift({
      id: Date.now(),
      ...payload,
      amount,
    })
  }

  const deleteTransaction = (id: number) => {
    transactions.value = transactions.value.filter((item) => item.id !== id)
  }

  const deleteBudget = (id: number) => {
    budgets.value = budgets.value.filter((item) => item.id !== id)
  }

  const deleteAsset = (id: number) => {
    assets.value = assets.value.filter((item) => item.id !== id)
  }

  const setSavingsGoal = (value: number) => {
    savingsGoal.value = value
  }

  const incomeTotal = computed(() =>
    transactions.value.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0),
  )

  const expenseTotal = computed(() =>
    transactions.value.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0),
  )

  const balance = computed(() => incomeTotal.value - expenseTotal.value)

  const totalAssets = computed(() => assets.value.reduce((sum, item) => sum + item.amount, 0))

  const expenseByCategory = computed(() => {
    const grouped = new Map<string, number>()
    transactions.value
      .filter((item) => item.type === 'expense')
      .forEach((item) => {
        grouped.set(item.category, (grouped.get(item.category) || 0) + item.amount)
      })

    return Array.from(grouped.entries()).sort((a, b) => b[1] - a[1])
  })

  const monthlyTrend = computed(() => {
    const months = new Map<string, { income: number; expense: number }>()
    transactions.value.forEach((item) => {
      const month = item.date.slice(0, 7)
      const current = months.get(month) || { income: 0, expense: 0 }
      if (item.type === 'income') current.income += item.amount
      else current.expense += item.amount
      months.set(month, current)
    })

    return Array.from(months.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-6)
  })

  const getBudgetSummary = (month: string) => {
    return budgets.value
      .filter((item) => item.month === month)
      .map((item) => {
        const used = transactions.value
          .filter((transaction) => transaction.type === 'expense' && transaction.category === item.category && transaction.date.startsWith(month))
          .reduce((sum, transaction) => sum + transaction.amount, 0)
        return {
          ...item,
          used,
          remaining: item.amount - used,
          progress: item.amount === 0 ? 0 : Math.min(100, Math.round((used / item.amount) * 100)),
        }
      })
  }

  onMounted(() => {
    loadData()
  })

  watch([transactions, categories, budgets, assets, savingsGoal], saveData, { deep: true })

  return {
    transactions,
    categories,
    budgets,
    assets,
    savingsGoal,
    incomeTotal,
    expenseTotal,
    balance,
    totalAssets,
    expenseByCategory,
    monthlyTrend,
    addTransaction,
    addCategory,
    addBudget,
    addAsset,
    deleteTransaction,
    deleteBudget,
    deleteAsset,
    setSavingsGoal,
    getBudgetSummary,
  }
}
