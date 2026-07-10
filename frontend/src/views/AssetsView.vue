<script setup lang="ts">
import { computed, ref } from 'vue'
import FinanceChart from '../components/FinanceChart.vue'
import { useFinance } from '../composables/useFinance'

const { assets, addAsset, assetGrowthTrend, deleteAsset, totalAssets } = useFinance()
const form = ref({ name: '', amount: '', type: 'cash' as 'cash' | 'bank' | 'investment', date: new Date().toISOString().slice(0, 10) })

const submitAsset = () => {
  addAsset({ name: form.value.name, amount: Number(form.value.amount), type: form.value.type, date: form.value.date })
  form.value = { name: '', amount: '', type: 'cash', date: new Date().toISOString().slice(0, 10) }
}

const totalByType = computed(() => {
  const grouped = new Map<string, number>()
  assets.value.forEach((item) => grouped.set(item.type, (grouped.get(item.type) || 0) + item.amount))
  return Array.from(grouped.entries())
})

const assetGrowthChartData = computed(() => ({
  labels: assetGrowthTrend.value.map(([month]) => month),
  datasets: [
    {
      label: 'Pertumbuhan Aset',
      data: assetGrowthTrend.value.map(([, amount]) => amount),
      borderColor: '#16a34a',
      backgroundColor: 'rgba(34, 197, 94, 0.12)',
      fill: true,
      tension: 0.3,
    },
  ],
}))
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
      <div>
        <p class="uppercase tracking-widest text-[10px] text-muted font-bold">Aset</p>
        <h1 class="text-xl lg:text-2xl font-extrabold tracking-tight text-text mt-0.5">Pantau nilai & pertumbuhan aset Anda</h1>
      </div>
      <div class="px-4.5 py-2.5 rounded-full text-sm font-bold text-success bg-emerald-600/10 border border-emerald-600/10 shrink-0">
        Total: Rp {{ totalAssets.toLocaleString('id-ID') }}
      </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">Tambah Aset</h2>
        <div class="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Nama Aset
            <input v-model="form.name" placeholder="Contoh: Tabungan" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" />
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Nominal
            <input v-model="form.amount" type="number" min="0" placeholder="2000000" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" />
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Tipe
            <select v-model="form.type" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-soft transition-all">
              <option value="cash">Tunai</option>
              <option value="bank">Bank</option>
              <option value="investment">Investasi</option>
            </select>
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Tanggal
            <input v-model="form.date" type="date" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all" />
          </label>
        </div>
        <button class="px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg hover:shadow-primary/20 border-none mt-2 self-start" @click="submitAsset">
          Tambah Aset
        </button>
      </section>

      <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">Ringkasan Aset</h2>
        
        <ul class="flex flex-col gap-3">
          <li v-for="item in totalByType" :key="item[0]" class="flex justify-between items-center gap-4 pb-2 border-b border-border last:border-0 last:pb-0">
            <strong class="text-sm font-bold text-muted uppercase tracking-wider">{{ item[0] }}</strong>
            <span class="text-sm font-extrabold text-text">Rp {{ item[1].toLocaleString('id-ID') }}</span>
          </li>
        </ul>
        
        <h3 class="text-xs font-bold text-muted uppercase tracking-wider border-t border-border pt-4 mt-2 mb-1">Daftar Rincian Aset</h3>
        <ul class="flex flex-col gap-3 pr-1">
          <li v-for="item in assets" :key="item.id" class="flex justify-between items-center gap-4 pb-3 border-b border-border last:border-0 last:pb-0">
            <div>
              <strong class="text-sm font-bold text-text">{{ item.name }}</strong>
              <p class="text-xs text-muted font-semibold mt-0.5">{{ item.type }} • {{ item.date }}</p>
            </div>
            <div class="flex items-center gap-3.5 shrink-0">
              <span class="text-sm font-bold text-text">Rp {{ item.amount.toLocaleString('id-ID') }}</span>
              <button class="px-3 py-1.5 rounded-full text-xs font-bold text-danger-text bg-danger-soft hover:opacity-90 transition-all cursor-pointer border-none" @click="deleteAsset(item.id)">🗑️</button>
            </div>
          </li>
        </ul>
      </section>
    </div>

    <FinanceChart type="line" title="Pertumbuhan Aset" :data="assetGrowthChartData" />
  </div>
</template>

