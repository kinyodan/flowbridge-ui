<!-- pages/auth-callback.vue -->
<script setup lang="ts">
import authService from '../services/authService.js'
const config = useRuntimeConfig()

definePageMeta({
  layout: 'blank',
  middleware: false // Skip auth middleware for this page
})

const route = useRoute()
const router = useRouter()
const landingUrl = config.public.dashboardUrl

onMounted(async () => {
  console.log('Auth callback received:', route.query)
  
  // Get the auth code from query parameters
  const { code, token, error, returnTo } = route.query
  
  if (error) {
    console.error('Auth error:', error)
    // Handle error - redirect to login with error message
    window.location.href = `${landingUrl}/login`  
    return
  }
  
  // Handle different auth methods:
  
  // 1. If using OAuth code flow
  if (code) {
    await exchangeCodeForToken(code as string)
    return
  }
  
  // 2. If using direct token (simpler)
  if (token) {
    await handleDirectToken(token as string, returnTo as string)
    return
  }
  
  // 3. No auth parameters found
  console.error('No auth parameters found in callback')
  window.location.href = `${landingUrl}/login`  

})


// Method 1: Exchange OAuth code for token
const exchangeCodeForToken = async (code: string) => {
  try {
    const urlParams = new URLSearchParams(window.location.search)
    const authCode = urlParams.get('code')
    
    if (authCode) {
      console.log("🎫 OAuth code received:", authCode)
      
      // We have a code, now we need to exchange it for a token
      // Call the TOKEN endpoint (not authorize)
      let payloadData = {
          grant_type: "authorization_code",
          code: authCode,
          client_id: "dashboard-app", 
          redirect_uri: window.location.origin + "/" 
        }

      const payload = JSON.stringify(payloadData)  
      const response = await authService.tokenAuth(payload)

      console.log(response)
      if (response.status == 200) {
        const { access_token,refresh_token, user, expires_in } = await response.data
        // localStorage.setItem("access_token", access_token)
        localStorage.setItem("username", user.username)
        localStorage.setItem("client_id", user.client_id)
        console.log(user)
        const clientId = user?.client_id || null
        console.log("✅ Token received:", access_token)

        await storeAuthTokens(access_token, refresh_token, clientId, expires_in)

        // Redirect to intended page or dashboard
        await redirectAfterAuth()
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname)
        return
      } else {
        console.error("❌ Token exchange failed:", response.status)

        const authUrl = new URL(`${landingUrl}/login`)
        authUrl.searchParams.append("response_type", "code")
        authUrl.searchParams.append("client_id", "dashboard-app")
        authUrl.searchParams.append("redirect_uri", window.location.origin + "/")
        
        window.location.href = authUrl.toString()

      }
    }  
    
  } catch (error) {
    console.error('Token exchange error:', error)
    // router.push('/login?error=auth_failed')
  }
}

// Method 2: Handle direct token (from your landing page)
const handleDirectToken = async (token: string, returnTo?: string) => {
  try {
    // Verify token with your backend
    const response = await authService.authVerify(token)

    if (!response.ok) throw new Error('Invalid token')
    
    // Store the token
    await storeAuthTokens(token)
    
    // Redirect
    await redirectAfterAuth(returnTo)
    
  } catch (error) {
    console.error('Token validation error:', error)
    window.location.href = `${landingUrl}/login`  
  }
}

// Store authentication tokens
const storeAuthTokens = async (accessToken: string, refreshToken?: string, clientId?: string , expires_in?: string) => {
  // Use secure cookies in production
  const accessTokenCookie = useCookie('auth_token', {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    secure: true,
    sameSite: 'strict'
  })
  
  accessTokenCookie.value = accessToken
  
  if (refreshToken) {
    const refreshTokenCookie = useCookie('refresh_token', {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      secure: true,
      httpOnly: true,
      sameSite: 'strict'
    })
    refreshTokenCookie.value = refreshToken
  }


  if(clientId){
    const clientIdCookie = useCookie('client_id', {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      secure: true,
      sameSite: 'strict'
    })
    clientIdCookie.value = clientId
  }

  if(expires_in){
    const expiresInCookie = useCookie('expires_in', {
      maxAge: 60 * 60 * 24 * 7, // 1 days
      secure: true,
      sameSite: 'strict'
    })
    expiresInCookie.value = Date.now() + (expires_in * 1000) 
  }

}

// Redirect after successful auth
const redirectAfterAuth = async (returnTo?: string) => {
  // Default redirect path
  let redirectPath = '/'
  
  // Check for returnTo parameter
  if (returnTo) {
    redirectPath = decodeURIComponent(returnTo)
  }
  
  // Validate redirect path (prevent open redirects)
  if (!isValidRedirectPath(redirectPath)) {
    redirectPath = '/'
  }
  
  // Use replace to prevent going back to callback
  window.location.replace(redirectPath)
}

// Security: Validate redirect paths
const isValidRedirectPath = (path: string): boolean => {
  // Only allow paths within our app
  return path.startsWith('/') && 
         !path.includes('//') && 
         !path.includes('http') &&
         !path.includes('javascript:')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background">
    <div class="text-center">
      <!-- Loading animation -->
      <div class="mb-6">
        <div class="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
      
      <h1 class="text-xl font-semibold mb-2">
        Completing authentication...
      </h1>
      <p class="text-muted-foreground">
        Please wait while we log you in.
      </p>
      
      <!-- Error fallback -->
      <div v-if="route.query.error" class="mt-6 p-4 rounded-lg bg-destructive/10">
        <p class="text-sm text-destructive">
          Authentication failed. Redirecting to login...
        </p>
      </div>
    </div>
  </div>
</template>