// middleware/auth.global.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
  const accessTokenSaved  = localstorage.getItme("access_token") || null
  
  // Skip on landing page routes or if we're already on landing subdomain
  if (process.client) {
    // Check if we're on the dashboard subdomain
    const currentHost = window.location.hostname
    if (!currentHost.includes('dashboard') && !currentHost.includes('app')) {
      // We're already on landing/other subdomain, skip middleware
      return
    }
  }
  
  // Check authentication status
  if (accessTokenSaved) {
    console.log(" ALL IS WELL accessTokenSaved-accessTokenSaved it true ")

  }else{  
    console.error("accessTokenSaved-accessTokenSaved")
    // Get the landing page URL from config
    const landingUrl = 'https://intraq.pro/login'
    // const landingUrl = 'http://localhost:3000'
    
    // Redirect to landing page with return URL
    const returnUrl = encodeURIComponent(to.fullPath)
    // window.location.href = `${landingUrl}/login?returnTo=${returnUrl}`
    
    // Prevent navigation in Nuxt
    // return abortNavigation()
  }
})