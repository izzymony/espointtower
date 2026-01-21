'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Loader from '@/app/components/Loading';
import Image from 'next/image';
import { Clock2, Tag, Info, Box, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ServiceStore {
  branding: { logo_url: string[] };
  name: string;
  status: string;
  description: string;
  base_price: number;
  category: string;
  eligible_roles: string;
  duration_minutes: string;
  rental_items: {
    1: { item: string; quantity: number; duration_hours: number };
  };
  discount_percent: number;
  service_hours: { start: string; end: string };
}

interface ServiceContent {
  content_id: string;
  service: string;
  service_unit: string;
  store: ServiceStore;
}

const ContentDetails = () => {
  const params = useParams();
  const content_id = params?.contentid as string;

  const [content, setContent] = useState<ServiceContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!content_id) return;

    const url = `https://espoint-5shr.onrender.com/espoint/get_content/${content_id}`;
    setLoading(true);
    setError('');

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch content details');
        return res.json();
      })
      .then((data) => {
        if (data.msg) setContent(data.msg);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [content_id]);

  if (loading)
    return (
      <div className="flex h-screen justify-center items-center">
        <Loader />
      </div>
    );
  if (error) return <div className="text-red-500 mt-20 text-center">{error}</div>;
  if (!content) return <div className="mt-20 text-center text-muted-foreground">No content found.</div>;

  const { store } = content;
  const itemQuantity = store.rental_items?.[1]?.quantity || 0;

  const images = store.branding?.logo_url?.length > 0 ? store.branding.logo_url : ['/camera-431119_1280.jpg'];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="space-y-8 pt-6">
      {/* HERO HEADER - Infused Design */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0a0a0a] px-8 py-12 shadow-2xl">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl"></div>

        <div className="relative z-10 space-y-2">
          <Badge variant="outline" className="text-primary border-primary/20 mb-2">{store.category || 'Service'}</Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            {store.name}
          </h1>
          <p className="text-gray-400 max-w-lg text-lg line-clamp-2">
            {store.description}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Image & Main Info */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white ring-1 ring-border/10">
            <div className="relative w-full h-[400px] group">
              <Image
                src={images[currentImageIndex]}
                alt={`${store.name} - Image ${currentImageIndex + 1}`}
                fill
                className="object-cover transition-all duration-500"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

              {/* Navigation Arrows (Only show if multiple images) */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-3 rounded-full backdrop-blur-sm transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 z-10"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-3 rounded-full backdrop-blur-sm transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 z-10"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  {/* Pagination Dots */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
                    {images.map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-2 rounded-full transition-all shadow-sm ${idx === currentImageIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-2 text-xl font-bold text-gray-900">
                <Info className="w-6 h-6 text-primary" />
                Description
              </div>
              <p className="text-gray-600 leading-relaxed text-lg">
                {store.description}
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-lg rounded-3xl bg-white p-6 ring-1 ring-border/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <Clock2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold">Service Hours</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-500 font-medium">Start Time</span>
                  <span className="font-bold text-gray-900">{store.service_hours?.start || '09:00'} AM</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-500 font-medium">End Time</span>
                  <span className="font-bold text-gray-900">{store.service_hours?.end || '05:00'} PM</span>
                </div>
              </div>
            </Card>

            <Card className="border-none shadow-lg rounded-3xl bg-white p-6 ring-1 ring-border/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <Box className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold">Rental Item</h3>
              </div>
              {store.rental_items && store.rental_items[1] ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Item Name</span>
                    <span className="font-bold">{store.rental_items[1].item}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Quantity</span>
                    <span className="font-bold">{store.rental_items[1].quantity}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Duration</span>
                    <span className="font-bold">{store.rental_items[1].duration_hours} hrs</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 italic">No rental items configured.</p>
              )}
            </Card>
          </div>
        </div>

        {/* Right Column: Pricing & Status */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl rounded-3xl bg-[#0a0a0a] text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full"></div>
            <CardContent className="p-8 space-y-6 relative z-10">
              <h3 className="text-2xl font-bold">Pricing Summary</h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-gray-400">
                  <span>Base Price</span>
                  <span>SL{store.base_price?.toLocaleString()}</span>
                </div>
                {itemQuantity > 0 && (
                  <div className="flex justify-between items-center text-gray-400">
                    <span>Quantity x{itemQuantity}</span>
                    <span>(Included)</span>
                  </div>
                )}
              </div>


            </CardContent>
          </Card>

          <Card className="border-none shadow-lg rounded-3xl bg-white p-6 ring-1 ring-border/10">
            <h3 className="text-lg font-bold mb-4">Technical Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Category</span>
                <Badge variant="secondary" className="bg-gray-100 text-gray-700">{store.category}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Eligible Roles</span>
                <span className="font-medium text-right max-w-[150px]">{store.eligible_roles}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Duration</span>
                <span className="font-medium">{store.duration_minutes} mins</span>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default ContentDetails;
