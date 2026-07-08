<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFinance } from '../composables/useFinance'

const { assets, addAsset, deleteAsset, totalAssets } = useFinance()
const form = ref({ name: '', amount: '', type: 'cash' as 'cash' | 'bank' | 'investment' })

const submitAsset = () => {
  addAsset({ name: form.value.name, amount: Number(form.value.amount), type: form.value.type })
  form.value = { name: '', amount: '', type: 'cash' }
}

const totalByType = computed(() => {
  const grouped = new Map<string, number>()
  assets.value.forEach((item) => {
    grouped.set(item.type, (grouped.get(item.type) || 0) + item.amount)
  })
  return Array.from(grouped.entries())
})
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Aset</p>
        <h1>Pantau nilai aset Anda</h1>
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
              <p>{{ item.type }}</p>
            </div>
            <div class="meta">
              <span>Rp {{ item.amount.toLocaleString('id-ID') }}</span>
              <button class="ghost-btn" @click="deleteAsset(item.id)">Hapus</button>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 1rem; }
.page-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
.eyebrow { text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.8rem; color: #64748b; }
.pill { background: #dbeafe; color: #1d4ed8; border-radius: 999px; padding: 0.45rem 0.8rem; }
.content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.card { background: white; border-radius: 16px; padding: 1rem; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06); }
.form-grid { display: grid; gap: 0.8rem; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-bottom: 0.8rem; }
label { display: flex; flex-direction: column; gap: 0.35rem; }
input, select { border: 1px solid #cbd5e1; border-radius: 10px; padding: 0.7rem 0.8rem; background: #f8fafc; }
.primary-btn, .ghost-btn { border: none; border-radius: 999px; padding: 0.65rem 1rem; cursor: pointer; }
.primary-btn { background: #2563eb; color: white; }
.ghost-btn { background: #fee2e2; color: #b91c1c; }
.list { list-style: none; padding: 0; margin: 0.7rem 0 0; display: flex; flex-direction: column; gap: 0.7rem; }
.list-item { display: flex; justify-content: space-between; gap: 1rem; align-items: center; padding-bottom: 0.7rem; border-bottom: 1px solid #e2e8f0; }
.meta { display: flex; align-items: center; gap: 0.7rem; }
@media (max-width: 900px) { .content-grid { grid-template-columns: 1fr; } .page-header { flex-direction: column; align-items: flex-start; } .form-grid { grid-template-columns: 1fr; } }
</style>
