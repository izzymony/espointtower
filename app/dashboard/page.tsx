"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"
import Loader from "../components/Loading"
import ServicesCount from "../components/ServicesCount"
import Amount from "../components/Amount"
import DynamicCount from "../components/DynamicCount"
import BookingCounts from "../components/BookingCounts"

// 🔹 Types
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
  const [user, setUser] = useState<{ username: string } | null>(null)
  const [membersCount, setMembersCounts] = useState<MembersCount[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}")

    if (!storedUser?.username) {
      setError("No user found in localStorage")
      return
    }
    setUser(storedUser)

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
  }, [])

  if (loading)
    return (
      <div className="mt-20 flex h-[100vh] justify-center items-center">
        <Loader />
      </div>
    )

  if (error) return <div className="text-red-500 mt-20">{error}</div>
  if (!membersCount.length) return <div className="mt-20">No content found.</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.username}! Here&apos;s an overview of your services and members.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4  md:grid-cols-3 ">
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
              <p className="text-2xl font-bold">{service.records.approved}</p>
            </CardContent>
          </Card>
        ))}

     
        {/* Extra stat cards */}
        <ServicesCount />
        <Amount />
        <DynamicCount />
        </div>
     
    </div>
  )
}
