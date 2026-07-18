<template>
  <div class="max-w-md mx-auto py-16 px-4 text-center text-text flex flex-col items-center justify-center min-h-[70vh]">
    <!-- Animated Badge -->
    <div class="relative mb-6 flex items-center justify-center">
      <div class="absolute inset-0 w-24 h-24 bg-primary/10 rounded-full animate-ping opacity-75"></div>
      <div class="relative w-20 h-20 bg-primary-soft border border-primary/20 rounded-full flex items-center justify-center shadow-lg select-none">
        <svg class="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
      </div>
    </div>

    <!-- Error Codes -->
    <h1 class="text-7xl font-extrabold tracking-tight text-primary select-none animate-pulse">404</h1>
    <h2 class="text-xl lg:text-2xl font-extrabold tracking-tight mt-4">Halaman Tidak Ditemukan</h2>
    
    <p class="text-sm text-muted font-medium mt-3 leading-relaxed max-w-sm">
      Maaf, tautan yang Anda tuju salah atau halaman tersebut telah dihapus. Yuk kembali ke jalur yang aman!
    </p>

    <!-- Navigation Action -->
    <div class="mt-8 flex flex-col sm:flex-row gap-3 w-full justify-center">
      <RouterLink 
        to="/" 
        class="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-primary bg-primary-soft hover:bg-primary-muted hover:scale-105 active:scale-95 transition-all inline-flex items-center justify-center gap-2 decoration-none shadow-xs"
      >
        <svg class="w-4 h-4 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
        Kembali ke Dashboard
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>
