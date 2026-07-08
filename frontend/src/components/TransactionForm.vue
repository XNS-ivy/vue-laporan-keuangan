<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TransactionType } from '../composables/useFinance'

const props = defineProps<{
  categories: Array<{ name: string; type: TransactionType }>
}>()

const emit = defineEmits<{
  (e: 'submit', payload: { type: TransactionType; amount: number; category: string; note: string; date: string }): void
  (e: 'add-category', payload: { name: string; type: TransactionType }): void
}>()

const form = ref({
  type: 'expense' as TransactionType,
  amount: '',
  category: '',
  note: '',
  date: new Date().toISOString().slice(0, 10),
})

const categorySuggestions = computed(() =>
  props.categories.filter((item) => item.type === form.value.type).map((item) => item.name),
)

const canAddCategory = computed(() => {
  const categoryName = form.value.category.trim()
  if (!categoryName) return false
  return !props.categories.some(
    (item) => item.type === form.value.type && item.name.toLowerCase() === categoryName.toLowerCase(),
  )
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

const addCategory = () => {
  const categoryName = form.value.category.trim()
  if (!categoryName || !canAddCategory.value) return
  emit('add-category', { name: categoryName, type: form.value.type })
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
        <div class="category-input">
          <input
            v-model="form.category"
            :list="`category-options-${form.type}`"
            :placeholder="form.type === 'income' ? 'Contoh: Gaji atau Bonus' : 'Contoh: Makan atau Kopi'"
          />
          <button v-if="canAddCategory" class="ghost-btn" type="button" @click="addCategory">Tambah kategori</button>
        </div>
        <datalist :id="`category-options-${form.type}`">
          <option v-for="item in categorySuggestions" :key="item" :value="item"></option>
        </datalist>
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
    <div class="suggestions" v-if="categorySuggestions.length">
      <button
        v-for="item in categorySuggestions"
        :key="item"
        class="chip chip-btn"
        type="button"
        @click="form.category = item"
      >
        {{ item }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 1rem;
  box-shadow: var(--shadow);
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
  color: var(--text);
}

.full {
  grid-column: 1 / -1;
}

.category-input {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.8rem;
}

.chip {
  border-radius: 999px;
  padding: 0.4rem 0.7rem;
  font-size: 0.85rem;
}

.chip-btn {
  border: none;
  cursor: pointer;
}

@media (max-width: 700px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .category-input {
    flex-direction: column;
  }
}
</style>
