<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFinance } from '../composables/useFinance'

const { savingsGoals, savingsGoalCurrent, savingsGoalMonthly, savingsGoalProgress, savingsGoalTarget, monthsToGoal, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal } = useFinance()

const form = ref({
  name: '',
  targetAmount: '',
  currentAmount: '',
  monthlyContribution: '',
  targetDate: '',
})

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
</script>

<template>
  <div class="page">
    <header class="hero">
      <div>
        <p class="eyebrow">Target Tabungan</p>
        <h1>Kelola lebih dari satu goal</h1>
        <p>Sekarang target tabungan tidak lagi satu angka global. User bisa punya beberapa tujuan sekaligus seperti dana darurat, liburan, atau gadget.</p>
      </div>
    </header>

    <section class="grid">
      <article class="card">
        <h2>Tambah Goal</h2>
        <div class="form-grid">
          <label>
            Nama goal
            <input v-model="form.name" placeholder="Contoh: Dana Darurat" />
          </label>
          <label>
            Target nominal
            <input v-model="form.targetAmount" type="number" min="0" placeholder="5000000" />
          </label>
          <label>
            Dana terkumpul
            <input v-model="form.currentAmount" type="number" min="0" placeholder="1000000" />
          </label>
          <label>
            Setoran bulanan
            <input v-model="form.monthlyContribution" type="number" min="0" placeholder="500000" />
          </label>
          <label>
            Target tanggal
            <input v-model="form.targetDate" type="date" />
          </label>
        </div>
        <button class="primary-btn" type="button" @click="submitGoal">Tambah Goal</button>
      </article>

      <article class="card progress-card">
        <div class="progress-head">
          <h2>Ringkasan Goal</h2>
          <span>{{ savingsGoalProgress }}%</span>
        </div>
        <div class="bar"><span :style="{ width: `${savingsGoalProgress}%` }"></span></div>
        <ul class="facts">
          <li>Total target: <strong>Rp {{ savingsGoalTarget.toLocaleString('id-ID') }}</strong></li>
          <li>Sudah terkumpul: <strong>Rp {{ savingsGoalCurrent.toLocaleString('id-ID') }}</strong></li>
          <li>Sisa nominal: <strong>Rp {{ remaining.toLocaleString('id-ID') }}</strong></li>
          <li>Setoran bulanan total: <strong>Rp {{ savingsGoalMonthly.toLocaleString('id-ID') }}</strong></li>
          <li>Estimasi tercapai: <strong>{{ monthsToGoal === null ? 'Belum bisa dihitung' : `${monthsToGoal} bulan` }}</strong></li>
        </ul>
      </article>
    </section>

    <section class="card">
      <h2>Daftar Goal</h2>
      <div class="goal-list">
        <article v-for="item in savingsGoals" :key="item.id" class="goal-item">
          <div>
            <strong>{{ item.name }}</strong>
            <p>Target Rp {{ item.targetAmount.toLocaleString('id-ID') }} • Terkumpul Rp {{ item.currentAmount.toLocaleString('id-ID') }}</p>
            <p>Setoran bulanan Rp {{ item.monthlyContribution.toLocaleString('id-ID') }} • {{ item.targetDate || 'Tanpa target tanggal' }}</p>
          </div>
          <div class="actions">
            <button class="ghost-btn" type="button" @click="updateSavingsGoal(item.id, { currentAmount: item.currentAmount + item.monthlyContribution })">Tambah progres</button>
            <button class="ghost-btn" type="button" @click="deleteSavingsGoal(item.id)">Hapus</button>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 1rem; }
.hero { background: linear-gradient(135deg, var(--sidebar-bg), var(--hero-accent)); color: white; border-radius: 24px; padding: 1.3rem 1.4rem; box-shadow: var(--shadow); }
.eyebrow { text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.8rem; opacity: 0.8; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 1rem; box-shadow: var(--shadow); }
.form-grid { display: grid; gap: 0.85rem; margin-bottom: 1rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
label { display: flex; flex-direction: column; gap: 0.35rem; color: var(--text); }
.progress-card { display: flex; flex-direction: column; gap: 0.8rem; }
.progress-head { display: flex; justify-content: space-between; align-items: center; }
.bar { width: 100%; height: 10px; background: var(--surface-2); border-radius: 999px; overflow: hidden; }
.bar span { display: block; height: 100%; background: linear-gradient(90deg, var(--primary), var(--success)); }
.facts { margin: 0; padding-left: 1rem; color: var(--muted); }
.facts strong { color: var(--text); }
.goal-list { display: flex; flex-direction: column; gap: 0.8rem; }
.goal-item { display: flex; justify-content: space-between; gap: 1rem; align-items: center; padding-bottom: 0.8rem; border-bottom: 1px solid var(--border); }
.actions { display: flex; gap: 0.6rem; flex-wrap: wrap; }
@media (max-width: 900px) { .form-grid { grid-template-columns: 1fr; } .goal-item { flex-direction: column; align-items: flex-start; } }
</style>
