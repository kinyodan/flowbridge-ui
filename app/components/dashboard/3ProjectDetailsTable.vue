<script lang="ts">
import { defineComponent, ref } from 'vue'
import projectsService from '../../../services/projectsService.js'
import dataProcessorService from '../../../services/dataProcessorService.js'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

export default defineComponent({
  name: 'ProjectDetailsTable',
  components: {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
  },

  props: {
    project: {
      type: Object,
      default: () => ({ datasets: [] })
    },
  },

  data() {
    return {
      apiUrl: "https://intraq-backend.onrender.com",
      fileInput: null as HTMLInputElement | null,
      uploading: false,
      uploadError: '',
      uploadSuccess: '',
      dataOpsProjectsG: [],
      fileLink: "",
      clientId: null as string | null,
      uploadfiles: null as FileList | null,   // Changed to FileList
      activeTab: 'projects-jobs', // Default tab: Projects Jobs
      selectedJobId: null as number | null, // Currently selected job in Job Progress tab
      terminalLogs: [] as Array<{ timestamp: string; level: string; message: string }>,
      wsConnection: null as WebSocket | null,
      activeTerminalSession: 'session-1', // Active terminal session tab
      terminalSessions: [
        { id: 'session-1', norm: 1, name: 'Session 1', jobId: null as string | null, ws: null as WebSocket | null, status: 'idle' as 'idle' | 'running' | 'stopped' | 'error' },
        { id: 'session-2', norm: 2, name: 'Session 2', jobId: null as string | null, ws: null as WebSocket | null, status: 'idle' as 'idle' | 'running' | 'stopped' | 'error' },
        { id: 'session-3', norm: 3, name: 'Session 3', jobId: null as string | null, ws: null as WebSocket | null, status: 'idle' as 'idle' | 'running' | 'stopped' | 'error' },
        { id: 'session-4', norm: 4, name: 'Session 4', jobId: null as string | null, ws: null as WebSocket | null, status: 'idle' as 'idle' | 'running' | 'stopped' | 'error' },
        { id: 'session-5', norm: 5, name: 'Session 5', jobId: null as string | null, ws: null as WebSocket | null, status: 'idle' as 'idle' | 'running' | 'stopped' | 'error' },
        { id: 'session-6', norm: 6, name: 'Session 6', jobId: null as string | null, ws: null as WebSocket | null, status: 'idle' as 'idle' | 'running' | 'stopped' | 'error' },
        { id: 'session-7', norm: 7, name: 'Session 7', jobId: null as string | null, ws: null as WebSocket | null, status: 'idle' as 'idle' | 'running' | 'stopped' | 'error' },
        { id: 'session-8', norm: 8, name: 'Session 8', jobId: null as string | null, ws: null as WebSocket | null, status: 'idle' as 'idle' | 'running' | 'stopped' | 'error' },
        { id: 'session-9', norm: 9, name: 'Session 9', jobId: null as string | null, ws: null as WebSocket | null, status: 'idle' as 'idle' | 'running' | 'stopped' | 'error' },
        { id: 'session-10', norm: 10, name: 'Session 10', jobId: null as string | null, ws: null as WebSocket | null, status: 'idle' as 'idle' | 'running' | 'stopped' | 'error' }
      ] as Array<{ id: string; name: string; jobId: string | null; ws: WebSocket | null; status: 'idle' | 'running' | 'stopped' | 'error' }>,
      sessionLogs: {
        'session-1': [] as Array<{ timestamp: string; level: string; message: string }>,
        'session-2': [] as Array<{ timestamp: string; level: string; message: string }>,
        'session-3': [] as Array<{ timestamp: string; level: string; message: string }>,
        'session-4': [] as Array<{ timestamp: string; level: string; message: string }>,
        'session-5': [] as Array<{ timestamp: string; level: string; message: string }>,
        'session-6': [] as Array<{ timestamp: string; level: string; message: string }>,
        'session-7': [] as Array<{ timestamp: string; level: string; message: string }>,
        'session-8': [] as Array<{ timestamp: string; level: string; message: string }>,
        'session-9': [] as Array<{ timestamp: string; level: string; message: string }>,
        'session-10': [] as Array<{ timestamp: string; level: string; message: string }>,
      },
    }
  },

  mounted() {
    if (process.client) {
      this.clientId = localStorage.getItem('client_id') || null
    }
  },

  methods: {
    async getProjects() {
      if (!process.client) return
      try {
        const setClientId = localStorage.getItem('client_id') || null
        const response = await projectsService.getProjects(setClientId)
        if (response?.status) {
          this.dataOpsProjectsG = response.data?.data || []
        }
      } catch (error) {
        console.error('Error fetching projects:', error)
      }
    },

    handleFiles(event: Event) {
      const target = event.target as HTMLInputElement
      if (target?.files) {
        this.uploadfiles = target.files
        console.log("uploadfiles handling method at project view", this.uploadfiles)
        console.log(event)
      }
    },

    // FIXED: Clean handleFileUpload using Options API properly
    async handleFileUpload() {
      const files = this.uploadfiles
      const projectName = this.project?.name || ''

      this.uploadError = ''
      this.uploadSuccess = ''

      if (!files || files.length === 0) {
        this.uploadError = 'Please select a file first'
        return
      }

      if (!projectName) {
        this.uploadError = 'Project name is required'
        return
      }

      // File validation
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ]

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileExt = file.name.toLowerCase().match(/\.(csv|xlsx|xls)$/i)

        if (!allowedTypes.includes(file.type) && !fileExt) {
          this.uploadError = 'Please upload a valid Excel (.xlsx, .xls) or CSV file.'
          return
        }
        if (file.size > 10 * 1024 * 1024) {
          this.uploadError = 'File too large. Maximum size is 10MB.'
          return
        }
      }

      this.uploading = true

      try {
        const formData = new FormData()
        formData.append('project_name', projectName)
        formData.append('client_id', this.project?.client_id || '')
        formData.append('project_code', this.project?.project_code || '')
        formData.append('assigned_to', this.project?.assigned_to || '')
        formData.append('assigned_by', this.project?.assigned_by || '')

        // Append all selected files
        for (let i = 0; i < files.length; i++) {
          formData.append('files', files[i])
        }

        const response = await projectsService.uploadDataset(formData)
        console.log("response-response-response")
        console.log(response)
        console.log("response-response-response")

        if (response?.status === 202) {
          const responseData = response.data
          const fileCount = responseData.task_ids?.length || 0
          this.uploadSuccess = `Successfully uploaded ${fileCount} file${fileCount >= 1 ? '' : 's'}\n ${responseData.message} when done, will appear in the projects Jobs list`
          this.$emit('uploaded', response)

          // Clear input
          this.uploadfiles = null
          if (this.fileInput) {
            this.fileInput = ""
          }

          // if (this.fileInputRef.value) {
          //   this.fileInputRef.value = null
          // }

          this.$nextTick(() => {
            if (this.fileInput) {
              this.fileInput = ''
            }
          })

        } else {
          this.uploadError = response?.data?.message || 'Upload failed'
        }
      } catch (err: any) {
        console.error('Upload failed:', err)
        this.uploadError = err?.response?.data?.message || err.message || 'Upload failed. Please try again.'
      } finally {
        this.uploading = false
      }
    },

    projectRecords(metaInfo: string) {
      try {
        const parsedInfo = JSON.parse(metaInfo)
        return parsedInfo?.rows || "-"
      } catch {
        return "-"
      }
    },

    formatDate(dateString: string) {
      if (!dateString) return "-"
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    },

    getStatusVariant(status: string) {
      switch (status) {
        case 'completed': return 'outline'
        case 'in-progress': return 'default'
        case 'validation': return 'secondary'
        case 'pending': return 'secondary'
        default: return 'secondary'
      }
    },

    downloadReport(type: string) {
      console.log(`Downloading ${type} report`)
    },

    // Job Progress tab methods
    selectJob(jobId: number) {
      this.selectedJobId = jobId
    },

    getJobStatusColor(status: string) {
      switch (status) {
        case 'completed': return 'bg-green-500'
        case 'in-progress': return 'bg-blue-500'
        case 'pending': return 'bg-yellow-500'
        case 'failed': return 'bg-red-500'
        default: return 'bg-gray-500'
      }
    },

    getJobStatusVariant(status: string) {
      switch (status) {
        case 'completed': return 'bg-green-500'
        case 'in-progress': return 'bg-blue-500'
        case 'pending': return 'bg-yellow-500'
        case 'failed': return 'bg-red-500'
        default: return 'bg-gray-500'
      }
    },

    async startJobSession(sessionId) {
      const session = this.terminalSessions.find(s => s.id === sessionId)
      if (!session) return

      if (session.status === 'running' && session.ws) {
        this.addLogToSession(sessionId, 'warn', 'Session already running')
        return
      }

      this.addLogToSession(sessionId, 'info', 'Starting websocket job...')

      try {
        const norm =  session.norm || null

        if (!norm) return

        const remoteFile =
          this.fileLink ||
          'https://raw.githubusercontent.com/kinyodan/jobfiles/refs/heads/master/danaba_cleaned_normalized_normalized_20260401_225222.csv'

        const headless = false

        const automationFile = `${this.project?.project_code}_automation.py`

        // IMPORTANT: get auth token from your auth store
        const authToken = localStorage.getItem('access_token') 
          //|| this.authToken || this.token

        if (!authToken) {
          session.status = 'error'
          this.addLogToSession(sessionId, 'error', 'Missing authentication token')
          return
        }

        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const wsUrl = `${wsProtocol}//intraq-automations-16520908241.europe-west1.run.app/ws/run`

        const ws = new WebSocket(wsUrl)

        session.ws = ws
        session.status = 'connecting'

        let authenticated = false

        ws.onopen = () => {
          session.status = 'authenticating'

          this.addLogToSession(sessionId, 'info', 'WebSocket connected')

          // STEP 1: authenticate first
          console.log("websockets oNoPEN FOR SESSION", session)
          ws.send(
            JSON.stringify({
              type: 'auth',
              token: authToken,
              norm: norm,
              remote_file: remoteFile,
              automation_file: automationFile,
              headless: headless
            })
          )
        }

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data)

          console.log('WS message:', data)

          switch (data.type) {
            case 'authenticated':
              authenticated = true
              session.status = 'running'

              this.addLogToSession(sessionId, 'success', 'Authenticated successfully')

              // STEP 2: send actual job payload
              ws.send(
                JSON.stringify({
                  norm,
                  remote_file: remoteFile,
                  automation_file: automationFile,
                  headless
                })
              )
              break

            case 'started':
              session.jobId = data.job_id
              this.addLogToSession(
                sessionId,
                'info',
                `Job started: ${data.job_id}`
              )
              break

            case 'status':
              if (data.job?.status) {
                session.status = data.job.status
              }

              this.addLogToSession(
                sessionId,
                'info',
                JSON.stringify(data.job, null, 2)
              )
              break

            case 'complete':
              session.status = data.job?.status || 'completed'
              this.addLogToSession(
                sessionId,
                'success',
                `Job finished: ${session.status}`
              )
              ws.close()
              break

            case 'error':
              session.status = 'error'
              this.addLogToSession(sessionId, 'error', data.message)
              break

            default:
              this.addLogToSession(sessionId, 'info', event.data)
          }
        }

        ws.onerror = (err) => {
          session.status = 'error'
          this.addLogToSession(sessionId, 'error', 'WebSocket connection error')
          console.error(err)
        }

        ws.onclose = () => {
          this.addLogToSession(sessionId, 'info', 'WebSocket disconnected')

          if (session.status === 'running' || session.status === 'authenticating') {
            session.status = 'disconnected'
          }
        }
      } catch (err) {
        session.status = 'error'
        this.addLogToSession(
          sessionId,
          'error',
          `Failed to start: ${err.message}`
        )
      }
    },

    // // Terminal WebSocket methods - per session
    // async startJobSession(sessionId: string) {
    //   const session = this.terminalSessions.find(s => s.id === sessionId)
    //   if (!session) return

    //   // If already running, don't start again
    //   if (session.status === 'running' && session.ws) {
    //     this.addLogToSession(sessionId, 'warn', 'Session already running')
    //     return
    //   }

    //   this.addLogToSession(sessionId, 'info', 'Starting job...')

    //   try {
    //     // For now, use default params or get from user input
    //     // You can add a modal/prompt to get these values
    //     const norm = 1
    //     const remoteFile = this.fileLink || 'https://raw.githubusercontent.com/kinyodan/jobfiles/refs/heads/master/danaba_cleaned_normalized_normalized_20260401_225222.csv'
    //     const headless = false

    //     const formData = new FormData()
    //     formData.append('norm', norm)
    //     formData.append('remote_file', remoteFile || '')
    //     formData.append('headless', headless || false)
    //     formData.append('project_code', this.project?.project_code || '')

    //     const response = await dataProcessorService.dataProcessing(formData)
    //     console.log("startJobSession-response-response")
    //     console.log(response)
    //     console.log("startJobSession-response-response")

    //     if (response.ok && data.job_id) {
    //       session.jobId = data.job_id
    //       session.status = 'running'
    //       this.addLogToSession(sessionId, 'info', `Job started: ${data.job_id}`)
    //       this.connectSessionWebSocket(sessionId, data.job_id)
    //     } else {
    //       session.status = 'error'
    //       this.addLogToSession(sessionId, 'error', data.detail || 'Failed to start job')
    //     }
    //   } catch (err: any) {
    //     session.status = 'error'
    //     this.addLogToSession(sessionId, 'error', `Failed to start: ${err.message}`)
    //   }
    // },

    async stopJobSession(sessionId: string) {
      const session = this.terminalSessions.find(s => s.id === sessionId)
      if (!session || !session.jobId) {
        this.addLogToSession(sessionId, 'warn', 'No job to stop')
        return
      }

      this.addLogToSession(sessionId, 'info', `Stopping job ${session.jobId}...`)

      try {
        const response = await fetch(`${this.apiUrl}/status/${session.jobId}/stop`, {
          method: 'POST'
        })

        const data = await response.json()

        if (response.ok) {
          session.status = 'stopped'
          this.addLogToSession(sessionId, 'info', 'Job stopped successfully')
          this.disconnectSessionWebSocket(sessionId)
        } else {
          this.addLogToSession(sessionId, 'error', data.detail || 'Failed to stop job')
        }
      } catch (err: any) {
        this.addLogToSession(sessionId, 'error', `Failed to stop: ${err.message}`)
      }
    },

    connectSessionWebSocket(sessionId: string, jobId: string) {
      const session = this.terminalSessions.find(s => s.id === sessionId)
      if (!session) return

      // Close existing connection if any
      if (session.ws) {
        session.ws.close()
        session.ws = null
      }

      const wsUrl = `${this.apiUrl.replace('http', 'ws')}/ws/jobs/${jobId}`
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        session.status = 'running'
        this.addLogToSession(sessionId, 'info', `Connected to job ${jobId}`)
      }

      ws.onmessage = (event) => {
        // API sends raw text, not JSON
        this.addLogToSession(sessionId, 'info', event.data)
      }

      ws.onerror = (error) => {
        session.status = 'error'
        this.addLogToSession(sessionId, 'error', 'WebSocket error occurred')
      }

      ws.onclose = () => {
        if (session.status === 'running') {
          session.status = 'stopped'
        }
        this.addLogToSession(sessionId, 'warn', 'Connection closed')
        session.ws = null
      }

      session.ws = ws
      session.jobId = jobId
    },

    disconnectSessionWebSocket(sessionId: string) {
      const session = this.terminalSessions.find(s => s.id === sessionId)
      if (session?.ws) {
        session.ws.close()
        session.ws = null
      }
    },

    disconnectAllWebSockets() {
      this.terminalSessions.forEach(session => {
        if (session.ws) {
          session.ws.close()
          session.ws = null
        }
      })
    },

    // Legacy methods - replaced by per-session methods
    connectTerminalWebSocket() {
      // Deprecated - use startJobSession instead
      console.log('Use startJobSession() for per-session connections')
    },

    disconnectTerminalWebSocket() {
      this.disconnectAllWebSockets()
    },

    addTerminalLog(level: string, message: string) {
      const timestamp = new Date().toLocaleTimeString()
      this.terminalLogs.push({ timestamp, level, message })
      
      // Keep only last 1000 logs
      if (this.terminalLogs.length > 1000) {
        this.terminalLogs.shift()
      }
      
      this.$nextTick(() => {
        this.scrollToBottom()
      })
    },

    clearTerminalLogs(sessionId?: string) {
      if (sessionId) {
        const sessionKey = sessionId as keyof typeof this.sessionLogs
        this.sessionLogs[sessionKey] = []
      } else {
        // Clear current active session
        const sessionKey = this.activeTerminalSession as keyof typeof this.sessionLogs
        this.sessionLogs[sessionKey] = []
      }
    },

    selectTerminalSession(sessionId: string) {
      this.activeTerminalSession = sessionId
      this.$nextTick(() => {
        this.scrollToBottom()
      })
    },

    addLogToSession(sessionId: string, level: string, message: string) {
      const timestamp = new Date().toLocaleTimeString()
      const sessionKey = sessionId as keyof typeof this.sessionLogs
      this.sessionLogs[sessionKey].push({ timestamp, level, message })
      
      // Keep only last 1000 logs per session
      if (this.sessionLogs[sessionKey].length > 1000) {
        this.sessionLogs[sessionKey].shift()
      }
      
      if (sessionId === this.activeTerminalSession) {
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      }
    },

    scrollToBottom() {
      const container = document.getElementById('terminal-container')
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    }
  },

  mounted() {
    if (process.client) {
      this.clientId = localStorage.getItem('client_id') || null
      // Connect WebSocket when on job-progress tab
      if (this.activeTab === 'job-progress') {
        this.connectTerminalWebSocket()
      }
    }
  },

  watch: {
    activeTab(newTab) {
      if (newTab === 'job-progress' && process.client) {
        this.connectTerminalWebSocket()
      } else {
        this.disconnectTerminalWebSocket()
      }
    }
  },

  computed: {
    // Get selected job data
    selectedJob() {
      if (!this.selectedJobId) return null
      return this.project.datasets?.find((job: any) => job.dataset_id ) || null
    },

    // Generate cards data based on selected job
    jobCards() {
      if (!this.selectedJob) return []
      
      const job = this.selectedJob
      const metaInfo = job.meta_info ? JSON.parse(job.meta_info) : {}
      
      return [
        {
          icon: '📊',
          color: 'blue',
          title: 'Total Records',
          value: metaInfo.rows?.toLocaleString() || '0',
          desc: 'Records in dataset',
          progress: null
        },
        {
          icon: '✅',
          color: 'green',
          title: 'Status',
          value: job.status || 'Pending',
          desc: 'Current processing status',
          progress: job.status === 'completed' ? 100 : job.status === 'in-progress' ? 65 : 0
        },
        {
          icon: '⚠️',
          color: 'red',
          title: 'Errors',
          value: job.processing_errors?.toString() || '0',
          desc: 'Processing errors encountered',
          progress: null
        },
        {
          icon: '📅',
          color: 'purple',
          title: 'Due Date',
          value: this.formatDate(job.due_date),
          desc: 'Expected completion date',
          progress: null
        }
      ]
    }
  }
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid gap-2">
      <div class="flex gap-2">
        <Badge variant="secondary" class="rounded-full" as-child>
          <!-- Add badge content if needed -->
        </Badge>
      </div>
    </div>
    
    <!-- Display upload status messages -->
    <div v-if="uploadError" class="p-3 bg-red-50 text-red-700 rounded-md">
      {{ uploadError }}
    </div>
    <div v-if="uploadSuccess" class="p-3 bg-green-50 text-green-700 rounded-md">
      {{ uploadSuccess }}
    </div>

    <!-- TABS: Projects Jobs (default) | Job Progress -->
    <Tabs v-model="activeTab" class="w-full">
      <TabsList class="grid w-full grid-cols-2 max-w-md mb-4">
        <TabsTrigger value="projects-jobs">
          Projects Jobs
        </TabsTrigger>
        <TabsTrigger value="job-progress">
          Job Progress
        </TabsTrigger>
      </TabsList>

      <!-- TAB 1: Projects Jobs (Default) - Original content -->
      <TabsContent value="projects-jobs" class="space-y-4">
        <div class="grid gap-4 md:grid-cols-2">
          <!-- LEFT COLUMN: Table in ScrollArea -->
          <div class="h-[600px]">
            <DashboardScrollArea class="h-full">
              <Card class="w-full h-full flex flex-col">
                <CardHeader class="flex-shrink-0">
                  <CardTitle>Project Jobs</CardTitle>
                </CardHeader>
                <CardContent class="flex-grow overflow-hidden">
                  <div class="h-full">
                    <Table class="w-full">
                      <TableCaption>A list of your recent project Jobs.</TableCaption>
                      <TableHeader class="sticky top-0 bg-white z-10">
                        <TableRow>
                          <TableHead class="w-[100px]">File name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Records</TableHead>
                          <TableHead>Errors</TableHead>
                          <TableHead class="text-right">Created at</TableHead>
                          <TableHead class="text-right">Due Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow v-for="data in project.datasets" :key="data.id || data.filename">
                          <TableCell class="font-medium">
                            {{ data.filename }}
                          </TableCell>
                          <TableCell>
                            <Badge :variant="getStatusVariant(data.status)">
                              {{ data.status ? data.status : "-" }}
                            </Badge>
                          </TableCell>
                          <TableCell>{{ projectRecords(data.meta_info) }}</TableCell>
                          <TableCell>{{ data.processing_errors || "-" }}</TableCell>
                          <TableCell class="text-right">
                            {{ formatDate(data.created_at) }}
                          </TableCell>
                          <TableCell class="text-right">
                            {{ formatDate(data.due_date) }}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger as-child>
                                <Button variant="ghost" size="sm">
                                  <component :is="icons.MoreHorizontal" v-if="icons.MoreHorizontal" class="w-4 h-4" />
                                  <span v-else>...</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem @click="downloadReport('data')">
                                  <component :is="icons.FileText" v-if="icons.FileText" class="w-4 h-4 mr-2" />
                                  Generate Report
                                </DropdownMenuItem>
                                <DropdownMenuItem @click="downloadReport('data')">
                                  <component :is="icons.Download" v-if="icons.Download" class="w-4 h-4 mr-2" />
                                  Export Data
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        <TableRow v-if="!project.datasets || project.datasets.length === 0">
                          <TableCell colspan="7" class="text-center py-8 text-gray-500">
                            No datasets found
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </DashboardScrollArea>
          </div>

          <!-- RIGHT COLUMN: Add Project Jobs -->
          <Card class="w-full">
            <CardHeader>
              <CardTitle>Add Project Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
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

                  <Button 
                    @click="handleFileUpload" 
                    class="w-full"
                    :disabled="uploading"
                  >
                    <span v-if="uploading">Uploading...</span>
                    <span v-else>Upload & Process</span>
                  </Button>
                  
                  <div v-if="uploading" class="text-center">
                    <div class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    <span class="ml-2">Uploading file...</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <!-- TAB 2: Job Progress - 4 Content Cards (2 on each side) -->
      <TabsContent value="job-progress" class="space-y-4">
        <div class="flex gap-4">
          <!-- LEFT COLUMN: Vertical Jobs List Section -->
          <div class="w-72 flex-shrink-0">
            <div class="w-full flex flex-col border rounded-lg bg-gray-50 h-[600px]">
              <div class="p-4 border-b bg-white rounded-t-lg flex-shrink-0">
                <h3 class="font-semibold text-gray-900">📋 Project Jobs</h3>
                <p class="text-xs text-gray-500 mt-1">Select a job to view details</p>
              </div>
              <div class="flex-1 overflow-y-auto p-2">
                <button
                  v-for="job in project.datasets"
                  :key="job.dataset_id"
                  @click="selectJob(job.dataset_id)"
                  class="w-full flex items-center p-3 mb-2 rounded-lg text-left transition-all duration-200"
                  :class="selectedJobId === job.dataset_id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'"
                >
                  <!-- Status Dot -->
                  <span
                    class="w-2 h-2 rounded-full mr-3 flex-shrink-0"
                    :class="getJobStatusColor(job.status)"
                  ></span>
                  
                  <!-- Job Info -->
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium truncate" :class="selectedJobId === job.dataset_id ? 'text-white' : 'text-gray-900'">
                      {{ job.filename }}
                    </div>
                    <div class="text-xs truncate" :class="selectedJobId === job.dataset_id ? 'text-indigo-200' : 'text-gray-500'">
                      {{ formatDate(job.created_at) }}
                    </div>
                  </div>
                </button>

                <!-- Empty State -->
                <div v-if="!project.datasets || project.datasets.length === 0" class="p-4 text-center text-gray-500">
                  <p class="text-sm">No jobs available</p>
                </div>

                <div class="w-full flex flex-col bg-gray-50 h-[100px]"></div>

              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN: Original Cards Grid -->
          <div class="flex-1 h-[580px] overflow-y-auto pr-2 pb-4">
            <div class="grid grid-cols-2 gap-4 pb-2">
            <!-- Card 1: Processing Status -->
            <Card class="w-full">
              <CardHeader>
                <CardTitle>Processing Status</CardTitle>
                <CardDescription>Real-time job processing metrics</CardDescription>
              </CardHeader>
              <CardContent class="space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium">Active Jobs</span>
                  <Badge variant="default">Running</Badge>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium">Queue Status</span>
                  <Badge variant="outline">Normal</Badge>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium">Success Rate</span>
                  <span class="text-lg font-bold text-green-600">98.5%</span>
                </div>
              </CardContent>
            </Card>

            <!-- Card 2: Records Processed -->
            <Card class="w-full">
              <CardHeader>
                <CardTitle>Records Processed</CardTitle>
                <CardDescription>Daily processing statistics</CardDescription>
              </CardHeader>
              <CardContent class="space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium">Total Records</span>
                  <span class="text-2xl font-bold">45,230</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium">Processed Today</span>
                  <span class="text-lg font-semibold text-blue-600">12,450</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium">Pending</span>
                  <span class="text-lg font-semibold text-yellow-600">3,200</span>
                </div>
              </CardContent>
            </Card>

            <!-- Card 3: Error Tracking -->
            <Card class="w-full">
              <CardHeader>
                <CardTitle>Error Tracking</CardTitle>
                <CardDescription>Validation errors and anomalies</CardDescription>
              </CardHeader>
              <CardContent class="space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium">Validation Errors</span>
                  <Badge variant="destructive">12</Badge>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium">Anomalies Detected</span>
                  <Badge variant="secondary">5</Badge>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium">Error Rate</span>
                  <span class="text-lg font-bold text-red-600">0.3%</span>
                </div>
              </CardContent>
            </Card>

            <!-- Card 4: Performance Metrics -->
            <Card class="w-full">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>System performance indicators</CardDescription>
              </CardHeader>
              <CardContent class="space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium">Avg Processing Time</span>
                  <span class="text-lg font-semibold">2.3s</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium">Throughput</span>
                  <span class="text-lg font-semibold text-blue-600">1,240/min</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium">Uptime</span>
                  <span class="text-lg font-semibold text-green-600">99.9%</span>
                </div>
              </CardContent>
            </Card>

            <!-- Card 5: Real-time Terminal Logs (Full Width) -->
            <Card class="w-full col-span-2">
              <CardHeader class="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Terminal Output
                  </CardTitle>
                  <CardDescription>Real-time WebSocket server logs</CardDescription>
                </div>
                <div class="flex gap-2">
                  <Badge variant="outline" class="text-xs">
                    <span class="w-1.5 h-1.5 rounded-full bg-green-500 mr-1"></span>
                    Connected
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <!-- Terminal Session Tabs -->
                <Tabs v-model="activeTerminalSession" class="w-full">
                  <TabsList class="grid w-full grid-cols-10 mb-4">
                    <TabsTrigger 
                      v-for="session in terminalSessions" 
                      :key="session.id"
                      :value="session.id"
                      class="text-xs relative"
                    >
                      {{ session.name }}
                      <span 
                        v-if="session.status === 'running'" 
                        class="ml-1 w-2 h-2 rounded-full bg-green-500 animate-pulse"
                      ></span>
                      <span 
                        v-else-if="session.status === 'stopped'" 
                        class="ml-1 w-2 h-2 rounded-full bg-yellow-500"
                      ></span>
                      <span 
                        v-else-if="session.status === 'error'" 
                        class="ml-1 w-2 h-2 rounded-full bg-red-500"
                      ></span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent 
                    v-for="session in terminalSessions" 
                    :key="session.id"
                    :value="session.id"
                    class="mt-0"
                  >
                    <div class="flex items-center justify-between mb-4">
                      <div class="flex items-center gap-2">
                        <Badge variant="outline" class="text-xs">
                          <span 
                            :class="{
                              'bg-green-500': session.status === 'running',
                              'bg-yellow-500': session.status === 'stopped',
                              'bg-red-500': session.status === 'error',
                              'bg-gray-400': session.status === 'idle'
                            }"
                            class="w-1.5 h-1.5 rounded-full mr-1"
                          ></span>
                          {{ session.status.toUpperCase() }}
                          <span v-if="session.jobId" class="ml-1 text-gray-400">| {{ session.jobId.slice(-12) }}</span>
                        </Badge>
                        
                        <div class="space-y-2">
                          <label class="text-sm font-medium">Enter file link</label>
                          <input
                            v-model="fileLink" 
                            type="text"
                            placeholder="e.g., https://storage.googleapis.com/..."
                            class="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            :disabled="uploading"
                          />
                        </div>

                        <Button 
                          variant="default" 
                          size="sm" 
                          @click="startJobSession(session.id)"
                          :disabled="session.status === 'running'"
                          class="ml-2"
                        >
                          <span v-if="session.status === 'idle'">Start</span>
                          <span v-else-if="session.status === 'running'">Running...</span>
                          <span v-else>Restart</span>
                        </Button>
                        
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          @click="stopJobSession(session.id)"
                          :disabled="session.status !== 'running'"
                          class="ml-2"
                        >
                          Stop
                        </Button>
                      </div>
                      
                      <Button variant="ghost" size="sm" @click="clearTerminalLogs(session.id)">
                        Clear
                      </Button>
                    </div>
                    
                    <div 
                      class="bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-400 h-64 overflow-y-auto" 
                      :id="'terminal-container-' + session.id"
                    >
                      <div v-if="sessionLogs[session.id as keyof typeof sessionLogs].length === 0" class="text-gray-500 italic">
                        <span v-if="session.status === 'idle'">Click "Start" to begin a job on {{ session.name }}...</span>
                        <span v-else-if="session.status === 'running'">Connecting to {{ session.name }}...</span>
                        <span v-else>{{ session.name }} is {{ session.status }}</span>
                      </div>
                      <div v-for="(log, index) in sessionLogs[session.id as keyof typeof sessionLogs]" :key="index" class="mb-1">
                        <span class="text-gray-500">{{ log.timestamp }}</span>
                        <span 
                          :class="{
                            'text-green-400': log.level === 'info',
                            'text-yellow-400': log.level === 'warn',
                            'text-red-400': log.level === 'error',
                            'text-blue-400': log.level === 'debug'
                          }"
                          class="ml-2"
                        >
                          [{{ log.level.toUpperCase() }}]
                        </span>
                        <span class="text-gray-300 ml-2">{{ log.message }}</span>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                <div class="w-full flex flex-col h-[100px]"></div>
              </CardContent>
            </Card>

          </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>
