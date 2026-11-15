<script setup lang="ts">
import { useSidebar } from '~/components/ui/sidebar'

const props = defineProps<{
  intraqPackages: [],
  clientPackage: {package_name: ""}
}>()

const { isMobile } = useSidebar()
const router = useRouter()

const activeTeam = ref(props.intraqPackages[0])

const changePackage = (plan) =>{
  console.log("changePackage")
  console.log(plan)
  router.push(`/onboarding?p=${plan.name}`)
}
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div class="aspect-square size-50 flex items-center justify-center rounded-lg  text-sidebar-primary-foreground">
              <img :src="activeTeam!.logo" />
              <Icon :name="activeTeam!.logo" class="size-4" />
            </div>
            <Icon name="i-lucide-chevrons-up-down" class="ml-auto" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="min-w-56 w-[--radix-dropdown-menu-trigger-width] rounded-lg"
          align="start"
          :side="isMobile ? 'bottom' : 'right'"
        >
          <DropdownMenuLabel class="text-xs text-muted-foreground">
            Intraq Packages
          </DropdownMenuLabel>
          <DropdownMenuItem
            v-for="(plan, index) in intraqPackages"
            :key="plan.name"
            class="gap-2 p-2"
            @click="changePackage(plan)"
          >
            <template v-if="clientPackage.package_name !== plan.name">
              <div class="size-6 flex items-center justify-center border rounded-sm">
                <Icon :name="plan.logo" class="size-4 shrink-0" />
              </div>
              {{ plan.name }}
            <DropdownMenuShortcut>⌘{{ index + 1 }}</DropdownMenuShortcut>
            </template>

          </DropdownMenuItem>

        </DropdownMenuContent>
      </DropdownMenu>
      <div class="grid flex-1 text-center text-sm leading-tight">
        <span class="truncate font-semibold">
          {{ clientPackage?.package_name || "" }}
        </span>
      </div>
    </SidebarMenuItem>
  </SidebarMenu>
</template>

<style scoped>

</style>
