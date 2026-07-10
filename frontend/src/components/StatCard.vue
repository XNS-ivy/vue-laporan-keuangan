<script setup lang="ts">
defineProps<{
  label: string
  value: string
  tone?: 'positive' | 'negative' | 'neutral'
}>()
</script>

<template>
  <article
    class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    :class="{
      'border-l-4 border-l-success': tone === 'positive',
      'border-l-4 border-l-danger': tone === 'negative',
      'border-l-4 border-l-primary': tone === 'neutral'
    }"
  >
    <span class="text-xs font-semibold text-muted uppercase tracking-wider">{{ label }}</span>
    <strong class="text-2xl font-bold tracking-tight text-text mt-1">{{ value }}</strong>
  </article>
</template>
