<script setup lang="ts">
import { ref } from 'vue'
import type { TransactionType } from '../composables/useFinance'

const props = defineProps<{
  categories: Array<{ name: string; type: TransactionType }>
}>()

const emit = defineEmits<{
  (e: 'submit', payload: { type: TransactionType; amount: number; category: string; note: string; date: string }): void
}>()

const form = ref({
  type: 'expense' as TransactionType,
  amount: '',
  category: '',
  note: '',
  date: new Date().toISOString().slice(0, 10),
})

const submit = () => {
  const amount = Number(form.value.amount)
  if (!amount || amount <= 0) return

  emit('submit', {
    type: form.value.type,
    amount,
    category: form.value.category,
    note: form.value.note,
    date: form.value.date,
  })

  form.value = {
    type: 'expense',
    amount: '',
    category: '',
    note: '',
    date: new Date().toISOString().slice(0, 10),
  }
}
</script>

<template>
  <section class="card">
    <h2>Tambah Transaksi</h2>
    <div class="form-grid">
      <label>
        Jenis
        <select v-model="form.type">
          <option value="income">Uang Masuk</option>
          <option value="expense">Uang Keluar</option>
        </select>
      </label>
      <label>
        Nominal
        <input v-model="form.amount" type="number" min="0" placeholder="100000" />
      </label>
      <label>
        Kategori
        <input v-model="form.category" :placeholder="form.type === 'income' ? 'Contoh: Gaji' : 'Contoh: Makan'" />
      </label>
      <label>
        Tanggal
        <input v-model="form.date" type="date" />
      </label>
      <label class="full">
        Catatan
        <input v-model="form.note" placeholder="Tambahkan catatan" />
      </label>
    </div>
    <button class="primary-btn" @click="submit">Simpan Transaksi</button>
    <div class="suggestions" v-if="props.categories.length">
      <span v-for="item in props.categories" :key="item.name" class="chip">{{ item.name }}</span>
    </div>
  </section>
</template>

<style scoped>
.card {
  background: white;
  border-radius: 16px;
  padding: 1rem;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.form-grid {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-bottom: 0.8rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.95rem;
  color: #334155;
}

input,
select,
button {
  font: inherit;
}

input,
select {
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 0.7rem 0.8rem;
  background: #f8fafc;
}

.full {
  grid-column: 1 / -1;
}

.primary-btn {
  border: none;
  border-radius: 999px;
  padding: 0.65rem 1rem;
  cursor: pointer;
  background: #2563eb;
  color: white;
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.8rem;
}

.chip {
  background: #eff6ff;
  color: #1d4ed8;
  border-radius: 999px;
  padding: 0.4rem 0.7rem;
  font-size: 0.85rem;
}

@media (max-width: 700px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
