<script setup lang="ts">
import { ref, computed, onMounted, watchEffect } from 'vue'
import { useRoute, useCookie } from '#imports'
import projectsService from '../services/projectsService.js'

// Icons
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

// UI Components
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
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'

// ====================== STATE ======================
const route = useRoute()

const clientPackage = ref("null")
const activeView = ref('overview')
const lastValidView = ref('overview')

const metrics = ref({
  dataQualityScore: 0,
  dataTrendValue: 0,
  recordsProcessed: 0,
  validationErrors: 0,
  dataAccuracy: 0,
  totalCloudSpend: 0,
  cloudTrendValue: 0,
  costSavings: 0,
  budgetUtilization: 0,
  anomaliesDetected: 0,
  opportunities: 0,
})

const cloudProviders = ref([
  { name: 'AWS', spend: 0, percentage: 0, color: '#FF9900', change: -0 },
  { name: 'Azure', spend: 0, percentage: 0, color: '#0089D6', change: 0 },
  { name: 'GCP', spend: 0, percentage: 0, color: '#4285F4', change: -0 },
])

const recentAlerts = ref([])
const savingsOpportunities = ref([])
const dataWorkflow = ref([])

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
  }
])

const dataOpsProjectsG = ref([])
const finOpsAccounts = ref([])
const finOpsAccountsG = ref([
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
  }
])

const timeRange = ref('30d')
const fileInput = ref(null)
const uploading = ref(false)
const uploadError = ref('')
const uploadSuccess = ref('')
const uploadSuccessStatus = ref(false)
const projectName = ref('')
const clientId = ref(null)
const uploadfiles = ref(null)

const paymentReference = ref(null)
const paymentReferenceMessage = ref('')
const paymentReferenceError = ref(null)
const paymentReferenceErrorMessage = ref('')
const uploadReference = ref(null)
const uploadReferenceMessage = ref('')
const uploadReferenceError = ref(null)
const uploadReferenceErrorMessage = ref('')

const totalSavingsOpportunity = computed(() =>
  savingsOpportunities.value.reduce((sum, item) => sum + item.savings, 0)
)

// ====================== HELPER FUNCTIONS ======================
const getSeverityVariant = (severity) => {
  switch (severity) {
    case 'error': return 'destructive'
    case 'warning': return 'default'
    case 'success': return 'outline'
    default: return 'secondary'
  }
}

const getPriorityVariant = (priority) => {
  switch (priority) {
    case 'high': return 'destructive'
    case 'medium': return 'default'
    case 'low': return 'outline'
    default: return 'secondary'
  }
}

const getStatusVariant = (status) => {
  switch (status) {
    case 'completed': return 'outline'
    case 'in-progress': return 'default'
    case 'validation': return 'secondary'
    case 'pending': return 'secondary'
    default: return 'secondary'
  }
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const getUtilizationColor = (utilization) => {
  if (utilization >= 90) return 'text-red-600'
  if (utilization >= 80) return 'text-yellow-600'
  return 'text-green-600'
}

const getTrendIcon = (trend) => {
  return trend < 0 ? 'TrendingDown' : 'TrendingUp'
}

const getTrendColor = (trend) => {
  return trend < 0 ? 'text-green-600' : 'text-red-600'
}

const projectRecords = (metaInfo) => {
  if (!metaInfo) return "-"
  try {
    const parsedInfo = JSON.parse(metaInfo)
    return parsedInfo?.rows || "-"
  } catch {
    return "-"
  }
}

// ====================== YOUR ORIGINAL FUNCTIONS ======================
const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFiles = (event) => {
  if (event.target.files) {
    uploadfiles.value = event.target.files
    console.log("uploadfiles handling method", uploadfiles.value)
  }
}

const handleFileUpload = async () => {
  const files = uploadfiles.value

  // Reset states
  uploadError.value = ''
  uploadSuccess.value = ''
  uploadSuccessStatus.value = false

  if (!files) {
    uploadError.value = 'Please select a file first'
    return
  }
  if (!projectName.value.trim()) {
    uploadError.value = 'Please enter a project name'
    return
  }

  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv'
  ]

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const fileExt = file.name.toLowerCase().match(/\.(csv|xlsx|xls)$/i)
    if (!allowedTypes.includes(file.type) && !fileExt) {
      uploadError.value = 'Please upload a valid Excel (.xlsx, .xls) or CSV file.'
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      uploadError.value = 'File too large. Maximum size is 10MB.'
      return
    }
  }

  uploading.value = true

  try {
    const formData = new FormData()
    formData.append('project_name', projectName.value.trim())

    const savedClientId = localStorage.getItem('client_id')
    if (savedClientId) {
      formData.append('client_id', savedClientId)
    }

    formData.append('project_code', null)
    formData.append('assigned_to', savedClientId || '')
    formData.append('assigned_by', savedClientId || '')

    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i])
    }

    const response = await projectsService.uploadDataset(formData)

    if (response.status_code == 202) {
      const responseData = response.data
      const fileCount = responseData.task_ids?.length || 0
      uploadSuccessStatus.value = true 
      uploadSuccess.value = `Successfully uploaded ${fileCount} file${fileCount >= 1 ? '' : 's'}`
      uploadfiles.value = null
      projectName.value = ''
      uploadReference.value = true
      uploadReferenceMessage.value = responseData.message

      if (fileInput.value) {
        fileInput.value.value = ''
      }

      await getProjects()
    } else {
      uploadReferenceError.value = true
      uploadReferenceErrorMessage.value = response.data.message
    }
  } catch (err) {
    console.error('Upload failed:', err)
    uploadError.value = err.message || 'Upload failed. Please try again.'
  } finally {
    uploading.value = false
  }
}

const handleUploaded = (event) => {
  console.log("emitted response event to index.vue..")
  getProjects()
}

// ====================== DATA FETCHING ======================
async function getProjects() {
  if (process.client) {
    const setClientId = localStorage.getItem('client_id') || null
    try {
      const response = await projectsService.getProjects(setClientId)
      if (response.status) {
        dataOpsProjectsG.value = response.data.data || []
        console.log(dataOpsProjectsG.value)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }
}

async function getPackage(client_id) {
  if (client_id == null) {
    return
  }
  const response = await projectsService.getPackages(client_id)
  if (response.status_code == 201) {
    clientPackage.value = response.data?.package || null
  }
  if (clientPackage.value == null) {
    // router.push('/onboarding')   // kept commented as per your original
  } else {
    const packageCookie = useCookie('package', {
      maxAge: 60 * 60 * 24 * 7,
      secure: true,
      sameSite: 'strict'
    })
    packageCookie.value = clientPackage.value
  }
}

// ====================== LIFECYCLE ======================
onMounted(() => {
  if (process.client) {
    clientId.value = localStorage.getItem('client_id') || null
    getProjects()
    getPackage(clientId.value)
  }
})

watchEffect(() => {
  if (process.client) {
    clientId.value = localStorage.getItem('client_id')
  }
})

// ====================== EXPOSE TO TEMPLATE ======================
defineExpose({
  activeView,
  lastValidView,
  metrics,
  cloudProviders,
  recentAlerts,
  savingsOpportunities,
  totalSavingsOpportunity,
  dataWorkflow,
  dataOpsProjects,
  dataOpsProjectsG,
  finOpsAccounts,
  finOpsAccountsG,
  timeRange,
  fileInput,
  uploading,
  uploadError,
  uploadSuccess,
  uploadSuccessStatus,
  projectName,
  clientId,
  uploadfiles,
  paymentReference,
  paymentReferenceMessage,
  uploadReference,
  uploadReferenceMessage,
  uploadReferenceError,
  uploadReferenceErrorMessage,
  formatCurrency,
  formatDate,
  getSeverityVariant,
  getPriorityVariant,
  getStatusVariant,
  getUtilizationColor,
  getTrendIcon,
  getTrendColor,
  projectRecords,
  triggerFileInput,
  handleFiles,
  handleFileUpload,
  handleUploaded,
  getProjects,
  getPackage
})
</script>


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

        <!-- Error/Success Messages -->
        <div v-if="paymentReferenceError" class="p-2 bg-red-50 text-red-600 text-sm rounded">
          {{ paymentReferenceErrorMessage }}
        </div>
        <div v-if="paymentReference" class="p-2 bg-green-50 text-green-600 text-sm rounded">
          {{ paymentReferenceMessage }}
        </div>

        <!-- Error/Success Messages -->
        <div v-if="uploadReferenceError" class="p-2 bg-red-50 text-red-600 text-sm rounded">
          {{ uploadReferenceErrorMessage }}
        </div>
        <div v-if="uploadReference" class="p-2 bg-green-50 text-green-600 text-sm rounded">
          {{ uploadReferenceMessage }}
        </div>

      </div>
      <div class="flex items-center gap-2">
        <!-- View Toggle -->
        <ToggleGroup
          v-model="activeView"
          type="single"
          variant="outline"
          class="hidden md:flex"
          @click="handleViewChange(activeView)"
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
                <DrawerTitle>New project</DrawerTitle>
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
              </div>
                
              <div class="space-y-4 py-4">
                <div class="space-y-2">
                  <label class="text-sm font-medium">Select File</label>
                  <input
                    ref="fileInput"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    multiple
                    class="w-full cursor-pointer border rounded-md p-2"
                    @change="handleFiles"
                  />
                </div>

                <!-- Error/Success Messages -->
                <div v-if="uploadError" class="p-2 bg-red-50 text-red-600 text-sm rounded">
                  {{ uploadError }}
                </div>
                <div v-if="uploadSuccessStatus" class="p-2 bg-green-50 text-green-600 text-sm rounded">
                  {{ uploadSuccess }}
                </div>

                <Button 
                  @click="handleFileUpload" 
                  class="w-full"
                  :disabled="uploading"
                >
                  <span v-if="uploading">Uploading...</span>
                  <span v-else>Upload & Process</span>
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
                {{ metrics.dataQualityScore }}%
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <TrendingUp class="w-3 h-3" />
                  {{metrics.dataTrendValue}}%
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
                {{ formatCurrency(metrics.totalCloudSpend) }}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <TrendingDown class="w-3 h-3" />
                  {{metrics.cloudTrendValue}}%
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
                {{ formatCurrency(metrics.costSavings) }}
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
                {{metrics.opportunities}} opportunities available
              </div>
            </CardFooter>
          </Card>

          <!-- Validation Errors -->
          <Card class="@container/card">
            <CardHeader>
              <CardDescription>Active Alerts</CardDescription>
              <CardTitle class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {{ metrics.validationErrors + metrics.anomaliesDetected }}
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
                    :is="alert.icon === 'AlertTriangle' ? AlertTriangle : 
                          alert.icon === 'Database' ? Database : 
                          alert.icon === 'Cloud' ? Cloud : CheckCircle" 
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
            <DashboardTrendsChart 
             :time-range="timeRange"
             :data="{
                spend: {
                  label: 'Total Spend',
                  color: '#3b82f6',
                  values: [/* daily spend array */]
                },
                records: {
                  label: 'Records Processed',
                  color: '#10b981',
                  values: [/* daily records */]
                },
                errors: {
                  label: 'Validation Errors',
                  color: '#ef4444',
                  values: [/* daily errors */]
                },
                quality: {
                  label: 'Avg Quality Score',
                  color: '#8b5cf6',
                  values: [/* daily avg quality */],
                  yAxis: 'right' // secondary axis if needed
                }
              }"
             />
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
                    <TableCell class="text-right">  {{project.dataset_info?.project_total_rows ? project.dataset_info?.project_total_rows : "-"}}                  </TableCell>
                    <TableCell class="text-center">
                      <span :class="project.quality >= 95 ? 'text-green-600 font-medium' : project.quality >= 90 ? 'text-blue-600' : 'text-yellow-600'">
                        {{ project.quality > 0 ? `${project.quality}%` : '-' }}
                      </span>
                    </TableCell>
                    <TableCell class="text-center">
                      <span :class="project.errors > 0 ? 'text-red-600 font-medium' : ''">
                        {{ project.dataset_info?.project_total_errors > 0 ? project.dataset_info?.project_total_errors.toLocaleString() : '-' }}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span class="text-sm">{{ formatDate(project.due_date) }}</span>
                    </TableCell>
                    <TableCell>{{ project.assigned_by ? project.assigned_by : "-" }}</TableCell>
                    <TableCell class="text-right">
                      <!-- View Details Drawer -->
                      <Drawer>
                        <DrawerTrigger as-child>
                          <Button @click="getProjectJobData(project)">
                            <Eye class="w-4 h-4 mr-2" style="color: white !important;"/>
                            View Details
                          </Button>
                        </DrawerTrigger>
                        <DrawerContent>
                          <div class="data-drawer-content min-h-400px">
                            <DrawerHeader>
                              <DrawerTitle>PROJECT NAME: {{project.name ? project.name.toUpperCase() : 'N/A'}}</DrawerTitle>
                              <DrawerDescription>{{project.project_code || 'No project code'}}</DrawerDescription>
                              <DashboardProjectDetailsTable :project="project" @uploaded="handleUploaded" />
                            </DrawerHeader>
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
                          <DropdownMenuItem @click="downloadReport('data')">
                            <component :is="icons.Download" v-if="icons.Download" class="w-4 h-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem @click="downloadReport('data')">
                            <component :is="icons.Download" v-if="icons.Download" class="w-4 h-4 mr-2" />
                            Trash
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
                          :is="getTrendIcon(account.trend) === 'TrendingDown' ? TrendingDown : TrendingUp" 
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

<style scoped>
.data-drawer-content {
  height: 900px;
}
</style>