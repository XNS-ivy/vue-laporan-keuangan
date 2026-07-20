<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFinance } from '../composables/useFinance'
import { getDynamicStep, handleNominalKeydown, t, formatMoney, appMode } from '../composables/useUserSettings'

const {
  savingsGoals,
  savingsGoalCurrent,
  savingsGoalMonthly,
  savingsGoalProgress,
  savingsGoalTarget,
  monthsToGoal,
  addSavingsGoal,
  deleteSavingsGoal,
  depositToSavingsGoal,
} = useFinance()

const form = ref({
  name: '',
  targetAmount: '',
  currentAmount: '',
  monthlyContribution: '',
  targetDate: '',
  currency: 'IDR' as any,
})

const activeDepositGoalId = ref<number | null>(null)
const depositAmount = ref<number | ''>('')
const withdrawFromBalance = ref(true)

const remaining = computed(() => Math.max(0, savingsGoalTarget.value - savingsGoalCurrent.value))

const submitGoal = () => {
  addSavingsGoal({
    name: form.value.name,
    targetAmount: Number(form.value.targetAmount),
    currentAmount: Number(form.value.currentAmount),
    monthlyContribution: Number(form.value.monthlyContribution),
    targetDate: form.value.targetDate,
    currency: form.value.currency || 'IDR',
  })
  form.value = { name: '', targetAmount: '', currentAmount: '', monthlyContribution: '', targetDate: '', currency: 'IDR' }
}

const startDeposit = (id: number) => {
  activeDepositGoalId.value = id
  depositAmount.value = ''
  withdrawFromBalance.value = true
}

const handleDeposit = () => {
  if (activeDepositGoalId.value === null) return
  const amount = Number(depositAmount.value)
  if (!amount || amount <= 0) return
  const success = depositToSavingsGoal(activeDepositGoalId.value, amount, withdrawFromBalance.value)
  if (success) {
    activeDepositGoalId.value = null
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="bg-linear-to-br from-sidebar-bg to-sidebar-accent text-white rounded-3xl p-6 lg:p-8 shadow-custom relative overflow-hidden">
      <div class="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
      <div class="z-10 grow max-w-2xl">
        <p class="uppercase tracking-widest text-xs text-white/60 font-bold">{{ t({ id: 'Target Tabungan', en: 'Savings Goal', ja: '貯蓄目標', es: 'Meta de Ahorro' }) }}</p>
        <h1 class="text-2xl lg:text-3xl font-extrabold tracking-tight mt-1">{{ t({ id: 'Wujudkan Celengan & Target Nabungmu', en: 'Realize Your Savings & Goals', ja: '貯金と目標を達成しましょう', es: 'Haga Realidad sus Ahorros y Metas' }) }}</h1>
        <p class="text-sm text-white/80 leading-relaxed mt-2">{{ t({ id: 'Biar impianmu cepat terwujud, yuk buat target tabungan yang spesifik seperti dana darurat, liburan, investasi, atau beli gadget impianmu.', en: 'To make your dreams come true quickly, let\'s create specific savings goals like emergency funds, holidays, investments, or buying your dream gadgets.', ja: '夢を早く実現するために、緊急資金、休暇、投資、または夢のガジェットの購入など、具体的な貯蓄目標を設定しましょう。', es: 'Para hacer realidad sus sueños rápidamente, creemos metas de ahorro específicas como fondos de emergencia, vacaciones, inversiones o la compra de sus dispositivos de ensueño.' }) }}</p>
      </div>
    </header>

    <section class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <article class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">{{ t({ id: 'Tambah Goal', en: 'Add Goal', ja: '目標の追加', es: 'Agregar Meta' }) }}</h2>
        <div class="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Nama Goal', en: 'Goal Name', ja: '目標名', es: 'Nombre de la Meta' }) }}
            <input v-model="form.name" :placeholder="t({ id: 'Contoh: Dana Darurat', en: 'e.g., Emergency Fund', ja: '例: 緊急資金', es: 'ej. Fondo de Emergencia' })" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" />
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Mata Uang Target', en: 'Goal Currency', ja: '目標通貨', es: 'Moneda de la Meta' }) }}
            <select v-model="form.currency" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all">
              <option value="IDR">IDR (Rp)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="SGD">SGD (S$)</option>
              <option value="JPY">JPY (¥)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Target Nominal', en: 'Target Amount', ja: '目標金額', es: 'Monto de Meta' }) }}
            <input 
              v-model="form.targetAmount" 
              type="number" 
              min="0" 
              :step="getDynamicStep(form.targetAmount)"
              @keydown="handleNominalKeydown"
              placeholder="5000000" 
              class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" 
            />
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Dana Terkumpul Awal', en: 'Initial Saved Amount', ja: '初期積立額', es: 'Monto Ahorrado Inicial' }) }}
            <input 
              v-model="form.currentAmount" 
              type="number" 
              min="0" 
              :step="getDynamicStep(form.currentAmount)"
              @keydown="handleNominalKeydown"
              placeholder="1000000" 
              class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" 
            />
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Setoran Bulanan', en: 'Monthly Contribution', ja: '毎月の積立', es: 'Contribución Mensual' }) }}
            <input 
              v-model="form.monthlyContribution" 
              type="number" 
              min="0" 
              :step="getDynamicStep(form.monthlyContribution)"
              @keydown="handleNominalKeydown"
              placeholder="500000" 
              class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" 
            />
          </label>
          <label class="sm:col-span-2 flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Target Tanggal', en: 'Target Date', ja: '目標日', es: 'Fecha Límite' }) }}
            <input v-model="form.targetDate" type="date" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all" />
          </label>
        </div>
        <button class="px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg hover:shadow-primary/20 border-none mt-2 self-start" type="button" @click="submitGoal">
          {{ t({ id: 'Tambah Goal', en: 'Add Goal', ja: '目標の追加', es: 'Agregar Meta' }) }}
        </button>
      </article>

      <article class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <div class="flex items-center justify-between border-b border-border pb-3">
          <h2 class="text-base font-bold text-text tracking-tight">{{ t({ id: 'Ringkasan Goal', en: 'Goal Summary', ja: '目標の概要', es: 'Resumen de Metas' }) }}</h2>
          <span class="text-sm font-bold text-success">{{ savingsGoalProgress }}%</span>
        </div>
        <div class="w-full h-2.5 bg-surface-2 rounded-full overflow-hidden">
          <div class="h-full bg-linear-to-r from-primary to-success transition-all duration-500" :style="{ width: `${savingsGoalProgress}%` }"></div>
        </div>
        <ul class="flex flex-col gap-3 pr-1 text-sm mt-1">
          <li class="flex justify-between items-center text-muted font-medium pb-2 border-b border-border/40">
            <span>{{ t({ id: 'Total Target', en: 'Total Target', ja: '合計目標', es: 'Meta Total' }) }}:</span>
            <strong class="text-text font-bold">{{ formatMoney(savingsGoalTarget) }}</strong>
          </li>
          <li class="flex justify-between items-center text-muted font-medium pb-2 border-b border-border/40">
            <span>{{ t({ id: 'Sudah Terkumpul', en: 'Saved Amount', ja: '積立額', es: 'Monto Ahorrado' }) }}:</span>
            <strong class="text-text font-bold">{{ formatMoney(savingsGoalCurrent) }}</strong>
          </li>
          <li class="flex justify-between items-center text-muted font-medium pb-2 border-b border-border/40">
            <span>{{ t({ id: 'Sisa Nominal', en: 'Remaining Amount', ja: '残りの金額', es: 'Monto Restante' }) }}:</span>
            <strong class="font-bold text-danger">{{ formatMoney(remaining) }}</strong>
          </li>
          <template v-if="appMode === 'advance'">
            <li class="flex justify-between items-center text-muted font-medium pb-2 border-b border-border/40">
              <span>{{ t({ id: 'Setoran Bulanan Total', en: 'Total Monthly Contribution', ja: '毎月の総積立額', es: 'Contribución Mensual Total' }) }}:</span>
              <strong class="text-text font-bold">{{ formatMoney(savingsGoalMonthly) }}</strong>
            </li>
            <li class="flex justify-between items-center text-muted font-medium">
              <span>{{ t({ id: 'Estimasi Tercapai', en: 'Estimated Reached', ja: '達成見込み', es: 'Estimación Alcanzada' }) }}:</span>
              <strong class="font-bold text-primary">{{ monthsToGoal === null ? t({ id: 'Belum bisa dihitung', en: 'Not calculable yet', ja: '計算不可', es: 'No calculable aún' }) : t({ id: `${monthsToGoal} bulan`, en: `${monthsToGoal} months`, ja: `${monthsToGoal}ヶ月`, es: `${monthsToGoal} meses` }) }}</strong>
            </li>
          </template>
        </ul>
      </article>
    </section>

    <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
      <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">{{ t({ id: 'Daftar Goal', en: 'Goal List', ja: '目標リスト', es: 'Lista de Metas' }) }}</h2>
      <div class="flex flex-col gap-4 pr-1">
        <article v-for="item in savingsGoals" :key="item.id" class="pb-4 border-b border-border last:border-0 last:pb-0">
          <div class="flex justify-between items-center gap-4">
            <div>
              <div class="flex items-center gap-2">
                <span v-if="item.currency && item.currency !== 'IDR'" class="text-[10px] px-1.5 py-0.5 rounded bg-primary-soft text-primary font-bold uppercase tracking-wide">{{ item.currency }}</span>
                <strong class="text-sm font-bold text-text">{{ item.name }}</strong>
              </div>
              <p class="text-xs text-muted font-semibold mt-0.5">{{ t({ id: 'Target', en: 'Target', ja: '目標', es: 'Meta' }) }} {{ formatMoney(item.targetAmount, item.currency || 'IDR') }} • {{ t({ id: 'Terkumpul', en: 'Saved', ja: '積立', es: 'Ahorrado' }) }} {{ formatMoney(item.currentAmount, item.currency || 'IDR') }}</p>
              <p class="text-xs text-muted font-semibold mt-0.5">{{ t({ id: 'Setoran bulanan', en: 'Monthly contribution', ja: '毎月の積立', es: 'Contribución mensual' }) }} {{ formatMoney(item.monthlyContribution, item.currency || 'IDR') }} • {{ item.targetDate || t({ id: 'Tanpa target tanggal', en: 'No target date', ja: '目標日なし', es: 'Sin fecha límite' }) }}</p>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button class="px-3.5 py-1.5 rounded-full text-xs font-bold text-primary bg-primary-soft hover:bg-primary-muted transition-all cursor-pointer border-none" type="button" @click="startDeposit(item.id)">{{ t({ id: 'Setor', en: 'Deposit', ja: '積立する', es: 'Depositar' }) }}</button>
              <button class="px-3.5 py-1.5 rounded-full text-xs font-bold text-danger-text bg-danger-soft hover:opacity-90 transition-all cursor-pointer border-none" type="button" @click="deleteSavingsGoal(item.id)">{{ t({ id: 'Hapus', en: 'Delete', ja: '削除', es: 'Eliminar' }) }}</button>
            </div>
          </div>

          <div v-if="activeDepositGoalId === item.id" class="mt-3 p-4 bg-surface-2 border border-border rounded-xl flex flex-col gap-3 text-xs">
            <label class="flex flex-col gap-1.5 font-bold text-muted uppercase tracking-wider">
              {{ t({ id: 'Nominal Setoran', en: 'Deposit Amount', ja: '積立額', es: 'Monto del Depósito' }) }}
              <input 
                v-model.number="depositAmount" 
                type="number" 
                min="0" 
                :step="getDynamicStep(depositAmount)"
                @keydown="handleNominalKeydown"
                placeholder="500000" 
                class="w-full border border-border rounded-xl px-3 py-2 bg-surface text-text font-semibold focus:outline-none" 
              />
            </label>
            <label class="flex items-center gap-2 cursor-pointer font-bold text-muted tracking-wide mt-1">
              <input v-model="withdrawFromBalance" type="checkbox" class="w-4 h-4 cursor-pointer accent-primary" />
              <span>{{ t({ id: 'Potong dari Saldo Utama (catat sebagai pengeluaran)', en: 'Deduct from Main Balance (record as expense)', ja: 'メイン残高から差し引く (支出として記録)', es: 'Deducir del Saldo Principal (registrar como gasto)' }) }}</span>
            </label>
            <div class="flex gap-2 mt-2">
              <button class="px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border-none shadow-sm" type="button" @click="handleDeposit">{{ t({ id: 'Konfirmasi', en: 'Confirm', ja: '確認', es: 'Confirmar' }) }}</button>
              <button class="px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-text bg-surface border border-border hover:bg-surface-2 transition-all cursor-pointer" type="button" @click="activeDepositGoalId = null">{{ t({ id: 'Batal', en: 'Cancel', ja: 'キャンセル', es: 'Cancelar' }) }}</button>
            </div>
          </div>
        </article>
        <p v-if="!savingsGoals.length" class="text-center py-8 text-xs text-muted font-semibold">{{ t({ id: 'Belum ada target tabungan terdaftar.', en: 'No savings goals registered yet.', ja: '登録された貯蓄目標はまだありません。', es: 'Aún no hay metas de ahorro registradas.' }) }}</p>
      </div>
    </section>
  </div>
</template>
