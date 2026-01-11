'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar, ChevronRight } from 'lucide-react'

interface Booking {
  service_name: string;
  service_id: string;
  status: string;
  created: string;
}

const Page = () => {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (!storedUser?.username) return;

    const username = storedUser.username;

    const url = `https://espoint-5shr.onrender.com/espoint/get_all_service/${username}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to Services");
        return res.json();
      })
      .then((data) => {
        if (data.msg) setBookings(data.msg);
      })
      .catch(() => { });
  }, []);

  return (
    <div className="space-y-8 pt-6">

      {/* HERO HEADER - Infused Design */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0a0a0a] px-8 py-12 shadow-2xl">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl"></div>

        <div className="relative z-10 space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            Booked <span className="text-primary">Contents</span>
          </h1>
          <p className="text-gray-400 max-w-lg text-lg">
            Manage your service bookings and view detailed content reservations.
          </p>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
        {bookings.map((booking) => (
          <Card key={booking.service_id} className='rounded-3xl border-none shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden bg-white ring-1 ring-border/10'>
            <CardHeader className="relative pb-4">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <div className="h-24 w-24 rounded-full bg-[#FFC107] blur-3xl"></div>
              </div>
              <div className="flex justify-between items-start">
                <Badge variant="outline" className="rounded-full bg-[#FFC107]/10 text-[#FFC107] border-[#FFC107]/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
                  {booking.status}
                </Badge>
                <span className="text-[10px] font-mono text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
                  {booking.service_id.length > 8 ? booking.service_id.slice(0, 8) + "..." : booking.service_id}
                </span>
              </div>
              <CardTitle className='font-bold text-xl text-[#0a0a0a] pt-4 line-clamp-1 group-hover:text-[#FFC107] transition-colors'>
                {booking.service_name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center text-sm text-muted-foreground gap-2">
                <Calendar className="w-4 h-4 text-[#FFC107]" />
                <span>Created on {new Date(booking.created).toLocaleDateString()}</span>
              </div>

              <Button
                onClick={() => router.push(`/dashboard/booked_contents/${booking.service_id}`)}
                className='w-full rounded-2xl bg-[#0a0a0a] text-white hover:bg-[#FFC107] hover:text-black font-bold h-12 shadow-lg hover:shadow-[0_0_20px_rgba(255,193,7,0.3)] transition-all'
              >
                See Bookings <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {bookings.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-white rounded-3xl border-dashed border-2 border-border/50">
            No bookings found.
          </div>
        )}
      </div>
    </div>
  )
}

export default Page