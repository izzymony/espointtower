"use client"

import React, { useEffect, useState } from "react";
import { ArrowRight, RefreshCw } from "lucide-react";
import Loader from "@/app/components/Loading";
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

interface Service {
  service_id: string;
  service_name: string;
  status: string;
  images: string[];
}

export default function ServicePage() {

  const [error, setError] = useState('')
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false)
  const router = useRouter();
  useEffect(() => {
    setLoading(true);
    setError("");
    fetch("https://espoint-5shr.onrender.com/espoint/get_all_pub_service")
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        if (data && Array.isArray(data.msg)) {
          setServices(data.msg);
        } else {
          setServices([]);
        }
      })
      .catch((err) => setError(err.message || "Error fetching services"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 pt-6">

      {/* HERO HEADER - Infused Design */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0a0a0a] px-8 py-12 shadow-2xl">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl"></div>

        <div className="relative z-10 space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            Uploaded <span className="text-primary">Content</span>
          </h1>
          <p className="text-gray-400 max-w-lg text-lg">
            Browse and manage your uploaded service multimedia content.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader />
        </div>
      ) : error ? (
        <p className="text-red-500 text-center py-10">{error}</p>
      ) : (
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {services.length > 0 ? (
            services.map((service) => (
              <div
                key={service.service_id}
                className="group relative bg-white rounded-[2.5rem] p-6 md:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col justify-between min-h-[320px] h-full ring-1 ring-border/10 overflow-hidden"
              >
                {/* Decorative background element for texture */}
                <div className="absolute top-[-50%] right-[-50%] w-full h-full bg-gradient-to-br from-gray-50/50 to-transparent rounded-full blur-3xl pointer-events-none"></div>

                {/* Top Section */}
                <div className="relative z-10 flex-1">
                  <div className="flex justify-between items-start mb-4 md:mb-6">
                    {/* Placeholder for Icon or just spacing */}
                    <div className="w-10 h-10 md:w-12 md:h-12"></div>

                    {/* Active Status Pill - Reference Style */}
                    <span className={`px-4 py-1.5 md:px-5 md:py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest shadow-sm ${service.status === 'approved' || service.status === 'active'
                      ? 'bg-[#FFC107] text-[#0a1120]'
                      : 'bg-gray-200 text-gray-500'
                      }`}>
                      {service.status || 'INACTIVE'}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-3xl md:text-4xl font-extrabold text-[#0a1120] tracking-tight mb-2 md:mb-4 capitalize leading-tight">
                    {service.service_name}
                  </h2>

                  {/* Description (Generated since not in API) */}
                  <p className="text-gray-400 text-base md:text-lg leading-relaxed font-medium max-w-[95%]">
                    Professional <span className="text-[#0a1120] font-semibold italic">{service.service_name.toLowerCase()}</span> solutions engineered for maximum performance.
                  </p>
                </div>

                {/* Bottom Section */}
                <div className="relative z-10 flex justify-between items-end mt-4">
                  {/* Domain Label */}
                  <div>
                    <p className="text-gray-300 font-bold text-[8px] md:text-[10px] uppercase tracking-[0.25em] mb-1">
                      DOMAIN
                    </p>
                    <p className="text-[#FFC107] font-black text-xs md:text-sm uppercase tracking-wider">
                      ELITE SUITE
                    </p>
                  </div>

                  {/* Action Button - Dark Squircle Arrow */}
                  <button
                    onClick={() => router.push(`/dashboard/Uploads/${service.service_id}/content`)}
                    className="bg-[#0a1120] hover:bg-primary text-white hover:text-[#0a1120] w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg group-hover:scale-110 shrink-0"
                  >
                    <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="col-span-full text-center py-12 text-muted-foreground">No uploaded content found.</p>
          )}
        </div>
      )}
    </div>
  )
}
