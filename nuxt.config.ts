// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/test-utils',
    'shadcn-nuxt',
    '@nuxtjs/tailwindcss'
  ],
  shadcn: {
    prefix: '',
    componentDir: './app/components/ui'
  }
})