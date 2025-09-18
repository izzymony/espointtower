"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Mode = "week" | "month" | "year" | "range" | "day";

interface AmountRecord {
  pending?: number;
  confirmed?: number;
  paid?: number;
  completed?: number;
  rejected?: number;
  [key: string]: number | undefined;
}

type AmountResponse = Record<string, AmountRecord>;

// Helper: format date as YYYY-MM-DD
const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Validate YYYY-MM-DD
const isValidDate = (dateStr: string) => /^\d{4}-\d{2}-\d{2}$/.test(dateStr);

const BookingAmounts = () => {
  const [data, setData] = useState<AmountResponse>({});
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>("week");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchAmounts = async () => {
    try {
      setError("");

      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (!storedUser?.username) {
        setError("No user found");
        return;
      }

      // ✅ Check admin role
      if (storedUser?.role !== "admin") {
        setIsAdmin(false);
        return;
      }
      setIsAdmin(true);

      const username = storedUser.username;
      const serviceUnit = "none";

      // Dates
      const today = formatDate(new Date());
      let referenceDateStr = today;
      let startStr = "none";
      let endStr = "none";

      if (mode === "range") {
        if (!startDate || !endDate) {
          setError("Please select both start and end dates for range mode.");
          return;
        }

        if (!isValidDate(startDate) || !isValidDate(endDate)) {
          setError("Invalid date format. Expected YYYY-MM-DD.");
          return;
        }

        if (startDate > endDate) {
          setError("Start date must be the same or before end date.");
          return;
        }

        referenceDateStr = today;
        startStr = startDate;
        endStr = endDate;
      } else if (mode === "month") {
        const [year, month] = today.split("-");
        referenceDateStr = `${year}-${month}-01`;
      } else if (mode === "year") {
        const [year] = today.split("-");
        referenceDateStr = `${year}-01-01`;
      } else if (mode === "day" || mode === "week") {
        referenceDateStr = today;
      }

      const url = `https://espoint.onrender.com/espoint/cal_b_amount/${username}/${serviceUnit}/${mode}/${referenceDateStr}/${startStr}/${endStr}`;
      console.log("Fetching URL:", url);

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch amounts");

      const resData = await res.json();
      setData(resData.msg ?? {});
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode !== "range") fetchAmounts();
  }, [mode]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      {isAdmin && (
        <div className="flex flex-wrap gap-4 items-center">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
            className="border px-3 py-2 rounded"
          >
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
            <option value="year">Yearly</option>
            <option value="day">Daily</option>
            <option value="range">Custom Range</option>
          </select>

          {mode === "range" && (
            <>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border px-3 py-2 rounded"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border px-3 py-2 rounded"
              />
              <button
                onClick={fetchAmounts}
                disabled={!startDate || !endDate || loading}
                className="bg-black disabled:bg-gray-400 text-white px-4 py-2 rounded hover:bg-[#b85f18] transition"
              >
                {loading ? "Fetching..." : "Fetch"}
              </button>
            </>
          )}
        </div>
      )}

      {/* Display Results */}
      {loading && <p>Loading...</p>}
      {!loading && Object.keys(data).length === 0 && isAdmin && (
        <p>No records found</p>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {isAdmin ? (
          Object.entries(data).map(([serviceId, record]) => (
            <Card key={serviceId} className="w-full max-w-md shadow-md rounded-xl">
  <CardHeader className="border-b pb-2">
    <CardTitle className="text-xl font-bold text-gray-800">
      Service: <p className="text-black font-medium">{serviceId}</p>
    </CardTitle>
  </CardHeader>

  <CardContent className="grid grid-cols-2 gap-4 pt-4">
    {Object.entries(record).map(([status, amount]) => (
      <div
        key={status}
        className="flex flex-col items-start bg-gray-50 p-3 rounded-lg hover:shadow-sm transition"
      >
        <span className="text-sm text-gray-500 capitalize">{status}</span>
        <span className="text-lg font-semibold text-gray-800">
          ₦{Number(amount).toLocaleString()}
        </span>
      </div>
    ))}
  </CardContent>
</Card>

          ))
        ) : (
          <>
            {/* Two placeholder boxes for non-admins */}
            <Card>
              <CardHeader>
                <CardTitle>Service: N/A</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold text-black">Amount: null</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Service: N/A</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold text-black">Amount: null</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default BookingAmounts;
