// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/test-utils',
    'shadcn-nuxt',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase'
  ],
  shadcn: {
    prefix: '',
    componentDir: './app/components/ui'
  },
  supabase: {
    redirectOptions: {
      login: '/auth/login',
            // The `callback` option allows you to specify a URL to redirect users to after email verification.
      // We are not using email verification callbacks right now, so this is set to undefined.
      callback: undefined,
      include: ['/polls/new'],
      exclude: [],
      saveRedirectToCookie: true,
    },
    cookieOptions: {
      // 8 hours
      maxAge: 60 * 60 * 8,
      sameSite: 'lax',
      // secure cookies in production only
      secure: process.env.NODE_ENV === 'production'
    },
    // Client options can be customized later if needed
  },
  nitro: {
    experimental: {
      tasks: true
    }
  }
})
