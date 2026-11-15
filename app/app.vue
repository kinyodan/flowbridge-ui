<script setup lang="ts">
import { ConfigProvider } from 'reka-ui'
import { Toaster } from '@/components/ui/sonner'
import 'vue-sonner/style.css'
import emailsService from '../services/emailsService.js'

const colorMode = useColorMode()
const color = computed(() => colorMode.value === 'light' ? '#ffffff' : '#ffffff') //  #09090b'
const { color: activeColor, type } = useCustomize()
const socketData = useState('socketData', () => null)
const socketStatus = useState('socketStatus', () => 'disconnected')
const emailsData = useState('emailsData', () => [])


const getClientEmails = async () => {
  const clientId = useCookie("client_id").value 
  console.log("getClientEmails-getClientEmails")
  try {
    // Verify token with your backend
    const response = await emailsService.getEmails(clientId)

    if (response.status === 200) {
      const responseData = response.data.data
      emailsData.value = responseData ? responseData : false
      console.log(responseData) 
      console.log(emailsData) 
    }  
      
  } catch (error) {
    console.error('Error fetching client emails:')
  }
}

const handleLogout = () => {
  console.log("✅ Token removed: access_token")
  const accessTokenCookie = useCookie('auth_token')
  accessTokenCookie.value = null

  const refreshTokenCookie = useCookie('refresh_token')
  refreshTokenCookie.value = null 
  const landingUrl = config.public.landingUrl
  const authUrl = new URL(`${landingUrl}/login`)

  //window.location.href = authUrl.toString()
}

const scheduleLogout = () => {
  const expiresAt = useCookie('expires_in').value

  if (!expiresAt) return

  const delay = expiresAt - Date.now()

  if (delay <= 0) {
    handleLogout()
    return
  }

  setTimeout(() => {
    handleLogout()
  }, delay)
}

const connectToUserSocket = () => {

  try {
    const clientId = useCookie("client_id").value 
    const authToken = useCookie("auth_token").value 

    if (clientId && authToken){
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${wsProtocol}//intraq-backend.onrender.com/ws/inbound_email/${clientId}`
      const ws = new WebSocket(wsUrl)

      let authenticated = false

      ws.onopen = () => {

        // STEP 1: authenticate first
        console.log("User websocket initiated at ON OPEN FOR SESSION",)
        ws.send(
          JSON.stringify({
            type: 'auth',
            token: authToken,
          })
        )
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        console.log('WS message:', data)
        socketData.value = data

        switch (data.type) {
          case 'authenticated':
            authenticated = true
            socketData.value = data
            console.log('Received:', data)

            break

          case 'inbound_emails':
            emailsData.value = data.data
            console.log('Received inbound_emails:', data.data)

            break

          case 'status':

            break

          case 'complete':

            break

          case 'error':

            break

          default:
            
        }
      }

      ws.onerror = (err) => {
        console.error(err)
      }

      ws.onclose = () => {
        console.error("user socket closed")
      }

    }else{
      console.error("Error there is not authToken or clientId")
    }   
  } catch (err) {
    console.log("Error with socket connection", err)
  }
}

const isTokenExpired = () => {
  const expiresAt = useCookie('expires_in').value

  if (!expiresAt) return true

  return Date.now() >= expiresAt
}

onMounted(() => {
  // immediate check
  if (isTokenExpired()) {
    handleLogout()
    return
  }

  // schedule future logout
  scheduleLogout()
  connectToUserSocket()
  getClientEmails()

  // re-check when tab becomes active again
  window.addEventListener('focus', () => {
    if (isTokenExpired()) {
      handleLogout()
    }
  })
})

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color },
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' },
  ],
  htmlAttrs: {
    lang: 'en',
  },
  bodyAttrs: {
    class: computed(() => `color-${activeColor.value} theme-${type.value}`),
  },
})

const title = 'Intraq — Reliable Data Solutions for Africa’s Leading Organizations'
const description = 'Intraq partners with enterprises, NGOs, and public institutions across Africa to deliver trusted data management solutions. From data entry and validation to analytics, our platform ensures accuracy, security, and actionable intelligence for every decision.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogUrl: 'https://intraq-dashboard.vercel.app/dashboard',
  ogImage: 'https://nuxt-shadcn-dashboard.vercel.app/social-card.png',
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: 'https://nuxt-shadcn-dashboard.vercel.app/social-card.png',
  twitterCard: 'summary_large_image',
})

const router = useRouter()

defineShortcuts({
  'G-H': () => router.push('/'),
  'G-E': () => router.push('/email'),
})

const textDirection = useTextDirection({ initialValue: 'ltr' })
const dir = computed(() => textDirection.value === 'rtl' ? 'rtl' : 'ltr')
</script>

<template>
  <Body class="overscroll-none antialiased bg-background text-foreground">
    <ConfigProvider :dir="dir">
      <div id="app" vaul-drawer-wrapper class="relative">
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>

        <!--<AppSettings />-->
      </div>

      <Toaster :theme="colorMode.preference as any || 'system'" />
    </ConfigProvider>
  </Body>
</template>
