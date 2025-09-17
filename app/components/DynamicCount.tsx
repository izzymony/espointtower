"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Mode = "week" | "month" | "year" | "day";

interface AmountResponse {
  [date: string]: {
    [status: string]: {
      [serviceId: string]: number;
    };
  };
}

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const DynamicCount = () => {
  const [data, setData] = useState<AmountResponse>({});
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>("week");
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchAmounts = async () => {
    try {
      setError("");
      setLoading(true);

      // ✅ read user from localStorage
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
      const today = formatDate(new Date());

      const url = `https://espoint.onrender.com/espoint/get_all_in_one_booking_count_dynamic/${username}/${serviceUnit}/${mode}/${today}`;
      console.log("Fetching:", url);

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");

      const result = await res.json();
      console.log("API Result:", result);

      setData(result.msg ?? {});
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

  // Auto-fetch on mount
  useEffect(() => {
    fetchAmounts();
  }, [mode]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Dynamic Booking Count</h2>

      {error && <p className="text-red-500">{error}</p>}
      {loading && <p>Loading...</p>}

      <div>
        {isAdmin ? (
          Object.keys(data).length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No records found</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">No booking data available.</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(data).map(([date, statuses]) => (
              <Card key={date}>
                <CardHeader>
                  <label>Date:</label>
                  <CardTitle>{date}</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.entries(statuses).map(([status, services]) => (
                    <div key={status} className="mb-2">
                      <h4 className="font-semibold">{status}</h4>
                      {Object.entries(services).map(([serviceId, count]) => (
                        <p key={serviceId}>
                          Service {serviceId}:{" "}
                          <span className="text-[#d4731e] font-bold">{count}</span>
                        </p>
                      ))}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )
        ) : (
          // Non-admin placeholder box
          <Card>
            <CardHeader>
              <CardTitle>Service: N/A</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-black">Count: null</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DynamicCount;
