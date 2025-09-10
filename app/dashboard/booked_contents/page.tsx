'use client'
import React, { useState, useEffect } from 'react'
import {  useRouter } from 'next/navigation'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Booking {
  booking_id: string;
  service: string;
  service_unit: string;
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
    const status = "pending";
    const url = `https://espoint.onrender.com/espoint/get_user_booking/${username}/${status}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch bookings");
        return res.json();
      })
      .then((data) => {
        if (data.msg) setBookings(data.msg);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="bg-white min-h-screen">
     
      <div className="max-w-7xl mx-auto  pb-16 ">
        <h1 className="text-5xl font-bold mb-10 drop-shadow-lg">My Bookings</h1>
        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center text-gray-500 text-xl">No bookings yet.</div>
        ) : (
          <div className="w-full overflow-x-auto rounded-lg">
            <div className="min-w-[1100px]">
              <Table className="w-full text-lg rounded-lg">
                <TableHeader className='rounded-md'>
                  <TableRow className="bg-[#d4731e] text-white ">
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
                      className="hover:bg-[#fffbed] cursor-pointer transition-all duration-200"
                      onClick={() => router.push(`/bookings/${booking.booking_id}`)}
                    >
                      <TableCell className="break-all font-mono py-6 px-6 text-base">{booking.booking_id}</TableCell>
                      <TableCell className="font-semibold text-[#d4731e] py-6 px-6 text-base">{booking.service}</TableCell>
                      <TableCell className="py-6 px-6">
                        <span className={`px-4 py-2 rounded-full font-semibold text-base shadow ${
                          booking.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : booking.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>{booking.status}</span>
                      </TableCell>
                      <TableCell className="text-gray-700 py-6 px-6 text-base">{new Date(booking.created).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Page