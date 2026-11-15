<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Database,
  Cloud,
  Server,
  Layers,
  ArrowRight,
  Search,
  CheckCircle2,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Play,
  RefreshCw,
  ShieldCheck,
  X,
  ChevronRight
} from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer'

// ====================== TYPES ======================
interface AirbytePropertySpec {
  type: 'string' | 'integer' | 'number' | 'boolean' | 'array' | 'object'
  title?: string
  description?: string
  default?: any
  examples?: any[]
  enum?: string[]
  airbyte_secret?: boolean
  order?: number
}

interface AirbyteConnectionSpec {
  type: string
  required?: string[]
  properties: Record<string, AirbytePropertySpec>
}

interface ConnectorItem {
  definitionId: string
  name: string
  category: 'Database' | 'CRM' | 'Storage' | 'Warehouse'
  releaseStage: 'generally_available' | 'beta'
  description: string
}

// ====================== STATE ======================
const currentStep = ref<1 | 2 | 3>(1)
const searchQuery = ref('')
const selectedCategory = ref<string>('All')

// Drawer & Dynamic Form State
const isConfigDrawerOpen = ref(false)
const activeConfigRole = ref<'source' | 'destination'>('source')
const activeConnector = ref<ConnectorItem | null>(null)
const isLoadingSpec = ref(false)
const activeSpec = ref<AirbyteConnectionSpec | null>(null)
const dynamicFormData = ref<Record<string, any>>({})
const secretVisibility = ref<Record<string, boolean>>({})
const formValidationErrors = ref<Record<string, string>>({})
const isTestingConnection = ref(false)
const connectionTestStatus = ref<'idle' | 'success' | 'error'>('idle')

// Saved Pipeline Configurations
const configuredSource = ref<{ connector: ConnectorItem; config: Record<string, any> } | null>(null)
const configuredDestination = ref<{ connector: ConnectorItem; config: Record<string, any> } | null>(null)
const syncFrequency = ref('every_1_hour')
const isProvisioningPipeline = ref(false)
const pipelineProvisionedSuccess = ref(false)

// ====================== MOCK AIRBYTE CATALOG ======================
const availableSources: ConnectorItem[] = [
  {
    definitionId: 'decd338e-5647-4c0b-adf4-da0e75f5a750',
    name: 'PostgreSQL',
    category: 'Database',
    releaseStage: 'generally_available',
    description: 'Replicate tables and WAL incremental changes from PostgreSQL databases.'
  },
  {
    definitionId: 'b117307c-14b6-41aa-9422-930a3892ba10',
    name: 'Salesforce CRM',
    category: 'CRM',
    releaseStage: 'generally_available',
    description: 'Extract Leads, Opportunities, Accounts, and custom SObjects via Bulk API.'
  },
  {
    definitionId: '69589781-7828-43c5-9f63-8925b1c1ccc2',
    name: 'Amazon S3 File Dump',
    category: 'Storage',
    releaseStage: 'generally_available',
    description: 'Ingest CSV, Parquet, JSONL, or Avro file dumps from S3 buckets.'
  },
  {
    definitionId: '435bb9a5-7887-4809-aa58-28c27df0d7ad',
    name: 'MySQL',
    category: 'Database',
    releaseStage: 'generally_available',
    description: 'High-throughput binlog CDC and snapshot extraction for MySQL.'
  }
]

const availableDestinations: ConnectorItem[] = [
  {
    definitionId: '424892c4-daac-4491-b35d-c6688ba547ba',
    name: 'Snowflake Warehouse',
    category: 'Warehouse',
    releaseStage: 'generally_available',
    description: 'Load normalized tables directly into Snowflake staging and production schemas.'
  },
  {
    definitionId: '22f6c74f-5699-40ff-833c-4a879ea40133',
    name: 'Google BigQuery',
    category: 'Warehouse',
    releaseStage: 'generally_available',
    description: 'Stream or batch-load partitioned tables into Google Cloud BigQuery.'
  },
  {
    definitionId: '25c5221d-dce2-4163-ade9-739ef790f503',
    name: 'PostgreSQL Target',
    category: 'Database',
    releaseStage: 'generally_available',
    description: 'Write normalized records into an operational PostgreSQL instance.'
  },
  {
    definitionId: '8be1cf83-fde1-477f-a4ad-318d23c9f3c6',
    name: 'Amazon S3 Data Lake',
    category: 'Storage',
    releaseStage: 'generally_available',
    description: 'Archive normalized datasets as compressed Parquet or CSV files in S3.'
  }
]

// ====================== MOCK AIRBYTE SPECS ======================
const mockSpecsByDefinitionId: Record<string, AirbyteConnectionSpec> = {
  'decd338e-5647-4c0b-adf4-da0e75f5a750': {
    type: 'object',
    required: ['host', 'port', 'database', 'username', 'password'],
    properties: {
      host: { type: 'string', title: 'Host Address', description: 'Hostname or IP of the PostgreSQL server.', examples: ['db.internal.company.com'], order: 1 },
      port: { type: 'integer', title: 'Port', default: 5432, description: 'Port number for PostgreSQL.', order: 2 },
      database: { type: 'string', title: 'Database Name', description: 'Name of the target database.', examples: ['production_crm'], order: 3 },
      username: { type: 'string', title: 'Username', description: 'Read-only replication user.', examples: ['airbyte_readonly'], order: 4 },
      password: { type: 'string', title: 'Password', airbyte_secret: true, description: 'Database password.', order: 5 },
      ssl_mode: { type: 'string', title: 'SSL Mode', enum: ['disable', 'allow', 'prefer', 'require', 'verify-full'], default: 'require', order: 6 }
    }
  },
  'b117307c-14b6-41aa-9422-930a3892ba10': {
    type: 'object',
    required: ['client_id', 'client_secret', 'refresh_token', 'start_date'],
    properties: {
      client_id: { type: 'string', title: 'Consumer Key (Client ID)', description: 'OAuth Consumer Key from your Salesforce Connected App.', order: 1 },
      client_secret: { type: 'string', title: 'Consumer Secret', airbyte_secret: true, description: 'OAuth Consumer Secret.', order: 2 },
      refresh_token: { type: 'string', title: 'Refresh Token', airbyte_secret: true, description: 'Permanent OAuth refresh token.', order: 3 },
      start_date: { type: 'string', title: 'Replication Start Date', examples: ['2025-01-01T00:00:00Z'], description: 'UTC ISO-8601 timestamp to begin syncing.', order: 4 },
      is_sandbox: { type: 'boolean', title: 'Use Sandbox Environment', default: false, description: 'Enable if connecting to test.salesforce.com.', order: 5 }
    }
  },
  '69589781-7828-43c5-9f63-8925b1c1ccc2': {
    type: 'object',
    required: ['dataset', 'bucket', 'aws_access_key_id', 'aws_secret_access_key', 'format'],
    properties: {
      dataset: { type: 'string', title: 'Output Stream Name', examples: ['raw_sales_dumps'], order: 1 },
      bucket: { type: 'string', title: 'S3 Bucket Name', examples: ['client-ingestion-dumps-prod'], order: 2 },
      path_prefix: { type: 'string', title: 'Folder Path Prefix', examples: ['exports/2026/'], order: 3 },
      format: { type: 'string', title: 'File Format', enum: ['csv', 'parquet', 'json', 'avro'], default: 'csv', order: 4 },
      aws_access_key_id: { type: 'string', title: 'AWS Access Key ID', airbyte_secret: true, order: 5 },
      aws_secret_access_key: { type: 'string', title: 'AWS Secret Access Key', airbyte_secret: true, order: 6 }
    }
  },
  default: {
    type: 'object',
    required: ['endpoint_url', 'api_key'],
    properties: {
      endpoint_url: { type: 'string', title: 'Endpoint / Host URL', examples: ['https://service.com'], order: 1 },
      api_key: { type: 'string', title: 'API Key / Token', airbyte_secret: true, description: 'Authentication key for the service.', order: 2 },
      region: { type: 'string', title: 'Cloud Region', enum: ['us-east-1', 'eu-west-1', 'af-south-1'], default: 'af-south-1', order: 3 },
      strict_schema: { type: 'boolean', title: 'Enforce Strict Schema Validation', default: true, order: 4 }
    }
  }
}

// ====================== COMPUTED ======================
const activeCatalog = computed(() => {
  const list = currentStep.value === 1 ? availableSources : availableDestinations
  return list.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCategory = selectedCategory.value === 'All' || item.category === selectedCategory.value
    return matchesSearch && matchesCategory
  })
})

const sortedSpecFields = computed(() => {
  if (!activeSpec.value?.properties) return []
  return Object.entries(activeSpec.value.properties)
    .map(([key, spec]) => ({
      key,
      ...spec,
      isRequired: activeSpec.value?.required?.includes(key) ?? false
    }))
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
})

// ====================== ACTIONS ======================
const openConnectorConfig = async (connector: ConnectorItem, role: 'source' | 'destination') => {
  activeConnector.value = connector
  activeConfigRole.value = role
  isConfigDrawerOpen.value = true
  isLoadingSpec.value = true
  connectionTestStatus.value = 'idle'
  formValidationErrors.value = {}
  secretVisibility.value = {}

  try {
    // Simulate network latency – replace with real FastAPI call
    await new Promise((resolve) => setTimeout(resolve, 400))
    const spec = mockSpecsByDefinitionId[connector.definitionId] || mockSpecsByDefinitionId.default
    activeSpec.value = spec

    const existingConfig =
      role === 'source' && configuredSource.value?.connector.definitionId === connector.definitionId
        ? configuredSource.value.config
        : role === 'destination' && configuredDestination.value?.connector.definitionId === connector.definitionId
          ? configuredDestination.value.config
          : null

    const initialData: Record<string, any> = {}
    for (const [key, prop] of Object.entries(spec.properties)) {
      if (existingConfig && existingConfig[key] !== undefined) {
        initialData[key] = existingConfig[key]
      } else if (prop.default !== undefined) {
        initialData[key] = prop.default
      } else if (prop.type === 'boolean') {
        initialData[key] = false
      } else {
        initialData[key] = ''
      }
    }
    dynamicFormData.value = initialData
  } finally {
    isLoadingSpec.value = false
  }
}

const validateDynamicForm = (): boolean => {
  const errors: Record<string, string> = {}
  if (!activeSpec.value) return false

  for (const field of sortedSpecFields.value) {
    const val = dynamicFormData.value[field.key]
    if (field.isRequired && (val === '' || val === null || val === undefined)) {
      errors[field.key] = `${field.title || field.key} is required by this connector.`
    }
  }
  formValidationErrors.value = errors
  return Object.keys(errors).length === 0
}

const testConnectorCredentials = async () => {
  if (!validateDynamicForm()) return
  isTestingConnection.value = true
  connectionTestStatus.value = 'idle'
  try {
    // Simulate real test – replace with FastAPI POST /connectors/test
    await new Promise((resolve) => setTimeout(resolve, 900))
    connectionTestStatus.value = 'success'
  } catch {
    connectionTestStatus.value = 'error'
  } finally {
    isTestingConnection.value = false
  }
}

const saveConnectorConfiguration = () => {
  if (!validateDynamicForm() || !activeConnector.value) return

  const payload = {
    connector: activeConnector.value,
    config: { ...dynamicFormData.value }
  }

  if (activeConfigRole.value === 'source') {
    configuredSource.value = payload
    if (!configuredDestination.value) currentStep.value = 2
  } else {
    configuredDestination.value = payload
    currentStep.value = 3
  }

  isConfigDrawerOpen.value = false
  searchQuery.value = ''
  selectedCategory.value = 'All'
}

const provisionFullPipeline = async () => {
  if (!configuredSource.value || !configuredDestination.value) return
  isProvisioningPipeline.value = true
  try {
    // Simulate provision – replace with FastAPI POST /pipelines
    await new Promise((resolve) => setTimeout(resolve, 1100))
    pipelineProvisionedSuccess.value = true
  } finally {
    isProvisioningPipeline.value = false
  }
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Database':
      return Database
    case 'Storage':
      return Cloud
    case 'Warehouse':
      return Server
    default:
      return Layers
  }
}

const resetPipeline = () => {
  configuredSource.value = null
  configuredDestination.value = null
  pipelineProvisionedSuccess.value = false
  currentStep.value = 1
  syncFrequency.value = 'every_1_hour'
}
</script>

<template>
  <div class="min-h-screen bg-white text-slate-900">
    <!-- Top Header Bar -->
    <header class="border-b border-slate-200 bg-white sticky top-0 z-20">
      <div class="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-600/20">
            <Layers class="h-5 w-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-lg font-bold tracking-tight text-slate-900">FlowBridge Mesh</h1>
              <Badge variant="outline" class="text-[10px] font-mono bg-orange-50 text-orange-600 border-orange-200">
                Airbyte Engine
              </Badge>
            </div>
            <p class="text-xs text-slate-500">Connect external sources and route normalized datasets to destinations</p>
          </div>
        </div>

        <!-- Stepper Controls -->
        <div class="bg-slate-100 border border-slate-200 p-1 rounded-xl flex items-center gap-1">
          <button
            type="button"
            @click="currentStep = 1"
            :class="[
              'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5',
              currentStep === 1 ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            ]"
          >
            <span>1. Source</span>
            <CheckCircle2 v-if="configuredSource" class="h-3.5 w-3.5" />
          </button>
          <ChevronRight class="h-3.5 w-3.5 text-slate-400" />
          <button
            type="button"
            @click="currentStep = 2"
            :class="[
              'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5',
              currentStep === 2 ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            ]"
          >
            <span>2. Destination</span>
            <CheckCircle2 v-if="configuredDestination" class="h-3.5 w-3.5" />
          </button>
          <ChevronRight class="h-3.5 w-3.5 text-slate-400" />
          <button
            type="button"
            :disabled="!configuredSource || !configuredDestination"
            @click="currentStep = 3"
            :class="[
              'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-40',
              currentStep === 3 ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            ]"
          >
            <span>3. Activate</span>
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <!-- Live Pipeline Summary Strip -->
      <section class="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div class="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <!-- Source Node Box -->
          <div
            @click="currentStep = 1"
            :class="[
              'w-full sm:w-64 p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between',
              configuredSource ? 'bg-white border-orange-300 shadow-sm' : 'bg-white/60 border-dashed border-slate-300'
            ]"
          >
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg" :class="configuredSource ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-400'">
                <Database class="h-4 w-4" />
              </div>
              <div>
                <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Source Ingestion</div>
                <div class="text-xs font-bold text-slate-800">
                  {{ configuredSource ? configuredSource.connector.name : 'Select a source...' }}
                </div>
              </div>
            </div>
            <Badge v-if="configuredSource" class="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">Ready</Badge>
          </div>

          <div class="flex items-center text-orange-500">
            <ArrowRight class="h-5 w-5 rotate-90 sm:rotate-0" />
          </div>

          <!-- Destination Node Box -->
          <div
            @click="currentStep = 2"
            :class="[
              'w-full sm:w-64 p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between',
              configuredDestination ? 'bg-white border-orange-300 shadow-sm' : 'bg-white/60 border-dashed border-slate-300'
            ]"
          >
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg" :class="configuredDestination ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-400'">
                <Server class="h-4 w-4" />
              </div>
              <div>
                <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Destination</div>
                <div class="text-xs font-bold text-slate-800">
                  {{ configuredDestination ? configuredDestination.connector.name : 'Select destination...' }}
                </div>
              </div>
            </div>
            <Badge v-if="configuredDestination" class="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">Ready</Badge>
          </div>
        </div>

        <div class="flex items-center gap-3 w-full lg:w-auto justify-end">
          <Button
            v-if="configuredSource && configuredDestination && currentStep !== 3"
            @click="currentStep = 3"
            class="bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-xl px-5"
          >
            Proceed to Activation
            <ArrowRight class="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </div>
      </section>

      <!-- Step 1 & Step 2: Connector Catalog Grid -->
      <section v-if="currentStep === 1 || currentStep === 2" class="space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-widest text-orange-600">
              Step {{ currentStep }} of 3
            </span>
            <h2 class="text-xl font-bold text-slate-900">
              {{ currentStep === 1 ? 'Choose Your Data Source Connector' : 'Choose Your Destination Connector' }}
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">
              Click any connector below to dynamically load its Airbyte schema specification and enter credentials.
            </p>
          </div>

          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div class="relative">
              <Search class="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search connectors..."
                class="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 w-full sm:w-64"
              />
            </div>

            <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                v-for="cat in ['All', 'Database', 'CRM', 'Storage', 'Warehouse']"
                :key="cat"
                type="button"
                @click="selectedCategory = cat"
                :class="[
                  'px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all',
                  selectedCategory === cat ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                ]"
              >
                {{ cat }}
              </button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div
            v-for="connector in activeCatalog"
            :key="connector.definitionId"
            @click="openConnectorConfig(connector, currentStep === 1 ? 'source' : 'destination')"
            class="group bg-white border border-slate-200 hover:border-orange-500 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
          >
            <div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div class="space-y-3">
              <div class="flex items-start justify-between">
                <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 group-hover:bg-orange-50 group-hover:text-orange-600 group-hover:border-orange-200 transition-colors">
                  <component :is="getCategoryIcon(connector.category)" class="h-5 w-5" />
                </div>
                <Badge variant="outline" class="text-[10px] font-mono bg-slate-50 text-slate-500 border-slate-200">
                  {{ connector.category }}
                </Badge>
              </div>

              <div>
                <h3 class="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                  {{ connector.name }}
                </h3>
                <p class="text-xs text-slate-500 leading-relaxed mt-1">
                  {{ connector.description }}
                </p>
              </div>
            </div>

            <div class="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-orange-600">
              <span>Configure Schema</span>
              <ArrowRight class="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      <!-- Step 3: Final Verification & Provision -->
      <section v-if="currentStep === 3" class="space-y-6">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-widest text-orange-600">Step 3 of 3</span>
          <h2 class="text-xl font-bold text-slate-900">Review & Provision Sync Pipeline</h2>
          <p class="text-xs text-slate-500 mt-0.5">Confirm both ends and launch the active Airbyte connection.</p>
        </div>

        <div v-if="!pipelineProvisionedSuccess" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Source Summary -->
          <div class="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="p-2 rounded-lg bg-orange-50 text-orange-600">
                  <Database class="h-4 w-4" />
                </div>
                <span class="text-sm font-bold text-slate-900">Source Node</span>
              </div>
              <button
                type="button"
                @click="openConnectorConfig(configuredSource!.connector, 'source')"
                class="text-[11px] font-semibold text-orange-600 hover:underline"
              >
                Edit Config
              </button>
            </div>
            <div>
              <div class="text-sm font-semibold text-slate-800">{{ configuredSource?.connector.name }}</div>
              <div class="text-xs text-slate-500 mt-1">
                {{ Object.keys(configuredSource?.config || {}).length }} schema parameters verified
              </div>
            </div>
          </div>

          <!-- Destination Summary -->
          <div class="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="p-2 rounded-lg bg-orange-50 text-orange-600">
                  <Server class="h-4 w-4" />
                </div>
                <span class="text-sm font-bold text-slate-900">Destination Node</span>
              </div>
              <button
                type="button"
                @click="openConnectorConfig(configuredDestination!.connector, 'destination')"
                class="text-[11px] font-semibold text-orange-600 hover:underline"
              >
                Edit Config
              </button>
            </div>
            <div>
              <div class="text-sm font-semibold text-slate-800">{{ configuredDestination?.connector.name }}</div>
              <div class="text-xs text-slate-500 mt-1">
                {{ Object.keys(configuredDestination?.config || {}).length }} schema parameters verified
              </div>
            </div>
          </div>
        </div>

        <!-- Schedule + Actions -->
        <div v-if="!pipelineProvisionedSuccess" class="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div>
            <h3 class="text-sm font-bold text-slate-900 mb-3">Automated Replication Schedule</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <label
                v-for="opt in [
                  { value: 'manual', label: 'Manual Trigger Only (Via API / Button)' },
                  { value: 'every_15_min', label: 'Every 15 Minutes (High-Frequency Incremental)' },
                  { value: 'every_1_hour', label: 'Every 1 Hour (Recommended)' },
                  { value: 'every_24_hours', label: 'Every 24 Hours (Daily Batch)' }
                ]"
                :key="opt.value"
                class="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all"
                :class="syncFrequency === opt.value ? 'border-orange-400 bg-orange-50/50' : 'border-slate-200 hover:border-slate-300'"
              >
                <input
                  type="radio"
                  v-model="syncFrequency"
                  :value="opt.value"
                  class="mt-0.5 accent-orange-600"
                />
                <span class="text-xs font-medium text-slate-700">{{ opt.label }}</span>
              </label>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <Button variant="outline" @click="currentStep = 1" class="rounded-xl border-slate-200 text-slate-600">
              Back to Catalog
            </Button>
            <Button
              @click="provisionFullPipeline"
              :disabled="isProvisioningPipeline"
              class="bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl px-6 shadow-md shadow-orange-600/15"
            >
              <Loader2 v-if="isProvisioningPipeline" class="h-4 w-4 mr-2 animate-spin" />
              <Play v-else class="h-4 w-4 mr-2" />
              {{ isProvisioningPipeline ? 'Provisioning Connection...' : 'Launch Active Sync Pipeline' }}
            </Button>
          </div>
        </div>

        <!-- Success State -->
        <div v-else class="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-4">
          <div class="mx-auto h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <ShieldCheck class="h-7 w-7" />
          </div>
          <div>
            <h3 class="text-lg font-bold text-emerald-900">Connection Provisioned Successfully!</h3>
            <p class="text-sm text-emerald-700 mt-1">
              Airbyte is now syncing records from
              <strong>{{ configuredSource?.connector.name }}</strong>
              to
              <strong>{{ configuredDestination?.connector.name }}</strong>.
            </p>
          </div>
          <div class="flex justify-center gap-3 pt-2">
            <Button variant="outline" @click="resetPipeline" class="rounded-xl border-emerald-300 text-emerald-800">
              <RefreshCw class="h-4 w-4 mr-2" />
              Start New Pipeline
            </Button>
          </div>
        </div>
      </section>
    </main>

    <!-- Configuration Drawer -->
    <Drawer v-model:open="isConfigDrawerOpen">
      <DrawerContent class="max-h-[92vh]">
        <DrawerHeader class="border-b border-slate-100 pb-4">
          <div class="flex items-start justify-between">
            <div>
              <DrawerTitle class="text-base font-bold text-slate-900">
                Configure {{ activeConnector?.name }}
              </DrawerTitle>
              <DrawerDescription class="text-xs text-slate-500 mt-1">
                Fields below are dynamically generated from the Airbyte connector specification.
              </DrawerDescription>
            </div>
            <DrawerClose as-child>
              <button type="button" class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                <X class="h-4 w-4" />
              </button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div class="px-6 py-5 overflow-y-auto max-h-[60vh]">
          <!-- Loading Spec -->
          <div v-if="isLoadingSpec" class="flex flex-col items-center justify-center py-16 space-y-3">
            <Loader2 class="h-8 w-8 text-orange-600 animate-spin" />
            <div class="text-sm font-medium text-slate-700">Fetching Connector Specification Schema...</div>
            <div class="text-xs text-slate-500">Querying backend Airbyte definition registry</div>
          </div>

          <!-- Dynamic Form -->
          <form v-else-if="activeSpec" @submit.prevent="saveConnectorConfiguration" class="space-y-5">
            <div
              v-for="field in sortedSpecFields"
              :key="field.key"
              class="space-y-1.5"
            >
              <label class="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                {{ field.title || field.key }}
                <span v-if="field.isRequired" class="text-orange-600">*</span>
              </label>

              <p v-if="field.description" class="text-[11px] text-slate-500 leading-snug">
                {{ field.description }}
              </p>

              <!-- Boolean -->
              <div v-if="field.type === 'boolean'" class="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  v-model="dynamicFormData[field.key]"
                  class="h-4 w-4 rounded border-slate-300 accent-orange-600"
                />
                <span class="text-xs text-slate-600">Enable {{ field.title || field.key }}</span>
              </div>

              <!-- Enum / Select -->
              <select
                v-else-if="field.enum && field.enum.length"
                v-model="dynamicFormData[field.key]"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
              >
                <option v-for="option in field.enum" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>

              <!-- Secret / Password -->
              <div v-else-if="field.airbyte_secret" class="relative">
                <input
                  :type="secretVisibility[field.key] ? 'text' : 'password'"
                  v-model="dynamicFormData[field.key]"
                  :placeholder="field.examples?.[0] || ''"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-10 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                />
                <button
                  type="button"
                  @click="secretVisibility[field.key] = !secretVisibility[field.key]"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <Eye v-if="!secretVisibility[field.key]" class="h-4 w-4" />
                  <EyeOff v-else class="h-4 w-4" />
                </button>
              </div>

              <!-- Number / Integer -->
              <input
                v-else-if="field.type === 'integer' || field.type === 'number'"
                type="number"
                v-model.number="dynamicFormData[field.key]"
                :placeholder="field.examples?.[0]?.toString() || ''"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
              />

              <!-- Default Text -->
              <input
                v-else
                type="text"
                v-model="dynamicFormData[field.key]"
                :placeholder="field.examples?.[0] || ''"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
              />

              <!-- Validation Error -->
              <p v-if="formValidationErrors[field.key]" class="text-[11px] text-red-600 flex items-center gap-1 mt-1">
                <AlertCircle class="h-3 w-3" />
                {{ formValidationErrors[field.key] }}
              </p>
            </div>

            <!-- Connection Test Status -->
            <div
              v-if="connectionTestStatus === 'success'"
              class="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs"
            >
              <CheckCircle2 class="h-4 w-4 shrink-0" />
              Connection check passed! Credentials and network reachability verified.
            </div>
            <div
              v-else-if="connectionTestStatus === 'error'"
              class="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs"
            >
              <AlertCircle class="h-4 w-4 shrink-0" />
              Connection check failed. Please verify your host, keys, or firewall permissions.
            </div>
          </form>
        </div>

        <DrawerFooter class="border-t border-slate-100 pt-4 flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            @click="testConnectorCredentials"
            :disabled="isLoadingSpec || isTestingConnection"
            class="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
          >
            <Loader2 v-if="isTestingConnection" class="h-3.5 w-3.5 mr-1.5 animate-spin" />
            <ShieldCheck v-else class="h-3.5 w-3.5 mr-1.5" />
            {{ isTestingConnection ? 'Testing Credentials...' : 'Test Connection' }}
          </Button>

          <DrawerClose as-child>
            <Button type="button" variant="outline" class="rounded-xl border-slate-200 text-slate-600 text-xs">
              Cancel
            </Button>
          </DrawerClose>

          <Button
            type="button"
            @click="saveConnectorConfiguration"
            :disabled="isLoadingSpec"
            class="bg-orange-600 hover:bg-orange-500 text-white rounded-xl px-6 text-xs font-semibold shadow-sm"
          >
            Save {{ activeConfigRole === 'source' ? 'Source' : 'Destination' }}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  </div>
</template>