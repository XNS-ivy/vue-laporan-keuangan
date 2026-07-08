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
  <div class="page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Utang & Piutang</p>
        <h1>Kelola kewajiban dan tagihan pribadi</h1>
      </div>
      <div class="header-metrics">
        <span class="pill">Utang: Rp {{ totalDebt.toLocaleString('id-ID') }}</span>
        <span class="pill">Piutang: Rp {{ totalReceivable.toLocaleString('id-ID') }}</span>
      </div>
    </header>

    <div class="content-grid">
      <section class="card">
        <h2>Tambah Catatan</h2>
        <div class="form-grid">
          <label>
            Judul
            <input v-model="form.name" placeholder="Contoh: Cicilan Laptop" />
          </label>
          <label>
            Jenis
            <select v-model="form.kind">
              <option value="debt">Utang</option>
              <option value="receivable">Piutang</option>
            </select>
          </label>
          <label>
            Pihak terkait
            <input v-model="form.counterpart" placeholder="Contoh: Budi" />
          </label>
          <label>
            Nominal
            <input v-model="form.amount" type="number" min="0" placeholder="1200000" />
          </label>
          <label>
            Jatuh tempo
            <input v-model="form.dueDate" type="date" />
          </label>
        </div>
        <button class="primary-btn" type="button" @click="submitDebt">Simpan</button>
      </section>

      <section class="card">
        <h2>Daftar Kewajiban</h2>
        <div class="debt-list">
          <article v-for="item in debts" :key="item.id" class="debt-item">
            <div>
              <strong>{{ item.name }}</strong>
              <p>{{ item.kind === 'debt' ? 'Utang ke' : 'Piutang dari' }} {{ item.counterpart }}</p>
              <p>Rp {{ item.amount.toLocaleString('id-ID') }} • Jatuh tempo {{ item.dueDate || '-' }}</p>
            </div>
            <div class="actions">
              <span class="status" :class="item.status">{{ item.status === 'open' ? 'Belum lunas' : 'Lunas' }}</span>
              <button class="primary-btn" type="button" @click="toggleDebtStatus(item.id)">Toggle status</button>
              <button class="ghost-btn" type="button" @click="deleteDebt(item.id)">Hapus</button>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 1rem; }
.page-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
.eyebrow { text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.8rem; color: var(--muted); }
.header-metrics { display: flex; gap: 0.6rem; flex-wrap: wrap; }
.pill { border-radius: 999px; padding: 0.45rem 0.8rem; }
.content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 1rem; box-shadow: var(--shadow); }
.form-grid { display: grid; gap: 0.8rem; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-bottom: 0.8rem; }
label { display: flex; flex-direction: column; gap: 0.35rem; color: var(--text); }
.debt-list { display: flex; flex-direction: column; gap: 0.8rem; }
.debt-item { display: flex; justify-content: space-between; gap: 1rem; align-items: center; padding-bottom: 0.8rem; border-bottom: 1px solid var(--border); }
.actions { display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-end; }
.status { font-size: 0.9rem; }
.status.open { color: var(--danger); }
.status.paid { color: var(--success); }
@media (max-width: 900px) { .content-grid { grid-template-columns: 1fr; } .page-header, .debt-item { flex-direction: column; align-items: flex-start; } .form-grid { grid-template-columns: 1fr; } .actions { align-items: flex-start; } }
</style>
