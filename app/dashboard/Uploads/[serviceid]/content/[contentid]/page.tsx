'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Loader from '@/app/components/Loading';
import Image from 'next/image';
import { Clock2 } from 'lucide-react';

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

  useEffect(() => {
    if (!content_id) return;

    const url = `https://espoint.onrender.com/espoint/get_content/${content_id}`;
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
  if (error) return <div className="text-red-500 mt-20">{error}</div>;
  if (!content) return <div className="mt-20">No content found.</div>;

  const { store } = content;
  const itemQuantity = store.rental_items[1]?.quantity || 0;
  const totalPrice = itemQuantity * (store.base_price || 0);

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <div className="relative w-full h-[35vh] sm:h-[50vh] md:h-[60vh] lg:h-[70vh] mt-16">
        <Image
          src={
            store.branding.logo_url.length > 0
              ? store.branding.logo_url[0]
              : '/camera-431119_1280.jpg'
          }
          alt={store.name}
          fill
          className="object-cover rounded-xl"
          priority
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 rounded-xl"></div>
        <div className="absolute bottom-6 left-4 sm:left-6 text-white">
          <span className="px-2 py-1 sm:px-3 sm:py-1 bg-black text-white text-xs sm:text-sm rounded-full shadow">
            {store.category}
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mt-3">
            {store.name}
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Description */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-black">Description</h2>
          <p className="mt-2 text-gray-700 text-sm sm:text-base leading-relaxed">
            {store.description}
          </p>
        </section>

        {/* Rental Items */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-black">Rental Items</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-gray-700 text-sm sm:text-base">
            <p>
              <span className="font-semibold">Item:</span>{' '}
              {store.rental_items[1].item}
            </p>
            <p>
              <span className="font-semibold">Quantity:</span>{' '}
              {store.rental_items[1].quantity}
            </p>
            <p>
              <span className="font-semibold">Duration:</span>{' '}
              {store.rental_items[1].duration_hours} hrs
            </p>
          </div>
        </section>

        {/* Check-in Details */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-black">Check-in Details</h2>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:gap-10 text-gray-700 text-sm sm:text-base">
            <div>
              <p className="font-medium">Start</p>
              <div className="flex items-center gap-2">
                <Clock2 className="text-black w-4 h-4 sm:w-5 sm:h-5" />
                <span>{store.service_hours.start} AM</span>
              </div>
            </div>
            <div>
              <p className="font-medium">End</p>
              <div className="flex items-center gap-2">
                <Clock2 className="text-black w-4 h-4 sm:w-5 sm:h-5" />
                <span>{store.service_hours.end} PM</span>
              </div>
            </div>
          </div>
        </section>

        {/* Price Summary (only Base + Total) */}
        <section className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-md">
          <h2 className="text-lg sm:text-xl font-bold text-black mb-4">Price Summary</h2>
          <div className="flex justify-between text-gray-700 text-sm sm:text-base">
            <span>Base Price</span>
            <span>₦{store.base_price}</span>
          </div>
          <hr className="my-3 border-gray-300" />
          <div className="flex justify-between font-bold text-black text-base sm:text-lg">
            <span>Total</span>
            <span>₦{totalPrice}</span>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ContentDetails;
