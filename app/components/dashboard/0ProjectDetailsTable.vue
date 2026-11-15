<script lang="ts">
import { defineComponent } from 'vue'
import projectsService from '../../../services/projectsService.js'

export default defineComponent({
  name: 'ProjectDetailsTable',

  props: {
    project: {
      type: Object,
      default: () => ({ datasets: [] })
    },
  },

  data() {
    return {
      apiUrl: "http://localhost:8000",
      fileInput: null as HTMLInputElement | null,
      uploading: false,
      uploadError: '',
      uploadSuccess: '',
      dataOpsProjectsG: [],
      clientId: null as string | null,
      uploadfiles: null as FileList | null,   // Changed to FileList
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
          this.uploadSuccess = `Successfully uploaded ${fileCount} file${fileCount >= 1 ? '' : 's'}\n ${responseData.message} when done it will appear in the list projects Jobs list`
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
    <div class="grid gap-4 md:grid-cols-2">
      <!-- LEFT COLUMN: Table in ScrollArea -->
      <div class="h-[600px]"> <!-- Add fixed height here -->
        <DashboardScrollArea class="h-full"> <!-- Pass height to ScrollArea -->
          <Card class="w-full h-full flex flex-col"> <!-- Make card fill height -->
            <CardHeader class="flex-shrink-0"> <!-- Prevent header from shrinking -->
              <CardTitle>Project Jobs</CardTitle>
            </CardHeader>
            <CardContent class="flex-grow overflow-hidden"> <!-- Allow content to grow -->
              <div class="h-full">
                <Table class="w-full">
                  <TableCaption>A list of your recent project Jobs.</TableCaption>
                  <TableHeader class="sticky top-0 bg-white z-10"> <!-- Optional: sticky header -->
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
                            <!-- Use imported icon if needed -->
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
  </div>
</template>