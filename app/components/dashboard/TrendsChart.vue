<script setup lang="ts">
import { ref, computed } from 'vue'

// Props
const props = defineProps({
  timeRange: {
    type: String,
    default: '30d',
  },
})

// ───────────────────────────────────────────────
// SAMPLE DATA – covers all 5 metrics
// Format: { date: 'YYYY-MM-DD', cloud_spend, records_processed, validation_errors, avg_quality, anomalies }
const sampleTrendsData = [
  // { date: '2025-12-26', cloud_spend: 1240, records_processed: 45800, validation_errors: 320, avg_quality: 96.2, anomalies: 1 },
  // { date: '2025-12-27', cloud_spend: 1380, records_processed: 67200, validation_errors: 410, avg_quality: 95.8, anomalies: 2 },
  // { date: '2025-12-28', cloud_spend: 1190, records_processed: 39000, validation_errors: 180, avg_quality: 97.5, anomalies: 0 },
  // { date: '2025-12-29', cloud_spend: 1450, records_processed: 81500, validation_errors: 520, avg_quality: 94.9, anomalies: 3 },
  // { date: '2025-12-30', cloud_spend: 1320, records_processed: 59000, validation_errors: 290, avg_quality: 96.7, anomalies: 1 },
  // { date: '2025-12-31', cloud_spend: 1280, records_processed: 71000, validation_errors: 340, avg_quality: 96.0, anomalies: 2 },
  // { date: '2026-01-01', cloud_spend: 1100, records_processed: 42000, validation_errors: 210, avg_quality: 97.1, anomalies: 0 },
  // { date: '2026-01-02', cloud_spend: 1560, records_processed: 98000, validation_errors: 680, avg_quality: 94.5, anomalies: 4 },
  // { date: '2026-01-03', cloud_spend: 1410, records_processed: 76000, validation_errors: 450, avg_quality: 95.7, anomalies: 2 },
  // { date: '2026-01-04', cloud_spend: 1330, records_processed: 63000, validation_errors: 380, avg_quality: 96.3, anomalies: 1 },
  // { date: '2026-01-05', cloud_spend: 1480, records_processed: 89000, validation_errors: 590, avg_quality: 95.1, anomalies: 3 },
  // { date: '2026-01-06', cloud_spend: 1270, records_processed: 54000, validation_errors: 270, avg_quality: 97.0, anomalies: 1 },
  // { date: '2026-01-07', cloud_spend: 1620, records_processed: 112000, validation_errors: 740, avg_quality: 94.2, anomalies: 5 },
  // { date: '2026-01-08', cloud_spend: 1390, records_processed: 68000, validation_errors: 420, avg_quality: 96.4, anomalies: 2 },
  // { date: '2026-01-09', cloud_spend: 1510, records_processed: 94000, validation_errors: 610, avg_quality: 95.6, anomalies: 3 },
  // { date: '2026-01-10', cloud_spend: 1180, records_processed: 51000, validation_errors: 250, avg_quality: 97.3, anomalies: 0 },
  // { date: '2026-01-11', cloud_spend: 1690, records_processed: 118000, validation_errors: 810, avg_quality: 93.8, anomalies: 6 },
  // { date: '2026-01-12', cloud_spend: 1440, records_processed: 82000, validation_errors: 490, avg_quality: 95.9, anomalies: 2 },
  // { date: '2026-01-13', cloud_spend: 1550, records_processed: 97000, validation_errors: 650, avg_quality: 95.4, anomalies: 3 },
  // { date: '2026-01-14', cloud_spend: 1220, records_processed: 57000, validation_errors: 310, avg_quality: 96.8, anomalies: 1 },
  // { date: '2026-01-15', cloud_spend: 1780, records_processed: 125000, validation_errors: 880, avg_quality: 94.1, anomalies: 5 },
  // { date: '2026-01-16', cloud_spend: 1490, records_processed: 85000, validation_errors: 530, avg_quality: 96.0, anomalies: 2 },
  // { date: '2026-01-17', cloud_spend: 1600, records_processed: 102000, validation_errors: 700, avg_quality: 95.2, anomalies: 4 },
  // { date: '2026-01-18', cloud_spend: 1300, records_processed: 62000, validation_errors: 360, avg_quality: 96.9, anomalies: 1 },
  // { date: '2026-01-19', cloud_spend: 1850, records_processed: 132000, validation_errors: 950, avg_quality: 93.5, anomalies: 7 },
  // { date: '2026-01-20', cloud_spend: 1520, records_processed: 88000, validation_errors: 570, avg_quality: 95.8, anomalies: 3 },
  // { date: '2026-01-21', cloud_spend: 1650, records_processed: 108000, validation_errors: 740, avg_quality: 94.7, anomalies: 4 },
  // { date: '2026-01-22', cloud_spend: 1350, records_processed: 68000, validation_errors: 400, avg_quality: 96.6, anomalies: 2 },
  // { date: '2026-01-23', cloud_spend: 1920, records_processed: 140000, validation_errors: 1020, avg_quality: 93.9, anomalies: 6 },
  // { date: '2026-01-24', cloud_spend: 1580, records_processed: 92000, validation_errors: 610, avg_quality: 95.5, anomalies: 3 },
]

// Use sample data directly (you can later replace with real API call)
const chartData = ref([...sampleTrendsData])

// Filter based on selected time range
const filteredData = computed(() => {
  if (!chartData.value.length) return []

  const referenceDate = new Date()
  let daysBack = 90
  if (props.timeRange === '30d') daysBack = 30
  if (props.timeRange === '7d') daysBack = 7

  const cutoff = new Date(referenceDate)
  cutoff.setDate(cutoff.getDate() - daysBack)

  return chartData.value.filter(item => new Date(item.date) >= cutoff)
})
</script>

<template>
  <Card class="@container/card">
    <CardHeader>
      <CardTitle>Cost & Data Trends</CardTitle>
      <CardDescription>Last {{ props.timeRange === '90d' ? '90' : props.timeRange.slice(0, -1) }} days performance</CardDescription>
      <CardAction>
        <!-- Your existing time range toggle here -->
      </CardAction>
    </CardHeader>

    <CardContent>
      <!-- No loading/empty state needed since we have sample data -->
      <AreaChart
        v-if="filteredData.length"
        :data="filteredData"
        :categories="[
          'cloud_spend',
          'records_processed',
          'validation_errors',
          'avg_quality',
          'anomalies'
        ]"
        index="date"
        :colors="[
          '#3b82f6',   // blue - Total Cloud Spend
          '#10b981',   // green - Records Processed
          '#ef4444',   // red - Validation Errors
          '#8b5cf6',   // purple - Avg Data Quality
          '#f59e0b'    // orange - Anomalies Detected
        ]"
        :valueFormatter="(value) => {
          if (value == null) return '-'
          if (value > 10000) return value.toLocaleString()           // large numbers (records)
          if (value > 1000) return '$' + value.toLocaleString()     // spend
          return value.toLocaleString()                              // small numbers (errors, quality, anomalies)
        }"
      />
      <div v-else class="h-64 flex items-center justify-center text-muted-foreground">
        No data available for selected period
      </div>
    </CardContent>
  </Card>
</template>