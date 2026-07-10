<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFinance } from '../composables/useFinance'

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
  })
  form.value = { name: '', targetAmount: '', currentAmount: '', monthlyContribution: '', targetDate: '' }
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
    <header class="bg-gradient-to-br from-sidebar-bg to-sidebar-accent text-white rounded-3xl p-6 lg:p-8 shadow-custom relative overflow-hidden">
      <div class="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
      <div class="z-10 flex-grow max-w-2xl">
        <p class="uppercase tracking-widest text-[10px] text-white/60 font-bold">Target Tabungan</p>
        <h1 class="text-2xl lg:text-3xl font-extrabold tracking-tight mt-1">Kelola lebih dari satu goal tabungan</h1>
        <p class="text-sm text-white/80 leading-relaxed mt-2">Dukung rencana keuangan masa depan Anda dengan membuat berbagai target tabungan spesifik seperti dana darurat, liburan, investasi, atau gadget baru.</p>
      </div>
    </header>

    <section class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <article class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">Tambah Goal</h2>
        <div class="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Nama Goal
            <input v-model="form.name" placeholder="Contoh: Dana Darurat" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" />
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Target Nominal (Rp)
            <input v-model="form.targetAmount" type="number" min="0" placeholder="5000000" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" />
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Dana Terkumpul Awal (Rp)
            <input v-model="form.currentAmount" type="number" min="0" placeholder="1000000" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" />
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Setoran Bulanan (Rp)
            <input v-model="form.monthlyContribution" type="number" min="0" placeholder="500000" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" />
          </label>
          <label class="sm:col-span-2 flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Target Tanggal
            <input v-model="form.targetDate" type="date" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all" />
          </label>
        </div>
        <button class="px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg hover:shadow-primary/20 border-none mt-2 self-start" type="button" @click="submitGoal">
          Tambah Goal
        </button>
      </article>

      <article class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <div class="flex items-center justify-between border-b border-border pb-3">
          <h2 class="text-base font-bold text-text tracking-tight">Ringkasan Goal</h2>
          <span class="text-sm font-bold text-success">{{ savingsGoalProgress }}%</span>
        </div>
        <div class="w-full h-2.5 bg-surface-2 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-primary to-success transition-all duration-500" :style="{ width: `${savingsGoalProgress}%` }"></div>
        </div>
        <ul class="flex flex-col gap-3 pr-1 text-sm mt-1">
          <li class="flex justify-between items-center text-muted font-medium pb-2 border-b border-border/40">
            <span>Total Target:</span>
            <strong class="text-text font-bold">Rp {{ savingsGoalTarget.toLocaleString('id-ID') }}</strong>
          </li>
          <li class="flex justify-between items-center text-muted font-medium pb-2 border-b border-border/40">
            <span>Sudah Terkumpul:</span>
            <strong class="text-text font-bold">Rp {{ savingsGoalCurrent.toLocaleString('id-ID') }}</strong>
          </li>
          <li class="flex justify-between items-center text-muted font-medium pb-2 border-b border-border/40">
            <span>Sisa Nominal:</span>
            <strong class="text-text font-bold text-danger">Rp {{ remaining.toLocaleString('id-ID') }}</strong>
          </li>
          <li class="flex justify-between items-center text-muted font-medium pb-2 border-b border-border/40">
            <span>Setoran Bulanan Total:</span>
            <strong class="text-text font-bold">Rp {{ savingsGoalMonthly.toLocaleString('id-ID') }}</strong>
          </li>
          <li class="flex justify-between items-center text-muted font-medium">
            <span>Estimasi Tercapai:</span>
            <strong class="text-text font-bold text-primary">{{ monthsToGoal === null ? 'Belum bisa dihitung' : `${monthsToGoal} bulan` }}</strong>
          </li>
        </ul>
      </article>
    </section>

    <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
      <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">Daftar Goal</h2>
      <div class="flex flex-col gap-4 pr-1">
        <article v-for="item in savingsGoals" :key="item.id" class="pb-4 border-b border-border last:border-0 last:pb-0">
          <div class="flex justify-between items-center gap-4">
            <div>
              <strong class="text-sm font-bold text-text">{{ item.name }}</strong>
              <p class="text-xs text-muted font-semibold mt-0.5">Target Rp {{ item.targetAmount.toLocaleString('id-ID') }} • Terkumpul Rp {{ item.currentAmount.toLocaleString('id-ID') }}</p>
              <p class="text-xs text-muted font-semibold mt-0.5">Setoran bulanan Rp {{ item.monthlyContribution.toLocaleString('id-ID') }} • {{ item.targetDate || 'Tanpa target tanggal' }}</p>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button class="px-3.5 py-1.5 rounded-full text-xs font-bold text-primary bg-primary-soft hover:bg-primary-muted transition-all cursor-pointer border-none" type="button" @click="startDeposit(item.id)">Setor</button>
              <button class="px-3.5 py-1.5 rounded-full text-xs font-bold text-danger-text bg-danger-soft hover:opacity-90 transition-all cursor-pointer border-none" type="button" @click="deleteSavingsGoal(item.id)">Hapus</button>
            </div>
          </div>

          <div v-if="activeDepositGoalId === item.id" class="mt-3 p-4 bg-surface-2 border border-border rounded-xl flex flex-col gap-3 text-xs">
            <label class="flex flex-col gap-1.5 font-bold text-muted uppercase tracking-wider">
              Nominal Setoran (Rp)
              <input v-model.number="depositAmount" type="number" min="0" placeholder="500000" class="w-full border border-border rounded-xl px-3 py-2 bg-surface text-text font-semibold focus:outline-none" />
            </label>
            <label class="flex items-center gap-2 cursor-pointer font-bold text-muted tracking-wide mt-1">
              <input v-model="withdrawFromBalance" type="checkbox" class="w-4 h-4 cursor-pointer accent-primary" />
              <span>Potong dari Saldo Utama (catat sebagai pengeluaran)</span>
            </label>
            <div class="flex gap-2 mt-2">
              <button class="px-4 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border-none shadow-sm" type="button" @click="handleDeposit">Konfirmasi</button>
              <button class="px-4 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-text bg-surface border border-border hover:bg-surface-2 transition-all cursor-pointer" type="button" @click="activeDepositGoalId = null">Batal</button>
            </div>
          </div>
        </article>
        <p v-if="!savingsGoals.length" class="text-center py-8 text-xs text-muted font-semibold">Belum ada target tabungan terdaftar.</p>
      </div>
    </section>
  </div>
</template>

