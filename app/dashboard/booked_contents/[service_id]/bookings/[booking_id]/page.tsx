"use client";
  import React, { useEffect, useState } from "react";
  import { useParams } from "next/navigation";
  import Loader from "@/app/components/Loading";
  
  interface Booking {
    booking_id: string;
    service: string;
    service_unit: string;
    service_id?: string;
    store: {
      client_email: string;
      preferred_staff_id: string;
      notes: string;
      service_time: string;
      amount: string;
      currency: string;
      service_date: string;
      client_phone: string;
      client_name: string;
      service_package_id: string;
      status: string;
      completed_date: string;
      booking_code: string;
    };
    status: string;
    created: string;
  }
  
  const Page = () => {
    const { booking_id } = useParams() as { booking_id: string };
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isInternal, setIsInternal] = useState(false);
  
    // Editable fields
    const [notes, setNotes] = useState("");
    const [status, setStatus] = useState("");
    const [amount, setAmount] = useState("");
    const [currency, setCurrency] = useState("");
    const [completedDate, setCompletedDate] = useState("");
    const [bookingCode, setBookingCode] = useState("");
  
    // Booking code workflow
    const [bookingCodeSaved, setBookingCodeSaved] = useState(false);
    const [bookingCodeConfirmed, setBookingCodeConfirmed] = useState(false);
  
    // Check user role
    useEffect(() => {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (storedUser?.role === "admin" || storedUser?.from === "internal") {
        setIsInternal(true);
      } else {
        setIsInternal(false);
        setMessage("Not permitted ❌");
        setTimeout(() => setMessage(""), 5000);
      }
    }, []);
  
    // Fetch booking details
    useEffect(() => {
      if (!booking_id) return;
      setLoading(true);
  
      fetch(`https://espoint.onrender.com/espoint/get_booking/${booking_id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch booking");
          return res.json();
        })
        .then(async (data) => {
          if (data.msg) {
            const bookingData = data.msg as Booking;
  
            setNotes(bookingData.store.notes || "");
            setStatus(bookingData.store.status || "");
            setAmount(bookingData.store.amount || "");
            setCurrency(bookingData.store.currency || "");
            setCompletedDate(bookingData.store.completed_date || "");
            setBookingCode(bookingData.store.booking_code || "");
            setBookingCodeSaved(!!bookingData.store.booking_code);
            setBookingCodeConfirmed(false);
  
            if (bookingData.service_unit) {
              try {
                const serviceRes = await fetch(
                  `https://espoint.onrender.com/espoint/get_all_content_based_service_and_status/${bookingData.service_unit}/approved`
                );
                if (serviceRes.ok) {
                  const serviceData = await serviceRes.json();
                  if (serviceData.msg && serviceData.msg.length > 0) {
                    bookingData.service_id = serviceData.msg[0].content_id;
                  }
                }
              } catch (err) {
                console.warn("⚠️ Failed to fetch service_id", err);
              }
            }
  
            setBooking(bookingData);
          }
        })
        .catch((err: unknown) => {
          const msg =
            err instanceof Error
              ? err.message
              : typeof err === "string"
              ? err
              : "Failed to fetch booking";
          setError(msg);
        })
        .finally(() => setLoading(false));
    }, [booking_id]);
  
    // Save booking and confirm code
    const handleSaveAndConfirmBookingCode = async () => {
      if (!booking || !isInternal) return;
  
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        if (!storedUser?.username) {
          setMessage("User not found in localStorage");
          return;
        }
  
        const payload = {
          service_id: booking.service_id || "",
          booking_id: booking.booking_id,
          username: storedUser.username,
          from: "external",
          data: {
            client_email: booking.store.client_email,
            preferred_staff_id: booking.store.preferred_staff_id,
            notes,
            service_time: booking.store.service_time,
            amount,
            currency,
            service_date: booking.store.service_date,
            client_phone: booking.store.client_phone,
            client_name: booking.store.client_name,
            service_package_id: booking.store.service_package_id,
            status,
            completed_date: completedDate,
            booking_code: bookingCode,
          },
        };
  
        // 1️⃣ Save booking (with new code)
        const res = await fetch(
          `https://espoint.onrender.com/espoint/create_booking`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        if (!res.ok) throw new Error("Failed to update booking");
        await res.json();
        setBookingCodeSaved(true);
  
        // 2️⃣ Confirm booking code
        const confirmUrl = `https://espoint.onrender.com/espoint/confirm_booking_code/${storedUser.username}/${booking.booking_id}/${bookingCode}`;
        const confirmRes = await fetch(confirmUrl, { method: "GET" });
        if (!confirmRes.ok) throw new Error("Failed to confirm booking code");
        const confirmResult = await confirmRes.json();
  
        if (confirmResult.msg === true) {
          setBookingCodeConfirmed(true);
          setMessage("Booking code saved and confirmed ✅");
        } else {
          setBookingCodeConfirmed(false);
          setMessage("Booking code saved but confirmation failed ❌");
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : typeof err === "string"
            ? err
            : "Error saving or confirming booking";
        setMessage(msg);
        setBookingCodeConfirmed(false);
        setBookingCodeSaved(false);
      }
    };
  
    if (loading)
      return (
        <div className="mt-20 flex justify-center items-center min-h-screen">
          <Loader />
        </div>
      );
  
    if (error) return <div className="text-red-500 mt-20">{error}</div>;
    if (!booking) return <div className="mt-20">No booking found.</div>;
  
    return (
      <div className="bg-white min-h-screen ">
        <h1 className="text-3xl font-bold mb-6">Booking Details</h1>
  
        <div className="bg-[#fafafa] p-6 rounded-lg shadow mb-8">
          <div className="grid grid-cols-1 gap-4">
            <p><strong>Client Name:</strong> {booking.store.client_name}</p>
            <p><strong>Email:</strong> {booking.store.client_email}</p>
            <p><strong>Phone:</strong> {booking.store.client_phone}</p>
            <p><strong>Amount:</strong> {booking.store.amount}</p>
            <p><strong>Currency:</strong> {booking.store.currency}</p>
            <p><strong>Status:</strong> {booking.store.status}</p>
            <p><strong>Booking Code:</strong> {booking.store.booking_code}</p>
  
            {/* Booking Code Section */}
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <input
                type="text"
                value={bookingCode}
                onChange={(e) => {
                  setBookingCode(e.target.value);
                  setBookingCodeSaved(false);
                  setBookingCodeConfirmed(false);
                }}
                className="flex-1 border px-3 py-2 rounded"
              />
             
              <button
                onClick={handleSaveAndConfirmBookingCode}
                className="bg-black text-white px-4 py-2 rounded hover:bg-green-700 transition"
              >
                Save & Confirm
              </button>
            </div>
  
           
            {bookingCodeConfirmed && <p className="text-green-600 mt-1">Code confirmed ✅</p>}
          </div>
        </div>
  
        {isInternal && (
          <div className="bg-[#fafafa] p-6 rounded-lg shadow mb-10">
            <h3 className="text-lg font-bold mb-4">Edit Booking</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600">Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Currency</label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Completed Date</label>
                <input
                  type="date"
                  value={completedDate}
                  onChange={(e) => setCompletedDate(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
            </div>
          </div>
        )}
  
        {message && (
          <p className="mt-3 text-center text-lg font-semibold text-red-500">{message}</p>
        )}
  
        <div className="mt-10 text-center text-gray-500 text-sm">
          Created: {new Date(booking.created).toLocaleString()}
        </div>
      </div>
    );
  };
  
  export default Page;