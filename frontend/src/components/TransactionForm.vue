<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { TransactionType, Transaction } from '../composables/useFinance'
import { getDynamicStep, handleNominalKeydown, t } from '../composables/useUserSettings'

const props = defineProps<{
  categories: Array<{ name: string; type: TransactionType }>
  editTransaction?: Transaction | null
}>()

const emit = defineEmits<{
  (e: 'submit', payload: { type: TransactionType; amount: number; category: string; subCategory?: string; note: string; date: string }): void
  (e: 'update', id: number, payload: { type: TransactionType; amount: number; category: string; subCategory?: string; note: string; date: string }): void
  (e: 'add-category', payload: { name: string; type: TransactionType }): void
  (e: 'cancel-edit'): void
}>()

const form = ref({
  type: 'expense' as TransactionType,
  amount: '',
  category: '',
  subCategory: '',
  note: '',
  date: new Date().toISOString().slice(0, 10),
})

const resetForm = () => {
  form.value = {
    type: 'expense',
    amount: '',
    category: '',
    subCategory: '',
    note: '',
    date: new Date().toISOString().slice(0, 10),
  }
}

// Watch for editTransaction changes to populate/reset form
watch(
  () => props.editTransaction,
  (newVal) => {
    if (newVal) {
      form.value = {
        type: newVal.type,
        amount: String(newVal.amount),
        category: newVal.category,
        subCategory: newVal.subCategory || '',
        note: newVal.note,
        date: newVal.date,
      }
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

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

  const payload = {
    type: form.value.type,
    amount,
    category: form.value.category,
    subCategory: form.value.subCategory.trim() || undefined,
    note: form.value.note,
    date: form.value.date,
  }

  if (props.editTransaction) {
    emit('update', props.editTransaction.id, payload)
  } else {
    emit('submit', payload)
  }

  resetForm()
}

const cancel = () => {
  emit('cancel-edit')
  resetForm()
}

const addCategory = () => {
  const categoryName = form.value.category.trim()
  if (!categoryName || !canAddCategory.value) return
  emit('add-category', { name: categoryName, type: form.value.type })
}
</script>

<template>
  <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
    <h2 class="text-lg font-bold text-text tracking-tight border-b border-border pb-2">
      {{ props.editTransaction ? t({ id: 'Edit Transaksi', en: 'Edit Transaction', ja: '取引の編集', es: 'Editar Transacción' }) : t({ id: 'Tambah Transaksi', en: 'Add Transaction', ja: '取引の追加', es: 'Agregar Transacción' }) }}
    </h2>
    
    <div class="grid gap-4 grid-cols-1 sm:grid-cols-2">
      <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
        {{ t({ id: 'Jenis', en: 'Type', ja: '種類', es: 'Tipo' }) }}
        <select v-model="form.type" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all">
          <option value="income">{{ t({ id: 'Uang Masuk', en: 'Income', ja: '収入', es: 'Ingreso' }) }}</option>
          <option value="expense">{{ t({ id: 'Uang Keluar', en: 'Expense', ja: '支出', es: 'Gasto' }) }}</option>
        </select>
      </label>
      
      <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
        {{ t({ id: 'Nominal', en: 'Amount', ja: '金額', es: 'Monto' }) }}
        <input 
          v-model="form.amount" 
          type="number" 
          min="0" 
          :step="getDynamicStep(form.amount)"
          @keydown="handleNominalKeydown"
          placeholder="100000" 
          class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" 
        />
      </label>
      
      <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
        {{ t({ id: 'Kategori', en: 'Category', ja: 'カテゴリー', es: 'Categoría' }) }}
        <div class="flex gap-2">
          <input
            v-model="form.category"
            :list="`category-options-${form.type}`"
            :placeholder="form.type === 'income' ? t({ id: 'Contoh: Gaji', en: 'e.g., Salary', ja: '例: 給与', es: 'ej. Salario' }) : t({ id: 'Contoh: Makan', en: 'e.g., Food', ja: '例: 食事', es: 'ej. Comida' })"
            class="grow border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60"
          />
          <button v-if="canAddCategory" class="px-3.5 py-2.5 rounded-xl text-xs font-bold text-danger-text bg-danger-soft hover:opacity-95 transition-all cursor-pointer border-none shrink-0" type="button" @click="addCategory">
            {{ t({ id: '+ Kategori', en: '+ Category', ja: '+ カテゴリー', es: '+ Categoría' }) }}
          </button>
        </div>
        <datalist :id="`category-options-${form.type}`">
          <option v-for="item in categorySuggestions" :key="item" :value="item"></option>
        </datalist>
      </label>

      <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
        {{ t({ id: 'Sub-Kategori', en: 'Sub-Category', ja: 'サブカテゴリー', es: 'Subcategoría' }) }}
        <input v-model="form.subCategory" :placeholder="t({ id: 'Contoh: Kopi / Pajak (opsional)', en: 'e.g., Coffee / Tax (optional)', ja: '例: コーヒー / 税金 (任意)', es: 'ej. Café / Impuestos (opcional)' })" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" />
      </label>
      
      <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
        {{ t({ id: 'Tanggal', en: 'Date', ja: '日付', es: 'Fecha' }) }}
        <input v-model="form.date" type="date" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all" />
      </label>
      
      <label class="sm:col-span-2 flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
        {{ t({ id: 'Catatan', en: 'Note', ja: 'メモ', es: 'Nota' }) }}
        <input v-model="form.note" :placeholder="t({ id: 'Tambahkan catatan', en: 'Add a note', ja: 'メモを追加', es: 'Agregar una nota' })" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" />
      </label>
    </div>
    
    <div class="flex items-center gap-3 mt-2 border-t border-border pt-4">
      <button class="px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg hover:shadow-primary/20 border-none" @click="submit">
        {{ props.editTransaction ? t({ id: 'Simpan Perubahan', en: 'Save Changes', ja: '変更を保存', es: 'Guardar Cambios' }) : t({ id: 'Simpan Transaksi', en: 'Save Transaction', ja: '取引を保存', es: 'Guardar Transacción' }) }}
      </button>
      <button v-if="props.editTransaction" class="px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-text bg-surface-2 border border-border hover:bg-border transition-all cursor-pointer" type="button" @click="cancel">
        {{ t({ id: 'Batal', en: 'Cancel', ja: 'キャンセル', es: 'Cancelar' }) }}
      </button>
    </div>

    <div class="flex flex-wrap gap-1.5 mt-2" v-if="categorySuggestions.length">
      <button
        v-for="item in categorySuggestions"
        :key="item"
        class="px-3 py-1.5 rounded-full text-xs font-semibold text-primary bg-primary-soft hover:bg-primary-muted transition-all cursor-pointer border-none"
        type="button"
        @click="form.category = item"
      >
        {{ item }}
      </button>
    </div>
  </section>
</template>
