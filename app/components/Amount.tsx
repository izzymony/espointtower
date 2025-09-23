"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Calendar,  Users, AlertCircle, DollarSign } from "lucide-react";

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

// Status config for colors and icons
const statusConfig = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: AlertCircle },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-800 border-blue-200", icon: Users },
  paid: { label: "Paid", color: "bg-green-100 text-green-800 border-green-200", icon: DollarSign },
  completed: { label: "Completed", color: "bg-green-100 text-green-800 border-green-200", icon: Calendar },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800 border-red-200", icon: AlertCircle },
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
      const storedUser  = JSON.parse(localStorage.getItem("user") || "{}");
      if (!storedUser ?.username) {
        setError("No user found. Please log in.");
        setIsAdmin(false);
        return;
      }

      // Check admin role
      if (storedUser ?.role !== "admin") {
        setIsAdmin(false);
        setData({});
        return;
      }
      setIsAdmin(true);

      const username = storedUser .username;
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
    // Initial fetch on mount
    fetchAmounts();
  }, []);

  if (!isAdmin && !loading) {
    return (
      <div className="max-w-4xl mx-auto py-10 ">
        <Card className="shadow-2xl rounded-3xl bg-white">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2 mx-auto">
              <AlertCircle className="w-8 h-8 text-red-500" />
              Access Restricted
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-gray-600 mb-4">This feature is only available to administrators.</p>
            <Button variant="outline" className="rounded-xl">
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-10 ">
      <Card className="shadow-2xl rounded-3xl bg-white">
        <CardHeader className="pb-6">
          <CardTitle className="text-3xl font-bold text-black flex items-center gap-2">
          <DollarSign  className="w-8 h-8 text-black hidden" /> 
           ₦
            Booking Amounts Dashboard
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Controls */}
          <div className="space-y-4">
  <div className="flex flex-wrap items-center justify-between gap-4 max-w-full">
    {/* Left: Controls */}
    <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 min-w-0">
      <Select value={mode} onValueChange={(value) => setMode(value as Mode)}>
        <SelectTrigger className="w-full sm:w-[180px] rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="week">Weekly</SelectItem>
          <SelectItem value="month">Monthly</SelectItem>
          <SelectItem value="year">Yearly</SelectItem>
          <SelectItem value="day">Daily</SelectItem>
          <SelectItem value="range">Custom Range</SelectItem>
        </SelectContent>
      </Select>

      {mode === "range" && (
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-xl border-gray-300"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-xl border-gray-300"
          />
        </div>
      )}
    </div>

    {/* Right: Button */}
    
  </div>
<Button
      onClick={fetchAmounts}
      disabled={loading || (mode === "range" && (!startDate || !endDate))}
      className="flex-shrink-0 bg-black text-white rounded-xl hover:bg-gray-800 px-4 sm:px-6 py-2 flex items-center gap-2 whitespace-nowrap"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Fetching...
        </>
      ) : (
        <>
          <Calendar className="w-4 h-4" />
          Fetch Data
        </>
      )}
    </Button>
  {error && (
    <Alert variant="destructive" className="rounded-xl">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  )}
</div>
          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-black" />
            </div>
          )}

          {/* No Data State */}
          {!loading && Object.keys(data).length === 0 && !error && (
            <Alert className="rounded-xl">
              <AlertDescription>No booking records found for the selected period.</AlertDescription>
            </Alert>
          )}

          {/* Results Grid */}
          {!loading && Object.keys(data).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(data).map(([serviceId, record]) => (
                <Card key={serviceId} className="shadow-lg rounded-xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b pb-3">
                    <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    ₦
                      Service: {serviceId}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-6 space-y-3">
                    {Object.entries(record)
                      .filter(([_, amount]) => amount !== undefined && amount > 0) // Only show non-zero amounts
                      .map(([statusKey, amount]) => {
                        const config = statusConfig[statusKey as keyof typeof statusConfig];
                        const Icon = config?.icon;
                        return (
                          <div
                            key={statusKey}
                            className={`flex items-center justify-between p-3 rounded-lg border ${config?.color || "bg-gray-50 border-gray-200"} hover:shadow-md transition-shadow`}
                          >
                            <div className="flex items-center gap-3">
                              {Icon && <Icon className="w-4 h-4" />}
                              <div>
                                <p className="text-sm font-medium capitalize">{config?.label || statusKey}</p>
                                <p className="text-xs text-gray-500">{statusKey}</p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-lg font-semibold">
                              ₦{Number(amount).toLocaleString()}
                            </Badge>
                          </div>
                        );
                      })}
                    {Object.entries(record).filter(([_, amount]) => amount === undefined || amount === 0).length > 0 && (
                      <p className="text-sm text-gray-500 text-center py-2">No other amounts recorded</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingAmounts;