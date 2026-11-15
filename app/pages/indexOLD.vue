<script setup lang="ts">
import { ref, computed, onMounted} from 'vue'
import NumberFlow from '@number-flow/vue'
import { 
  TrendingDown, 
  TrendingUp, 
  Database, 
  Cloud, 
  AlertTriangle, 
  CheckCircle,
  DollarSign,
  Activity,
  Zap,
  Server,
  FileText,
  Eye,
  Download,
  MoreHorizontal
} from 'lucide-vue-next'

// Import UI components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardAction,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import BaseDateRangePicker from '@/components/base/DateRangePicker.vue'
import DashboardTrendsChart from '@/components/dashboard/TrendsChart.vue'
import DashboardProjectDetailsTable from '@/components/dashboard/ProjectDetailsTable.vue'

// Dashboard view state
const activeView = ref<'overview' | 'data' | 'finops'>('overview')

// Metrics data
const metrics = ref({
  dataQualityScore: 0,
  recordsProcessed: 0,
  validationErrors: 0,
  dataAccuracy: 0,
  totalCloudSpend: 0,
  costSavings: 0,
  budgetUtilization: 0,
  anomaliesDetected: 0,
})

onMounted(() => {

  getProjects()

  setTimeout(() => {
    metrics.value = {
      dataQualityScore: 0,
      recordsProcessed: 0,
      validationErrors: 0,
      dataAccuracy: 0,
      totalCloudSpend: 0,
      costSavings: 0,
      budgetUtilization: 0,
      anomaliesDetected: 0,
    }
  }, 100)
})

// Cloud provider distribution
const cloudProviders = ref([
  { name: 'AWS', spend: 0, percentage: 0, color: '#FF9900', change: -0 },
  { name: 'Azure', spend: 0, percentage: 0, color: '#0089D6', change: 0 },
  { name: 'GCP', spend: 0, percentage: 0, color: '#4285F4', change: -0 },
])

// Recent alerts
const recentAlerts = ref([
  { 
    type: 'cost', 
    severity: 'warning',
    message: 'AWS EC2 spending up 23% this week',
    time: '2h ago',
    icon: AlertTriangle
  },
  { 
    type: 'data', 
    severity: 'error',
    message: '156 duplicate records detected in CRM import',
    time: '5h ago',
    icon: Database
  },
  { 
    type: 'cost', 
    severity: 'warning',
    message: 'GCP budget threshold (80%) reached',
    time: '1d ago',
    icon: Cloud
  },
  { 
    type: 'success', 
    severity: 'success',
    message: 'Data validation completed successfully',
    time: '2d ago',
    icon: CheckCircle
  },
])

// Savings opportunities
const savingsOpportunities = ref([
  { category: 'Reserved Instances', savings: 0, priority: 'high', provider: 'AWS' },
  { category: 'Idle Resources', savings: 0, priority: 'high', provider: 'AWS' },
  { category: 'Oversized Instances', savings: 0, priority: 'high', provider: 'Azure' },
  { category: 'Unused Storage', savings: 0, priority: 'medium', provider: 'GCP' },
  { category: 'Data Transfer Optimization', savings: 0, priority: 'low', provider: 'All' },
])

const totalSavingsOpportunity = computed(() => 
  savingsOpportunities.value.reduce((sum, item) => sum + item.savings, 0)
)

// Data validation workflow
const dataWorkflow = ref([
  { stage: 'Upload', status: 'completed', records: 0 },
  { stage: 'Validation', status: 'in-progress', records: 0 },
  { stage: 'Cleaning', status: 'pending', records: 0 },
  { stage: 'Analysis', status: 'pending', records: 0 },
])

// DataOps Table Data
const dataOpsProjects = ref([
  {
    id: 'PRJ-001',
    name: 'Customer CRM Migration',
    client: 'Safaricom Kenya',
    status: 'in-progress',
    records: 125000,
    quality: 96.5,
    errors: 342,
    startDate: '2024-12-01',
    dueDate: '2024-12-15',
    assignee: 'Grace Njeri'
  },
  {
    id: 'PRJ-002',
    name: 'NGO Program Data Cleanup',
    client: 'CARE International',
    status: 'validation',
    records: 87500,
    quality: 94.2,
    errors: 156,
    startDate: '2024-11-28',
    dueDate: '2024-12-10',
    assignee: 'Michael Ade'
  },
  {
    id: 'PRJ-003',
    name: 'Financial Records Audit',
    client: 'Equity Bank',
    status: 'completed',
    records: 250000,
    quality: 99.1,
    errors: 12,
    startDate: '2024-11-15',
    dueDate: '2024-11-30',
    assignee: 'Esther Muthoni'
  },
  {
    id: 'PRJ-004',
    name: 'Healthcare Data Integration',
    client: 'Nairobi Hospital',
    status: 'pending',
    records: 0,
    quality: 0,
    errors: 0,
    startDate: '2024-12-10',
    dueDate: '2024-12-25',
    assignee: 'David Kamau'
  },
  {
    id: 'PRJ-005',
    name: 'E-commerce Analytics Setup',
    client: 'Jumia Kenya',
    status: 'in-progress',
    records: 450000,
    quality: 92.8,
    errors: 892,
    startDate: '2024-11-20',
    dueDate: '2024-12-20',
    assignee: 'Sarah Wanjiru'
  },
])

let dataOpsProjectsG = ref([])

// FinOps Table Data
const finOpsAccounts = ref([
  {
    id: 'ACC-001',
    account: 'Production Environment',
    provider: 'AWS',
    department: 'Engineering',
    currentSpend: 28500,
    budget: 35000,
    utilization: 81.4,
    trend: -5.2,
    anomalies: 2,
    savings: 4200,
    owner: 'John Mwangi'
  },
  {
    id: 'ACC-002',
    account: 'Data Analytics',
    provider: 'Azure',
    department: 'Data Science',
    currentSpend: 18200,
    budget: 20000,
    utilization: 91.0,
    trend: 12.3,
    anomalies: 1,
    savings: 2800,
    owner: 'Jane Akinyi'
  },
  {
    id: 'ACC-003',
    account: 'ML Training',
    provider: 'GCP',
    department: 'AI/ML',
    currentSpend: 12800,
    budget: 15000,
    utilization: 85.3,
    trend: -3.1,
    anomalies: 0,
    savings: 1900,
    owner: 'Peter Odhiambo'
  },
  {
    id: 'ACC-004',
    account: 'Development',
    provider: 'AWS',
    department: 'Engineering',
    currentSpend: 8500,
    budget: 10000,
    utilization: 85.0,
    trend: 2.1,
    anomalies: 0,
    savings: 1200,
    owner: 'Mary Wangari'
  },
  {
    id: 'ACC-005',
    account: 'Marketing Analytics',
    provider: 'Azure',
    department: 'Marketing',
    currentSpend: 6400,
    budget: 8000,
    utilization: 80.0,
    trend: -8.5,
    anomalies: 1,
    savings: 800,
    owner: 'James Mutua'
  },
  {
    id: 'ACC-006',
    account: 'Customer Portal',
    provider: 'GCP',
    department: 'Product',
    currentSpend: 9200,
    budget: 12000,
    utilization: 76.7,
    trend: 4.2,
    anomalies: 0,
    savings: 1500,
    owner: 'Lucy Chebet'
  },
])

const apiUrl = "http://localhost:8002"

const timeRange = ref('30d')

//const fileInput = ref<HTMLInputElement | null>(null)

const triggerFileInput = () => {
  fileInput.value?.click()
}

// const handleFileUpload = (event: Event) => {
//   const target = event.target as HTMLInputElement
//   if (target.files && target.files.length > 0) {
//     const file = target.files[0]
//     console.log('Selected file:', file)
//   }
// }

function submitFile() {
  // Handle file submission
  console.log('Submitting file...')
}

// Helper functions
const getSeverityVariant = (severity: string) => {
  switch (severity) {
    case 'error': return 'destructive'
    case 'warning': return 'default'
    case 'success': return 'outline'
    default: return 'secondary'
  }
}

const getPriorityVariant = (priority: string) => {
  switch (priority) {
    case 'high': return 'destructive'
    case 'medium': return 'default'
    case 'low': return 'outline'
    default: return 'secondary'
  }
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'completed': return 'outline'
    case 'in-progress': return 'default'
    case 'validation': return 'secondary'
    case 'pending': return 'secondary'
    default: return 'secondary'
  }
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

// Missing FinOps functions
const getUtilizationColor = (utilization: number) => {
  if (utilization >= 90) return 'text-red-600'
  if (utilization >= 80) return 'text-yellow-600'
  return 'text-green-600'
}

const getTrendIcon = (trend: number) => {
  return trend < 0 ? TrendingDown : TrendingUp
}

const getTrendColor = (trend: number) => {
  return trend < 0 ? 'text-green-600' : 'text-red-600'
}

const getProjectJobData = (project: String) =>{
  console.log("Getting project data..for", project)

}

const downloadReport = (type: 'data' | 'finops') => {
  console.log(`Downloading ${type} report...`)
  // Implement report download logic
}

const viewDetails = (id: string, type: 'data' | 'finops') => {
  console.log(`Viewing details for ${type} item: ${id}`)
  // Implement navigation to details page
}

const projectRecords = (metaInfo) =>{
  const parsedInfo = JSON.parse(metaInfo) ? JSON.parse(metaInfo) : null
  return parsedInfo?.rows || "-"
}

const fileInput = ref(null)

const uploading = ref(false)
const uploadError = ref('')
const uploadSuccess = ref('')
const projectName = ref('')
// Optional: get client_id from auth store
// const { clientId } = useAuth() // adjust based on your auth setup

// Only run in browser
const clientId = ref(null)

if (process.client) {
  clientId.value = localStorage.getItem('client_id') || null
}

// Optional: watch for changes (if it can change during session)
watchEffect(() => {
  if (process.client) {
    clientId.value = localStorage.getItem('client_id')
  }
})

async function getProjects(){
  if (process.client) {
     const setClientId = localStorage.getItem('client_id') || null
     const response = await $fetch(`${apiUrl}/datasets?client_id=${setClientId}`, {
      method: 'GET',
      // headers: { 'Content-Type': 'multipart/form-data' } // auto-set by browser
    }) 

    if (response.status) {
       dataOpsProjectsG = response.data
       console.log(dataOpsProjectsG)
    } 
  }
}

let uploadfiles = null

async function handleFiles(event){
  // uploadfiles = event.target.files[0]
  console.log("uploadfiles handling method", event.target.files[0])
  uploadfiles = event.target.files[0]
}

async function handleFileUpload(event) {
  const file = uploadfiles || null
  
  // Reset states
  uploadError.value = ''
  uploadSuccess.value = ''
  
  if (!file) return

  // Validate file type
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel',                                           // .xls
    'text/csv'
  ]
  
  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
    uploadError.value = 'Please upload a valid Excel (.xlsx, .xls) or CSV file.'
    return
  }

  // Validate file size (optional - e.g., max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    uploadError.value = 'File too large. Maximum size is 10MB.'
    return
  }

  uploading.value = true

  try {
    // Read file as ArrayBuffer (needed for backend)
    const arrayBuffer = await file.arrayBuffer()
    const fileBytes = new Uint8Array(arrayBuffer)
    const savedClientIdCookie = useCookie("client_id")
    const clientId = savedClientIdCookie?.value || null

    const formData = new FormData()
    formData.append('project_name', projectName.value.trim())
    formData.append('client_id', localStorage.getItem('client_id'))
    formData.append('project_code', false)
    formData.append('assigned_to', localStorage.getItem('client_id'))
    formData.append('assigned_by', localStorage.getItem('client_id'))
    formData.append('file', file)

    // Or if your backend expects raw bytes + JSON:
    const payload = {
      project_name: projectName.value.trim(),
      client_id: localStorage.getItem('client_id') || null,
      UploadFile: Array.from(fileBytes) // or base64 if preferred
    }

    // Call your upload API
    const response = await $fetch(`${apiUrl}/upload_dataset?projectName=${projectName.value.trim()}`, {
      method: 'POST',
      body: formData
      // headers: { 'Content-Type': 'multipart/form-data' } // auto-set by browser
    })

    // Success!
    uploadSuccess.value = `Uploaded successfully: ${response.filename} (${response.rows} rows)`
    
    // Optional: emit event or refresh data list
    // emit('uploaded', response)

    // Clear input so same file can be re-uploaded
    if (fileInput.value) fileInput.value.value = ''
    if (projectName.value) projectName.value = ''
    getProjects()

  } catch (err) {
    console.error('Upload failed:', err)
    uploadError.value = err.data?.message || err.message || 'Upload failed. Please try again.'
  } finally {
    uploading.value = false
  }
}

async function uploaded(event) {
  console.log("emited response event to index.vue..")
  // body...
}

</script>

<style scoped>
.data-drawer-content {
  height: 900px;
}
</style>

<template>
  <div class="w-full flex flex-col gap-4">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          Dashboard
        </h2>
        <p class="text-sm text-muted-foreground">
          Data & Cloud Cost Intelligence Platform
        </p>
      </div>
      <div class="flex items-center gap-2">
        <!-- View Toggle -->
        <ToggleGroup
          v-model="activeView"
          type="single"
          variant="outline"
          class="hidden md:flex"
        >
          <ToggleGroupItem value="overview">
            Overview
          </ToggleGroupItem>
          <ToggleGroupItem value="data">
            Data Ops
          </ToggleGroupItem>
          <ToggleGroupItem value="finops">
            FinOps
          </ToggleGroupItem>
        </ToggleGroup>

        <!-- Mobile View Selector -->
        <Select v-model="activeView" class="md:hidden">
          <SelectTrigger class="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overview">Overview</SelectItem>
            <SelectItem value="data">Data Ops</SelectItem>
            <SelectItem value="finops">FinOps</SelectItem>
          </SelectContent>
        </Select>

        <!-- Add Job Drawer -->
        <Drawer>
          <DrawerTrigger as-child>
            <Button>
              + Add Project
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <div class="p-4 max-w-sm w-full mx-auto">
              <DrawerHeader>
                <DrawerTitle>Upload Data File</DrawerTitle>
                <DrawerDescription>Upload Excel or CSV for processing</DrawerDescription>
              </DrawerHeader>

              <div class="space-y-2">
                <label class="text-sm font-medium">Enter Project Name</label>
                <input
                  v-model="projectName" 
                  type="text"
                  placeholder="e.g., Q4 Sales Report"
                  class="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  :disabled="uploading"
                />
                <p v-if="projectNameError" class="text-sm text-red-600">
                  {{ projectNameError }}
                </p>
              </div>
                
              <div class="space-y-4 py-4">
                <div class="space-y-2">
                  <label class="text-sm font-medium">Select File</label>
                  <input
                    ref="fileInput"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    class="w-full cursor-pointer"
                    @change="handleFiles"
                  />
                </div>

                <Button @click="handleFileUpload" class="w-full">
                  Upload & Process
                </Button>
              </div>

              <DrawerFooter>
                <DrawerClose as-child>
                  <Button variant="outline" class="w-full">
                    Cancel
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>

        <BaseDateRangePicker />
      </div>
    </div>

    <main class="@container/main flex flex-1 flex-col gap-4 md:gap-8">
      <!-- Overview View -->
      <div v-if="activeView === 'overview'" class="space-y-4 md:space-y-8">
        <!-- Key Metrics Grid -->
        <div class="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
          <!-- Data Quality Score -->
          <Card class="@container/card">
            <CardHeader>
              <CardDescription>Data Quality Score</CardDescription>
              <CardTitle class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                <NumberFlow
                  :value="metrics.dataQualityScore"
                  suffix="%"
                />
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <TrendingUp class="w-3 h-3" />
                  +2.5%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter class="flex-col items-start gap-1.5 text-sm">
              <div class="line-clamp-1 flex gap-2 font-medium">
                Improved accuracy <CheckCircle class="size-4" />
              </div>
              <div class="text-muted-foreground">
                {{ metrics.recordsProcessed.toLocaleString() }} records processed
              </div>
            </CardFooter>
          </Card>

          <!-- Total Cloud Spend -->
          <Card class="@container/card">
            <CardHeader>
              <CardDescription>Total Cloud Spend</CardDescription>
              <CardTitle class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                <NumberFlow
                  :value="metrics.totalCloudSpend"
                  :format="{ style: 'currency', currency: 'USD', trailingZeroDisplay: 'stripIfInteger' }"
                />
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <TrendingDown class="w-3 h-3" />
                  -4.2%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter class="flex-col items-start gap-1.5 text-sm">
              <div class="line-clamp-1 flex gap-2 font-medium">
                Cost optimization active <DollarSign class="size-4" />
              </div>
              <div class="text-muted-foreground">
                Down from last month
              </div>
            </CardFooter>
          </Card>

          <!-- Cost Savings Identified -->
          <Card class="@container/card">
            <CardHeader>
              <CardDescription>Cost Savings Identified</CardDescription>
              <CardTitle class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                <NumberFlow
                  :value="metrics.costSavings"
                  :format="{ style: 'currency', currency: 'USD', trailingZeroDisplay: 'stripIfInteger' }"
                />
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <Zap class="w-3 h-3" />
                  Active
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter class="flex-col items-start gap-1.5 text-sm">
              <div class="line-clamp-1 flex gap-2 font-medium">
                Potential monthly savings <TrendingUp class="size-4" />
              </div>
              <div class="text-muted-foreground">
                5 opportunities available
              </div>
            </CardFooter>
          </Card>

          <!-- Validation Errors -->
          <Card class="@container/card">
            <CardHeader>
              <CardDescription>Active Alerts</CardDescription>
              <CardTitle class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                <NumberFlow
                  :value="metrics.validationErrors + metrics.anomaliesDetected"
                />
              </CardTitle>
              <CardAction>
                <Badge variant="destructive">
                  <AlertTriangle class="w-3 h-3" />
                  Attention
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter class="flex-col items-start gap-1.5 text-sm">
              <div class="line-clamp-1 flex gap-2 font-medium">
                Requires review <Activity class="size-4" />
              </div>
              <div class="text-muted-foreground">
                {{ metrics.validationErrors }} data + {{ metrics.anomaliesDetected }} cost
              </div>
            </CardFooter>
          </Card>
        </div>

        <!-- Two Column Layout -->
        <div class="grid grid-cols-1 gap-4 @3xl/main:grid-cols-2">
          <!-- Cloud Provider Breakdown -->
          <Card class="@container/card">
            <CardHeader>
              <CardTitle>Cloud Provider Spending</CardTitle>
              <CardDescription>Current month distribution</CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
              <div v-for="provider in cloudProviders" :key="provider.name" class="space-y-2">
                <div class="flex items-center justify-between text-sm">
                  <div class="flex items-center gap-2">
                    <div 
                      class="w-3 h-3 rounded-full" 
                      :style="{ backgroundColor: provider.color }"
                    />
                    <span class="font-medium">{{ provider.name }}</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-muted-foreground">
                      ${{ provider.spend.toLocaleString() }}
                    </span>
                    <Badge :variant="provider.change < 0 ? 'outline' : 'default'" class="text-xs">
                      <component :is="provider.change < 0 ? TrendingDown : TrendingUp" class="w-3 h-3" />
                      {{ Math.abs(provider.change) }}%
                    </Badge>
                  </div>
                </div>
                <div class="w-full bg-muted rounded-full h-2">
                  <div 
                    class="h-2 rounded-full transition-all"
                    :style="{ 
                      width: `${provider.percentage}%`,
                      backgroundColor: provider.color 
                    }"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Recent Alerts -->
          <Card class="@container/card">
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>System notifications & warnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="space-y-3">
                <div 
                  v-for="(alert, index) in recentAlerts" 
                  :key="index"
                  class="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <component 
                    :is="alert.icon" 
                    class="w-4 h-4 mt-0.5 flex-shrink-0"
                    :class="{
                      'text-destructive': alert.severity === 'error',
                      'text-yellow-600': alert.severity === 'warning',
                      'text-green-600': alert.severity === 'success'
                    }"
                  />
                  <div class="flex-1 space-y-1">
                    <p class="text-sm font-medium leading-none">
                      {{ alert.message }}
                    </p>
                    <p class="text-xs text-muted-foreground">
                      {{ alert.time }}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Cost Savings Opportunities -->
        <Card class="@container/card">
          <CardHeader>
            <CardTitle>Cost Savings Opportunities</CardTitle>
            <CardDescription>
              Potential savings: 
              <span class="font-semibold text-foreground">
                ${{ totalSavingsOpportunity.toLocaleString() }}/month
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <div 
                v-for="(opportunity, index) in savingsOpportunities" 
                :key="index"
                class="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div class="flex items-center gap-4">
                  <Badge :variant="getPriorityVariant(opportunity.priority)">
                    {{ opportunity.priority }}
                  </Badge>
                  <div>
                    <p class="font-medium">{{ opportunity.category }}</p>
                    <p class="text-sm text-muted-foreground">{{ opportunity.provider }}</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-semibold text-lg">
                    ${{ opportunity.savings.toLocaleString() }}
                  </p>
                  <p class="text-xs text-muted-foreground">per month</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Data Validation Workflow -->
        <Card class="@container/card">
          <CardHeader>
            <CardTitle>Data Validation Workflow</CardTitle>
            <CardDescription>Current processing status</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div 
                v-for="(stage, index) in dataWorkflow" 
                :key="index"
                class="flex items-center gap-4"
              >
                <div class="flex-shrink-0">
                  <div 
                    class="w-10 h-10 rounded-full flex items-center justify-center"
                    :class="{
                      'bg-green-100 text-green-600': stage.status === 'completed',
                      'bg-blue-100 text-blue-600': stage.status === 'in-progress',
                      'bg-muted text-muted-foreground': stage.status === 'pending'
                    }"
                  >
                    <component 
                      :is="stage.status === 'completed' ? CheckCircle : stage.status === 'in-progress' ? Activity : Server" 
                      class="w-5 h-5"
                    />
                  </div>
                </div>
                <div class="flex-1">
                  <div class="flex items-center justify-between">
                    <p class="font-medium">{{ stage.stage }}</p>
                    <Badge 
                      :variant="stage.status === 'completed' ? 'outline' : stage.status === 'in-progress' ? 'default' : 'secondary'"
                    >
                      {{ stage.status }}
                    </Badge>
                  </div>
                  <p class="text-sm text-muted-foreground">
                    {{ stage.records > 0 ? `${stage.records.toLocaleString()} records` : 'Waiting' }}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Chart Placeholder -->
        <Card class="@container/card">
          <CardHeader>
            <CardTitle>Cost & Data Trends</CardTitle>
            <CardDescription>Last 30 days performance</CardDescription>
            <CardAction>
              <ToggleGroup
                v-model="timeRange"
                type="single"
                variant="outline"
                class="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
              >
                <ToggleGroupItem value="90d">
                  Last 3 months
                </ToggleGroupItem>
                <ToggleGroupItem value="30d">
                  Last 30 days
                </ToggleGroupItem>
                <ToggleGroupItem value="7d">
                  Last 7 days
                </ToggleGroupItem>
              </ToggleGroup>
            </CardAction>
          </CardHeader>
          <CardContent>
            <DashboardTrendsChart :time-range="timeRange" />
          </CardContent>
        </Card>
      </div>

      <!-- DataOps View -->
      <div v-if="activeView === 'data'" class="space-y-4 md:space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Data Operations Projects</CardTitle>
            <CardDescription >
              Manage and track all data processing projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead class="text-right">Records</TableHead>
                    <TableHead class="text-right">Quality</TableHead>
                    <TableHead class="text-right">Errors</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead class="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="project in dataOpsProjectsG" :key="project.id">
                    <TableCell>
                      <div>
                        <p class="font-medium">{{ project.name ? project.name.toUpperCase() : "-"  }}</p>
                        <p class="text-xs text-muted-foreground">{{ project.project_code ? project.project_code : "-"}}</p>
                      </div>
                    </TableCell>
                    <TableCell>{{ project.client_id ? project.client_id : "-"}}</TableCell>
                    <TableCell class="text-right">                    </TableCell>
                    <TableCell class="text-center">
                      <span :class="project.quality >= 95 ? 'text-green-600 font-medium' : project.quality >= 90 ? 'text-blue-600' : 'text-yellow-600'">
                        {{ project.quality > 0 ? `${project.quality}%` : '-' }}
                      </span>
                    </TableCell>
                    <TableCell class="text-center">
                      <span :class="project.errors > 0 ? 'text-red-600 font-medium' : ''">
                        {{ project.errors > 0 ? project.errors.toLocaleString() : '-' }}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span class="text-sm">{{ formatDate(project.due_date) ? formatDate(project.due_date) : "-" }}</span>
                    </TableCell>
                    <TableCell>{{ project.assigned_by ? project.assigned_by : "-" }}</TableCell>
                    <TableCell class="text-right">
                      <!-- View Details Drawer -->
                      <Drawer>
                        <DrawerTrigger as-child>
                          <Button @click="getProjectJobData(project )">
                            <Eye class="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </DrawerTrigger>
                        <DrawerContent>
                          <div class="data-drawer-content min-h-400px">
                            <DrawerHeader>
                              <DrawerTitle>PROJECT NAME: {{project.name.toUpperCase()}}</DrawerTitle>
                              <DrawerDescription>{{project.project_code}}</DrawerDescription>
                                <DashboardProjectDetailsTable :project="project" />
                              </DrawerHeader><DrawerFooter>
                              <DrawerClose as-child>
                                <Button variant="outline" class="w-full">
                                  Cancel
                                </Button>
                              </DrawerClose>
                            </DrawerFooter>
                          </div>  
                        </DrawerContent>
                      </Drawer>
                      <DropdownMenu>
                        <DropdownMenuTrigger as-child>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal class="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem @click="downloadReport('data')">
                            <FileText class="w-4 h-4 mr-2" />
                            Generate Report
                          </DropdownMenuItem>
                          <DropdownMenuItem @click="downloadReport('data')">
                            <Download class="w-4 h-4 mr-2" />
                            Export Data
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- FinOps View -->
      <div v-if="activeView === 'finops'" class="space-y-4 md:space-y-8">
        <!-- FinOps Summary Cards -->
        <div class="grid grid-cols-1 gap-4 @xl/main:grid-cols-3">
          <Card>
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-sm font-medium">
                Total Cloud Spend
              </CardTitle>
              <DollarSign class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">
                {{ formatCurrency(finOpsAccounts.reduce((sum, acc) => sum + acc.currentSpend, 0)) }}
              </div>
              <p class="text-xs text-muted-foreground">
                Across all providers and departments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-sm font-medium">
                Total Savings Identified
              </CardTitle>
              <TrendingDown class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">
                {{ formatCurrency(finOpsAccounts.reduce((sum, acc) => sum + acc.savings, 0)) }}
              </div>
              <p class="text-xs text-muted-foreground">
                Active cost optimization opportunities
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-sm font-medium">
                Total Anomalies
              </CardTitle>
              <AlertTriangle class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">
                {{ finOpsAccounts.reduce((sum, acc) => sum + acc.anomalies, 0) }}
              </div>
              <p class="text-xs text-muted-foreground">
                Cost anomalies requiring attention
              </p>
            </CardContent>
          </Card>
        </div>

        <!-- FinOps Accounts Table -->
        <Card>
          <CardHeader>
            <CardTitle>Cloud Financial Operations</CardTitle>
            <CardDescription>Monitor and optimize cloud spending across all accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead class="text-right">Current Spend</TableHead>
                    <TableHead class="text-right">Budget</TableHead>
                    <TableHead class="text-right">Utilization</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead class="text-right">Anomalies</TableHead>
                    <TableHead class="text-right">Savings</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead class="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="account in finOpsAccounts" :key="account.id">
                    <TableCell class="font-medium">
                      <div>
                        <p>{{ account.account }}</p>
                        <p class="text-xs text-muted-foreground">{{ account.id }}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" class="capitalize">
                        {{ account.provider }}
                      </Badge>
                    </TableCell>
                    <TableCell>{{ account.department }}</TableCell>
                    <TableCell class="text-right font-medium">
                      {{ formatCurrency(account.currentSpend) }}
                    </TableCell>
                    <TableCell class="text-right">
                      {{ formatCurrency(account.budget) }}
                    </TableCell>
                    <TableCell class="text-right">
                      <span :class="getUtilizationColor(account.utilization)">
                        {{ account.utilization.toFixed(1) }}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <div class="flex items-center gap-1">
                        <component 
                          :is="getTrendIcon(account.trend)" 
                          class="w-4 h-4" 
                          :class="getTrendColor(account.trend)"
                        />
                        <span :class="getTrendColor(account.trend)">
                          {{ Math.abs(account.trend).toFixed(1) }}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell class="text-right">
                      <Badge 
                        v-if="account.anomalies > 0" 
                        variant="destructive"
                        class="px-2 py-0.5"
                      >
                        {{ account.anomalies }}
                      </Badge>
                      <span v-else class="text-muted-foreground">-</span>
                    </TableCell>
                    <TableCell class="text-right font-medium text-green-600">
                      {{ formatCurrency(account.savings) }}
                    </TableCell>
                    <TableCell>{{ account.owner }}</TableCell>
                    <TableCell class="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger as-child>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal class="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem @click="viewDetails(account.id, 'finops')">
                            <Eye class="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem @click="downloadReport('finops')">
                            <FileText class="w-4 h-4 mr-2" />
                            Generate Report
                          </DropdownMenuItem>
                          <DropdownMenuItem @click="downloadReport('finops')">
                            <Download class="w-4 h-4 mr-2" />
                            Export Cost Data
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  </div>
</template>