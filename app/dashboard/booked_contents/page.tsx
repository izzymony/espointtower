'use client'
import React, { useState, useEffect } from 'react'
import {  useRouter } from 'next/navigation'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Booking {
  service_name:string;
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
    
    const url = `https://espoint.onrender.com/espoint/get_all_service/${username}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to Services");
        return res.json();
      })
      .then((data) => {
        if (data.msg) setBookings(data.msg);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="bg-white min-h-screen">
      <h1 className='text-4xl font-bold'></h1>
      <div className='flex flex-col gap-6'>
      <div className='grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3'>

        {bookings.map((booking) => (
          <div key={booking.service_id} className='bg-white py-6 rounded-xl p-3 shadow-lg '>
          <h1 className='font-bold text-black py-3 '>{booking.service_name}</h1>
          <p className=''>{booking.service_id.length > 8 ? booking.service_id.slice(0,8) + "..." : booking.service_id}</p>
          <p>{booking.status}</p>
          <p className='font-sm text-sm '>{booking.created}</p>

          <button  onClick={() => router.push(`/dashboard/booked_contents/${booking.service_id}`)}  className=' bg-black p-1 rounded-xl mt-3 text-white text-[17px] font-sm px-3 py-2'>See Bookings</button>
          </div>
        ))}
      </div>
      </div>
    </div>
  )
}

export default Page