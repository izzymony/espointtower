"use client";

import React, { useEffect, useState } from "react";
import Loader from "@/app/components/Loading";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar, Filter, RefreshCw, BarChart3, CheckCircle2, Clock, XCircle, ChevronDown } from "lucide-react";

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
        setData({}); // Clear data to show freshness
      } else if (mode === "year") {
        referenceDate = today.slice(0, 4); // YYYY
        setData({});
      }

      const url = `https://espoint-5shr.onrender.com/espoint/get_all_in_one_booking_count_dynamic/${username}/${serviceUnit}/${mode}/${referenceDate}`;
      console.log("Fetching:", url);

      setLoading(true);
      setError("");

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch booking counts");

      const resData = await res.json();
      if (resData.msg && typeof resData.msg === "object") {
        // The API returns { [date]: { [status]: { [serviceId]: count } } }
        // We need to aggregate this into { [serviceId]: { [status]: count } }
        const aggregated: CountResponse = {};

        Object.values(resData.msg).forEach((dateData: any) => {
          if (dateData && typeof dateData === "object") {
            Object.entries(dateData).forEach(([status, services]: [string, any]) => {
              if (services && typeof services === "object") {
                Object.entries(services).forEach(([serviceId, count]: [string, any]) => {
                  if (!aggregated[serviceId]) {
                    aggregated[serviceId] = { confirmed: 0, pending: 0, cancelled: 0 };
                  }

                  const normalizedStatus = status.toLowerCase();
                  const value = typeof count === "number" ? count : 0;

                  if (normalizedStatus === "confirmed") {
                    aggregated[serviceId].confirmed = (aggregated[serviceId].confirmed || 0) + value;
                  } else if (normalizedStatus === "pending") {
                    aggregated[serviceId].pending = (aggregated[serviceId].pending || 0) + value;
                  } else if (normalizedStatus === "cancelled") {
                    aggregated[serviceId].cancelled = (aggregated[serviceId].cancelled || 0) + value;
                  } else {
                    // Handle other statuses if they exist
                    aggregated[serviceId][status] = (aggregated[serviceId][status] || 0) + value;
                  }
                });
              }
            });
          }
        });

        setData(aggregated);
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
    // Prevent fetching range if dates aren't ready, but fetch others immediately
    if (mode !== "range") {
      fetchCounts();
    }
  }, [mode]);

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#0a0a0a] text-[#FFC107] shadow-lg">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0a0a0a]">
            Booking <span className="text-gray-400">Overview</span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
              className="pl-9 pr-8 py-2 bg-gray-50 border border-transparent hover:border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-[#FFC107]/20 outline-none appearance-none cursor-pointer transition-all"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="range">Custom Range</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {mode === "range" && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 bg-gray-50 rounded-xl text-sm border-none focus:ring-2 focus:ring-[#FFC107]/20 outline-none text-gray-700"
              />
              <span className="text-gray-300">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 bg-gray-50 rounded-xl text-sm border-none focus:ring-2 focus:ring-[#FFC107]/20 outline-none text-gray-700"
              />
              <button
                onClick={fetchCounts}
                className="bg-[#0a0a0a] text-white p-2 rounded-xl hover:bg-[#FFC107] hover:text-black transition-colors shadow-lg"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader />
        </div>
      ) : error ? (
        <div className="p-6 rounded-[2rem] bg-red-50 text-red-600 border border-red-100 flex flex-col items-center gap-2 text-center">
          <XCircle className="w-8 h-8 opacity-50" />
          <p className="font-medium">{error}</p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {Object.keys(data).length > 0 ? (
            Object.entries(data).map(([serviceId, record]) => (
              <Card
                key={serviceId}
                className="group relative border-none shadow-xl rounded-[2.5rem] bg-[#0a0a0a] text-white p-8 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              >
                {/* Abstract Glow */}
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-gradient-to-br from-[#FFC107]/20 to-transparent rounded-full blur-3xl transition-all group-hover:scale-125"></div>

                <CardHeader className="p-0 mb-6 relative z-10">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[#FFC107] text-[10px] font-black uppercase tracking-[0.25em] mb-1">SERVICE</p>
                      <CardTitle className="text-xl font-bold text-white tracking-tight">
                        {serviceId}
                      </CardTitle>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white/50 group-hover:text-[#FFC107] group-hover:border-[#FFC107]/30 transition-all">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0 space-y-4 relative z-10">
                  {/* Confirmed */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group/row">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-green-500/10 text-green-500">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-gray-300">Confirmed</span>
                    </div>
                    <span className="text-lg font-bold text-white group-hover/row:text-green-400 transition-colors">
                      {record.confirmed || 0}
                    </span>
                  </div>

                  {/* Pending */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group/row">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-yellow-500/10 text-yellow-500">
                        <Clock className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-gray-300">Pending</span>
                    </div>
                    <span className="text-lg font-bold text-white group-hover/row:text-yellow-400 transition-colors">
                      {record.pending || 0}
                    </span>
                  </div>

                  {/* Cancelled */}
                  {record.cancelled !== undefined && record.cancelled > 0 && (
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group/row">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-red-500/10 text-red-500">
                          <XCircle className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-gray-300">Cancelled</span>
                      </div>
                      <span className="text-lg font-bold text-white group-hover/row:text-red-400 transition-colors">
                        {record.cancelled || 0}
                      </span>
                    </div>
                  )}

                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-16 text-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No booking data available for this period.</p>
              <p className="text-gray-400 text-sm mt-1">Try selecting a different date range.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingCounts;
