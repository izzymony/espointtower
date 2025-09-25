"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"
import Loader from "../components/Loading"
import ServicesCount from "../components/ServicesCount"
import Amount from "../components/Amount"
import DynamicCount from "../components/DynamicCount"
import BookingCounts from "../components/BookingCounts"

interface ServiceRecord {
  approved: number
}

interface ServiceDetails {
  service_name: string
  records: ServiceRecord
}

interface ApiResponse {
  msg: {
    [service_id: string]: ServiceDetails
  }
}

interface MembersCount {
  service_id: string
  service_name: string
  records: ServiceRecord
}

export default function DashboardPage() {
  const [user, setUser] = useState<{ username: string; role?: string } | null>(null)
  const [membersCount, setMembersCounts] = useState<MembersCount[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}")

    if (!storedUser?.username) {
      setError("No user found in localStorage")
      return
    }

    setUser(storedUser)
    setIsAdmin(storedUser?.role === "admin")

    // ✅ Only fetch real data if admin
    if (storedUser?.role === "admin") {
      const username = storedUser.username
      const url = `https://espoint.onrender.com/espoint/get_all_service_members_counts/${username}`

      setLoading(true)
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch service members count")
          return res.json()
        })
        .then((data: ApiResponse) => {
          if (data.msg && typeof data.msg === "object") {
            const arr: MembersCount[] = Object.entries(data.msg).map(
              ([service_id, details]) => ({
                service_id,
                service_name: details.service_name,
                records: details.records,
              })
            )
            setMembersCounts(arr)
          } else {
            setMembersCounts([])
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false))
    } else {
      // ❌ Not admin → show dummy boxes
      setMembersCounts([
        { service_id: "1", service_name: "Service A", records: { approved: 0 } },
        { service_id: "2", service_name: "Service B", records: { approved: 0 } },
        { service_id: "3", service_name: "Service C", records: { approved: 0 } },
      ])
    }
  }, [])

  if (loading)
    return (
      <div className="mt-20 flex h-[100vh] justify-center items-center opacity-3">
        <Loader />
      </div>
    )

  if (error) return <div className="text-red-500 mt-20">{error}</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.username}!{" "}
          {isAdmin ? "Here’s an overview of your services and members." : "You have limited access."}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {membersCount.map((service) => (
          <Card key={service.service_id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {service.service_name}
                <Users className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
              <CardDescription>Approved Members</CardDescription>
            </CardHeader>
            <CardContent>
              {/* If not admin, show "null" instead of number */}
              <p className="text-2xl font-bold">
                {isAdmin ? service.records.approved : "null"}
              </p>
            </CardContent>
          </Card>
        ))}

        {/* Extra stat cards (only show real values if admin, else nulls) */}
        <ServicesCount />
        
        <DynamicCount />
       
      </div>
      <div>
        <Amount />
      </div>
    </div>
  )
}
