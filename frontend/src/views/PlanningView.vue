<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFinance } from '../composables/useFinance'

const { budgets, addBudget, categories, deleteBudget, getBudgetSummary } = useFinance()
const month = ref(new Date().toISOString().slice(0, 7))
const budgetItems = computed(() => getBudgetSummary(month.value))
const form = ref({ category: '', amount: '', month: month.value })

const submitBudget = () => {
  addBudget({ category: form.value.category, amount: Number(form.value.amount), month: form.value.month })
  form.value = { category: '', amount: '', month: month.value }
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Planning</p>
        <h1>Atur batas pengeluaran bulanan</h1>
      </div>
      <input v-model="month" type="month" />
    </header>

    <div class="content-grid">
      <section class="card">
        <h2>Buat Anggaran</h2>
        <div class="form-grid">
          <label>
            Kategori
            <input v-model="form.category" placeholder="Contoh: Belanja" />
          </label>
          <label>
            Nominal
            <input v-model="form.amount" type="number" min="0" placeholder="500000" />
          </label>
          <label>
            Bulan
            <input v-model="form.month" type="month" />
          </label>
        </div>
        <button class="primary-btn" @click="submitBudget">Simpan Anggaran</button>
        <div class="chip-list">
          <span v-for="item in categories" :key="item.id" class="chip">{{ item.name }}</span>
        </div>
      </section>

      <section class="card">
        <h2>Ringkasan Anggaran</h2>
        <div v-for="item in budgetItems" :key="item.id" class="budget-item">
          <div>
            <strong>{{ item.category }}</strong>
            <p>Target {{ item.amount.toLocaleString('id-ID') }} • Terpakai {{ item.used.toLocaleString('id-ID') }}</p>
          </div>
          <div class="right">
            <span :class="item.remaining >= 0 ? 'good' : 'warn'">Sisa {{ item.remaining.toLocaleString('id-ID') }}</span>
            <div class="bar"><span :style="{ width: `${item.progress}%` }"></span></div>
            <button class="ghost-btn" @click="deleteBudget(item.id)">Hapus</button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 1rem; }
.page-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
.eyebrow { text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.8rem; color: #64748b; }
.content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.card { background: white; border-radius: 16px; padding: 1rem; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06); }
.form-grid { display: grid; gap: 0.8rem; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-bottom: 0.8rem; }
label { display: flex; flex-direction: column; gap: 0.35rem; }
input { border: 1px solid #cbd5e1; border-radius: 10px; padding: 0.7rem 0.8rem; background: #f8fafc; }
.primary-btn, .ghost-btn { border: none; border-radius: 999px; padding: 0.65rem 1rem; cursor: pointer; }
.primary-btn { background: #2563eb; color: white; }
.ghost-btn { background: #fee2e2; color: #b91c1c; }
.chip-list { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.8rem; }
.chip { background: #eff6ff; color: #1d4ed8; border-radius: 999px; padding: 0.4rem 0.7rem; font-size: 0.85rem; }
.budget-item { display: flex; justify-content: space-between; gap: 1rem; align-items: center; padding: 0.7rem 0; border-bottom: 1px solid #e2e8f0; }
.right { display: flex; flex-direction: column; gap: 0.4rem; min-width: 140px; }
.bar { width: 100%; height: 8px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
.bar span { display: block; height: 100%; background: linear-gradient(90deg, #2563eb, #22c55e); }
.good { color: #16a34a; font-weight: 600; }
.warn { color: #dc2626; font-weight: 600; }
@media (max-width: 900px) { .content-grid { grid-template-columns: 1fr; } .page-header { flex-direction: column; align-items: flex-start; } .form-grid { grid-template-columns: 1fr; } .budget-item { flex-direction: column; align-items: flex-start; } }
</style>
