<script setup lang="ts">
import { ref } from 'vue'
import { useFinance } from '../composables/useFinance'

const { debts, totalDebt, totalReceivable, addDebt, toggleDebtStatus, deleteDebt } = useFinance()

const form = ref({
  name: '',
  counterpart: '',
  amount: '',
  dueDate: '',
  kind: 'debt' as 'debt' | 'receivable',
})

const submitDebt = () => {
  addDebt({
    name: form.value.name,
    counterpart: form.value.counterpart,
    amount: Number(form.value.amount),
    dueDate: form.value.dueDate,
    kind: form.value.kind,
  })
  form.value = { name: '', counterpart: '', amount: '', dueDate: '', kind: 'debt' }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
      <div>
        <p class="uppercase tracking-widest text-[10px] text-muted font-bold">Utang & Piutang</p>
        <h1 class="text-xl lg:text-2xl font-extrabold tracking-tight text-text mt-0.5">Kelola kewajiban & tagihan pribadi</h1>
      </div>
      <div class="flex flex-wrap gap-2 shrink-0">
        <span class="px-4 py-2 rounded-full text-xs font-bold text-danger-text bg-danger-soft border border-danger/10 shadow-xs">
          Utang: Rp {{ totalDebt.toLocaleString('id-ID') }}
        </span>
        <span class="px-4 py-2 rounded-full text-xs font-bold text-success bg-emerald-600/10 border border-emerald-600/10 shadow-xs">
          Piutang: Rp {{ totalReceivable.toLocaleString('id-ID') }}
        </span>
      </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">Tambah Catatan</h2>
        <div class="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Judul
            <input v-model="form.name" placeholder="Contoh: Cicilan Laptop" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" />
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Jenis
            <select v-model="form.kind" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-soft transition-all">
              <option value="debt">Utang</option>
              <option value="receivable">Piutang</option>
            </select>
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Pihak terkait
            <input v-model="form.counterpart" placeholder="Contoh: Budi" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" />
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Nominal
            <input v-model="form.amount" type="number" min="0" placeholder="1200000" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" />
          </label>
          <label class="sm:col-span-2 flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Jatuh tempo
            <input v-model="form.dueDate" type="date" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all" />
          </label>
        </div>
        <button class="px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg hover:shadow-primary/20 border-none mt-2 self-start" type="button" @click="submitDebt">
          Simpan Catatan
        </button>
      </section>

      <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">Daftar Kewajiban</h2>
        <div class="flex flex-col gap-3">
          <article v-for="item in debts" :key="item.id" class="flex justify-between items-center gap-4 pb-3.5 border-b border-border last:border-0 last:pb-0">
            <div>
              <strong class="text-sm font-bold text-text">{{ item.name }}</strong>
              <p class="text-xs text-muted font-semibold mt-0.5">{{ item.kind === 'debt' ? 'Utang ke' : 'Piutang dari' }} {{ item.counterpart }}</p>
              <p class="text-xs text-muted font-bold mt-1">Rp {{ item.amount.toLocaleString('id-ID') }} • Jatuh tempo {{ item.dueDate || '-' }}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border" :class="item.status === 'open' ? 'bg-red-500/10 text-danger border-danger/10' : 'bg-emerald-600/10 text-success border-success/10'">
                {{ item.status === 'open' ? 'Belum lunas' : 'Lunas' }}
              </span>
              <button class="px-3 py-1.5 rounded-full text-[10px] font-bold text-primary bg-primary-soft hover:bg-primary-muted transition-all cursor-pointer border-none" type="button" @click="toggleDebtStatus(item.id)">Centang</button>
              <button class="px-3 py-1.5 rounded-full text-[10px] font-bold text-danger-text bg-danger-soft hover:opacity-90 transition-all cursor-pointer border-none" type="button" @click="deleteDebt(item.id)">🗑️</button>
            </div>
          </article>
          <p v-if="!debts.length" class="text-center py-8 text-xs text-muted font-semibold">Belum ada catatan utang/piutang.</p>
        </div>
      </section>
    </div>
  </div>
</template>

