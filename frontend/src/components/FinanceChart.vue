<script setup lang="ts">
import { ref, watch } from 'vue'
import { Bar, Doughnut, Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  Tooltip,
  PointElement,
  LineElement,
} from 'chart.js'

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  Tooltip,
  PointElement,
  LineElement,
)

const props = defineProps<{
  type: 'doughnut' | 'bar' | 'line'
  title: string
  data: Record<string, unknown>
  options?: Record<string, unknown>
}>()

const activeType = ref<'doughnut' | 'bar' | 'line'>(props.type)

watch(() => props.type, (newVal) => {
  activeType.value = newVal
})
</script>

<template>
  <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-2">
      <h3 class="text-base font-bold text-text tracking-tight">{{ title }}</h3>
      
      <!-- Selector Tipe Chart -->
      <div class="flex items-center gap-0.5 bg-surface-2 border border-border rounded-xl p-0.5 shrink-0">
        <button
          v-for="t in (['bar', 'line', 'doughnut'] as const)"
          :key="t"
          class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all border-none"
          :class="activeType === t ? 'bg-primary text-primary-contrast shadow-sm' : 'text-muted hover:text-text hover:bg-border/40'"
          @click="activeType = t"
          type="button"
        >
          {{ t === 'bar' ? 'Bar' : t === 'line' ? 'Line' : 'Pie' }}
        </button>
      </div>
    </div>
    
    <div class="relative w-full overflow-hidden">
      <Doughnut v-if="activeType === 'doughnut'" :data="props.data as any" :options="props.options || { responsive: true, plugins: { legend: { position: 'bottom' } } }" />
      <Bar v-else-if="activeType === 'bar'" :data="props.data as any" :options="props.options || { responsive: true, plugins: { legend: { position: 'bottom' } } }" />
      <Line v-else :data="props.data as any" :options="props.options || { responsive: true, plugins: { legend: { position: 'bottom' } } }" />
    </div>
  </section>
</template>
