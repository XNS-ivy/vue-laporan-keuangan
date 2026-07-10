import { computed, onMounted, watch } from 'vue'
import * as XLSX from 'xlsx'
import { useUi } from './useUi'
import { 
  // State refs
  transactions,
  categories,
  budgets,
  assets,
  savingsGoals,
  recurringTransactions,
  debts,
  initialized,

  // State helpers & loaders
  currentDate,
  currentMonth,
  toTitle,
  safeNumber,
  normalizeAsset,
  normalizeLegacyGoal,
  ensureCategory,
  loadData,
  saveData,
  storageKey,
  defaultCategories
} from './useFinanceState'

// Re-export types so we don't break existing UI imports that reference useFinance.ts for type information.
export type { 
  TransactionType, 
  Transaction, 
  CategoryItem, 
  BudgetItem, 
  AssetAdjustment, 
  AssetItem, 
  SavingsGoal, 
  RecurringTransaction, 
  DebtItem,
  LegacySavingsGoal,
  FinanceData
} from '../types/finance'

import type { 
  Transaction, 
  CategoryItem, 
  BudgetItem, 
  AssetItem, 
  SavingsGoal, 
  RecurringTransaction, 
  DebtItem,
  FinanceData,
  TransactionType,
  AssetAdjustment
} from '../types/finance'

export function useFinance() {
  const { globalDateFilter, pushToast } = useUi()

  const isWithinGlobalDate = (date: string) => {
    const startOk = !globalDateFilter.value.start || date >= globalDateFilter.value.start
    const endOk = !globalDateFilter.value.end || date <= globalDateFilter.value.end
    return startOk && endOk
  }

  const baseAddTransaction = (payload: Omit<Transaction, 'id'>, skipToast = false) => {
    const amount = safeNumber(payload.amount)
    const categoryName = toTitle(payload.category)
    if (!amount || !categoryName) return false
    ensureCategory(categoryName, payload.type)
    transactions.value.unshift({ id: Date.now(), ...payload, amount, category: categoryName, note: payload.note.trim() })
    if (!skipToast) pushToast('Transaksi berhasil disimpan', 'success')
    return true
  }

  const addTransaction = (payload: Omit<Transaction, 'id'>) => baseAddTransaction(payload)
  
  const addCategory = (name: string, type: TransactionType, color?: string, icon?: string) => ensureCategory(name, type, color, icon)
  
  const deleteCategory = (id: number) => {
    const categoryItem = categories.value.find((c) => c.id === id)
    if (!categoryItem) return false
    const isUsed = transactions.value.some((t) => t.category.toLowerCase() === categoryItem.name.toLowerCase() && t.type === categoryItem.type)
    if (isUsed) {
      pushToast(`Kategori "${categoryItem.name}" masih digunakan dalam transaksi`, 'error')
      return false
    }
    const isUsedRecurring = recurringTransactions.value.some((r) => r.category.toLowerCase() === categoryItem.name.toLowerCase() && r.type === categoryItem.type)
    if (isUsedRecurring) {
      pushToast(`Kategori "${categoryItem.name}" masih digunakan dalam transaksi rutin`, 'error')
      return false
    }
    const isUsedBudget = budgets.value.some((b) => b.category.toLowerCase() === categoryItem.name.toLowerCase())
    if (isUsedBudget) {
      pushToast(`Kategori "${categoryItem.name}" masih digunakan dalam anggaran`, 'error')
      return false
    }
    categories.value = categories.value.filter((c) => c.id !== id)
    pushToast(`Kategori "${categoryItem.name}" berhasil dihapus`, 'success')
    return true
  }

  const updateCategory = (id: number, payload: Partial<CategoryItem>) => {
    categories.value = categories.value.map((c) => {
      if (c.id === id) {
        const newName = payload.name !== undefined ? toTitle(payload.name) : c.name
        if (newName && newName.toLowerCase() !== c.name.toLowerCase()) {
          transactions.value = transactions.value.map((t) => t.category.toLowerCase() === c.name.toLowerCase() && t.type === c.type ? { ...t, category: newName } : t)
          recurringTransactions.value = recurringTransactions.value.map((r) => r.category.toLowerCase() === c.name.toLowerCase() && r.type === c.type ? { ...r, category: newName } : r)
          budgets.value = budgets.value.map((b) => b.category.toLowerCase() === c.name.toLowerCase() ? { ...b, category: newName } : b)
        }
        return {
          ...c,
          ...payload,
          name: newName || c.name
        }
      }
      return c
    })
    pushToast('Kategori berhasil diperbarui', 'success')
  }

  const addBudget = (payload: Omit<BudgetItem, 'id'>) => {
    const amount = safeNumber(payload.amount)
    const category = toTitle(payload.category)
    if (!amount || !category) return
    budgets.value.unshift({ id: Date.now(), category, amount, month: payload.month })
    pushToast('Anggaran berhasil disimpan', 'success')
  }

  const addAsset = (payload: Omit<AssetItem, 'id'>) => {
    const amount = safeNumber(payload.amount)
    const name = toTitle(payload.name)
    if (!amount || !name) return
    const normalized = normalizeAsset({ ...payload, amount, name })
    assets.value.unshift({ ...normalized, id: Date.now() })
    pushToast('Aset berhasil ditambahkan', 'success')
  }

  const updateAsset = (id: number, payload: Partial<Omit<AssetItem, 'id' | 'adjustments'>>) => {
    assets.value = assets.value.map((item) => {
      if (item.id === id) {
        const name = payload.name !== undefined ? toTitle(payload.name) : item.name
        const type = payload.type !== undefined ? payload.type : item.type
        const date = payload.date !== undefined ? payload.date : item.date
        const initialAmount = payload.initialAmount !== undefined ? safeNumber(payload.initialAmount) : (item.initialAmount ?? item.amount)
        const adjustments = item.adjustments || []
        const totalAdjustments = adjustments.reduce((sum, adj) => adj.type === 'appreciation' ? sum + adj.amount : sum - adj.amount, 0)
        return {
          ...item,
          name,
          type,
          date,
          initialAmount,
          amount: initialAmount + totalAdjustments
        }
      }
      return item
    })
    pushToast('Aset berhasil diperbarui', 'success')
  }

  const adjustAssetValue = (id: number, adjustment: Omit<AssetAdjustment, 'id'>, recordAsTransaction: boolean) => {
    const amountVal = safeNumber(adjustment.amount)
    if (!amountVal) return false
    let success = false
    assets.value = assets.value.map((item) => {
      if (item.id === id) {
        const adjs = item.adjustments || []
        const newAdjustment: AssetAdjustment = {
          id: Date.now(),
          date: adjustment.date || currentDate(),
          type: adjustment.type,
          amount: amountVal,
          note: adjustment.note.trim()
        }
        const updatedAdjs = [...adjs, newAdjustment]
        const initialAmount = item.initialAmount ?? item.amount
        const totalAdjustments = updatedAdjs.reduce((sum, adj) => adj.type === 'appreciation' ? sum + adj.amount : sum - adj.amount, 0)
        success = true
        return {
          ...item,
          initialAmount,
          adjustments: updatedAdjs,
          amount: initialAmount + totalAdjustments
        }
      }
      return item
    })
    if (success) {
      pushToast('Penyesuaian nilai aset berhasil dicatat', 'success')
      if (recordAsTransaction) {
        const asset = assets.value.find((a) => a.id === id)
        const name = asset ? asset.name : 'Aset'
        const txType = adjustment.type === 'appreciation' ? 'income' : 'expense'
        const txCategory = adjustment.type === 'appreciation' ? 'Pemasukan' : 'Tagihan'
        const txNote = `Penyesuaian ${adjustment.type === 'appreciation' ? 'apresiasi' : 'penyusutan'} aset "${name}": ${adjustment.note.trim()}`
        baseAddTransaction({
          type: txType,
          amount: amountVal,
          category: txCategory,
          subCategory: 'Penyesuaian Aset',
          note: txNote,
          date: adjustment.date || currentDate()
        }, true)
      }
    }
    return success
  }

  const deleteAssetAdjustment = (assetId: number, adjustmentId: number) => {
    let success = false
    assets.value = assets.value.map((item) => {
      if (item.id === assetId) {
        const adjs = item.adjustments || []
        const updatedAdjs = adjs.filter((adj) => adj.id !== adjustmentId)
        const initialAmount = item.initialAmount ?? item.amount
        const totalAdjustments = updatedAdjs.reduce((sum, adj) => adj.type === 'appreciation' ? sum + adj.amount : sum - adj.amount, 0)
        success = true
        return {
          ...item,
          adjustments: updatedAdjs,
          amount: initialAmount + totalAdjustments
        }
      }
      return item
    })
    if (success) {
      pushToast('Catatan penyesuaian dihapus', 'info')
    }
    return success
  }

  const addSavingsGoal = (payload: Omit<SavingsGoal, 'id'>) => {
    if (!payload.name.trim() || !safeNumber(payload.targetAmount)) return
    savingsGoals.value.unshift({ id: Date.now(), name: payload.name.trim(), targetAmount: safeNumber(payload.targetAmount), currentAmount: safeNumber(payload.currentAmount), monthlyContribution: safeNumber(payload.monthlyContribution), targetDate: payload.targetDate })
    pushToast('Goal tabungan berhasil ditambahkan', 'success')
  }

  const updateSavingsGoal = (id: number, payload: Partial<Omit<SavingsGoal, 'id'>>) => {
    savingsGoals.value = savingsGoals.value.map((item) => item.id === id ? { ...item, ...payload, targetAmount: payload.targetAmount !== undefined ? safeNumber(payload.targetAmount) : item.targetAmount, currentAmount: payload.currentAmount !== undefined ? safeNumber(payload.currentAmount) : item.currentAmount, monthlyContribution: payload.monthlyContribution !== undefined ? safeNumber(payload.monthlyContribution) : item.monthlyContribution } : item)
    pushToast('Progress goal diperbarui', 'success')
  }

  const depositToSavingsGoal = (id: number, amount: number, withdrawFromBalance = false) => {
    const goalIndex = savingsGoals.value.findIndex((item) => item.id === id)
    if (goalIndex === -1) return false
    const goal = savingsGoals.value[goalIndex]
    if (!goal) return false
    const depositAmount = safeNumber(amount)
    if (depositAmount <= 0) return false
    savingsGoals.value[goalIndex] = {
      ...goal,
      currentAmount: goal.currentAmount + depositAmount
    }
    if (withdrawFromBalance) {
      baseAddTransaction({
        type: 'expense',
        amount: depositAmount,
        category: 'Tabungan',
        note: `Setoran tabungan: ${goal.name}`,
        date: currentDate()
      }, true)
    }
    pushToast(`Berhasil menyetor Rp ${depositAmount.toLocaleString('id-ID')} ke ${goal.name}`, 'success')
    return true
  }

  const deleteSavingsGoal = (id: number) => { savingsGoals.value = savingsGoals.value.filter((item) => item.id !== id) }

  const addRecurringTransaction = (payload: Omit<RecurringTransaction, 'id' | 'lastAppliedMonth'>) => {
    const amount = safeNumber(payload.amount)
    const title = toTitle(payload.title)
    const category = toTitle(payload.category)
    if (!amount || !title || !category) return
    ensureCategory(category, payload.type)
    recurringTransactions.value.unshift({ id: Date.now(), title, type: payload.type, category, amount, note: payload.note.trim(), dayOfMonth: Math.min(28, Math.max(1, Number(payload.dayOfMonth) || 1)), lastAppliedMonth: '' })
    pushToast('Recurring transaction berhasil ditambahkan', 'success')
  }

  const applyRecurringTransaction = (id: number, month = currentMonth(), silent = false) => {
    const item = recurringTransactions.value.find((entry) => entry.id === id)
    if (!item || item.lastAppliedMonth === month) return false
    const applied = baseAddTransaction({ type: item.type, amount: item.amount, category: item.category, note: `${item.note} (otomatis)`, date: `${month}-${String(item.dayOfMonth).padStart(2, '0')}` }, true)
    if (!applied) return false
    item.lastAppliedMonth = month
    if (!silent) pushToast(`Recurring ${item.title} diterapkan`, 'info')
    return true
  }

  const autoApplyRecurringTransactions = () => {
    const month = currentMonth()
    let appliedCount = 0
    recurringTransactions.value.forEach((item) => {
      if (applyRecurringTransaction(item.id, month, true)) appliedCount += 1
    })
    if (appliedCount) pushToast(`${appliedCount} recurring transaction diterapkan otomatis`, 'info')
  }

  const deleteRecurringTransaction = (id: number) => { recurringTransactions.value = recurringTransactions.value.filter((item) => item.id !== id) }
  
  const addDebt = (payload: Omit<DebtItem, 'id' | 'status'>) => {
    const amount = safeNumber(payload.amount)
    const name = toTitle(payload.name)
    const counterpart = toTitle(payload.counterpart)
    if (!amount || !name || !counterpart) return
    debts.value.unshift({ id: Date.now(), name, counterpart, amount, dueDate: payload.dueDate, kind: payload.kind, status: 'open' })
    pushToast('Catatan utang/piutang berhasil disimpan', 'success')
  }
  
  const toggleDebtStatus = (id: number) => { debts.value = debts.value.map((item) => item.id === id ? { ...item, status: item.status === 'open' ? 'paid' : 'open' } : item) }
  
  const updateDebt = (id: number, payload: Partial<Omit<DebtItem, 'id'>>) => {
    debts.value = debts.value.map((item) => {
      if (item.id === id) {
        const name = payload.name !== undefined ? toTitle(payload.name) : item.name
        const counterpart = payload.counterpart !== undefined ? toTitle(payload.counterpart) : item.counterpart
        const amount = payload.amount !== undefined ? safeNumber(payload.amount) : item.amount
        const dueDate = payload.dueDate !== undefined ? payload.dueDate : item.dueDate
        const kind = payload.kind !== undefined ? payload.kind : item.kind
        const status = payload.status !== undefined ? payload.status : item.status
        return {
          ...item,
          name,
          counterpart,
          amount,
          dueDate,
          kind,
          status
        }
      }
      return item
    })
    pushToast('Catatan utang/piutang berhasil diperbarui', 'success')
  }

  const deleteTransaction = (id: number) => { transactions.value = transactions.value.filter((item) => item.id !== id) }
  
  const updateTransaction = (id: number, payload: Omit<Transaction, 'id'>) => {
    const amount = safeNumber(payload.amount)
    const categoryName = toTitle(payload.category)
    if (!amount || !categoryName) return false
    ensureCategory(categoryName, payload.type)
    const index = transactions.value.findIndex((item) => item.id === id)
    if (index === -1) return false
    transactions.value[index] = {
      id,
      type: payload.type,
      amount,
      category: categoryName,
      subCategory: payload.subCategory,
      note: payload.note.trim(),
      date: payload.date,
    }
    pushToast('Transaksi berhasil diperbarui', 'success')
    return true
  }

  const exportJsonData = () => {
    const payload: FinanceData = {
      transactions: transactions.value,
      categories: categories.value,
      budgets: budgets.value,
      assets: assets.value,
      savingsGoals: savingsGoals.value,
      recurringTransactions: recurringTransactions.value,
      debts: debts.value,
    }
    return JSON.stringify(payload, null, 2)
  }

  const importJsonData = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString) as Partial<FinanceData>
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Format JSON tidak valid')
      }
      if (parsed.transactions && !Array.isArray(parsed.transactions)) throw new Error('Format transaksi salah')
      if (parsed.categories && !Array.isArray(parsed.categories)) throw new Error('Format kategori salah')
      if (parsed.budgets && !Array.isArray(parsed.budgets)) throw new Error('Format anggaran salah')
      if (parsed.assets && !Array.isArray(parsed.assets)) throw new Error('Format aset salah')
      if (parsed.savingsGoals && !Array.isArray(parsed.savingsGoals)) throw new Error('Format target tabungan salah')
      if (parsed.recurringTransactions && !Array.isArray(parsed.recurringTransactions)) throw new Error('Format transaksi rutin salah')
      if (parsed.debts && !Array.isArray(parsed.debts)) throw new Error('Format utang/piutang salah')

      if (parsed.transactions) transactions.value = parsed.transactions
      if (parsed.categories) categories.value = parsed.categories
      if (parsed.budgets) budgets.value = parsed.budgets
      if (parsed.assets) assets.value = parsed.assets.map((item, index) => ({
        ...normalizeAsset(item as AssetItem | Omit<AssetItem, 'id'>),
        id: 'id' in item && typeof item.id === 'number' ? item.id : Date.now() + index,
      }))
      if (parsed.savingsGoals) savingsGoals.value = parsed.savingsGoals
      if (parsed.recurringTransactions) recurringTransactions.value = parsed.recurringTransactions
      if (parsed.debts) debts.value = parsed.debts

      saveData()
      pushToast('Data berhasil diimpor', 'success')
      return true
    } catch (e: any) {
      pushToast(`Gagal mengimpor data: ${e.message || e}`, 'error')
      return false
    }
  }

  const deleteBudget = (id: number) => { budgets.value = budgets.value.filter((item) => item.id !== id) }
  const deleteAsset = (id: number) => { assets.value = assets.value.filter((item) => item.id !== id) }
  const deleteDebt = (id: number) => { debts.value = debts.value.filter((item) => item.id !== id) }

  const resetAllData = () => {
    localStorage.removeItem(storageKey)
    localStorage.removeItem('finance-app-data-v2')
    transactions.value = []
    categories.value = [...defaultCategories]
    budgets.value = []
    assets.value = []
    savingsGoals.value = []
    recurringTransactions.value = []
    debts.value = []
    saveData()
    pushToast('Semua data berhasil dibersihkan', 'info')
  }

  const filteredTransactions = computed(() => transactions.value.filter((item) => isWithinGlobalDate(item.date)))
  const incomeTransactions = computed(() => filteredTransactions.value.filter((item) => item.type === 'income'))
  const expenseTransactions = computed(() => filteredTransactions.value.filter((item) => item.type === 'expense'))
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
    filteredTransactions.value.forEach((item) => {
      const key = `${item.type}:${item.category.toLowerCase()}`
      const current = grouped.get(key) || { name: item.category, type: item.type, total: 0, count: 0, average: 0, latest: item.date }
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
    filteredTransactions.value.forEach((item) => {
      const month = item.date.slice(0, 7)
      const current = months.get(month) || { income: 0, expense: 0, net: 0 }
      if (item.type === 'income') current.income += item.amount
      else current.expense += item.amount
      current.net = current.income - current.expense
      months.set(month, current)
    })
    return Array.from(months.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-6)
  })

  const getBudgetSummary = (month: string) => budgets.value.filter((item) => item.month === month).map((item) => {
    const used = expenseTransactions.value.filter((transaction) => transaction.category === item.category && transaction.date.startsWith(month)).reduce((sum, transaction) => sum + transaction.amount, 0)
    return { ...item, used, remaining: item.amount - used, progress: item.amount === 0 ? 0 : Math.min(100, Math.round((used / item.amount) * 100)) }
  })

  const currentMonthBudgetSummary = computed(() => getBudgetSummary(currentMonth()))
  const budgetAlerts = computed(() => currentMonthBudgetSummary.value.filter((item) => item.progress >= 80).map((item) => ({ ...item, level: item.progress >= 100 ? 'danger' as const : 'warning' as const, message: item.progress >= 100 ? `Budget ${item.category} sudah lewat batas ${item.progress}%` : `Budget ${item.category} sudah terpakai ${item.progress}%` })))
  const monthlyComparison = computed(() => {
    const sorted = monthlyTrend.value
    const current = sorted[sorted.length - 1]
    const previous = sorted[sorted.length - 2]
    if (!current) return { currentMonth: '', previousMonth: '', incomeChange: 0, expenseChange: 0, netChange: 0 }
    return { currentMonth: current[0], previousMonth: previous?.[0] || '', incomeChange: current[1].income - (previous?.[1].income || 0), expenseChange: current[1].expense - (previous?.[1].expense || 0), netChange: current[1].net - (previous?.[1].net || 0) }
  })

  const transactionCount = computed(() => filteredTransactions.value.length)
  const averageIncome = computed(() => incomeTransactions.value.length ? Math.round(incomeTotal.value / incomeTransactions.value.length) : 0)
  const averageExpense = computed(() => expenseTransactions.value.length ? Math.round(expenseTotal.value / expenseTransactions.value.length) : 0)
  const savingsGoalTarget = computed(() => savingsGoals.value.reduce((sum, item) => sum + item.targetAmount, 0))
  const savingsGoalCurrent = computed(() => savingsGoals.value.reduce((sum, item) => sum + item.currentAmount, 0))
  const savingsGoalMonthly = computed(() => savingsGoals.value.reduce((sum, item) => sum + item.monthlyContribution, 0))
  const savingsGoalProgress = computed(() => savingsGoalTarget.value > 0 ? Math.min(100, Math.round((savingsGoalCurrent.value / savingsGoalTarget.value) * 100)) : 0)
  const monthsToGoal = computed(() => !savingsGoalMonthly.value ? null : Math.ceil(Math.max(0, savingsGoalTarget.value - savingsGoalCurrent.value) / savingsGoalMonthly.value))
  
  const assetGrowthTrend = computed(() => {
    const months = new Map<string, number>()
    assets.value.slice().sort((a, b) => a.date.localeCompare(b.date)).forEach((item) => {
      const month = item.date.slice(0, 7)
      months.set(month, (months.get(month) || 0) + item.amount)
    })
    let running = 0
    return Array.from(months.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([month, amount]) => { running += amount; return [month, running] as const })
  })
  
  const openDebts = computed(() => debts.value.filter((item) => item.kind === 'debt' && item.status === 'open'))
  const openReceivables = computed(() => debts.value.filter((item) => item.kind === 'receivable' && item.status === 'open'))
  const totalDebt = computed(() => openDebts.value.reduce((sum, item) => sum + item.amount, 0))
  const totalReceivable = computed(() => openReceivables.value.reduce((sum, item) => sum + item.amount, 0))
  const upcomingRecurring = computed(() => recurringTransactions.value.slice().sort((a, b) => a.dayOfMonth - b.dayOfMonth).map((item) => ({ ...item, isApplied: item.lastAppliedMonth === currentMonth() })))

  const nextMonthForecast = computed(() => {
    const trend = monthlyTrend.value
    if (trend.length < 2) {
      return {
        hasEnoughData: false,
        predictedExpense: 0,
        trendDirection: 'flat' as 'up' | 'down' | 'flat',
        percentageChange: 0,
      }
    }

    const N = trend.length
    const x = Array.from({ length: N }, (_, i) => i)
    const y = trend.map(([, val]) => val.expense)

    const meanX = x.reduce((a, b) => a + b, 0) / N
    const meanY = y.reduce((a, b) => a + b, 0) / N

    let numerator = 0
    let denominator = 0
    for (let i = 0; i < N; i++) {
      numerator += (x[i]! - meanX) * (y[i]! - meanY)
      denominator += (x[i]! - meanX) ** 2
    }

    const slope = denominator === 0 ? 0 : numerator / denominator
    const intercept = meanY - slope * meanX

    const predictedExpense = Math.max(0, Math.round(slope * N + intercept))
    const currentMonthExpense = y[N - 1] || 0
    let percentageChange = 0
    if (currentMonthExpense > 0) {
      percentageChange = Math.round(((predictedExpense - currentMonthExpense) / currentMonthExpense) * 100)
    }

    const trendDirection = slope > 1000 ? 'up' as const : slope < -1000 ? 'down' as const : 'flat' as const

    return {
      hasEnoughData: true,
      predictedExpense,
      trendDirection,
      percentageChange,
      slope
    }
  })

  const categoryForecasts = computed(() => {
    const sorted = [...transactions.value].sort((a, b) => a.date.localeCompare(b.date))
    const uniqueMonths = Array.from(new Set(sorted.map(t => t.date.slice(0, 7)))).sort()
    
    if (uniqueMonths.length < 2) return []

    const monthCatMap = new Map<string, Map<string, number>>()
    uniqueMonths.forEach(m => {
      monthCatMap.set(m, new Map<string, number>())
    })

    sorted.forEach(t => {
      if (t.type !== 'expense') return
      const m = t.date.slice(0, 7)
      const catMap = monthCatMap.get(m)!
      catMap.set(t.category, (catMap.get(t.category) || 0) + t.amount)
    })

    const allCategories = Array.from(new Set(sorted.filter(t => t.type === 'expense').map(t => t.category)))
    const forecasts: Array<{ category: string; predictedAmount: number; trendDirection: 'up' | 'down' | 'flat'; percentageChange: number }> = []

    allCategories.forEach(category => {
      const y = uniqueMonths.map(m => monthCatMap.get(m)!.get(category) || 0)
      const totalSpent = y.reduce((a, b) => a + b, 0)
      if (totalSpent === 0) return

      const N = y.length
      const x = Array.from({ length: N }, (_, i) => i)

      const meanX = x.reduce((a, b) => a + b, 0) / N
      const meanY = y.reduce((a, b) => a + b, 0) / N

      let numerator = 0
      let denominator = 0
      for (let i = 0; i < N; i++) {
        numerator += (x[i]! - meanX) * (y[i]! - meanY)
        denominator += (x[i]! - meanX) ** 2
      }

      const slope = denominator === 0 ? 0 : numerator / denominator
      const intercept = meanY - slope * meanX

      const predictedAmount = Math.max(0, Math.round(slope * N + intercept))
      const currentAmount = y[N - 1] || 0
      let percentageChange = 0
      if (currentAmount > 0) {
        percentageChange = Math.round(((predictedAmount - currentAmount) / currentAmount) * 100)
      }

      const trendDirection = slope > 500 ? 'up' as const : slope < -500 ? 'down' as const : 'flat' as const

      forecasts.push({
        category,
        predictedAmount,
        trendDirection,
        percentageChange
      })
    })

    return forecasts.sort((a, b) => b.predictedAmount - a.predictedAmount)
  })

  const automatedInsights = computed(() => {
    const insights: string[] = []
    const topExpense = expenseByCategory.value[0]
    const topIncome = incomeByCategory.value[0]
    const firstAlert = budgetAlerts.value[0]
    if (balance.value < 0) insights.push('Cashflow sedang negatif. Prioritaskan memangkas pengeluaran utama bulan ini.')
    if (firstAlert) insights.push(firstAlert.message)
    if (topExpense) insights.push(`Kategori ${topExpense[0]} menjadi pengeluaran terbesar saat ini.`)
    if (monthlyComparison.value.expenseChange > 0 && monthlyComparison.value.previousMonth) insights.push(`Pengeluaran naik Rp ${monthlyComparison.value.expenseChange.toLocaleString('id-ID')} dibanding ${monthlyComparison.value.previousMonth}.`)
    if (topIncome) insights.push(`Sumber pemasukan terbesar Anda berasal dari ${topIncome[0]}.`)
    if (!insights.length) insights.push('Data masih sehat. Pertahankan ritme pemasukan dan pengeluaran seperti sekarang.')
    return insights
  })

  const exportTransactionsCsv = () => {
    const rows = [['Tanggal', 'Jenis', 'Kategori', 'Nominal', 'Catatan'], ...filteredTransactions.value.map((item) => [item.date, item.type, item.category, String(item.amount), item.note || '-'])]
    return rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
  }

  const buildReportHtml = () => `
    <html><head><title>Laporan Keuangan</title><style>
    body{font-family:Segoe UI,sans-serif;padding:24px;color:#0f172a}h1,h2{margin:0 0 12px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left}ul{padding-left:18px}
    .meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:16px 0}.box{border:1px solid #cbd5e1;border-radius:12px;padding:12px}
    </style></head><body>
    <h1>Laporan Keuangan ${currentMonth()}</h1>
    <div class="meta">
      <div class="box"><strong>Pemasukan</strong><div>Rp ${incomeTotal.value.toLocaleString('id-ID')}</div></div>
      <div class="box"><strong>Pengeluaran</strong><div>Rp ${expenseTotal.value.toLocaleString('id-ID')}</div></div>
      <div class="box"><strong>Saldo</strong><div>Rp ${balance.value.toLocaleString('id-ID')}</div></div>
      <div class="box"><strong>Aset</strong><div>Rp ${totalAssets.value.toLocaleString('id-ID')}</div></div>
    </div>
    <h2>Insight</h2>
    <ul>${automatedInsights.value.map((item) => `<li>${item}</li>`).join('')}</ul>
    <h2>Transaksi</h2>
    <table><thead><tr><th>Tanggal</th><th>Jenis</th><th>Kategori</th><th>Nominal</th><th>Catatan</th></tr></thead>
    <tbody>${filteredTransactions.value.map((item) => `<tr><td>${item.date}</td><td>${item.type}</td><td>${item.category}</td><td>Rp ${item.amount.toLocaleString('id-ID')}</td><td>${item.note || '-'}</td></tr>`).join('')}</tbody></table>
    </body></html>
  `

  const downloadExcelReport = () => {
    const data = filteredTransactions.value.map((item) => ({
      Tanggal: item.date,
      Jenis: item.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      Kategori: item.category,
      'Sub-Kategori': item.subCategory || '-',
      Nominal: item.amount,
      Catatan: item.note || '-'
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transaksi')

    const max_len = data.reduce((acc, row) => {
      acc.Tanggal = Math.max(acc.Tanggal, String(row.Tanggal).length)
      acc.Jenis = Math.max(acc.Jenis, String(row.Jenis).length)
      acc.Kategori = Math.max(acc.Kategori, String(row.Kategori).length)
      acc['Sub-Kategori'] = Math.max(acc['Sub-Kategori'], String(row['Sub-Kategori']).length)
      acc.Nominal = Math.max(acc.Nominal, String(row.Nominal).length)
      acc.Catatan = Math.max(acc.Catatan, String(row.Catatan).length)
      return acc
    }, { Tanggal: 10, Jenis: 12, Kategori: 12, 'Sub-Kategori': 14, Nominal: 12, Catatan: 15 })

    worksheet['!cols'] = Object.keys(max_len).map((key) => ({
      wch: max_len[key as keyof typeof max_len] + 3
    }))

    XLSX.writeFile(workbook, `laporan-keuangan-${currentMonth()}.xlsx`)
    pushToast('Laporan Excel (.xlsx) berhasil diunduh', 'success')
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
    pushToast('CSV berhasil diunduh', 'success')
  }

  const downloadPdfReport = () => {
    const win = window.open('', '_blank', 'width=960,height=720')
    if (!win) {
      pushToast('Popup diblokir browser saat export PDF', 'error')
      return
    }
    win.document.write(buildReportHtml())
    win.document.close()
    win.focus()
    window.setTimeout(() => {
      win.print()
      pushToast('PDF siap dicetak/disimpan dari dialog browser', 'success')
    }, 300)
  }

  const exportSummaryText = computed(() => [
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
  ].join('\n'))

  onMounted(() => {
    if (initialized.value) return
    loadData()
    autoApplyRecurringTransactions()
    initialized.value = true
  })

  watch([transactions, categories, budgets, assets, savingsGoals, recurringTransactions, debts], () => {
    if (initialized.value) saveData()
  }, { deep: true })

  return {
    transactions,
    filteredTransactions,
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
    deleteCategory,
    updateCategory,
    addBudget,
    addAsset,
    updateAsset,
    adjustAssetValue,
    deleteAssetAdjustment,
    addSavingsGoal,
    updateSavingsGoal,
    depositToSavingsGoal,
    deleteSavingsGoal,
    addRecurringTransaction,
    applyRecurringTransaction,
    autoApplyRecurringTransactions,
    deleteRecurringTransaction,
    addDebt,
    toggleDebtStatus,
    updateDebt,
    deleteTransaction,
    updateTransaction,
    exportJsonData,
    importJsonData,
    deleteBudget,
    deleteAsset,
    deleteDebt,
    getBudgetSummary,
    nextMonthForecast,
    categoryForecasts,
    exportTransactionsCsv,
    downloadCsvReport,
    downloadExcelReport,
    downloadPdfReport,
    exportSummaryText,
    resetAllData,
  }
}
