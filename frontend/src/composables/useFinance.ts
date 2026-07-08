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
  date: string
}

export type SavingsGoal = {
  id: number
  name: string
  targetAmount: number
  currentAmount: number
  monthlyContribution: number
  targetDate: string
}

export type RecurringTransaction = {
  id: number
  title: string
  type: TransactionType
  category: string
  amount: number
  note: string
  dayOfMonth: number
  lastAppliedMonth: string
}

export type DebtItem = {
  id: number
  name: string
  counterpart: string
  amount: number
  dueDate: string
  kind: 'debt' | 'receivable'
  status: 'open' | 'paid'
}

type LegacySavingsGoal = {
  targetAmount: number
  monthlyContribution: number
}

type FinanceData = {
  transactions: Transaction[]
  categories: CategoryItem[]
  budgets: BudgetItem[]
  assets: AssetItem[]
  savingsGoal?: number | LegacySavingsGoal
  savingsGoals?: SavingsGoal[]
  recurringTransactions?: RecurringTransaction[]
  debts?: DebtItem[]
}

const storageKey = 'finance-app-data-v3'

const defaultCategories: CategoryItem[] = [
  { id: 1, name: 'Gaji', type: 'income' },
  { id: 2, name: 'Freelance', type: 'income' },
  { id: 3, name: 'Makan', type: 'expense' },
  { id: 4, name: 'Transport', type: 'expense' },
  { id: 5, name: 'Tagihan', type: 'expense' },
  { id: 6, name: 'Belanja', type: 'expense' },
]

const defaultGoal = (): SavingsGoal => ({
  id: Date.now(),
  name: 'Dana Darurat',
  targetAmount: 5000000,
  currentAmount: 0,
  monthlyContribution: 500000,
  targetDate: '',
})

const defaultRecurring: RecurringTransaction[] = [
  {
    id: 101,
    title: 'Gaji Bulanan',
    type: 'income',
    category: 'Gaji',
    amount: 5000000,
    note: 'Pemasukan rutin bulanan',
    dayOfMonth: 25,
    lastAppliedMonth: '',
  },
  {
    id: 102,
    title: 'Tagihan Internet',
    type: 'expense',
    category: 'Tagihan',
    amount: 350000,
    note: 'Pengeluaran rutin internet',
    dayOfMonth: 10,
    lastAppliedMonth: '',
  },
]

const transactions = ref<Transaction[]>([])
const categories = ref<CategoryItem[]>([])
const budgets = ref<BudgetItem[]>([])
const assets = ref<AssetItem[]>([])
const savingsGoals = ref<SavingsGoal[]>([])
const recurringTransactions = ref<RecurringTransaction[]>([])
const debts = ref<DebtItem[]>([])
const initialized = ref(false)

const currentDate = () => new Date().toISOString().slice(0, 10)
const currentMonth = () => currentDate().slice(0, 7)
const toTitle = (value: string) => value.trim()
const safeNumber = (value: number | string) => Math.max(0, Number(value) || 0)

const normalizeLegacyGoal = (value: number | LegacySavingsGoal | undefined) => {
  if (typeof value === 'number') {
    return {
      ...defaultGoal(),
      targetAmount: value < 1000 ? 5000000 : value,
      monthlyContribution: 500000,
    }
  }

  return {
    ...defaultGoal(),
    targetAmount: value?.targetAmount && value.targetAmount > 0 ? value.targetAmount : 5000000,
    monthlyContribution: value?.monthlyContribution && value.monthlyContribution > 0 ? value.monthlyContribution : 500000,
  }
}

const normalizeAsset = (item: AssetItem | Omit<AssetItem, 'id'>) => ({
  ...item,
  date: 'date' in item && item.date ? item.date : currentDate(),
})

const ensureCategory = (name: string, type: TransactionType) => {
  const categoryName = toTitle(name)
  if (!categoryName) return false
  const exists = categories.value.some(
    (item) => item.name.toLowerCase() === categoryName.toLowerCase() && item.type === type,
  )
  if (exists) return false
  categories.value.push({ id: Date.now() + Math.floor(Math.random() * 1000), name: categoryName, type })
  return true
}

const loadData = () => {
  const saved = localStorage.getItem(storageKey) || localStorage.getItem('finance-app-data-v2')
  if (!saved) {
    categories.value = defaultCategories
    savingsGoals.value = [defaultGoal()]
    recurringTransactions.value = defaultRecurring
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
    recurringTransactions.value = parsed.recurringTransactions?.length ? parsed.recurringTransactions : defaultRecurring

    if (parsed.savingsGoals?.length) {
      savingsGoals.value = parsed.savingsGoals
    } else {
      savingsGoals.value = [normalizeLegacyGoal(parsed.savingsGoal)]
    }
  } catch {
    categories.value = defaultCategories
    savingsGoals.value = [defaultGoal()]
    recurringTransactions.value = defaultRecurring
  }
}

const saveData = () => {
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

export function useFinance() {
  const addTransaction = (payload: Omit<Transaction, 'id'>) => {
    const amount = safeNumber(payload.amount)
    const categoryName = toTitle(payload.category)
    if (!amount || !categoryName) return

    ensureCategory(categoryName, payload.type)

    transactions.value.unshift({
      id: Date.now(),
      ...payload,
      amount,
      category: categoryName,
      note: payload.note.trim(),
    })
  }

  const addCategory = (name: string, type: TransactionType) => ensureCategory(name, type)

  const addBudget = (payload: Omit<BudgetItem, 'id'>) => {
    const amount = safeNumber(payload.amount)
    const category = toTitle(payload.category)
    if (!amount || !category) return
    budgets.value.unshift({ id: Date.now(), category, amount, month: payload.month })
  }

  const addAsset = (payload: Omit<AssetItem, 'id'>) => {
    const amount = safeNumber(payload.amount)
    const name = toTitle(payload.name)
    if (!amount || !name) return
    const normalized = normalizeAsset({ ...payload, amount, name })
    assets.value.unshift({ ...normalized, id: Date.now() })
  }

  const addSavingsGoal = (payload: Omit<SavingsGoal, 'id'>) => {
    if (!payload.name.trim() || !safeNumber(payload.targetAmount)) return
    savingsGoals.value.unshift({
      id: Date.now(),
      name: payload.name.trim(),
      targetAmount: safeNumber(payload.targetAmount),
      currentAmount: safeNumber(payload.currentAmount),
      monthlyContribution: safeNumber(payload.monthlyContribution),
      targetDate: payload.targetDate,
    })
  }

  const updateSavingsGoal = (id: number, payload: Partial<Omit<SavingsGoal, 'id'>>) => {
    savingsGoals.value = savingsGoals.value.map((item) =>
      item.id === id
        ? {
            ...item,
            ...payload,
            targetAmount: payload.targetAmount !== undefined ? safeNumber(payload.targetAmount) : item.targetAmount,
            currentAmount: payload.currentAmount !== undefined ? safeNumber(payload.currentAmount) : item.currentAmount,
            monthlyContribution:
              payload.monthlyContribution !== undefined ? safeNumber(payload.monthlyContribution) : item.monthlyContribution,
          }
        : item,
    )
  }

  const deleteSavingsGoal = (id: number) => {
    savingsGoals.value = savingsGoals.value.filter((item) => item.id !== id)
  }

  const addRecurringTransaction = (payload: Omit<RecurringTransaction, 'id' | 'lastAppliedMonth'>) => {
    const amount = safeNumber(payload.amount)
    const title = toTitle(payload.title)
    const category = toTitle(payload.category)
    if (!amount || !title || !category) return
    ensureCategory(category, payload.type)
    recurringTransactions.value.unshift({
      id: Date.now(),
      title,
      type: payload.type,
      category,
      amount,
      note: payload.note.trim(),
      dayOfMonth: Math.min(28, Math.max(1, Number(payload.dayOfMonth) || 1)),
      lastAppliedMonth: '',
    })
  }

  const applyRecurringTransaction = (id: number, month = currentMonth()) => {
    const item = recurringTransactions.value.find((entry) => entry.id === id)
    if (!item || item.lastAppliedMonth === month) return false
    addTransaction({
      type: item.type,
      amount: item.amount,
      category: item.category,
      note: `${item.note} (otomatis)`,
      date: `${month}-${String(item.dayOfMonth).padStart(2, '0')}`,
    })
    item.lastAppliedMonth = month
    return true
  }

  const deleteRecurringTransaction = (id: number) => {
    recurringTransactions.value = recurringTransactions.value.filter((item) => item.id !== id)
  }

  const addDebt = (payload: Omit<DebtItem, 'id' | 'status'>) => {
    const amount = safeNumber(payload.amount)
    const name = toTitle(payload.name)
    const counterpart = toTitle(payload.counterpart)
    if (!amount || !name || !counterpart) return
    debts.value.unshift({
      id: Date.now(),
      name,
      counterpart,
      amount,
      dueDate: payload.dueDate,
      kind: payload.kind,
      status: 'open',
    })
  }

  const toggleDebtStatus = (id: number) => {
    debts.value = debts.value.map((item) => (item.id === id ? { ...item, status: item.status === 'open' ? 'paid' : 'open' } : item))
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

  const deleteDebt = (id: number) => {
    debts.value = debts.value.filter((item) => item.id !== id)
  }

  const incomeTransactions = computed(() => transactions.value.filter((item) => item.type === 'income'))
  const expenseTransactions = computed(() => transactions.value.filter((item) => item.type === 'expense'))
  const incomeTotal = computed(() => incomeTransactions.value.reduce((sum, item) => sum + item.amount, 0))
  const expenseTotal = computed(() => expenseTransactions.value.reduce((sum, item) => sum + item.amount, 0))
  const balance = computed(() => incomeTotal.value - expenseTotal.value)
  const totalAssets = computed(() => assets.value.reduce((sum, item) => sum + item.amount, 0))

  const expenseByCategory = computed(() => {
    const grouped = new Map<string, number>()
    expenseTransactions.value.forEach((item) => grouped.set(item.category, (grouped.get(item.category) || 0) + item.amount))
    return Array.from(grouped.entries()).sort((a, b) => b[1] - a[1])
  })

  const incomeByCategory = computed(() => {
    const grouped = new Map<string, number>()
    incomeTransactions.value.forEach((item) => grouped.set(item.category, (grouped.get(item.category) || 0) + item.amount))
    return Array.from(grouped.entries()).sort((a, b) => b[1] - a[1])
  })

  const categoryAnalytics = computed(() => {
    const grouped = new Map<string, { name: string; type: TransactionType; total: number; count: number; average: number; latest: string }>()
    transactions.value.forEach((item) => {
      const key = `${item.type}:${item.category.toLowerCase()}`
      const current = grouped.get(key) || {
        name: item.category,
        type: item.type,
        total: 0,
        count: 0,
        average: 0,
        latest: item.date,
      }
      current.total += item.amount
      current.count += 1
      current.average = Math.round(current.total / current.count)
      if (item.date > current.latest) current.latest = item.date
      grouped.set(key, current)
    })
    return Array.from(grouped.values()).sort((a, b) => b.total - a.total)
  })

  const monthlyTrend = computed(() => {
    const months = new Map<string, { income: number; expense: number; net: number }>()
    transactions.value.forEach((item) => {
      const month = item.date.slice(0, 7)
      const current = months.get(month) || { income: 0, expense: 0, net: 0 }
      if (item.type === 'income') current.income += item.amount
      else current.expense += item.amount
      current.net = current.income - current.expense
      months.set(month, current)
    })
    return Array.from(months.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-6)
  })

  const currentMonthBudgetSummary = computed(() => getBudgetSummary(currentMonth()))

  const budgetAlerts = computed(() =>
    currentMonthBudgetSummary.value
      .filter((item) => item.progress >= 80)
      .map((item) => ({
        ...item,
        level: item.progress >= 100 ? 'danger' : 'warning',
        message:
          item.progress >= 100
            ? `Budget ${item.category} sudah lewat batas ${item.progress}%`
            : `Budget ${item.category} sudah terpakai ${item.progress}%`,
      })),
  )

  const monthlyComparison = computed(() => {
    const sorted = monthlyTrend.value
    const current = sorted[sorted.length - 1]
    const previous = sorted[sorted.length - 2]
    if (!current) {
      return {
        currentMonth: '',
        previousMonth: '',
        incomeChange: 0,
        expenseChange: 0,
        netChange: 0,
      }
    }
    return {
      currentMonth: current[0],
      previousMonth: previous?.[0] || '',
      incomeChange: current[1].income - (previous?.[1].income || 0),
      expenseChange: current[1].expense - (previous?.[1].expense || 0),
      netChange: current[1].net - (previous?.[1].net || 0),
    }
  })

  const transactionCount = computed(() => transactions.value.length)
  const averageIncome = computed(() => (incomeTransactions.value.length ? Math.round(incomeTotal.value / incomeTransactions.value.length) : 0))
  const averageExpense = computed(() => (expenseTransactions.value.length ? Math.round(expenseTotal.value / expenseTransactions.value.length) : 0))

  const savingsGoalTarget = computed(() => savingsGoals.value.reduce((sum, item) => sum + item.targetAmount, 0))
  const savingsGoalCurrent = computed(() => savingsGoals.value.reduce((sum, item) => sum + item.currentAmount, 0))
  const savingsGoalMonthly = computed(() => savingsGoals.value.reduce((sum, item) => sum + item.monthlyContribution, 0))
  const savingsGoalProgress = computed(() =>
    savingsGoalTarget.value > 0 ? Math.min(100, Math.round((savingsGoalCurrent.value / savingsGoalTarget.value) * 100)) : 0,
  )
  const monthsToGoal = computed(() => {
    if (!savingsGoalMonthly.value) return null
    return Math.ceil(Math.max(0, savingsGoalTarget.value - savingsGoalCurrent.value) / savingsGoalMonthly.value)
  })

  const assetGrowthTrend = computed(() => {
    const months = new Map<string, number>()
    assets.value
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((item) => {
        const month = item.date.slice(0, 7)
        months.set(month, (months.get(month) || 0) + item.amount)
      })

    let running = 0
    return Array.from(months.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => {
        running += amount
        return [month, running] as const
      })
  })

  const openDebts = computed(() => debts.value.filter((item) => item.kind === 'debt' && item.status === 'open'))
  const openReceivables = computed(() => debts.value.filter((item) => item.kind === 'receivable' && item.status === 'open'))
  const totalDebt = computed(() => openDebts.value.reduce((sum, item) => sum + item.amount, 0))
  const totalReceivable = computed(() => openReceivables.value.reduce((sum, item) => sum + item.amount, 0))

  const upcomingRecurring = computed(() =>
    recurringTransactions.value
      .slice()
      .sort((a, b) => a.dayOfMonth - b.dayOfMonth)
      .map((item) => ({
        ...item,
        isApplied: item.lastAppliedMonth === currentMonth(),
      })),
  )

  const automatedInsights = computed(() => {
    const insights: string[] = []
    const topExpense = expenseByCategory.value[0]
    const topIncome = incomeByCategory.value[0]
    const firstAlert = budgetAlerts.value[0]

    if (balance.value < 0) insights.push('Cashflow sedang negatif. Prioritaskan memangkas pengeluaran utama bulan ini.')
    if (firstAlert) insights.push(firstAlert.message)
    if (topExpense) insights.push(`Kategori ${topExpense[0]} menjadi pengeluaran terbesar saat ini.`)
    if (monthlyComparison.value.expenseChange > 0 && monthlyComparison.value.previousMonth) {
      insights.push(`Pengeluaran naik Rp ${monthlyComparison.value.expenseChange.toLocaleString('id-ID')} dibanding ${monthlyComparison.value.previousMonth}.`)
    }
    if (topIncome) insights.push(`Sumber pemasukan terbesar Anda berasal dari ${topIncome[0]}.`)
    if (!insights.length) insights.push('Data masih sehat. Pertahankan ritme pemasukan dan pengeluaran seperti sekarang.')

    return insights
  })

  const getBudgetSummary = (month: string) =>
    budgets.value
      .filter((item) => item.month === month)
      .map((item) => {
        const used = expenseTransactions.value
          .filter((transaction) => transaction.category === item.category && transaction.date.startsWith(month))
          .reduce((sum, transaction) => sum + transaction.amount, 0)

        return {
          ...item,
          used,
          remaining: item.amount - used,
          progress: item.amount === 0 ? 0 : Math.min(100, Math.round((used / item.amount) * 100)),
        }
      })

  const exportTransactionsCsv = () => {
    const rows = [
      ['Tanggal', 'Jenis', 'Kategori', 'Nominal', 'Catatan'],
      ...transactions.value.map((item) => [item.date, item.type, item.category, String(item.amount), item.note || '-']),
    ]
    return rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
  }

  const downloadCsvReport = () => {
    const csv = exportTransactionsCsv()
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `laporan-keuangan-${currentMonth()}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportSummaryText = computed(() => {
    const lines = [
      `Laporan bulan ${currentMonth()}`,
      `Total pemasukan: Rp ${incomeTotal.value.toLocaleString('id-ID')}`,
      `Total pengeluaran: Rp ${expenseTotal.value.toLocaleString('id-ID')}`,
      `Saldo: Rp ${balance.value.toLocaleString('id-ID')}`,
      `Aset: Rp ${totalAssets.value.toLocaleString('id-ID')}`,
      `Utang terbuka: Rp ${totalDebt.value.toLocaleString('id-ID')}`,
      `Piutang terbuka: Rp ${totalReceivable.value.toLocaleString('id-ID')}`,
      '',
      'Insight:',
      ...automatedInsights.value.map((item) => `- ${item}`),
    ]
    return lines.join('\n')
  })

  onMounted(() => {
    if (initialized.value) return
    loadData()
    initialized.value = true
  })

  watch(
    [transactions, categories, budgets, assets, savingsGoals, recurringTransactions, debts],
    () => {
      if (initialized.value) saveData()
    },
    { deep: true },
  )

  return {
    transactions,
    categories,
    budgets,
    assets,
    savingsGoals,
    recurringTransactions,
    debts,
    incomeTotal,
    expenseTotal,
    balance,
    totalAssets,
    expenseByCategory,
    incomeByCategory,
    categoryAnalytics,
    monthlyTrend,
    monthlyComparison,
    transactionCount,
    averageIncome,
    averageExpense,
    savingsGoalTarget,
    savingsGoalCurrent,
    savingsGoalMonthly,
    savingsGoalProgress,
    monthsToGoal,
    assetGrowthTrend,
    budgetAlerts,
    currentMonthBudgetSummary,
    openDebts,
    openReceivables,
    totalDebt,
    totalReceivable,
    upcomingRecurring,
    automatedInsights,
    addTransaction,
    addCategory,
    addBudget,
    addAsset,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    addRecurringTransaction,
    applyRecurringTransaction,
    deleteRecurringTransaction,
    addDebt,
    toggleDebtStatus,
    deleteTransaction,
    deleteBudget,
    deleteAsset,
    deleteDebt,
    getBudgetSummary,
    exportTransactionsCsv,
    downloadCsvReport,
    exportSummaryText,
  }
}
