'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Loader from '@/app/components/Loading';

import Image from 'next/image';
import { Heart, ArrowLeft, Package, Clock2, Calendar1} from 'lucide-react';
interface ServiceStore {
  branding: {
    logo_url: string[];
  };
  name: string;
  status: string;
  description: string;
  base_price: number;
  category: string;
  eligible_roles: string;
  duration_minutes: string;
  rental_items:{
    1:{
      item: string;
      quantity:number;
      duration_hours:number;
    }
  }

  discount_percent: number;
  service_hours:{
    start: string;
    end:string
  }
  
}

interface ServiceContent {
  content_id: string;
  service: string;
  service_unit: string;
  store: ServiceStore;
}

interface FormData{
  client_name: string;
  client_email: string;
  client_phone: string;
  service_date: string;
  service_time: string;
  notes: string;
  preferred_staff_id: string;
  status: string;
  username?: string;
}


const ContentDetails = () => {
  const [showModal, setShowModal] = useState(false);
  const params = useParams();
  const content_id = params?.contentid as string;

  const [content, setContent] = useState<ServiceContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter()

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    client_name: '',
  client_email: '',
  client_phone: '',
  service_date: '',
  service_time: '',
  notes: '',
  preferred_staff_id: '',
  status: 'pending', 
  })


  useEffect(() => {
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  if (storedUser?.username) {
    setFormData((prev) => ({
      ...prev,
      username: storedUser.username,
    }));
  }
}, []);


  
  useEffect(() => {
    if (!content_id) return;

    const url = `https://espoint.onrender.com/espoint/get_content/${content_id}`;
    console.log("Fetching Content URL:", url);

    setLoading(true);
    setError('');

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch content details');
        return res.json();
      })
      .then((data) => {
        if (data.msg) {
          setContent(data.msg);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [content_id]);


const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  const { name, value } = e.target;
setFormData((prev) => ({...prev, [name]: value}))
}

   /* const handleSubmitBooking = async (e) => {
  e.preventDefault();
  setBookingLoading(true);
  setBookingSuccess('');
  setBookingError('');
  try {
    const payload = {
      service_id: content?.service || '',
      booking_id: '',
      username: '',
      from: 'internal/external',
      data: {
        ...formData,
        amount: totalPrice,
        currency: 'NGN',
        status: 'pending',
        service_package_id: content?.content_id || '',
      },
    };
    const res = await fetch('https://espoint.onrender.com/espoint/create_booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setBookingSuccess('Booking successful!');
    } else {
      setBookingError(data.message || 'Booking failed.');
    }
  } catch (err) {
    setBookingError('Booking failed.');
  } finally {
    setBookingLoading(false);
  }
};
 */

const handleSubmitBooking = async (e: React.FormEvent<HTMLFormElement | HTMLSelectElement>) => {
  e.preventDefault();
  setBookingLoading(true);
  setBookingSuccess('');
  setBookingError('');

  try {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

    if(!storedUser || !storedUser.username){
      setBookingError('You must be logged in to make a booking')
      return;
    }

    const payload = {
      service: content?.service || "",
      service_unit: content?.service_unit || "",
      username:formData.username,
      from: "internal", // you can set "external" if needed
      data: {
        client_email: formData.client_email,
        preferred_staff_id: formData.preferred_staff_id,
        notes: formData.notes,
        service_time: formData.service_time,
        amount: String(totalPrice), // backend expects string
        currency: "NGN",
        service_date: formData.service_date,
        client_phone: formData.client_phone,
        client_name: formData.client_name,
        status: "pending", // default status
        completed_date: "", // leave empty
        booking_code: "",   // leave empty, backend may generate this
      },
    };

    console.log("Submitting booking payload:", payload);

    const res = await fetch("https://espoint.onrender.com/espoint/create_booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    // Log the response for debugging
    console.log("Booking response:", data);
    // Extract booking_id from data.msg (e.g., {msg: "Booking ID <id>"})
    let bookingId = "";
    if (data.msg && typeof data.msg === "string" && data.msg.startsWith("Booking ID ")) {
      bookingId = data.msg.replace("Booking ID ", "");
    }
    if (res.ok && bookingId) {
      setBookingSuccess("Booking successful!");
      router.push(`/booked_contents`);
      setShowModal(false);
    } else {
      setBookingError(data.message || "Booking failed.");
    }
  } catch (err) {
    console.error("Booking failed:", err);
    setBookingError("Booking failed.");
  } finally {
    setBookingLoading(false);
  }
};

  if (loading) return <div className="mt-20 flex h-[100vh] justify-center items-center"><Loader /></div>;
  if (error) return <div className="text-red-500 mt-20">{error}</div>;
  if (!content) return <div className="mt-20">No content found.</div>;

  const { store } = content;
  // Calculate total price and total items
  const itemQuantity = store.rental_items[1]?.quantity || 0;
  const itemPrice = store.base_price || 0;
  const totalPrice = itemQuantity * itemPrice;

  return (
    <div className="bg-white h-[100vh]">
     
      <div className=" ">
        <main>
          <div className="relative w-full">
            {store.branding.logo_url.length > 0 ? (
              <Image
                src={store.branding.logo_url[0]}
                alt={store.name}
                width={1200}
                height={600}
                className="w-full h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[70vh] object-cover rounded-xl"
                priority
              />
            ) : (
              <Image
                src={'/camera-431119_1280.jpg'}
                alt={store.name}
                width={1200}
                height={600}
                className="w-full h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[70vh] object-cover rounded-xl"
                priority
              />
            )}
            <div className="absolute top-4 left-0 w-full flex justify-between items-center px-6 z-10">
                                <div className="text-center py-1 px-4 rounded-full bg-primary text-primary-foreground capitalize shadow-lg">
                                  {store.category}
                                </div>
                                <button
                                  className="p-2 bg-white/90 hover:bg-white rounded-full transition-colors shadow-lg"
                                  onClick={(e) => e.preventDefault()}
                                >
                                  <Heart className="w-6 h-6 text-muted-foreground hover:text-red-500 transition-colors" />
                                </button>
                              </div>
          </div>

          <div className='py-8'>
            <div className=''>
            <h1 className='font-bold text-3xl text-black py-5 '>{store.name}</h1>
            </div>
            <hr className='mt-6' />
            <h1 className='text-black text-xl font-bold mt-4'> Description</h1>
            <p className='font-xs  text-[18px] mt-2'>{store.description}</p>


            <hr className='mt-6'/>
            <h1 className='text-black text-xl font-bold mt-4'> Rental items</h1>
            <div className='grid gap-5 mt-6'>
            <div className='flex items-center gap-2 '>
              <p className='text-black font-bold text-[18px]'>Items</p>:
              <p className='font-xs text-black'>{store.rental_items[1].item}</p>
              
            </div>
            <div className='flex items-center gap-2'>
             <p className='text-black font-bold text-[18px]'>Quantity</p>:
              <p className='font-xs text-black'>{store.rental_items[1].quantity}</p>

            </div>
            <div className='flex items-center gap-2 '>
               <p className='text-text-black font-bold text-[18px]'>Duration hours</p>:
              <p className='font-xs text-black'>{store.rental_items[1].duration_hours}hr</p>

            </div>
            </div>
            <hr className='mt-6' />
            <h1 className='text-black text-xl font-bold mt-4'> Check-in details</h1>
            <div className='grid gap-1  mt-4'>
               <p className='font-medium text-[17px]'>Start</p>
              <div className='flex gap-2 mt-1'>
                <Clock2 className='text-black  ' />
               
                 <p className='font-xs text-black'>{store.service_hours.start}AM</p>
                 
              </div>
            </div>
            <div className='grid gap-1  mt-4'>
               <p className='font-medium text-[17px]'>End</p>
              <div className='flex gap-2 mt-1'>
                <Clock2 className='text-black  ' />
               
                 <p className='font-xs text-black'>{store.service_hours.end}PM</p>
                 
              </div>
            </div>

            <div className='bg-white pb-6 p-4 border mt-10 border-gray-200 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 flex flex-col overflow-hidden'>
              <p className='font-bold text-2xl text-black'>
                &#8358; {store.base_price} <span className='text-base text-gray-500 font-normal'>(per item)</span>
              </p>
              <div className='flex flex-col gap-2 py-3'>
                <p className='text-lg text-black font-semibold'>Total Items: <span className='text-black'>{itemQuantity}</span></p>
                <p className='text-lg text-black font-semibold'>Total Price: <span className='text-black'>&#8358; {totalPrice}</span></p>
              </div>
              <div className=' flex gap-3 py-7'>
                <div className='border w-full border-gray-300 rounded-lg mt-4 p-4'>
                  <p className='text-black text-[17px]'>START</p>
                  <div className='flex gap-2'>
                    <Calendar1 className='text-black w-4 mt-2' />
                    <p className='font-medium mt-2 text-black'>Add date</p>
                  </div>
                </div>
                <div className='border w-full border-gray-300 rounded-lg mt-4 p-4'>
                  <p className='text-black text-[17px]'>START</p>
                  <div className='flex gap-2'>
                    <Calendar1 className='text-black w-4 mt-2' />
                    <p className='font-medium mt-2 text-black'>Add date</p>
                  </div>
                </div>
              </div>
              <button className='text-white font-bold rounded-lg bg-black p-2 w-full'>Reserve</button>

              <hr className='border border-gray-200 mt-8'/>
              <div className='py-6'>
                <table className='w-full text-left text-gray-800 text-[15px] border border-gray-200 rounded-lg mt-2'>
                  <thead>
                    <tr className='text-[14px]'>
                      <th className='py-2 px-3'>Item</th>
                      <th className='py-2 px-3'>Unit Price</th>
                      <th className='py-2 px-3'>Quantity</th>
                      <th className='py-2 px-3'>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className='py-2 px-3'>{store.rental_items[1].item}</td>
                      <td className='py-2 px-3'>&#8358; {store.base_price}</td>
                      <td className='py-2 px-3'>{store.rental_items[1].quantity}</td>
                      <td className='py-2 px-3 font-bold text-black'>&#8358; {store.base_price * store.rental_items[1].quantity}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className='flex justify-center'>
              <button
  className='text-white font-bold rounded-lg bg-black p-2 w-[200px] text-white disabled:opacity-60'
  
  disabled={bookingLoading}
  onClick={() => setShowModal(true)}
>
  {bookingLoading ? 'Booking...' : 'Book'}
</button>
      {/* Popup Modal */}
     {showModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-40">
    <div className="bg-white rounded-xl shadow-lg p-8 w-[500px] text-center relative">
      <button
        className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl font-bold"
        onClick={() => setShowModal(false)}
      >
        &times;
      </button>
      <h2 className="text-2xl font-bold mb-4">Complete Your Booking</h2>
      <form onSubmit={handleSubmitBooking} className="flex flex-col gap-4 text-left">
        <input name="client_name" value={formData.client_name} onChange={handleFormChange} className="border rounded px-3 py-2" placeholder="Full Name" required />
        <input name="client_email" value={formData.client_email} onChange={handleFormChange} className="border rounded px-3 py-2" placeholder="Email" required type="email" />
        <input name="client_phone" value={formData.client_phone} onChange={handleFormChange} className="border rounded px-3 py-2" placeholder="Phone" required />
        <input type='date' name="service_date" value={formData.service_date} onChange={handleFormChange} className="border rounded px-3 py-2" placeholder="Service Date (YYYY-MM-DD)" required />
        <input type='time' name="service_time" value={formData.service_time} onChange={handleFormChange} className="border rounded px-3 py-2" placeholder="Service Time (e.g. 10:00)" required />
        <input name="notes" value={formData.notes} onChange={handleFormChange} className="border rounded px-3 py-2" placeholder="Notes (optional)" />
        <input
  name="username"
  value={formData.username}
  onChange={handleFormChange}
  className="border rounded px-3 py-2"
  placeholder="Username"
  required
/>

        <select
  name="status"
  value={formData.status}
onChange={handleFormChange

}
  className="border rounded px-3 py-2"
>
  <option value="pending">Pending</option>
  <option value="confirmed">Confirmed</option>
  <option value="cancelled">Cancelled</option>
</select>

        <button
          type="submit"
          className="bg-[#d4731e] text-white font-bold rounded-lg py-2 mt-2 disabled:opacity-60"
          disabled={bookingLoading}
   
        >
          {bookingLoading ? 'Booking...' : 'Submit Booking'}
        </button>
      </form>
      {bookingSuccess && <p className="text-green-600 font-semibold mt-4">{bookingSuccess}</p>}
      {bookingError && <p className="text-red-600 font-semibold mt-4">{bookingError}</p>}
    </div>
  </div>
)}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ContentDetails;