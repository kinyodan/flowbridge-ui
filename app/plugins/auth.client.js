// plugins/auth.client.js - CORRECT VERSION
export default defineNuxtPlugin(async () => {
  // Only run on client side
  if (process.server) return
  
  // console.log("🎫 client.auth is running....."
  // 1. First, check if we have an auth code from landing page
  // const urlParams = new URLSearchParams(window.location.search)
  // const authCode = urlParams.get('code')
  
  // if (authCode) {
    // console.log("🎫 OAuth code received:", authCode)
    
    // // We have a code, now we need to exchange it for a token
    // // Call the TOKEN endpoint (not authorize)
    // try {
    //   const tokenResponse = await fetch("http://localhost:8000/token", {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/x-www-form-urlencoded",
    //     },
    //     body: new URLSearchParams({
    //       grant_type: "authorization_code",
    //       code: authCode,
    //       client_id: "dashboard-app", // Your client ID
    //       redirect_uri: window.location.origin + "/" // Same as used in authorize
    //     })
    //   })
      
    //   if (tokenResponse.ok) {

    //     const { access_token, user } = await tokenResponse.json()
    //     localStorage.setItem("access_token", access_token)
    //     console.log("✅ Token received:", user)
        
    //     // Clean URL
    //     window.history.replaceState({}, '', window.location.pathname)
    //     return
    //   } else {
    //     console.error("❌ Token exchange failed:", tokenResponse.status)
    //   }
    // } catch (error) {
    //   console.error("❌ Token exchange error:", error)
    // }

    
  // }
  
  // 2. If no code, check if we need to START the OAuth flow
  // Check for existing token first
  const existingToken = localStorage.getItem("access_token")
  const authUrl_stored = localStorage.getItem("auth_url")
  
  if (!existingToken) {
    // No token found, need to initiate OAuth
    const currentPath = window.location.pathname
    const isProtectedPage = currentPath.startsWith('/dashboard/auth-callback') || currentPath === '/'
    const authUrl = authUrl_stored || "https://intraq.pro/login"

    if (isProtectedPage) {
      console.log("🔄 isProtectedPage Starting OAuth flow...")      
      // window.location.href = authUrl.toString()
    }else{
      console.error("Redirect to login... access_token not present or is invalid")
      // window.location.href = authUrl
    }


  } else {
    // We have a token, verify it's still valid
    try {
      console.log("access_token exists and is valid login is normal ")

    } catch (error) {
      console.error("❌ Token verification failed:", error)
    }
  }
})