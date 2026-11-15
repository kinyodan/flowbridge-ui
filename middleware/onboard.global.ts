// middleware/auth.global.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
  
  // Skip on landing page routes or if we're already on landing subdomain
  if (process.client) {
    // Check if we're on the dashboard subdomain
    console.log("checking for package set otherwise redirect to onboarding ")
  }
  
})