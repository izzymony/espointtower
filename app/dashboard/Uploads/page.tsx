"use client"

import React, { useEffect, useState } from "react";
import { ArrowRight, RefreshCw } from "lucide-react";
import Loader from "@/app/components/Loading";
import {useRouter} from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

interface Service {
service_id: string;
service_name: string;
status:string;       
images: string[];       
}

const ServicePage = () => {

  const [error, setError] =  useState('')
  const[services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false)
  const router = useRouter();
  useEffect(() => {
    setLoading(true);
    setError("");
    fetch("https://espoint.onrender.com/espoint/get_all_pub_service")
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
    <div className="bg-white   ">
      

              <h1 className="text-4xl font-bold mb-4  text-center">Empowering your needs with our services</h1>      

              <p className="text-black font-sm mb-4 text-center text-[18px]">Discover unique accommodations and experience tailored to your perfect getaway</p>
              {loading ? (
                <Loader />
              ) : error ? (
                <p className="text-red-500">{error}</p>
              ) : (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {services.length > 0 ? (
                    services.map((service) => (
                      <div key={service.service_id} className="bg-white pb-5 border  p-3 pb-3 border-gray-200 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1">
                            {(Array.isArray(service.images) && service.images.length > 0 ? service.images : ['/placeholder-image.png']).map((img, idx) => (
                             <Image key={idx} src={img} alt={service.service_name} width={400} height={200} className="w-full h-48 object-cover rounded-md"/>      
                            ))}
                            <div className="">
                        <div className="flex justify-between items-center px-2">

                          <span className="font-semibold text-lg text-gray-800">{service.service_name}</span>
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${service.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>{service.status}</span>
                        </div>
                        <div   className="text-xs text-gray-500 break-all">ID: {service.service_id}</div>
                        <div  onClick={() => router.push(`/dashboard/Uploads/${service.service_id}/content`)} className="flex float-right items-center text-primary group-hover:translate-x-1 transition-transform">
                           <span className="text-sm font-medium mr-1">Explore</span>
                        <ArrowRight className="w-4 h-4" />  
                        </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>No services found.</p>
                  )}
                </div>
              )}
    </div>
  )
}

export default ServicePage
