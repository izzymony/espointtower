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
    const storedUser  = JSON.parse(localStorage.getItem("user") || "{}");
    if (storedUser ?.role === "admin" || storedUser ?.from === "internal") {
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
      const storedUser  = JSON.parse(localStorage.getItem("user") || "{}");
      if (!storedUser ?.username) {
        setMessage("User  not found in localStorage");
        return;
      }

      const payload = {
        service_id: booking.service_id || "",
        booking_id: booking.booking_id,
        username: storedUser .username,
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
         
        },
      };

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
      const storedUser  = JSON.parse(localStorage.getItem("user") || "{}");
      if (!storedUser ?.username) {
        setMessage("User  not found in localStorage");
        return;
      }

      const confirmUrl = `https://espoint.onrender.com/espoint/confirm_booking_code/${storedUser .username}/${booking.booking_id}/${bookingCode}`;
      const confirmRes = await fetch(confirmUrl, { method: "GET" });
      if (!confirmRes.ok) throw new Error("Failed to confirm booking code");
      const confirmResult = await confirmRes.json();

      if (confirmResult.msg === true) {
        setBookingCodeConfirmed(true);
        setMessage("Booking code confirmed ✅");
      } else {
        setBookingCodeConfirmed(false);
        setMessage("Booking code confirmation failed ❌");
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
    <div className="bg-white min-h-screen  py-10 max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="inline-block mb-8 bg-black text-white px-5 py-2 rounded-md shadow-md hover:bg-gray-900 transition"
        aria-label="Back to bookings"
      >
        &larr; Back to bookings
      </button>

      <h1 className="text-4xl font-extrabold mb-8 text-black border-b border-gray-300 pb-3">
        Booking Details
      </h1>

      {/* Booking Info */}
      <section className="bg-white bg-opacity-5 rounded-lg p-6 mb-10 shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-black">
          <div>
            <p className="mb-2">
              <span className="font-semibold">Client Name:</span>{" "}
              {booking.store.client_name}
            </p>
            <p className="mb-2">
              <span className="font-semibold">Email:</span>{" "}
              {booking.store.client_email}
            </p>
            <p className="mb-2">
              <span className="font-semibold">Phone:</span>{" "}
              {booking.store.client_phone}
            </p>
          </div>
          <div>
            <p className="mb-2">
              <span className="font-semibold">Amount:</span> {booking.store.amount}
            </p>
            <p className="mb-2">
              <span className="font-semibold">Currency:</span>{" "}
              {booking.store.currency}
            </p>
            <p className="mb-2">
              <span className="font-semibold">Status:</span> {booking.store.status}
            </p>
            
          </div>
        </div>
      </section>

      {/* Booking Code Section */}
      <section className="bg-white bg-opacity-5 rounded-lg p-6 mb-10 shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-black">Booking Code</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={bookingCode}
            onChange={(e) => {
              setBookingCode(e.target.value);
              setBookingCodeSaved(false);
              setBookingCodeConfirmed(false);
            }}
            className="flex-1 border border-black rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            aria-label="Booking code input"
          />
          <button
            onClick={handleConfirmBookingCode}
            className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-900 transition"
            aria-label="Confirm booking code"
          >
            Confirm Code
          </button>
        </div>
        {bookingCodeConfirmed && (
          <p className="text-green-600 mt-2 font-semibold">Code confirmed ✅</p>
        )}
      </section>

      {/* Editable Booking Section */}
      {isInternal && (
        <section className="bg-white bg-opacity-5 rounded-lg p-6 shadow-md mb-10">
          <h2 className="text-2xl font-semibold mb-6 text-black">Edit Booking</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <label
                htmlFor="notes"
                className="mb-1 font-medium text-black"
              >
                Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="border border-black rounded-md px-4 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-black"
                rows={4}
              />
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="status"
                className="mb-1 font-medium text-black"
              >
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="border border-black rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="amount"
                className="mb-1 font-medium text-black"
              >
                Amount
              </label>
              <input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="border border-black rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="currency"
                className="mb-1 font-medium text-black"
              >
                Currency
              </label>
              <input
                id="currency"
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="border border-black rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="flex flex-col md:col-span-2">
              <label
                htmlFor="completedDate"
                className="mb-1 font-medium text-black"
              >
                Completed Date
              </label>
              <input
                id="completedDate"
                type="date"
                value={completedDate}
                onChange={(e) => setCompletedDate(e.target.value)}
                className="border border-black rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          <button
            onClick={handleSaveBooking}
            className="mt-6 bg-black text-white px-8 py-3 rounded-md font-semibold shadow-md hover:bg-gray-900 transition"
            aria-label="Save booking updates"
          >
            Save Booking Updates
          </button>
        </section>
      )}

      {/* Message */}
      {message && (
        <p
          className={`mt-4 text-center font-semibold ${
            message.includes("success")
              ? "text-green-600"
              : message.includes("confirmed")
              ? "text-green-600"
              : "text-red-600"
          }`}
          role="alert"
        >
          {message}
        </p>
      )}

      {/* Created Date */}
      <p className="mt-10 text-center text-gray-600 text-sm">
        Created: {new Date(booking.created).toLocaleString()}
      </p>
    </div>
  );
};

export default Page;