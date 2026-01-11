import React, { useEffect, useState } from "react";
import { Briefcase, Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ServiceCount {
  active: number;
}

const ServicesCount = () => {
  const [user, setUser] = useState<{ username: string; role?: string } | null>(
    null
  );
  const [serviceCount, setServiceCount] = useState<ServiceCount | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

    if (!storedUser?.username) {
      setError("No user found ");
      return;
    }
    setUser(storedUser);

    // 🚨 only fetch if admin
    if (storedUser.role === "admin") {
      const username = storedUser.username;
      const url = `https://espoint-5shr.onrender.com/espoint/get_all_service_count/${username}`;

      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error("failed to fetch");
          return res.json();
        })
        .then((data) => {
          if (data.msg) {
            setServiceCount(data.msg); // msg = { active: 2 }
          }
        })
        .catch((err) => setError(err.message));
    }
  }, []);

  if (error) return <div className="text-red-500 mt-20">{error}</div>;

  return (
    <div className="h-full">
      <Card className="group relative border-none shadow-xl rounded-[2.5rem] bg-[#0a0a0a] text-white overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col justify-between">
        {/* Abstract Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FFC107]/20 to-transparent rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:scale-125"></div>

        <CardHeader className="relative z-10 pb-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[#FFC107] text-[10px] font-black uppercase tracking-[0.25em] mb-1">STATUS</p>
              <CardTitle className="text-xl font-bold text-white tracking-tight">
                Active Services
              </CardTitle>
            </div>
            <div className="p-3 rounded-full bg-white/5 border border-white/10 text-[#FFC107] group-hover:bg-[#FFC107] group-hover:text-[#0a0a0a] transition-all duration-300">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10">
          <div className="flex items-end gap-3 mt-4">
            <span className="text-6xl font-black text-white tracking-tighter leading-none group-hover:text-[#FFC107] transition-colors duration-300">
              {/* 🔒 If user is not admin, show "-" */}
              {user?.role === "admin" ? serviceCount?.active ?? 0 : "-"}
            </span>
            <span className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#FFC107]" /> Live
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServicesCount;
