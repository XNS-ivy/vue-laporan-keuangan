<script setup lang="ts">
import { ref, computed } from 'vue';
import { t as tr, categoryIcons } from '../composables/useUserSettings';


// Props
const props = defineProps({
  groups: {
    type: Array as () => Array<{ name: string; icons: Array<{ key: string; label: string }> }>,
    required: true,
  },
  show: {
    type: Boolean,
    required: true,
  },
});

// Emits
const emit = defineEmits(['select', 'close']);

// i18n


// Search term
const search = ref('');

// Computed filtered groups based on search
const filteredGroups = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return props.groups;
  return props.groups
    .map(group => ({
      ...group,
      icons: group.icons.filter(icon =>
        icon.key.toLowerCase().includes(q) || icon.label.toLowerCase().includes(q)
      ),
    }))
    .filter(g => g.icons.length > 0);
});

function select(key: string) {
  emit('select', key);
}
function close() {
  emit('close');
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50" @click.self="close">
    <div class="bg-surface-2 rounded-2xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto shadow-lg">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold text-text">{{ tr({ id: 'Pilih Ikon Kategori', en: 'Choose Category Icon', ja: 'カテゴリーアイコンを選択', es: 'Seleccionar Icono de Categoría' }) }}</h2>
        <button @click="close" class="text-muted hover:text-text transition-colors">✕</button>
      </div>
      <input v-model="search" type="text"
        :placeholder="tr({ id: 'Cari ikon...', en: 'Search icons...', ja: 'アイコン検索...', es: 'Buscar iconos...' })"
        class="w-full mb-4 border border-border rounded-xl px-3 py-2 bg-surface text-text" />
      <div v-for="group in filteredGroups" :key="group.name" class="mb-4">
        <h3 class="text-sm font-semibold text-muted mb-2">{{ group.name }}</h3>
        <div class="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
          <button v-for="icon in group.icons" :key="icon.key"
            @click="select(icon.key)"
            class="flex items-center justify-center p-2 rounded-xl border border-border hover:bg-surface-2 transition-colors">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
              v-html="categoryIcons[icon.key] || categoryIcons['tag']" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Tailwind CSS handles styling */
</style>
