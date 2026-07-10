<script setup lang="ts">
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
</script>

<template>
  <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
    <h3 class="text-base font-bold text-text tracking-tight border-b border-border pb-2">{{ title }}</h3>
    <div class="relative w-full overflow-hidden">
      <Doughnut v-if="props.type === 'doughnut'" :data="props.data as any" :options="props.options || { responsive: true, plugins: { legend: { position: 'bottom' } } }" />
      <Bar v-else-if="props.type === 'bar'" :data="props.data as any" :options="props.options || { responsive: true, plugins: { legend: { position: 'bottom' } } }" />
      <Line v-else :data="props.data as any" :options="props.options || { responsive: true, plugins: { legend: { position: 'bottom' } } }" />
    </div>
  </section>
</template>
