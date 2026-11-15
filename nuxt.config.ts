import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  site: {
    url: 'https://dashboard.intraq.simokai.com/dashboard',
    name: 'Intraq',
    description: 'Reliable Data Solutions for Africa\'s Leading Organizations'
  },

  devtools: { enabled: true },

  css: ['~/assets/css/tailwind.css'],
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

  components: [
    {
      path: '~/components',
      extensions: ['.vue'],
    },
  ],

  modules: [
    'shadcn-nuxt',
    '@vueuse/nuxt',
    '@nuxt/eslint',
    '@nuxt/icon',
    '@pinia/nuxt',
    '@nuxtjs/color-mode',
    '@nuxt/fonts',
  ],

  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * @default "~/components/ui"
     */
    componentDir: '~/components/ui',
  },

  colorMode: {
    preference: 'light', // default value of $colorMode.preference
    fallback: 'light', // fallback value if not system preference found
    hid: 'nuxt-color-mode-script',
    globalName: '__NUXT_COLOR_MODE__',
    componentName: 'ColorScheme',
    classPrefix: '',
    classSuffix: '',
    storageKey: 'nuxt-color-mode'
  },

  runtimeConfig: {
    // Private keys (server-side only)
    apiSecret: process.env.API_SECRET,
    
    // Public keys (exposed to client)
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'https://intraq-backend.onrender.com',
      landingUrl: process.env.NUXT_PUBLIC_LANDING_URL || 'https://intraq.pro',
      dashboardUrl: process.env.NUXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.intraq.pro/dashboard',
    }
  },

  eslint: {
    config: {
      standalone: false,
    },
  },

  fonts: {
    defaults: {
      weights: [300, 400, 500, 600, 700, 800],
    },
  },

  routeRules: {
    '/components': { redirect: '/components/accordion' },
    '/settings': { redirect: '/settings/profile' },
  },

  imports: {
    dirs: [
      './lib',
    ],
  },

  compatibilityDate: '2024-12-14',

  // Development server config
  devServer: {
    host: '0.0.0.0',
    port: 3001, // Different port from landing app
  },

  // Critical for Vercel deployment - subpath routing
  app: {
    baseURL: '/dashboard/'
  },
  
  // Update route rules for subpath
  nitro: {
    preset: 'vercel',
    routeRules: {
      // '/dashboard/components': { redirect: '/dashboard/components/accordion' },
      // '/dashboard/settings': { redirect: '/dashboard/settings/profile' },
    }
  }
})