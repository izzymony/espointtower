"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, ShieldCheck, Crown } from "lucide-react"
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
      const url = `https://espoint-5shr.onrender.com/espoint/get_all_service_members_counts/${username}`

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
      <div className="mt-20 flex h-[100vh] justify-center items-center ">
        <Loader />
      </div>
    )

  if (error) return <div className="text-red-500 mt-20">{error}</div>

  return (
    <div className="space-y-12 pt-6 pb-20">
      {/* Welcome Header */}
      <div className="relative">
        <h1 className="text-4xl font-extrabold tracking-tight text-[#0a0a0a]">
          Command <span className="text-[#FFC107]">Center</span>
        </h1>
        <p className="text-gray-500 mt-2 max-w-xl">
          Welcome back, <span className="font-bold text-gray-900">{user?.username}</span>.
          {isAdmin ? " Here is the high-level overview of your platform's performance." : " You have limited access to this dashboard."}
        </p>
      </div>

      {/* Top Grid: Service Overview */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <Crown className="w-5 h-5 text-[#FFC107]" />
          <h2 className="text-xl font-bold text-gray-800">Service Performance</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Active Services Card */}
          <ServicesCount />

          {/* Member Count Cards */}
          {membersCount.map((service) => (
            <Card
              key={service.service_id}
              className="group relative  border-none shadow-xl rounded-[2.5rem] bg-[#0a0a0a] text-white p-6 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Abstract Glow */}
              <div className="absolute bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-3xl transition-all group-hover:bg-[#FFC107]/10"></div>

              <CardHeader className="p-0 relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-white/10 rounded-xl text-[#FFC107] border border-white/5 group-hover:bg-[#FFC107] group-hover:text-[#0a0a0a] transition-colors duration-300">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="px-2 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] uppercase font-bold tracking-widest text-[#FFC107]">
                    Members
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0 relative z-10">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-400 truncate pr-4">
                    {service.service_name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white tracking-tight group-hover:text-[#FFC107] transition-colors">
                      {isAdmin ? service.records.approved : "-"}
                    </span>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Approved</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Analytics Sections */}
      <div className="space-y-12">
        {/* Dynamic Analysis Section */}
        <section className="bg-white/50 rounded-[3rem] p-1">
          <DynamicCount />
        </section>

        {/* Booking Overview Section */}
        <section className="bg-white/50 rounded-[3rem] p-1">
          <BookingCounts />
        </section>

        {/* Financial Overview Section */}
        <section className="bg-white/50 rounded-[3rem] p-1">
          <Amount />
        </section>
      </div>
    </div>
  )
}
