<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { useAuth } from '@/composables/useAuth'

const { user, logout } = useAuth()
</script>

<template>
  <div class="min-h-dvh flex flex-col">
    <header class="border-b">
      <div class="container mx-auto max-w-5xl px-4 h-14 flex items-center justify-between gap-4">
        <nav class="flex items-center gap-3">
          <NuxtLink to="/" class="font-semibold">Quick Poll</NuxtLink>
          <NuxtLink to="/polls" class="text-muted-foreground hover:text-foreground">Polls</NuxtLink>
          <NuxtLink to="/polls/new" class="text-muted-foreground hover:text-foreground">New Poll</NuxtLink>
        </nav>
        <div class="flex items-center gap-2">
          <template v-if="user">
            <span class="text-sm text-muted-foreground">Hi, {{ user.name }}</span>
            <Button variant="outline" size="sm" @click="logout">Logout</Button>
          </template>
          <template v-else>
            <NuxtLink to="/auth/login"><Button size="sm" variant="outline">Sign in</Button></NuxtLink>
            <NuxtLink to="/auth/register"><Button size="sm">Register</Button></NuxtLink>
          </template>
        </div>
      </div>
    </header>
    <main class="flex-1">
      <div class="container mx-auto max-w-5xl px-4 py-6">
        <slot />
      </div>
    </main>
  </div>
</template>

<style scoped>
.container { width: 100%; }
</style>
