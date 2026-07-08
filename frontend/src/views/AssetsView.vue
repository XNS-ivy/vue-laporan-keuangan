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
      backgroundColor: 'rgba(34, 197, 94, 0.18)',
      fill: true,
      tension: 0.3,
    },
  ],
}))
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Aset</p>
        <h1>Pantau nilai dan pertumbuhan aset Anda</h1>
      </div>
      <div class="pill">Total: Rp {{ totalAssets.toLocaleString('id-ID') }}</div>
    </header>

    <div class="content-grid">
      <section class="card">
        <h2>Tambah Aset</h2>
        <div class="form-grid">
          <label>
            Nama Aset
            <input v-model="form.name" placeholder="Contoh: Tabungan" />
          </label>
          <label>
            Nominal
            <input v-model="form.amount" type="number" min="0" placeholder="2000000" />
          </label>
          <label>
            Tipe
            <select v-model="form.type">
              <option value="cash">Tunai</option>
              <option value="bank">Bank</option>
              <option value="investment">Investasi</option>
            </select>
          </label>
          <label>
            Tanggal
            <input v-model="form.date" type="date" />
          </label>
        </div>
        <button class="primary-btn" @click="submitAsset">Tambah Aset</button>
      </section>

      <section class="card">
        <h2>Ringkasan Aset</h2>
        <ul class="list">
          <li v-for="item in totalByType" :key="item[0]" class="list-item">
            <strong>{{ item[0] }}</strong>
            <span>Rp {{ item[1].toLocaleString('id-ID') }}</span>
          </li>
        </ul>
        <ul class="list">
          <li v-for="item in assets" :key="item.id" class="list-item">
            <div>
              <strong>{{ item.name }}</strong>
              <p>{{ item.type }} • {{ item.date }}</p>
            </div>
            <div class="meta">
              <span>Rp {{ item.amount.toLocaleString('id-ID') }}</span>
              <button class="ghost-btn" @click="deleteAsset(item.id)">Hapus</button>
            </div>
          </li>
        </ul>
      </section>
    </div>

    <FinanceChart type="line" title="Pertumbuhan Aset" :data="assetGrowthChartData" />
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 1rem; }
.page-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
.eyebrow { text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.8rem; color: var(--muted); }
.pill { border-radius: 999px; padding: 0.45rem 0.8rem; }
.content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 1rem; box-shadow: var(--shadow); }
.form-grid { display: grid; gap: 0.8rem; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-bottom: 0.8rem; }
label { display: flex; flex-direction: column; gap: 0.35rem; color: var(--text); }
.list { list-style: none; padding: 0; margin: 0.7rem 0 0; display: flex; flex-direction: column; gap: 0.7rem; }
.list-item { display: flex; justify-content: space-between; gap: 1rem; align-items: center; padding-bottom: 0.7rem; border-bottom: 1px solid var(--border); }
.meta { display: flex; align-items: center; gap: 0.7rem; }
@media (max-width: 900px) { .content-grid { grid-template-columns: 1fr; } .page-header { flex-direction: column; align-items: flex-start; } .form-grid { grid-template-columns: 1fr; } }
</style>
