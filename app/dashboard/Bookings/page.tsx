"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ServicesAPI, CreateBookingRequest } from "@/utils/servicesApi";
import { RefreshCw } from "lucide-react";
// Types
interface Service {
  id: string;
  name: string;
}

export default function BookingsPage() {
  const [formData, setFormData] = useState({
    client_email: "",
    preferred_staff_id: "",
    notes: "",
    service_time: "",
    service_date: "",
    client_phone: "",
    client_name: "",
    service_package_id: "",
    status: "active",
    completed_date: "",
    booking_code: "",
    service_unit: "",
    service: "",
      from: "internal" as "internal" | "external",
  });

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('')
  const [message, setMessage] = useState("");
  const[, setEditError] = useState('')
  const [username, setUsername] = useState("williams")

  const generateBookingCode = (): string => {
  return (
    "BOOK-" +
    Math.random()
      .toString(36) // base-36 => 0–9, a–z
      .substring(2, 12) // take 10 characters
      .toUpperCase()
  );
};


useEffect(() => {
    const fetchServices = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const username = storedUser.username || "guest";

        setUsername(username)

        const res = await fetch(
          `https://espoint.onrender.com/espoint/get_all_service/${username}`
        );
        const data = await res.json();

        if (Array.isArray(data.msg)) {
          // API returned array inside `msg`
          setServices(
            data.msg.map((s: any) => ({
              id: s.service_id,
              name: s.service_name,
            }))
          );
        } else {
          console.warn("Unexpected response:", data);
          setServices([]);
        }
      } catch (err) {
        console.error("Failed to fetch services", err);
        setServices([]);
      }
    };

    fetchServices();
  }, []);


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ When service is chosen, auto-fill service + service_unit
  const handleServiceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const serviceId = e.target.value;
    const selectedService = services.find((s) => s.id === serviceId);

    setFormData((prev) => ({
      ...prev,
      service: selectedService?.name || "",
      service_unit: selectedService?.id || ""
    }));
  };

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
     
if (!username){
  alert(" Please you must be logged in to create a booking")
  setLoading(false);
  return;
}
      const payload: CreateBookingRequest = {
        service: formData.service,
        service_unit: formData.service_unit,
        username,
        from: formData.from,
        service_id: formData.service_unit,
        data: {
          client_email: formData.client_email,
          preferred_staff_id: formData.preferred_staff_id,
          notes: formData.notes,
          service_time: formData.service_time,
          service_date: formData.service_date,
          client_phone: formData.client_phone,
          client_name: formData.client_name,
          service_package_id: formData.service_package_id,
          status: formData.status,
          completed_date: formData.completed_date,
          booking_code: formData.booking_code || generateBookingCode(),
         /*  booking_code:
            formData.booking_code || generateBookingCode(), */ 
          service_unit: formData.service_unit,
          service: formData.service,
        },
      };

      await ServicesAPI.createBooking(payload);
      setMessage("✅ Booking created successfully!");

      // reset form
      setFormData({
        client_email: "",
     
        preferred_staff_id: "",
        notes: "",
        service_time: "",
        service_date: "",
        client_phone: "",
        client_name: "",
        service_package_id: "",
        status: "pending",
        completed_date: "",
        booking_code: "",
        service_unit: "",
        service: "",
        from: "internal",
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setEditError(err.message);
      } else {
        setEditError("Failed to create booking");
      }
    } finally {
      setLoading(false);
    }
  };


  return (
     <div className="max-w-2xl mx-auto p-3">
      <h1 className="text-2xl font-bold mb-4">Create Booking</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Client Name</Label>
          <Input
            name="client_name"
            value={formData.client_name}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label>Email</Label>
          <Input
            name="client_email"
            value={formData.client_email}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label>Phone</Label>
          <Input
            name="client_phone"
            value={formData.client_phone}
            onChange={handleChange}
          />
        </div>

         <div>
          <label htmlFor="">Username</label>
          <Input value={username}  className=""/>
        </div> 

        <div>
          <Label>Service</Label>
          <select
            name="service_unit"
            value={formData.service_unit}
            onChange={handleServiceSelect}
            className="w-full border p-2 rounded"
          >
            <option value="">-- Select Service --</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Preferred Staff ID</Label>
          <Input
            name="preferred_staff_id"
            value={formData.preferred_staff_id}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label>Service Date</Label>
          <Input
            type="date"
            name="service_date"
            value={formData.service_date}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label>Service Time</Label>
          <Input
            type="time"
            name="service_time"
            value={formData.service_time}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label>Notes</Label>
          <Textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label>Status</Label>
          <Input
            name="status"
            value={formData.status}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="">Service Package ID</label>  
          <Input
            name="service_package_id"
            value={formData.service_package_id}
            onChange={handleChange}
          />
        </div>

         <div>
          <Label>Completed Date</Label>
          <Input
            type="date"
            name="completed_date"
            value={formData.completed_date}
            onChange={handleChange}
          />
        </div>
            <div>
          <Label>From</Label>
          <select
            name="from"
            value={formData.from}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            <option value="internal">Internal</option>
            <option value="external">External</option>
          </select>
        </div>

          <div>
  <Label>Booking Code</Label>
  <div className="flex gap-2">
    <Input
      name="booking_code"
      value={formData.booking_code}
      onChange={handleChange}
      placeholder="Auto-generated if left blank"
    />
    <Button
      type="button"
      onClick={() => {
        const randomCode = Math.random()
          .toString(36) // base-36 for [0-9a-z]
          .substring(2, 14)
          .toUpperCase();
        setFormData((prev) => ({ ...prev, booking_code: randomCode }));
      }}
      className="shrink-0"
    >
       <RefreshCw className="h-4 w-4" />
    </Button>
  </div>
</div>


        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Booking"}
        </Button>
      </form>
      {message && <p className="mt-4">{message}</p>}
    </div>
         
  );
}
