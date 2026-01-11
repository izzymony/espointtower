"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar, TrendingUp, Activity, BarChart3, Layers } from "lucide-react";

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

      const url = `https://espoint-5shr.onrender.com/espoint/get_all_in_one_booking_count_dynamic/${username}/${serviceUnit}/${mode}/${today}`;
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
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-[#0a0a0a] text-[#FFC107] shadow-lg">
          <BarChart3 className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-[#0a0a0a]">
          Dynamic <span className="text-gray-400">Analysis</span>
        </h2>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-600 border border-red-100 flex items-center gap-2">
          <Activity className="w-5 h-5" /> {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0a0a0a]"></div>
        </div>
      )}

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {isAdmin ? (
          Object.keys(data).length === 0 ? (
            <Card className="col-span-full border-none shadow-xl rounded-[2rem] bg-white p-8 text-center ring-1 ring-border/10">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                  <Layers className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">No Data Available</h3>
                  <p className="text-gray-500 mt-1">There are no booking records for this period.</p>
                </div>
              </div>
            </Card>
          ) : (
            Object.entries(data).map(([date, statuses]) => (
              <div key={date} className="contents">
                {Object.entries(statuses).map(([status, services]) => (
                  Object.entries(services).map(([serviceId, count]) => (
                    <Card
                      key={`${date}-${status}-${serviceId}`}
                      className="group relative border-none shadow-xl rounded-[2.5rem] bg-[#0a0a0a] text-white p-6 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                    >
                      {/* Abstract BG Decor */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFC107]/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-[#FFC107]/20"></div>

                      <CardHeader className="p-0 mb-4 relative z-10">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider">
                            <Calendar className="w-3 h-3 text-[#FFC107]" />
                            {date}
                          </div>
                          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${status.toLowerCase() === 'active' || status.toLowerCase() === 'approved'
                            ? 'bg-[#FFC107] text-[#0a1120]'
                            : 'bg-white/10 text-gray-300'
                            }`}>
                            {status}
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="p-0 relative z-10">
                        <div className="space-y-1">
                          <div className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em]">
                            SERVICE ID
                          </div>
                          <div className="text-lg font-bold text-white mb-4 line-clamp-1">
                            #{serviceId}
                          </div>

                          <div className="h-px bg-white/10 w-full mb-4"></div>

                          <div className="flex items-end gap-2">
                            <span className="text-5xl font-black text-[#FFC107] tracking-tighter leading-none">
                              {count}
                            </span>
                            <span className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-2">
                              Bookings
                            </span>
                          </div>
                        </div>
                      </CardContent>

                      {/* Hover Icon */}
                      <div className="absolute bottom-4 right-4 text-white/5 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-110 duration-500">
                        <TrendingUp className="w-16 h-16" />
                      </div>
                    </Card>
                  ))
                ))}
              </div>
            ))
          )
        ) : (
          // Non-admin placeholder box
          <Card className="col-span-full border-dashed border-2 border-gray-200 shadow-none rounded-[2rem] bg-gray-50 p-8 flex flex-col items-center justify-center gap-2">
            <Activity className="w-10 h-10 text-gray-400" />
            <p className="text-lg font-semibold text-gray-600">Access Restricted</p>
            <p className="text-sm text-gray-400">Administrator privileges required.</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DynamicCount;
