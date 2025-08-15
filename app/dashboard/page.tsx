"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserPlus, Settings, Activity } from "lucide-react"

// Define the Member type inline (or import from your models/services)
type Member = {
  username?: string;
  status?: string;
  position?: string;
  [key: string]: any;
};

export default function DashboardPage() {
  const [user, setUser] = useState<{ username: string } | null>(null)
  const [members, setMembers] = useState<Member[]>([])

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }

    const membersData = localStorage.getItem("members")
    if (membersData) {
      setMembers(JSON.parse(membersData))
    }
  }, [])

  const stats = [
    {
      title: "Total Members",
      value: members.length,
      icon: Users,
      description: "Active members in the system",
    },
    {
      title: "Active Members",
      value: members.filter((m) => m.status === "active").length,
      icon: Activity,
      description: "Currently active members",
    },
    {
      title: "Admins",
      value: members.filter((m) => m.position === "admin").length,
      icon: Settings,
      description: "System administrators",
    },
    {
      title: "Pending Members",
      value: members.filter((m) => m.status === "pending").length,
      icon: UserPlus,
      description: "Members awaiting approval",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.username}! Here&apos;s an overview of your member management system.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Manage your members and system settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Use the sidebar to navigate to Settings where you can add, update, and manage member passcodes.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}