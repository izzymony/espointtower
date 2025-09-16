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
  const month = String(date.getMonth() + 1).padStart(2, "0"); // 01-12
  const day = String(date.getDate()).padStart(2, "0");       // 01-31
  return `${year}-${month}-${day}`;
};

// Validate YYYY-MM-DD
const isValidDate = (dateStr: string) => /^\d{4}-\d{2}-\d{2}$/.test(dateStr);

const BookingAmounts = () => {
  const [data, setData] = useState<AmountResponse>({});
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>("week");
  const [startDate, setStartDate] = useState(""); // YYYY-MM-DD
  const [endDate, setEndDate] = useState("");     // YYYY-MM-DD
 const [loading, setLoading] = useState(false)
  const [popup, setPopup] = useState("");
  const [isAdmin , setIsAdmin] = useState(false);


 
  const fetchAmounts = async () => {
  
    try {
      setError("");
      

      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (!storedUser?.username) {
        setError("No user found");
       
        return;
      }

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
    // auto-fetch only for non-range modes
    if  (mode !== "range") fetchAmounts();
  }, [mode]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      
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

      {/* Display Results */}
      {loading && <p>Loading...</p>}
      {!loading && Object.keys(data).length === 0 && <p>No records found</p>}

      <div className="grid grid-cols-1 gap-3">
        {Object.entries(data).map(([serviceId, record]) => (
          <Card key={serviceId}>
            <CardHeader>
              <CardTitle>Service: {serviceId}</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.entries(record).map(([status, amount]) => (
                <p
                  key={status}
                  className="text-lg font-semibold text-black"
                >
                  {status}: ₦{Number(amount).toLocaleString()}
                </p>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BookingAmounts;
