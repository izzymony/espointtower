"use client"

import { Home, Settings, Users, LogOut, Briefcase, Upload, Book, UploadIcon, BookIcon } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Services",
    url: "/dashboard/services",
    icon: Briefcase,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },

  {
    title: "Upload Services",
    url: "/dashboard/upload_services",
    icon: Upload,
  },

  {
    title: "Uploads",
    url: "/dashboard/Uploads",
    icon: UploadIcon,
  },
  {
    title: "booked contents",
    url: "/dashboard/booked_contents",
    icon: BookIcon,
  }
]

export function AppSidebar() {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  return (
    <Sidebar className="h-screen border-r border-white/5 bg-[#0a0a0a] text-white" collapsible="icon">
      <SidebarHeader className="border-b border-white/5 pb-4 pt-4">
        <div className="flex items-center gap-3 px-3 transition-all group-data-[collapsible=icon]:justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-[0_0_15px_rgba(255,193,7,0.3)]">
            <div className="h-6 w-6 rounded-full border-2 border-black/80" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-bold tracking-tight text-xl text-white">ESPOINT</span>
            <span className="text-[10px] font-bold tracking-[0.2em] text-primary">ADMIN PANEL</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/50 text-xs font-medium px-4 mb-2 uppercase tracking-wider group-data-[collapsible=icon]:hidden">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className="h-12 rounded-xl text-gray-400 font-medium transition-all duration-200 hover:bg-white/5 hover:text-white hover:pl-4 data-[active=true]:bg-[#FFC107] data-[active=true]:text-black data-[active=true]:font-bold data-[active=true]:shadow-lg active:scale-95"
                  >
                    <Link href={item.url} className="flex items-center gap-3 px-3">
                      <item.icon className="h-5 w-5 transition-colors" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/5 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <Button
              
              className="w-full justify-start h-12 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-all group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5 group-data-[collapsible=icon]:mr-0" />
              <span className="group-data-[collapsible=icon]:hidden font-medium">Sign Out</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
