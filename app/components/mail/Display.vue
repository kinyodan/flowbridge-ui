<script lang="ts" setup>
import type { Mail } from './data/mails'
import { addDays, addHours, format, nextSaturday } from 'date-fns'
import { Archive, ArchiveX, ArrowLeft, Clock, Forward, MoreVertical, Reply, ReplyAll, Trash2 } from 'lucide-vue-next'
import { computed } from 'vue'

interface MailDisplayProps {
  mail: Mail | undefined
}

const props = defineProps<MailDisplayProps>()

const emit = defineEmits(['close', 'reply', 'reply-all', 'forward'])

const replyText = ref('')

function onReply() {
  emit('reply', { mail: props.mail, replyText: replyText.value })
}

function onReplyAll() {
  emit('reply-all', { mail: props.mail, replyText: replyText.value })
}

function onForward() {
  emit('forward', { mail: props.mail })
}

const mailFallbackName = computed(() => {
  return props.mail?.name
    .split(' ')
    .map(chunk => chunk[0])
    .join('')
})

const today = new Date()
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex items-center p-2">
      <div class="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="ghost" size="icon" :disabled="!mail" @click="emit('close')">
              <ArrowLeft class="size-4" />
              <span class="sr-only">Back</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Back</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="ghost" size="icon" :disabled="!mail">
              <Archive class="size-4" />
              <span class="sr-only">Archive</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Archive</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="ghost" size="icon" :disabled="!mail">
              <ArchiveX class="size-4" />
              <span class="sr-only">Move to junk</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Move to junk</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="ghost" size="icon" :disabled="!mail">
              <Trash2 class="size-4" />
              <span class="sr-only">Move to trash</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Move to trash</TooltipContent>
        </Tooltip>
        <Separator orientation="vertical" class="mx-1 !h-6" />
        <Tooltip>
          <Popover>
            <PopoverTrigger as-child>
              <TooltipTrigger as-child>
                <Button variant="ghost" size="icon" :disabled="!mail">
                  <Clock class="size-4" />
                  <span class="sr-only">Snooze</span>
                </Button>
              </TooltipTrigger>
            </PopoverTrigger>
            <PopoverContent class="w-full flex p-0">
              <div class="flex flex-col gap-2 border-r px-2 py-4">
                <div class="px-4 text-sm font-medium">
                  Snooze until
                </div>
                <div class="grid min-w-[250px] gap-1">
                  <Button
                    variant="ghost"
                    class="justify-start font-normal"
                  >
                    Later today
                    <span class="ml-auto text-muted-foreground">
                      {{ format(addHours(today, 4), "E, h:m b") }}
                    </span>
                  </Button>
                  <Button
                    variant="ghost"
                    class="justify-start font-normal"
                  >
                    Tomorrow
                    <span class="ml-auto text-muted-foreground">
                      {{ format(addDays(today, 1), "E, h:m b") }}
                    </span>
                  </Button>
                  <Button
                    variant="ghost"
                    class="justify-start font-normal"
                  >
                    This weekend
                    <span class="ml-auto text-muted-foreground">
                      {{ format(nextSaturday(today), "E, h:m b") }}
                    </span>
                  </Button>
                  <Button
                    variant="ghost"
                    class="justify-start font-normal"
                  >
                    Next week
                    <span class="ml-auto text-muted-foreground">
                      {{ format(addDays(today, 7), "E, h:m b") }}
                    </span>
                  </Button>
                </div>
              </div>
              <div class="p-2">
                <Calendar />
              </div>
            </PopoverContent>
          </Popover>
          <TooltipContent>Snooze</TooltipContent>
        </Tooltip>
      </div>
      <div class="ml-auto flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="ghost" size="icon" :disabled="!mail" @click="onReply">
              <Reply class="size-4" />
              <span class="sr-only">Reply</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reply</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="ghost" size="icon" :disabled="!mail" @click="onReplyAll">
              <ReplyAll class="size-4" />
              <span class="sr-only">Reply all</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reply all</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="ghost" size="icon" :disabled="!mail" @click="onForward">
              <Forward class="size-4" />
              <span class="sr-only">Forward</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Forward</TooltipContent>
        </Tooltip>
      </div>
      <Separator orientation="vertical" class="mx-2 !h-6" />
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon" :disabled="!mail">
            <MoreVertical class="size-4" />
            <span class="sr-only">More</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Mark as unread</DropdownMenuItem>
          <DropdownMenuItem>Star thread</DropdownMenuItem>
          <DropdownMenuItem>Add label</DropdownMenuItem>
          <DropdownMenuItem>Mute thread</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    <Separator />
    <div v-if="mail" class="flex flex-1 flex-col overflow-hidden">
      <!-- Email Header - fixed -->
      <div class="flex items-start p-4 shrink-0">
        <div class="flex items-start gap-4 text-sm">
          <Avatar>
            <AvatarFallback>
              {{ mailFallbackName }}
            </AvatarFallback>
          </Avatar>
          <div class="grid gap-1">
            <div class="font-semibold">
              {{ mail.name }}
            </div>
            <div class="line-clamp-1 text-xs">
              {{ mail.subject }}
            </div>
            <div class="line-clamp-1 text-xs">
              <span class="font-medium">Reply-To:</span> {{ mail.email }}
            </div>
          </div>
        </div>
        <div v-if="mail.date" class="ml-auto text-xs text-muted-foreground">
          {{ format(new Date(mail.date), "PPpp") }}
        </div>
      </div>
      <Separator class="shrink-0" />
      <!-- Email Body - scrollable -->
      <div class="flex-1 p-4 text-sm overflow-y-auto min-h-0">
        <div v-if="mail.full_email?.html"
          class="email-html"
          v-html="mail.full_email.html"
        />
        <p v-else>
          {{ mail.text }}
        </p>
      </div>
      <!-- Reply Box - fixed at bottom -->
      <Separator class="shrink-0" />
      <div class="p-4 shrink-0">
        <form @submit.prevent="onReply">
          <div class="grid gap-4">
            <Textarea
              v-model="replyText"
              class="p-4"
              :placeholder="`Reply ${mail.name}...`"
            />
            <div class="flex items-center">
              <Label
                html-for="mute"
                class="flex items-center gap-2 text-xs font-normal"
              >
                <Switch id="mute" aria-label="Mute thread" /> Mute this
                thread
              </Label>
              <Button
                type="submit"
                size="sm"
                class="ml-auto"
              >
                Send
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
    <div v-else class="p-8 text-center text-muted-foreground">
      No message selected
    </div>
  </div>
</template>

<style>
.email-html {
  line-height: 1.6;
  color: inherit;
}

.email-html * {
  max-width: 100%;
}

.email-html p {
  margin: 0 0 16px 0;
}

.email-html blockquote {
  margin-left: 12px;
  padding-left: 12px;
  border-left: 2px solid #d1d5db;
}

.email-html img {
  max-width: 100%;
  height: auto;
}

.email-html a {
  color: #2563eb;
  text-decoration: underline;
}

/* prevent giant gmail spacing */
.email-html div {
  margin: 0;
}

/* preserve your original email card */
.email-html .container {
  max-width: 620px;
  margin: 24px auto;
  border-radius: 16px;
  overflow: hidden;
}

/* preserve original email content spacing */
.email-html .content p {
  margin-bottom: 16px;
}

/* gmail quote section */
.email-html .gmail_quote {
  margin-top: 24px;
}
</style>