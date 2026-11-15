<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from '#imports'
import clientsService from '../services/clientsService.js'
import {
  Users,
  User,
  Mail,
  Phone,
  Calendar,
  MoreHorizontal
} from 'lucide-vue-next'

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
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

const router = useRouter()

// ====================== STATE ======================
const clients = ref([])
const loadingClients = ref(true)
const loadingMessage = ref('Loading clients...')

// ====================== HELPER FUNCTIONS ======================
const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusVariant = (status) => {
  switch (status) {
    case 'active': return 'default'
    case 'inactive': return 'secondary'
    case 'pending': return 'outline'
    default: return 'secondary'
  }
}

// ====================== NAVIGATION ======================
const goToClientDashboard = (clientId) => {
  router.push(`/admin-dashboard?client_id=${clientId}`)
}

// ====================== FETCH CLIENTS ======================
async function getClients() {
  loadingClients.value = true
  try {
    const response = await clientsService.getClients()
    if (response.status) {
      clients.value = response.data.data || []
    }
  } catch (error) {
    console.error('Error fetching clients:', error)
    try {
      const fallbackResponse = await clientsService.getUsers()
      if (fallbackResponse.status) {
        clients.value = fallbackResponse.data.data || []
      }
    } catch (fallbackError) {
      console.error('Error fetching users:', fallbackError)
      loadingMessage.value = 'Failed to load clients'
    }
  } finally {
    loadingClients.value = false
  }
}

// ====================== LIFECYCLE ======================
onMounted(() => {
  getClients()
})

// ====================== EXPOSE ======================
defineExpose({
  clients,
  loadingClients,
  loadingMessage,
  formatDateTime,
  getStatusVariant,
  goToClientDashboard,
  getClients
})
</script>

<template>
  <div class="space-y-4 md:space-y-8">
    <Card>
      <CardHeader>
        <CardTitle>All Clients</CardTitle>
        <CardDescription>
          View and manage all registered clients in the system
        </CardDescription>
        
        <div v-if="loadingClients" class="flex items-center justify-center py-8">
          <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          <span class="ml-3 text-muted-foreground">{{ loadingMessage }}</span>
        </div>
      </CardHeader>

      <CardContent v-if="!loadingClients">
        <div v-if="clients.length === 0" class="text-center py-12">
          <Users class="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p class="text-lg font-medium">No clients found</p>
          <p class="text-sm text-muted-foreground">There are no clients in the system yet.</p>
        </div>

        <div v-else class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead class="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="client in clients" :key="client.id || client.client_id">
                <TableCell>
                  <div>
                    <p class="font-medium">
                      {{ client.client_id || client.id || '-' }}
                    </p>
                    <p v-if="client.username" class="text-xs text-muted-foreground">
                      {{ client.username }}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div class="flex items-center gap-2">
                    <User class="w-4 h-4 text-muted-foreground" />
                    <span class="font-medium">
                      {{ client.name || client.full_name || client.first_name + ' ' + client.last_name || '-' }}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div class="flex items-center gap-2">
                    <Mail class="w-4 h-4 text-muted-foreground" />
                    <span>{{ client.email || '-' }}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div class="flex items-center gap-2">
                    <Phone class="w-4 h-4 text-muted-foreground" />
                    <span>{{ client.phone || client.phone_number || '-' }}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span>{{ client.company || client.company_name || client.organization || '-' }}</span>
                </TableCell>
                <TableCell>
                  <Badge :variant="getStatusVariant(client.status || 'active')">
                    {{ client.status || 'active' }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div class="flex items-center gap-2">
                    <Calendar class="w-4 h-4 text-muted-foreground" />
                    <span class="text-sm">
                      {{ formatDateTime(client.created_at || client.createdAt || client.join_date) }}
                    </span>
                  </div>
                </TableCell>
                <TableCell class="text-right">
                  <Button 
                    size="sm" 
                    @click="goToClientDashboard(client.client_id || client.id)"
                    class="gap-2"
                  >
                    <Users class="w-4 h-4" />
                    Client dashboard
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="sm" class="ml-2">
                        <MoreHorizontal class="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem @click="goToClientDashboard(client.client_id || client.id)">
                        <Users class="w-4 h-4 mr-2" />
                        View Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Mail class="w-4 h-4 mr-2" />
                        Send Email
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Phone class="w-4 h-4 mr-2" />
                        Contact
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
</template>

<style scoped>
</style>