// nuxt.config.ts
export default defineNuxtConfig({
    devtools: { enabled: true },

    css: [
        'vuetify/lib/styles/main.sass',
        '@mdi/font/css/materialdesignicons.min.css'
    ],

    modules: [
        '@nuxtjs/google-fonts',
        '@pinia/nuxt',
    ],

    googleFonts: {
        families: {
            Roboto: [300, 400, 500, 700]
        }
    },

    build: {
        transpile: ['vuetify']
    },

    runtimeConfig: {
        public: {
            apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3001'
        }
    },
    vite: {
        define: {
            'process.env.DEBUG': false,
        },
        server: {
            watch: {
                usePolling: true,
            },
        },
        build: {
            sourcemap: true
        }
    },
    devServer: {
        host: '0.0.0.0',
        port: 3000
    },
    ssr: true

})

