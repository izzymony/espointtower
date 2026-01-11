'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronLeft, Filter } from 'lucide-react'
import { Button } from "@/components/ui/button"

type Status = "pending" | "paid" | "confirmed" | "completed" | "rejected"

interface Booking {
  service_id: string;
  booking_id: string;
  service: string;
  service_unit: string;
  status: string;
  created: string;
}

const Booked = () => {
  const params = useParams()
  const { service_id } = params as { service_id: string }
  const router = useRouter()

  const [error, setError] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<Status>("pending")

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}')

    if (!storedUser?.username) {
      setError('No user found in localStorage')
      return
    }

    if (!service_id) {
      setError('No service_id found in URL params')
      return
    }

    const username = storedUser.username
    const url = `https://espoint-5shr.onrender.com/espoint/get_bookings_based_status_restricted/${username}/${filter}/${service_id}`

    setLoading(true)
    setError('')

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch bookings or user not permitted')
        return res.json()
      })
      .then((data) => {
        if (data.msg) {
          setBookings(data.msg)
        } else {
          setBookings([])
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [service_id, filter])

  return (
    <div className="space-y-6 pt-6">

      {/* HERO HEADER - Infused Design */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0a0a0a] px-8 py-10 shadow-2xl">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#FFC107]/20 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#FFC107]/10 blur-3xl"></div>

        <div className="relative z-10">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-gray-400 hover:text-[#FFC107] hover:bg-white/5 mb-4 pl-0"
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> Back to listings
          </Button>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
            Service <span className="text-[#FFC107]">Bookings</span>
          </h1>
          <p className="text-gray-400 mt-2 max-w-lg">
            Manage and view status for all bookings related to this service.
          </p>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="rounded-3xl bg-white shadow-xl ring-1 ring-black/5 overflow-hidden">

        {/* Controls Bar */}
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            {loading ? (
              "Syncing..."
            ) : (
              <>Showing <span className="text-black font-bold">{bookings.length}</span> {filter} bookings</>
            )}
          </div>

          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-1.5 border border-gray-100">
            <Filter className="w-4 h-4 text-gray-400 ml-2" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as Status)}
              className='bg-transparent border-none text-sm font-medium text-black focus:ring-0 cursor-pointer py-1'
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {loading && <div className="text-gray-500 text-center py-12">Loading bookings...</div>}

          {error && <div className="text-red-500 text-center py-12 bg-red-50 rounded-xl border border-red-100">{error}</div>}

          {!loading && !error && bookings.length === 0 ? (
            <div className="text-center py-20 px-4 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
              <div className="text-gray-400 mb-2">No bookings found for this filter.</div>
            </div>
          ) : (
            !loading && !error && (
              <div className="overflow-hidden rounded-2xl border border-gray-100">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#0a0a0a] hover:bg-[#0a0a0a]">
                      <TableHead className="py-4 px-6 text-white font-medium">Booking ID</TableHead>
                      <TableHead className="py-4 px-6 text-white font-medium">Service</TableHead>
                      <TableHead className="py-4 px-6 text-white font-medium">Status</TableHead>
                      <TableHead className="py-4 px-6 text-white font-medium">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow
                        key={booking.booking_id}
                        onClick={() =>
                          router.push(`/dashboard/booked_contents/${service_id}/bookings/${booking.booking_id}`)
                        }
                        className="cursor-pointer transition-colors hover:bg-gray-50 group"
                      >
                        <TableCell className="font-mono text-xs text-gray-500 py-4 px-6 group-hover:text-black transition-colors">
                          {booking.booking_id}
                        </TableCell>
                        <TableCell className="font-bold text-black py-4 px-6">
                          {booking.service}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide
                              ${booking.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                : booking.status === 'confirmed'
                                  ? 'bg-green-100 text-green-800 border border-green-200'
                                  : booking.status === 'paid'
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : booking.status === 'rejected'
                                      ? 'bg-red-100 text-red-800 border border-red-200'
                                      : booking.status === 'completed'
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                        : 'bg-gray-100 text-gray-800'
                              }
                            `}
                          >
                            {booking.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-500 py-4 px-6 text-sm">
                          {new Date(booking.created).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

export default Booked
