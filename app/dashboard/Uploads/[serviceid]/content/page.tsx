'use client';

import React, { useEffect, useState } from 'react';
import Loader from '@/app/components/Loading';

import { useParams , useRouter} from 'next/navigation';
import Image from 'next/image';
import { Heart } from 'lucide-react';

interface ServiceStore {
  branding: {
    logo_url: ['/camera-431119_1280.jpg'];
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

const ContentService = () => {
  const params = useParams();
  const service_id = params?.serviceid as string;
  const router = useRouter()
  const [error, setError] = useState('');
  const [serviceContent, setServiceContent] = useState<ServiceContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (!service_id) return;

    const url = `https://espoint.onrender.com/espoint/get_all_content_based_service_and_status/${service_id}/approved`;
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

  if (loading) return <div className="mt-20 flex h-[100vh] justify-center  items-center"><Loader /></div>;
  if (error) return <div className="text-red-500 mt-20">{error}</div>;
  if (serviceContent.length === 0)
    return <div className="mt-20">No content found for this service.</div>;

  return (
    <div className="bg-white">
     
      <div className="">
        <h1 className="text-black font-bold text-4xl mb-6">
          Explore service contents
        </h1>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {serviceContent.map((content) => {
            const { store } = content;
            return (
              <div
                key={content.content_id}
                className="bg-white h-fit pb-6 border border-gray-200 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 flex flex-col overflow-hidden"
              >
                <div className="relative w-full">
                  {store.branding.logo_url.length > 0 ? (
                    <Image
                      src={store.branding.logo_url[0]}
                      alt={store.name}
                      width={1200}
                      height={600}
                      className="w-full h-[220px] sm:h-[260px] md:h-[320px] lg:h-[380px] object-cover"
                      priority
                    />
                  ) : (
                    <Image
                      src={'/camera-431119_1280.jpg'}
                      alt={store.name}
                      width={1200}
                      height={600}
                      className="w-full h-[220px] sm:h-[260px] md:h-[320px] lg:h-[380px] object-cover"
                      priority
                    />
                  )}
                  {/* Overlay category and heart button */}
                  <div className="absolute top-4 left-0 w-full flex justify-between items-center px-6 z-10">
                    <div className="text-center py-1 px-4 rounded-full bg-primary text-primary-foreground capitalize shadow-lg">
                      {store.category}
                    </div>
                    <button
                      className="p-2 bg-white/90 hover:bg-white rounded-full transition-colors shadow-lg"
                      onClick={(e) => e.preventDefault()}
                    >
                     
                    </button>
                  </div>
                </div>
                <div className="px-6 py-6 flex flex-col gap-4 flex-1">
                  <div className="flex justify-between items-center">
                    <h1 className="font-semibold text-xl md:text-2xl lg:text-3xl">{store.name}</h1>
                    <span className={` ${store.status === 'active' ? 'text-green-600' : 'text-gray-600'} font-medium`}>{store.status}</span>
                  </div>
                  
<div className="py-2 font-sx text-[16px] text-base ">
  {store.description.length > 120
    ? store.description.slice(0, 120) + '...'
    : store.description}
</div>

                  <div className="flex justify-between items-center mt-auto">
                    <span className="font-bold text-black text-lg md:text-xl lg:text-2xl">&#8358; {store.base_price}</span>
                    <button
                      onClick={() => router.push(`/dashboard/Uploads/${service_id}/content/${content.content_id}`)}
                      className="bg-black text-white hover:bg-[#b85c0f] py-2 px-5 rounded-lg transition-colors duration-300 font-semibold shadow-md"
                    >
                      Book Now
                    </button>
                  </div>
                </div>

                {/* Logo */}
                
              {/*   {store.branding.logo_url.length > 0  ? (
                  <div className="relative">
                    
                    <Image
                      src={store.branding.logo_url[0]}
                      alt={store.name}
                      width={100}
                      height={100}
                      className=" h-full bg-gray-400 object-cover"
                    />
                  </div>
                ) : (
                   <div className="relative h-[200px] bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
    📷
  </div>
                )}

               
                <div className='px-4 '>
                <div className="flex justify-between items-center mb-2 ">
                  <h2 className="text-lg font-bold text-gray-800">{store.name}</h2>
                  <span
                    className={` absolute rounded-full p-1 px-3 text-[14px] text-white font-medium ${
                      store.status === 'active'
                        ? 'bg-[#d4731e] text-green-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {store.status}
                  </span>
                </div>
                

                
                
                <p className="text-gray-700 text-sm">{store.description}</p>
              </div> */}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default ContentService;
