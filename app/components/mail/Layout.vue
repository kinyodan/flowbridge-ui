<script lang="ts" setup>
import type { Mail } from './data/mails'
import type { LinkProp } from '~/components/mail/Nav.vue'
import { useMediaQuery } from '@vueuse/core'
import { Search } from 'lucide-vue-next'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'

const props = withDefaults(defineProps<MailProps>(), {
  defaultCollapsed: false,
  defaultLayout: () => [18, 82],
})

const emit = defineEmits(['compose'])

interface MailProps {
  accounts: {
    label: string
    email: string
    icon: string
  }[]
  mails: Mail[]
  defaultLayout?: number[]
  defaultCollapsed?: boolean
  navCollapsedSize: number
}

const isCollapsed = ref(props.defaultCollapsed)
const selectedMail = ref<string | undefined>()
const isComposing = ref(false)
const activeFolder = ref('inbox') // inbox, sent, drafts, junk, trash, archive
const searchValue = ref('')
const replyToMail = ref<Mail | null>(null) // Store mail being replied to

// Check if emails are loading (empty or undefined)
const isLoading = computed(() => {
  return !props.mails //|| props.mails.length === 0 
})
const debouncedSearch = refDebounced(searchValue, 250)

const filteredMailList = computed(() => {
  let output: Mail[]
  const searchValue = debouncedSearch.value?.trim()
  if (!searchValue) {
    output = props.mails || []
  }

  else {
    output = Array.isArray(props.mails)
      ? props.mails.filter((item) => {
          return item.name.includes(debouncedSearch.value)
            || item.email.includes(debouncedSearch.value)
            || item.subject.includes(debouncedSearch.value)
            || item.text.includes(debouncedSearch.value)
        })
      : []
  }

  return output
})

const unreadMailList = computed(() => filteredMailList.value.filter(item => !item.read))

const selectedMailData = computed(() => props.mails?.find(item => item.id === selectedMail.value))

// Filter mails by folder
const folderMailList = computed(() => {
  if (activeFolder.value === 'inbox') {
    return filteredMailList.value
  }
  if (activeFolder.value === 'sent') {
    // For sent folder, show all mails (in real app, filter by sent folder)
    return filteredMailList.value
  }
  if (activeFolder.value === 'unread') {
    return filteredMailList.value.filter(item => !item.read)
  }
  return filteredMailList.value
})

const folderTitle = computed(() => {
  const titles: Record<string, string> = {
    inbox: 'Inbox',
    sent: 'Sent',
    drafts: 'Drafts',
    junk: 'Junk',
    trash: 'Trash',
    archive: 'Archive'
  }
  return titles[activeFolder.value] || 'Inbox'
})

const links: LinkProp[] = [
  {
    title: 'Inbox',
    label: '128',
    icon: 'lucide:inbox',
    variant: 'default',
  },
  {
    title: 'Drafts',
    label: '9',
    icon: 'lucide:file',
    variant: 'ghost',
  },
  {
    title: 'Sent',
    label: '',
    icon: 'lucide:send',
    variant: 'ghost',
  },
  {
    title: 'Junk',
    label: '23',
    icon: 'lucide:archive',
    variant: 'ghost',
  },
  {
    title: 'Trash',
    label: '',
    icon: 'lucide:trash',
    variant: 'ghost',
  },
  {
    title: 'Archive',
    label: '',
    icon: 'lucide:archive',
    variant: 'ghost',
  },
  {
    title: 'Compose',
    label: '',
    icon: 'lucide:pen-square',
    variant: 'ghost',
  },
]

const links2: LinkProp[] = [
  {
    title: 'Social',
    label: '972',
    icon: 'lucide:user-2',
    variant: 'ghost',
  },
  {
    title: 'Updates',
    label: '342',
    icon: 'lucide:alert-circle',
    variant: 'ghost',
  },
  {
    title: 'Forums',
    label: '128',
    icon: 'lucide:message-square',
    variant: 'ghost',
  },
  {
    title: 'Shopping',
    label: '8',
    icon: 'lucide:shopping-cart',
    variant: 'ghost',
  },
  {
    title: 'Promotions',
    label: '21',
    icon: 'lucide:archive',
    variant: 'ghost',
  },
]

function onCollapse() {
  isCollapsed.value = true
}

function onExpand() {
  isCollapsed.value = false
}

function onCompose() {
  selectedMail.value = undefined
  isComposing.value = true
}

function onCloseCompose() {
  isComposing.value = false
  replyToMail.value = null
}

// Handle reply from Display component
function handleReply(event: { mail: Mail; replyText: string }) {
  // Open compose with reply-to info pre-filled
  replyToMail.value = {
    email: event.mail.email,
    name: event.mail.name,
    subject: event.mail.subject,
    body: event.mail.full_email.html,
    email_id: event.mail.id
  }

  isComposing.value = true

  console.log("handleReply")
  console.log(replyToMail.value)
  console.log("handleReply")

}

function handleReplyAll(event: { mail: Mail; replyText: string }) {
  // Open compose with reply-to info
  replyToMail.value = {
    email: event.mail.email,
    name: event.mail.name,
    subject: event.mail.subject,
    body: event.mail.full_email.html
  }
  isComposing.value = true
}

function handleForward(event: { mail: Mail }) {
  // Open compose with mail forwarded (pre-fill body with original)
  replyToMail.value = null
  isComposing.value = true
}

function onNavClick(link: LinkProp) {
  const folderMap: Record<string, string> = {
    'Inbox': 'inbox',
    'Sent': 'sent',
    'Drafts': 'drafts',
    'Junk': 'junk',
    'Trash': 'trash',
    'Archive': 'archive'
  }
  
  if (link.title === 'Compose') {
    onCompose()
  } else if (folderMap[link.title]) {
    activeFolder.value = folderMap[link.title]
    selectedMail.value = undefined
    isComposing.value = false
  }
}

const defaultCollapse = useMediaQuery('(max-width: 768px)')

watch(() => defaultCollapse.value, () => {
  isCollapsed.value = defaultCollapse.value
})

</script>

<template>
  <TooltipProvider :delay-duration="0">
    <ResizablePanelGroup
      id="resize-panel-group-1"
      direction="horizontal"
      class="h-full max-h-[calc(100dvh-54px-3rem)] items-stretch"
    >
      <ResizablePanel
        id="resize-panel-1"
        :default-size="defaultLayout[0]"
        :collapsed-size="navCollapsedSize"
        collapsible
        :min-size="15"
        :max-size="20"
        :class="cn(isCollapsed && 'min-w-[50px] transition-all duration-300 ease-in-out')"
        @expand="onExpand"
        @collapse="onCollapse"
      >
        <div :class="cn('flex h-[56px] items-center justify-between', isCollapsed ? 'h-[56px]' : 'px-2')">
          <MailAccountSwitcher :is-collapsed="isCollapsed" :accounts="accounts" />
          <Button 
            variant="default" 
            size="sm"
            @click="onCompose()"
          >
            <Icon name="lucide:pen-square" class="size-4 mr-2" />
            Compose
          </Button>
        </div>
        <Separator />
        <MailNav
          :is-collapsed="isCollapsed"
          :links="links"
          @click="onNavClick"
        />
        <Separator />
        <MailNav
          :is-collapsed="isCollapsed"
          :links="links2"
        />
      </ResizablePanel>
      <ResizableHandle id="resize-handle-1" with-handle />
      <ResizablePanel id="resize-panel-2" :default-size="defaultLayout[1]" :min-size="30">
        <!-- Loading state -->
        <div v-if="isLoading" class="flex items-center justify-center h-full">
          <div class="flex flex-col items-center gap-4 p-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p class="text-sm text-muted-foreground">Loading emails...</p>
          </div>
        </div>
        <MailCompose v-else-if="isComposing" @close="onCloseCompose" :reply-to="replyToMail" />
        <MailDisplay v-else-if="selectedMailData" :mail="selectedMailData" @close="selectedMail = ''" @reply="handleReply" @reply-all="handleReplyAll" @forward="handleForward" />
        <Tabs v-else default-value="all">
          <div class="flex items-center px-4 py-2">
            <h1 class="text-xl font-bold">
              {{ folderTitle }}
            </h1>
            <TabsList v-if="activeFolder === 'inbox'" class="ml-auto">
              <TabsTrigger value="all" class="text-zinc-600 dark:text-zinc-200">
                All mail
              </TabsTrigger>
              <TabsTrigger value="unread" class="text-zinc-600 dark:text-zinc-200">
                Unread
              </TabsTrigger>
            </TabsList>
          </div>
          <Separator />
          <div class="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <form>
              <div class="relative">
                <Search class="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                <Input v-model="searchValue" placeholder="Search" class="pl-8" />
              </div>
            </form>
          </div>
          <TabsContent v-if="activeFolder === 'inbox'" value="all" class="m-0">
            <MailList v-model:selected-mail="selectedMail" :items="filteredMailList" />
          </TabsContent>
          <TabsContent v-if="activeFolder === 'inbox'" value="unread" class="m-0">
            <MailList v-model:selected-mail="selectedMail" :items="unreadMailList" />
          </TabsContent>
          <!-- Show mail list for other folders -->
          <div v-if="activeFolder !== 'inbox'" class="m-0">
            <MailList v-model:selected-mail="selectedMail" :items="filteredMailList" />
          </div>
        </Tabs>
      </ResizablePanel>
    </ResizablePanelGroup>
  </TooltipProvider>
</template>
