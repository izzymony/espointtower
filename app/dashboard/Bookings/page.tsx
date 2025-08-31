"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ServicesAPI } from "@/utils/servicesApi";

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
    status: "pending",
    completed_date: "",
    booking_code: "",
    service_unit: "",
    service: ""
  });

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ✅ Fetch services on mount
  useEffect(() => {
    const fetchServices = async () => {
      try {
        // Get stored username (same way you did in your service content upload)
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const username = storedUser.username || "guest";

        const res = await fetch(
          `https://espoint.onrender.com/espoint/get_all_service/${username}`
        );
        const data = await res.json();

        if(Array.isArray(data)){
          setServices(data);    
        }else if(data.services && Array.isArray(data.service)){
          setServices(data.services);

        }else{
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
      await ServicesAPI.createBooking(formData);
      setMessage("✅ Booking created successfully!");
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
        service: ""
      });
    } catch (err: any) {
      console.error("Booking failed", err);
      setMessage("❌ Failed to create booking: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  return (
     <div className="max-w-2xl mx-auto p-6">
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

        {/* ✅ Services Dropdown */}
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

        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Booking"}
        </Button>
      </form>
      {message && <p className="mt-4">{message}</p>}
    </div>
         
  );
}
