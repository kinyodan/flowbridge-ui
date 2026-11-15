<!-- app/pages/onboarding.vue -->
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
// import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Database, Cloud, Zap, PieChart, Activity } from 'lucide-vue-next'
import projectsService from '../services/projectsService.js'

const router = useRouter()
const route = useRoute()
// const { toast } = useToast()

const selectedPackage = ref(null)
const isSubmitting = ref(false)

// Packages from your content.yml (pricing + model sections)
const packages = ref([
  {
    type: 'dataops',
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

onMounted(() => {
  if(route.query.p){
    const package_query = findPackageByName(route.query.p)
    selectedPackage.value = package_query.type
  }
})

const findPackageByName = (name) => {
  if (!name) return null
  
  return packages.value.find(pkg => 
    pkg.name.toLowerCase() === name.toLowerCase()
  ) || null
}

// Select package handler
const selectPackage = (pkgType) => {
  selectedPackage.value = pkgType
}

// Submit to backend
const submitPackage = async () => {
	if (!selectedPackage.value) {
	// toast({
	//   title: 'Please select a package',
	//   description: 'Choose either DataOps or FinOps to continue.',
	//   variant: 'destructive'
	// })
	return
	}

	isSubmitting.value = true

	try {
    const savedClientIdCookie = useCookie("client_id")
    const clientId = savedClientIdCookie?.value || null
	  const package_name = packages.value.find(p => p.type === selectedPackage.value)?.name
	  const formData = new FormData()
	  formData.append("client_id", clientId)
	  formData.append("package_name", package_name)

	  const response = await projectsService.setPackage(formData)

	  if(response.status === 201){
		  const responseData = response.data 
		  console.log(responseData.package)
		  // Success!
		  console.log(`submitted Package successfully: ${responseData}`)
      const packageCookie = useCookie('package', {
        maxAge: 60 * 60 * 24 * 7, // 7 days
        secure: true,
        sameSite: 'strict'
      })
      
      packageCookie.value = responseData?.package || null
      window.location.href = '/'
	  }  

	} catch (err) {
		console.error('Upload failed:', err)
	} finally {
		isSubmitting.value = false

	}

}
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col items-center justify-center p-6">
    <div class="w-full max-w-5xl space-y-12">
      <!-- Header -->
      <div class="text-center space-y-4">
        <h1 class="text-4xl md:text-5xl font-bold tracking-tight">
          Choose Your <span class="text-primary">Intraq</span> Package
        </h1>
        <p class="text-xl text-muted-foreground max-w-2xl mx-auto">
          Select the plan that best fits your data management and cloud cost optimization needs. 
          You can upgrade later as your organization scales.
        </p>
      </div>

      <!-- Package Cards -->
      <div class="grid md:grid-cols-3 gap-8">
        <Card
          v-for="pkg in packages"
          :key="pkg.type"
          class="relative overflow-hidden transition-all hover:shadow-xl hover:scale-[1.02]"
          :class="{ 'ring-2 ring-primary shadow-xl': selectedPackage === pkg.type }"
        >
          <CardHeader class="pb-4">
            <div class="flex items-center justify-between">
              <component :is="pkg.icon" class="h-10 w-10 text-primary" />
              <Badge v-if="pkg.highlight" variant="default">Recommended</Badge>
            </div>
            <CardTitle class="text-2xl mt-4">{{ pkg.name }}</CardTitle>
            <CardDescription class="text-xl font-semibold mt-2">
              {{ pkg.price }}
            </CardDescription>
          </CardHeader>

          <CardContent class="space-y-6">
            <p class="text-muted-foreground">{{ pkg.description }}</p>
            <ul class="space-y-3">
              <li v-for="(feature, i) in pkg.features" :key="i" class="flex items-start gap-2">
                <CheckCircle class="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span class="text-sm">{{ feature }}</span>
              </li>
            </ul>
          </CardContent>

          <CardFooter>
            <Button
              class="w-full"
              :variant="selectedPackage === pkg.type ? 'default' : 'outline'"
              @click="selectPackage(pkg.type)"
            >
              {{ selectedPackage === pkg.type ? 'Selected' : 'Choose this package' }}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <!-- Submit Button -->
      <div class="flex justify-center pt-8">
        <Button
          size="lg"
          class="px-12 py-6 text-lg"
          :disabled="!selectedPackage || isSubmitting"
          @click="submitPackage"
        >
          <span v-if="isSubmitting">Updating package...</span>
          <span v-else>Confirm Package & Continue to Dashboard</span>
        </Button>
      </div>

      <!-- Footer note -->
      <p class="text-center text-sm text-muted-foreground mt-12">
        Need a custom plan? <a href="/contact" class="text-primary hover:underline">Contact sales</a>
      </p>
    </div>
  </div>
</template>