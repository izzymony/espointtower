'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Status = "pending" | "paid" | "confirmed" | "completed"

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

  const [checkedRole, setCheckedRole] = useState(false)

  

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
    const url = `https://espoint.onrender.com/espoint/get_bookings_based_status_restricted/${username}/${filter}/${service_id}`

    setLoading(true)
    setError('')

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch bookings')
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
    <div className="bg-white">
      <div className=" mx-auto pb-16 ">
        <h1 className="text-5xl font-bold mb-10 drop-shadow-lg">Bookings</h1>

        {/* Filter Dropdown */}
        <div className='flex flex-wrap gap-4 items-center mb-6'>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Status)}
            className='border px-3 py-2 rounded'
          >
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {loading && <div className="text-black text-lg">Loading {filter} bookings...</div>}
        {error && <div className="text-red-500 text-lg">{error}</div>}
        {!loading && !error && bookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center text-gray-500 text-xl">
            No {filter} bookings found.
          </div>
        ) : (
          <div className=" overflow-x-auto rounded-lg">
            <Table className=" text-lg rounded-lg">
              <TableHeader>
                <TableRow className="bg-black text-white">
                  <TableHead className="py-5 px-6 text-lg text-white">Booking ID</TableHead>
                  <TableHead className="py-5 px-6 text-lg text-white">Service</TableHead>
                  <TableHead className="py-5 px-6 text-lg text-white">Status</TableHead>
                  <TableHead className="py-5 px-6 text-lg text-white">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow
                    key={booking.booking_id}
                    onClick={() =>
                      router.push(`/dashboard/booked_contents/${service_id}/bookings/${booking.booking_id}`)
                    }
                    className="hover:bg-[#fffbed] cursor-pointer transition-all duration-200"
                  >
                    <TableCell className="break-all font-mono py-6 px-6 text-sm">{booking.booking_id}</TableCell>
                    <TableCell className="font-semibold text-black py-6 px-6">{booking.service}</TableCell>
                    <TableCell className="py-6 px-6">
                      <span
                        className={`px-4 py-2 rounded-full font-semibold text-sm shadow ${
                          booking.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : booking.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : booking.status === 'paid'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-700 py-6 px-6">
                      {new Date(booking.created).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Booked
