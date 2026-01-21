"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Calendar, Users, AlertCircle, DollarSign, Wallet, Filter, ChevronDown, CheckCircle2, XCircle } from "lucide-react";

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

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isValidDate = (dateStr: string) => /^\d{4}-\d{2}-\d{2}$/.test(dateStr);

// Status config optimized for Dark Theme
const statusConfig = {
  pending: { label: "Pending", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", icon: AlertCircle },
  confirmed: { label: "Confirmed", color: "text-blue-400 bg-blue-400/10 border-blue-400/20", icon: Users },
  paid: { label: "Paid", color: "text-green-400 bg-green-400/10 border-green-400/20", icon: DollarSign },
  completed: { label: "Completed", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "text-red-400 bg-red-400/10 border-red-400/20", icon: XCircle },
};

const BookingAmounts = () => {
  const [data, setData] = useState<AmountResponse>({});
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>("week");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchAmounts = async () => {
    setLoading(true);
    setError("");
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (!storedUser?.username) {
        setError("No user found. Please log in.");
        setIsAdmin(false);
        return;
      }

      if (storedUser?.role !== "admin") {
        setIsAdmin(false);
        setData({});
        return;
      }
      setIsAdmin(true);

      const username = storedUser.username;
      const serviceUnit = "none";
      const today = formatDate(new Date());
      let referenceDateStr = today;
      let startStr = "none";
      let endStr = "none";

      if (mode === "range") {
        if (!startDate || !endDate) {
          setError("Please select both start and end dates.");
          return;
        }
        if (!isValidDate(startDate) || !isValidDate(endDate)) {
          setError("Invalid date format.");
          return;
        }
        if (startDate > endDate) {
          setError("Start date must be before end date.");
          return;
        }
        startStr = startDate;
        endStr = endDate;
      } else if (mode === "month") {
        const [year, month] = today.split("-");
        referenceDateStr = `${year}-${month}-01`;
      } else if (mode === "year") {
        const [year] = today.split("-");
        referenceDateStr = `${year}-01-01`;
      }

      const url = `https://espoint-5shr.onrender.com/espoint/cal_b_amount/${username}/${serviceUnit}/${mode}/${referenceDateStr}/${startStr}/${endStr}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch amounts: ${res.statusText}`);

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
    if (isAdmin && mode !== "range") {
      fetchAmounts();
    }
  }, [mode, isAdmin]);

  useEffect(() => {
    fetchAmounts();
  }, []);

  if (!isAdmin && !loading) {
    return (
      <div className="py-10">
        <Card className="shadow-none rounded-[2.5rem] bg-gray-50 border-2 border-dashed border-gray-200 p-10 text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800">Access Restricted</h3>
          <p className="text-gray-500 mt-2">Financial dashboards are only available to administrators.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 h-full">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#0a0a0a] text-[#FFC107] shadow-lg">
            <Wallet className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0a0a0a]">
            Financial <span className="text-gray-400">Overview</span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Select value={mode} onValueChange={(value) => setMode(value as Mode)}>
              <SelectTrigger className="w-[160px] pl-9 bg-gray-50 border-transparent hover:border-gray-200 rounded-xl focus:ring-[#FFC107]/20 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
                <SelectItem value="year">Yearly</SelectItem>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="range">Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === "range" && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-auto px-3 py-2 bg-gray-50 rounded-xl text-sm border-none focus:ring-2 focus:ring-[#FFC107]/20 outline-none text-gray-700 h-10"
              />
              <span className="text-gray-300">-</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-auto px-3 py-2 bg-gray-50 rounded-xl text-sm border-none focus:ring-2 focus:ring-[#FFC107]/20 outline-none text-gray-700 h-10"
              />
              <Button
                onClick={fetchAmounts}
                disabled={loading}
                className="bg-[#0a0a0a] text-white h-10 w-10 p-0 rounded-xl hover:bg-[#FFC107] hover:text-black transition-colors shadow-lg"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-600 border border-red-100 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading && Object.keys(data).length === 0 ? (
          <div className="col-span-full flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[#0a0a0a]" />
          </div>
        ) : Object.keys(data).length > 0 ? (
          Object.entries(data).map(([serviceId, record]) => (
            <Card key={serviceId} className="group relative border-none shadow-xl rounded-[2.5rem] bg-[#0a0a0a] text-white p-0 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              {/* Header Decoration */}
              <div className="absolute top-0 w-full h-32 bg-gradient-to-b from-[#FFC107]/10 to-transparent"></div>

              <CardHeader className="relative z-10 pb-4 pt-8 px-8">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[#FFC107] text-[10px] font-black uppercase tracking-[0.25em] mb-2 opacity-80">Ref: {serviceId.substring(0, 8)}</p>
                    <CardTitle className="text-xl font-bold text-white tracking-tight leading-snug">
                      {serviceId}
                    </CardTitle>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[#FFC107]">
                    <Wallet className="w-5 h-5" />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="relative z-10 px-8 pb-8 space-y-3">
                {Object.entries(record)
                  .filter(([_, amount]) => amount !== undefined && amount > 0)
                  .map(([statusKey, amount]) => {
                    const config = statusConfig[statusKey as keyof typeof statusConfig] || statusConfig.pending;
                    const Icon = config.icon;
                    return (
                      <div
                        key={statusKey}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group/item ${config.color} border-opacity-20 bg-opacity-5 hover:bg-opacity-10`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full bg-current bg-opacity-20`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-bold uppercase tracking-wide opacity-90">{config.label}</span>
                        </div>
                        <div className="text-lg font-black tracking-tight">
                          <span className="text-[10px] align-top opacity-50 mr-0.5">₦</span>
                          {Number(amount).toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                {Object.entries(record).filter(([_, amount]) => amount === undefined || amount === 0).length > 0 && Object.keys(record).length > 0 && (
                  <p className="text-[10px] text-center text-gray-500 uppercase tracking-widest pt-2">No other transactions</p>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          !loading && (
            <div className="col-span-full py-20 text-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No financial records found.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default BookingAmounts;