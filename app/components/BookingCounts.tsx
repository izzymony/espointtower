"use client";

import React, { useEffect, useState } from "react";
import Loader from "@/app/components/Loading";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Mode = "week" | "month" | "year" | "range";

interface CountRecord {
  pending?: number;
  confirmed?: number;
  cancelled?: number;
  [key: string]: number | undefined;
}

type CountResponse = Record<string, CountRecord>;

const BookingCounts = () => {
  const [data, setData] = useState<CountResponse>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>("week");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchCounts = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (!storedUser?.username) {
        setError("No user found");
        return;
      }

      const username = storedUser.username;
      const serviceUnit = "none"; // placeholder until service_unit is available

      // Dates
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      let referenceDate = today;

      if (mode === "range") {
        if (!startDate || !endDate) {
          setError("Please select both start and end dates for range mode.");
          return;
        }
        referenceDate = `${startDate}:${endDate}`;
      } else if (mode === "month") {
        referenceDate = today.slice(0, 7); // YYYY-MM
      } else if (mode === "year") {
        referenceDate = today.slice(0, 4); // YYYY
      }

      const url = `https://espoint.onrender.com/espoint/get_all_in_one_booking_count_dynamic/${username}/${serviceUnit}/${mode}/${referenceDate}`;
      console.log("Fetching:", url);

      setLoading(true);
      setError("");

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch booking counts");

      const resData = await res.json();
      if (resData.msg) {
        setData(resData.msg);
      } else {
        setData({});
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, [mode]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="">
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as Mode)}
          className="border px-3 py-2 rounded"
        >
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
          <option value="year">Yearly</option>
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
              onClick={fetchCounts}
              className="bg-[#d4731e] text-white px-4 py-2 rounded hover:bg-[#b85f18] transition"
            >
              Fetch
            </button>
          </>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <Loader />
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="">
          {Object.entries(data).map(([serviceId, record]) => (
            <Card key={serviceId} className="shadow-md rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800">
                  Service: {serviceId}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(record).map(([status, count]) => (
                  <div
                    key={status}
                    className=""
                  >
                    <span className="capitalize text-gray-600">{status}</span>
                    <span className="font-semibold text-[#d4731e]">
                      {count}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingCounts;
