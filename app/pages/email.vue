<script setup lang="ts">
import { accounts, mails } from '@/components/mail/data/mails'
const socketData = useState('socketData')
const socketStatus = useState('socketStatus')
const emailsData = useState('emailsData')

</script>

<template>
  <div class="-m-4 lg:-m-6">
    <MailLayout
      :accounts="accounts"
      :mails="emailsData || []"
      :emailsData="emailsData"
      :nav-collapsed-size="4"
    />
  </div>
</template>
