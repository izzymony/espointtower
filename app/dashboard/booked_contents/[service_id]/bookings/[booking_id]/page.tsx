"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Loader from "@/app/components/Loading";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

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

    fetch(`https://espoint-5shr.onrender.com/espoint/get_booking/${booking_id}`)
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
          setBookingCode("");
          setBookingCodeSaved(!!bookingData.store.booking_code);
          setBookingCodeConfirmed(false);

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

  // 1️⃣ Save booking updates
  const handleSaveBooking = async () => {
    if (!booking || !isInternal) return;

    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (!storedUser?.username) {
        setMessage("User  not found in localStorage");
        return;
      }

      const payload = {
        service_id: booking.service_id || "",
        booking_id: booking.booking_id,
        username: storedUser.username,
        from: "internal",
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

        },
      };

      const res = await fetch(
        `https://espoint-5shr.onrender.com/espoint/create_booking`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error("Failed to update booking");
      await res.json();

      setMessage("Booking updated successfully ✅");
      setBookingCodeSaved(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Error saving booking";
      setMessage(msg);
    }
  };

  // 2️⃣ Confirm booking code
  const handleConfirmBookingCode = async () => {
    if (!booking || !isInternal) return;

    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (!storedUser?.username) {
        setMessage("User  not found in localStorage");
        return;
      }

      const confirmUrl = `https://espoint-5shr.onrender.com/espoint/confirm_booking_code/${storedUser.username}/${booking.booking_id}/${bookingCode.trim()}`;
      const confirmRes = await fetch(confirmUrl, { method: "GET" });
      if (!confirmRes.ok) throw new Error("Failed to confirm booking code");
      const confirmResult = await confirmRes.json();

      console.log("Confirmation verification result:", confirmResult);

      if (confirmResult.msg === true || confirmResult.msg === "true") {
        setBookingCodeConfirmed(true);
        setMessage("Booking code confirmed ✅");
      } else {
        setBookingCodeConfirmed(false);
        setMessage(`Booking code confirmation failed: ${JSON.stringify(confirmResult.msg || "Invalid code")} ❌`);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Error confirming booking code";
      setMessage(msg);
    }
  };

  if (loading)
    return (
      <div className="mt-20 flex justify-center items-center min-h-screen bg-white">
        <Loader />
      </div>
    );

  if (error)
    return (
      <div className="text-red-600 mt-20 text-center font-semibold bg-white min-h-screen flex items-center justify-center px-4">
        {error}
      </div>
    );
  if (!booking)
    return (
      <div className="mt-20 text-center font-semibold bg-white min-h-screen flex items-center justify-center px-4">
        No booking found.
      </div>
    );

  return (
    <div className="space-y-6 pt-6 max-w-5xl mx-auto pb-20">

      {/* HERO HEADER - Infused Design */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0a0a0a] px-8 py-10 shadow-2xl">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#FFC107]/20 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#FFC107]/10 blur-3xl"></div>

        <div className="relative z-10">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-[#FFC107] hover:bg-white/5 mb-4 pl-0 flex items-center gap-2 text-sm font-medium transition-colors p-2 rounded-lg"
          >
            &larr; Back to bookings
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">
                Booking <span className="text-[#FFC107]">#{booking.booking_id.slice(0, 8)}</span>
              </h1>
              <p className="text-gray-400">
                Manage details for {booking.store.client_name}
              </p>
            </div>
            <div className="px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-md">
              <span className="text-white text-sm font-mono tracking-wider">
                {new Date(booking.created).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN: DETAILS */}
        <div className="lg:col-span-2 space-y-6">

          {/* Booking Info Card */}
          <section className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-[#FFC107] rounded-full"></span>
              Client Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Name</p>
                <p className="font-semibold text-lg text-black">{booking.store.client_name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${booking.store.status === 'confirmed' ? 'bg-green-100 text-green-800 border-green-200' :
                  booking.store.status === 'paid' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                    'bg-yellow-100 text-yellow-800 border-yellow-200'
                  }`}>
                  {booking.store.status}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email</p>
                <p className="font-medium text-black">{booking.store.client_email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phone</p>
                <p className="font-medium text-black">{booking.store.client_phone}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Amount</p>
                <p className="font-bold text-2xl text-black">
                  {booking.store.currency} {booking.store.amount}
                </p>
              </div>
            </div>
          </section>

          {/* Edit Form */}
          {isInternal && (
            <section className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-black rounded-full"></span>
                Edit Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col space-y-2">
                  <label htmlFor="notes" className="text-sm font-bold text-gray-700">Notes</label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FFC107] transition-all resize-none h-32"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col space-y-2">
                    <label htmlFor="status" className="text-sm font-bold text-gray-700">Status</label>
                    <select
                      id="status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FFC107] transition-all"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label htmlFor="amount" className="text-sm font-bold text-gray-700">Amount</label>
                    <input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FFC107] transition-all"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <button
                    onClick={handleSaveBooking}
                    className="bg-black text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-[#FFC107] hover:text-black hover:shadow-[#FFC107]/20 transition-all duration-300"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN: ACTIONS */}
        <div className="space-y-6">

          {/* Code Verification */}
          <section className="bg-[#0a0a0a] rounded-3xl p-8 shadow-xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFC107] blur-[80px] opacity-20"></div>

            <h2 className="text-xl font-bold mb-4 relative z-10">Verification</h2>
            <p className="text-gray-400 text-sm mb-6 relative z-10">Enter the booking code provided by the client to verify this service.</p>

            <div className="relative z-10 space-y-4">
              <input
                type="text"
                value={bookingCode}
                placeholder="Enter booking code to verify"
                onChange={(e) => {
                  setBookingCode(e.target.value);
                  setBookingCodeSaved(false);
                  setBookingCodeConfirmed(false);
                }}
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:bg-white/20 focus:border-[#FFC107] transition-all text-center tracking-widest font-mono text-lg"
              />
              <button
                onClick={handleConfirmBookingCode}
                className="w-full bg-[#FFC107] text-black font-bold py-3 rounded-xl hover:bg-white hover:scale-[1.02] transition-all"
              >
                Verify Code
              </button>
            </div>

            {bookingCodeConfirmed && (
              <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-center">
                <p className="text-green-400 font-bold text-sm">Code Verified Successfully</p>
              </div>
            )}
          </section>

          {/* Status Message */}
          {message && (
            <div className={`p-4 rounded-2xl border ${message.includes("success") || message.includes("confirmed") ? "bg-green-50 border-green-100 text-green-700" : "bg-red-50 border-red-100 text-red-600"
              } font-medium text-center text-sm shadow-sm`}>
              {message}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default Page;