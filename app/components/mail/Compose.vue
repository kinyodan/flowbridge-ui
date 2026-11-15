<script lang="ts" setup>
import { X, Send, Paperclip, MoreVertical, ArrowLeft } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Separator } from '~/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import emailsService from '../services/emailsService.js'
import * as cheerio from 'cheerio'

const props = defineProps<{
  replyTo?: {
    email: string
    name: string
    subject: string
    body: string
    email_id: string
  } | null
}>()

const emit = defineEmits(['close', 'send'])

const to = ref(props.replyTo?.email || '')
const subject = ref(props.replyTo ? `Re: ${props.replyTo.subject}` : '')
const email_id = ref(props.replyTo?.email_id || null)
const body = ref('')
const emailBody = ref('')
const clientId = useCookie("client_id").value 

// Watch for prop changes
watch(() => props.replyTo, (newVal) => {
  if (newVal) {
    to.value = newVal.email
    subject.value = `Re: ${newVal.subject}`
    emailBody.value = cleanEmailHtml(props.replyTo?.body)
    console.log(emailBody)
  }
})

watch(body, (newBody) => {
  if (newBody) {
    emailBody.value = cleanEmailHtml(props.replyTo?.body)
    console.log("chnage in body text watch updated")
    emailBody.value = buildEmailWithSignature(props);
    console.log(emailBody)
  }
})

const cleanEmailHtml = (htmlBody: string): string => {
  if (!htmlBody) return '';
 
  const $ = cheerio.load(htmlBody);

  // Remove Gmail quote blocks
  $('.gmail_attr, blockquote.gmail_quote').remove();

  // Fix concatenated m_- classes
  $('*').each((_, el) => {
    const className = $(el).attr('class');
    if (!className) return;
   
    let classes = className.trim().split(/\s+/);
    classes = classes
      .map(cls => {
        if (/^m_-\d+/.test(cls)) {
          return cls.replace(/^m_-\d+/, '');
        }
        return cls;
      })
      .filter(cls => {
        const l = cls.toLowerCase();
        return cls.length > 0 &&
               !l.includes('gmail') &&
               !l.includes('outlook') &&
               !l.includes('mso-');
      });

    if (classes.length > 0) {
      $(el).attr('class', classes.join(' '));
    } else {
      $(el).removeAttr('class');
    }
  });

  // Remove bad inline styles
  $('[style]').each((_, el) => {
    const style = $(el).attr('style') || '';
    if (style.includes('border-left') || style.includes('padding-left:1ex')) {
      $(el).removeAttr('style');
    }
  });

  return $.html().trim();
};

// ================== ELEGANT SIGNATURE (Top Position) ==================
const intraqSignature = `
<table border="0" cellpadding="0" cellspacing="0" style="max-width: 380px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; border-collapse: collapse; margin-bottom: 25px;">
  <tr>
    <td style="padding: 0 0 15px 0;">
      <table border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-right: 18px; vertical-align: top;">
            <div style="font-size: 28px; font-weight: 800; letter-spacing: -1.5px; color: #0f172a;">
              intra<span style="color: #f97316;">q</span>
            </div>
          </td>
          <td style="vertical-align: top; padding-top: 4px;">
            <div style="font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 2px;">
              Daniel Kinyo
            </div>
            <div style="font-size: 13px; color: #64748b; margin-bottom: 8px;">
              Founder & Director
            </div>
            <div style="font-size: 13px; color: #334155; line-height: 1.5;">
              Intraq Data Operations<br>
              Nairobi, Kenya
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
 
  <tr>
    <td style="padding: 12px 0; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
      <table border="0" cellpadding="0" cellspacing="0" style="font-size: 13px;">
        <tr>
          <td style="padding-right: 20px;">
            <a href="tel:+254700000000" style="color: #64748b; text-decoration: none;">📞 +254 700 000 000</a>
          </td>
          <td style="padding-right: 20px;">
            <a href="mailto:daniel@intraq.pro" style="color: #64748b; text-decoration: none;">✉️ daniel@intraq.pro</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
 
  <tr>
    <td style="padding-top: 12px;">
      <a href="https://intraq.pro" style="color: #f97316; text-decoration: none; font-weight: 500; font-size: 13px;">
        www.intraq.pro
      </a>
      <span style="color: #cbd5e1; margin: 0 8px;">•</span>
      <span style="color: #64748b; font-size: 12.5px;">
        Professional Data Operations
      </span>
    </td>
  </tr>
</table>

<!-- Full Width Divider -->
<div style="margin: 25px 0 30px 0; width: 100%;">
  <div style="display: flex; align-items: center; width: 100%;">
    <div style="flex: 1; height: 1px; background: #f59e0b33;"></div>
    <div style="padding: 0 18px; text-align: center; white-space: nowrap;">
      <div style="font-size:12px; letter-spacing:3px; color:#f59e0b; font-weight:700;">
        INTRAQ
      </div>
      <div style="font-size:10px; letter-spacing:1px; color:#999; margin-top:3px;">
        Data Solutions (DataOps) | FinOps Solutions
      </div>
    </div>
    <div style="flex: 1; height: 1px; background: #f59e0b33;"></div>
  </div>
</div>
`;

// ================== FINAL FUNCTION ==================
const buildEmailWithSignature = (props: any): string => {
  const cleanedBody = cleanEmailHtml(props.replyTo?.body || '');

  const finalHtml = `
    <html>
    <head></head>
    <body>

      ${body.value}

      ${intraqSignature}
      
      <div dir="ltr" style="margin-top: 20px;">
        ${cleanedBody}
      </div>
    </body>
    </html>
  `;

  return finalHtml.trim();
};

// Usage
emailBody.value = buildEmailWithSignature(props);
console.log(emailBody);

const submitReply = async () => {
  console.log("handling submitReply message at compose")

  const formData = new FormData()
  const toList = [to.value]
  
  formData.append('to', JSON.stringify(toList));
  formData.append('original_subject', subject.value)
  formData.append('original_message_id', email_id.value)
  formData.append('client_id', clientId)
  formData.append('content', emailBody.value)

  try {
    const response = await emailsService.sendReply(formData)
    if (response.status === 200) {
      console.log(response) 
    }  
  } catch (error) {
    console.error('Error fetching client emails:')
  }
}

function handleSend() {
  console.log("handling sending message at compose")
  emit('send', {
    to: to.value,
    subject: subject.value,
    body: emailBody.value
  })
  // Reset form
  to.value = ''
  subject.value = ''
  body.value = ''
}
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex items-center p-2">
      <div class="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="ghost" size="icon" @click="emit('close')">
              <ArrowLeft class="size-4" />
              <span class="sr-only">Back</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Back</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="ghost" size="icon">
              <Paperclip class="size-4" />
              <span class="sr-only">Attach file</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Attach file</TooltipContent>
        </Tooltip>
      </div>
      <div class="ml-auto flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="ghost" size="icon">
              <MoreVertical class="size-4" />
              <span class="sr-only">More options</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>More</TooltipContent>
        </Tooltip>
      </div>
    </div>
    <Separator />
    <div class="flex flex-1 flex-col p-4">
      <form @submit.prevent="submitReply"  >
        <div class="grid gap-4">
          <div class="grid gap-1">
            <Label for="to" class="text-sm font-medium">To</Label>
            <Input
              id="to"
              v-model="to"
              type="email"
              placeholder="recipient@example.com"
              required
            />
          </div>
          <div class="grid gap-1">
            <Label for="subject" class="text-sm font-medium">Subject</Label>
            <Input
              id="subject"
              v-model="subject"
              placeholder="Email subject"
              required
            />
          </div>
          <div class="grid gap-1 flex-1">
          {{body}}
            <Label for="body" class="text-sm font-medium">Message</Label>
            <Textarea
              id="body"
              v-model="body"
              placeholder="Write your message..."
              class="min-h-[300px] flex-1"
            />
          </div>
          <div class="flex items-center justify-between">
            <div class="text-xs text-muted-foreground">
              Press Ctrl+Enter to send
            </div>
            <Button type="button" @click.prevent="submitReply" size="sm">
              <Send class="size-4 mr-2" />
              Send
            </Button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>