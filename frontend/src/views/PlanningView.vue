<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFinance } from '../composables/useFinance'

const { addBudget, budgetAlerts, categories, currentMonthBudgetSummary, deleteBudget, getBudgetSummary, monthlyComparison } = useFinance()
const month = ref(new Date().toISOString().slice(0, 7))
const budgetItems = computed(() => getBudgetSummary(month.value))
const expenseCategories = computed(() => categories.value.filter((item) => item.type === 'expense'))
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
        <p class="subtle">Budget sekarang dilengkapi alert otomatis dan konteks perbandingan bulan ke bulan.</p>
      </div>
      <input v-model="month" type="month" />
    </header>

    <section v-if="budgetAlerts.length" class="card alert-card">
      <h2>Alert Bulan Ini</h2>
      <div class="alert-list">
        <div v-for="item in budgetAlerts" :key="item.id" class="alert-item" :class="item.level">
          <strong>{{ item.category }}</strong>
          <span>{{ item.message }}</span>
        </div>
      </div>
    </section>

    <div class="content-grid">
      <section class="card">
        <h2>Buat Anggaran</h2>
        <div class="form-grid">
          <label>
            Kategori
            <input v-model="form.category" list="expense-categories" placeholder="Contoh: Belanja" />
            <datalist id="expense-categories">
              <option v-for="item in expenseCategories" :key="item.id" :value="item.name"></option>
            </datalist>
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
          <span v-for="item in expenseCategories" :key="item.id" class="chip">{{ item.name }}</span>
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

    <section class="card">
      <h2>Perbandingan Bulan Berjalan</h2>
      <div class="comparison-grid">
        <div class="comparison-item">
          <span>Pemasukan</span>
          <strong>{{ monthlyComparison.incomeChange >= 0 ? '+' : '' }}Rp {{ monthlyComparison.incomeChange.toLocaleString('id-ID') }}</strong>
        </div>
        <div class="comparison-item">
          <span>Pengeluaran</span>
          <strong>{{ monthlyComparison.expenseChange >= 0 ? '+' : '' }}Rp {{ monthlyComparison.expenseChange.toLocaleString('id-ID') }}</strong>
        </div>
        <div class="comparison-item">
          <span>Net</span>
          <strong>{{ monthlyComparison.netChange >= 0 ? '+' : '' }}Rp {{ monthlyComparison.netChange.toLocaleString('id-ID') }}</strong>
        </div>
      </div>
      <p class="subtle">Budget aktif bulan ini: {{ currentMonthBudgetSummary.length }} kategori.</p>
    </section>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 1rem; }
.page-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
.eyebrow { text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.8rem; color: var(--muted); }
.subtle { color: var(--muted); }
.content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 1rem; box-shadow: var(--shadow); }
.form-grid { display: grid; gap: 0.8rem; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-bottom: 0.8rem; }
label { display: flex; flex-direction: column; gap: 0.35rem; color: var(--text); }
.chip-list { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.8rem; }
.chip { border-radius: 999px; padding: 0.4rem 0.7rem; font-size: 0.85rem; }
.budget-item { display: flex; justify-content: space-between; gap: 1rem; align-items: center; padding: 0.7rem 0; border-bottom: 1px solid var(--border); }
.right { display: flex; flex-direction: column; gap: 0.4rem; min-width: 140px; }
.bar { width: 100%; height: 8px; background: var(--surface-2); border-radius: 999px; overflow: hidden; }
.bar span { display: block; height: 100%; background: linear-gradient(90deg, var(--primary), var(--success)); }
.good { color: var(--success); font-weight: 600; }
.warn { color: var(--danger); font-weight: 600; }
.alert-card { border-color: color-mix(in srgb, var(--danger) 20%, var(--border)); }
.alert-list { display: flex; flex-wrap: wrap; gap: 0.7rem; }
.alert-item { display: flex; flex-direction: column; gap: 0.25rem; padding: 0.8rem 0.9rem; border-radius: 14px; background: var(--surface-2); border: 1px solid var(--border); }
.alert-item.warning { border-color: #f59e0b; }
.alert-item.danger { border-color: var(--danger); }
.comparison-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.8rem; }
.comparison-item { border: 1px solid var(--border); border-radius: 14px; padding: 0.85rem; background: var(--surface-2); display: flex; flex-direction: column; gap: 0.35rem; }
@media (max-width: 900px) { .content-grid { grid-template-columns: 1fr; } .page-header { flex-direction: column; align-items: flex-start; } .form-grid { grid-template-columns: 1fr; } .budget-item { flex-direction: column; align-items: flex-start; } }
</style>
