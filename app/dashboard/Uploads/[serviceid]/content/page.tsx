'use client';

import React, { useEffect, useState } from 'react';
import Loader from '@/app/components/Loading';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Heart, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface ServiceStore {
  branding: {
    logo_url: string[];
  };
  name: string;
  status: string;
  description: string;
  base_price: number;
  category: string;
}

interface ServiceContent {
  content_id: string;
  store: ServiceStore;
}

const ContentCard = ({ content, service_id }: { content: ServiceContent; service_id: string }) => {
  const { store } = content;
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = store.branding.logo_url.length > 0 ? store.branding.logo_url : ['/camera-431119_1280.jpg'];

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div
      className="group relative bg-white rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 p-5 flex flex-col gap-6 ring-1 ring-border/10"
    >
      {/* Image Section */}
      <div className="relative w-full h-[320px] rounded-[2rem] overflow-hidden bg-gray-100 shadow-inner group-hover:shadow-md transition-shadow">
        <Image
          src={images[currentImageIndex]}
          alt={`${store.name} - Image ${currentImageIndex + 1}`}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          priority
        />

        {/* Navigation Arrows (Only show if multiple images) */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            {/* Pagination Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Category Badge overlay */}
        <div className="absolute top-4 left-4">
          <span className="px-4 py-2 bg-[#FFC107] text-black text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">
            {store.category}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-col gap-1 px-2">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-extrabold text-[#0a0a0a] leading-tight tracking-tight">
              {store.name.toLowerCase()}
            </h2>
            <p className="text-[#adb5bd] font-bold text-xs uppercase tracking-[0.15em] mt-1">
              PREMIUM OFFERING
            </p>
          </div>
          {/* Active Status Pill */}
          <div className="px-4 py-1 rounded-full border border-[#FFC107] bg-[#FFC107]/10 text-[#d4a007] text-[10px] font-bold uppercase tracking-widest">
            {store.status}
          </div>
        </div>

        {/* Description snippet */}
        <div className="mt-4 mb-2">
          <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">
            {store.description}
          </p>
        </div>

        <div className="h-px bg-gray-100 my-2"></div>

        {/* Footer / Price / Action */}
        <div className="flex justify-between items-end mt-2">
          <div className="flex flex-col">
            <span className="text-[#adb5bd] font-bold text-[10px] uppercase tracking-[0.2em] mb-1">
              ACQUISITION TIER
            </span>
            <span className="text-3xl font-black text-[#0a0a0a] tracking-tight">
              &#8358; {store.base_price.toLocaleString()}
            </span>
          </div>

          <button
            onClick={() => router.push(`/dashboard/Uploads/${service_id}/content/${content.content_id}`)}
            className="flex items-center gap-2 bg-[#0a1120] text-white py-3 px-6 rounded-full font-bold text-sm tracking-widest uppercase hover:bg-primary hover:text-black transition-colors duration-300 shadow-lg group-hover:shadow-primary/25"
          >
            ENTER <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ContentService() {
  const params = useParams();
  const service_id = params?.serviceid as string;
  const [error, setError] = useState('');
  const [serviceContent, setServiceContent] = useState<ServiceContent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!service_id) return;

    const url = `https://espoint-5shr.onrender.com/espoint/get_all_content_based_service_and_status/${service_id}/approved`;
    console.log("Fetching URL:", url);

    setLoading(true);
    setError('');

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data.msg)) {
          setServiceContent(data.msg);
        } else if (data.msg) {
          setServiceContent([data.msg]); // wrap single object
        } else {
          setServiceContent([]);
        }
      })
      .catch((err) => setError(err.message || 'Error fetching service content'))
      .finally(() => setLoading(false));
  }, [service_id]);

  if (loading) return <div className="min-h-screen flex justify-center items-center"><Loader /></div>;
  if (error) return <div className="text-red-500 mt-20 text-center">{error}</div>;
  if (serviceContent.length === 0)
    return <div className="mt-20 text-center text-muted-foreground">No content found for this service.</div>;

  return (
    <div className="space-y-10 pt-6 pb-20">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Explore <span className="text-primary">Content</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Discover premium offerings available for booking.
          </p>
        </div>
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {serviceContent.map((content) => (
          <ContentCard key={content.content_id} content={content} service_id={service_id} />
        ))}
      </div>
    </div>
  );
}
