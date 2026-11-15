<script setup lang="ts">
import type { ScrollAreaRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
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

import {
  ScrollAreaCorner,
  ScrollAreaRoot,
  ScrollAreaViewport,
} from 'reka-ui'

import { cn } from '@/lib/utils'
import ScrollBar from './ScrollBar.vue'

const props = defineProps<ScrollAreaRootProps & { 
  class?: HTMLAttributes['class']
  //project?: Record<string, any>
}>()

const delegatedProps = reactiveOmit(props, 'class')

const projectRecords = (metaInfo) =>{
  const parsedInfo = JSON.parse(metaInfo) ? JSON.parse(metaInfo) : null
  return parsedInfo?.rows || "-"
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
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

</script>

<template>
  <ScrollAreaRoot
    data-slot="scroll-area"
    v-bind="delegatedProps"
    :class="cn('relative', props.class)"
  >
    <ScrollAreaViewport
      data-slot="scroll-area-viewport"
      class="focus-visible:ring-ring/50 size-full 
      rounded-[inherit] transition-[color,box-shadow] 
      outline-none focus-visible:ring-[3px] 
      focus-visible:outline-1">
            
      <slot/>

    </ScrollAreaViewport>
    <ScrollBar />
    <ScrollAreaCorner />
  </ScrollAreaRoot>
</template>
