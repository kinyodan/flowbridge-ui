<script setup lang="ts">
import type { NavGroup, NavLink, NavSectionTitle } from '~/types/nav'
import { navMenu, navMenuBottom } from '~/constants/menus'
import projectsService from '../services/projectsService.js'
import { CheckCircle, Database, Cloud, Zap, PieChart, Activity } from 'lucide-vue-next'

const router = useRouter()

function resolveNavItemComponent(item: NavLink | NavGroup | NavSectionTitle): any {
  if ('children' in item)
  return resolveComponent('LayoutSidebarNavGroup')
  return resolveComponent('LayoutSidebarNavLink')
}

// Add onMounted lifecycle hook
// onMounted(() => {
//   console.log('Sidebar component mounted')
  
//   // Your code here - for example:
//   if (typeof window !== 'undefined') {
//     const clientId = localStorage.getItem('client_id')
//     console.log('Client ID:', clientId)
//     // Call your getPackages method here
//     // getPackage(clientId)
//   }
// })

const clientId = getUserCookieData || null 

function getUserCookieData() {
  console.log("✅ getting user data in sidebar: getUserCookieData")
  const clientId = useCookie('client_id')
  return clientId
}

onMounted(() => {
  if (process.client) {
    const clientId = localStorage.getItem('client_id')
    console.log('Sidebar mounted - Client ID:', clientId)
    //getPackage(clientId)
    getUserCookieData
  }
})

const clientPackage = ref(null)

async function getPackage(client_id: string | null) {
  if (!client_id) return

  try {
    const response = await projectsService.getPackages(client_id)
    
    if (response.status === 201 || response.status_code === 201) {
      clientPackage.value = response.data?.package || null

      // ✅ FIXED: Do NOT redirect automatically
      if (!clientPackage.value) {
        console.warn("No package found for user. Consider showing onboarding banner instead of redirect.")
        // router.push('/onboarding')   // ← Commented out to prevent 404
      } else {
        const packageCookie = useCookie('package', {
          maxAge: 60 * 60 * 24 * 7,
          secure: true,
          sameSite: 'strict'
        })
        packageCookie.value = clientPackage.value
      }
    }
  } catch (error) {
    console.error('Error fetching package in sidebar:', error)
  }
}

const intraqPackages = ref([
  {
    type: 'dataops',
    logo: '/images/logo-dark.png', 
    name: 'DataOps Starter',
    price: 'KES 15,000 / project',
    description: 'Perfect for one-off data projects or initial cloud cost assessments.',
    features: [
      'Up to 5,000 records processed',
      'Basic data formatting and validation',
      'Cloud bill visualization for 1 provider',
      '2-day turnaround',
      'Email support'
    ],
    icon: Database,
    highlight: false
  },
  {
    type: 'dataopsProfessional',
    logo: '/images/logo-dark.png', 
    name: 'DataOps Professional',
    price: 'KES 40,000 / month',
    description: 'Ongoing data management with advanced validation & error correction.',
    features: [
      'Up to 20,000 records/month',
      'Advanced data validation & error correction',
      'Multi-cloud cost dashboard & basic alerts',
      'Monthly optimization recommendations',
      'Priority email & WhatsApp support'
    ],
    icon: Activity,
    highlight: true
  },
  {
    type: 'finops',
    logo: '/images/logo-dark.png', 
    name: 'FinOps Enterprise',
    price: 'Custom Quote',
    description: 'Advanced automation, analytics, global FinOps, dedicated support.',
    features: [
      'Unlimited record processing',
      'Custom FinOps dashboards & API integrations',
      'Dedicated account manager & FinOps specialist',
      'SLA-backed turnaround & cost-savings targets',
      'Multi-currency support & global compliance',
      'Optional on-site training'
    ],
    icon: PieChart,
    highlight: false
  }
])

// Replace icons with image paths
const teams = [
  {
    name: 'Intraq',
    logo: '/images/logo-dark.png', // ✅ your custom logo
    plan: 'Enterprise',
  },
  {
    name: 'DataPro',
    logo: '/images/logo-dark.png',
    plan: 'Startup',
  },
  {
    name: 'InsightHub',
    logo: '/images/logo-dark.png',
    plan: 'Free',
  },
]

const user = {
  name: 'Daniel Kinyo',
  email: 'daniel@intraq.com',
  avatar: '/avatars/avatartion.png',
}

const { sidebar } = useAppSettings()
</script>

<template>
  <Sidebar :collapsible="sidebar.collapsible" :side="sidebar.side" :variant="sidebar.variant">
    <SidebarHeader>
      <LayoutSidebarNavHeader :clientPackage="clientPackage" :intraqPackages="intraqPackages" />
      <!--<Search /> -->
      <!-- VoiceFlow Logo Link -->
      <NuxtLink 
        to="http://voiceflow.intraq.pro" 
        target="_blank"
        external
        class="block w-full -my-2 voiceflow"
      >
        <img 
          src="/images/voiceflow.png" 
          alt="VoiceFlow" 
          class="w-full h-auto max-h-12 object-contain"
        />
      </NuxtLink>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup v-for="(nav, indexGroup) in navMenu" :key="indexGroup">
        <SidebarGroupLabel v-if="nav.heading">
          {{ nav.heading }}
        </SidebarGroupLabel>
        <component 
          :is="resolveNavItemComponent(item)" 
          v-for="(item, index) in nav.items.filter(item => item.target === 'user' || (item.target === 'admin' && clientId == 'CLG2WTPQ9X') )"
          :key="index" 
        :item="item" />
      </SidebarGroup>

      <SidebarGroup class="mt-auto">
        <component
          :is="resolveNavItemComponent(item)"
          v-for="(item, index) in navMenuBottom"
          :key="index"
          :item="item"
          size="sm"
        />
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <LayoutSidebarNavFooter :user="user" />
    </SidebarFooter>

    <SidebarRail />
  </Sidebar>
</template>
<style scoped>
  .voiceflow img {
    max-width: 50% !important;
    padding-top: 1em;
  }
</style>