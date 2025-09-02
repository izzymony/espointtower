"use client";
import React, { useEffect, useState } from "react";
import { ServicesAPI, CreateServiceContentPayload } from "@/utils/servicesApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
interface RentalItem {
  item: string;
  quantity: string;
  duration_hours: string;
}

interface ServiceListItem {
  id: string;
  name: string;
}

interface ServiceContentData {
  description: string;
  branding: { logo_url: string[] };
  service_hours: { start: string; end: string };
  rental_items: Record<string, { item: string; quantity: string; duration_hours: string }>;
  discount_percent: string;
  duration_minutes: string;
  base_price: string;
  category: string;
  name: string;
  status: string;
}

interface ServiceContent {
  id: string;
  service: string;
  service_id: string;
  username: string;
  created_by: string;
  service_unit: string;
  data: ServiceContentData;
}


export default function UploadServicePage() {
  const [services, setServices] = useState<ServiceListItem[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [serviceName, ] = useState("");
  const [description, setDescription] = useState("");
  const [hoursStart, setHoursStart] = useState("");
  const [hoursEnd, setHoursEnd] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("active");
  const [rentalItems, setRentalItems] = useState<RentalItem[]>([
    { item: "Camera", quantity: "1", duration_hours: "1" },
  ]);

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [logoUrls, setLogoUrls] = useState<string[]>([]);

  const [contentId , setContentId ] = useState("")
  const [contentData, setContentData] = useState<ServiceContent | null>(null);
  const [loadingContent, setLoadingContent] = useState(false)

  // Load available services
  useEffect(() => {
    async function loadServices() {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        if (storedUser?.username) {
          setCreatedBy(storedUser.username);
        }
        const all = await ServicesAPI.getAllService();
        setServices(all);
      } catch (err) {
        console.error("Failed to load services", err);
      }
    }
    loadServices();
  }, []);

  // Update service name when selecting
  useEffect(() => {
    if (selectedService) {
      const selected = services.find((s) => s.id === selectedService);
      if (selected) {
        setName(selected.name);
      }
    }
  }, [selectedService, services]);

  // Add rental item dynamically
  const addRentalItem = () => {
    setRentalItems([
      ...rentalItems,
      { item: "", quantity: "1", duration_hours: "1" },
    ]);
  };

  // ✅ Upload logos
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    setUploading(true);

    try {
      const uploadedUrls: string[] = [];
      const companyName = "espoint"; // hardcoded company

      for (const file of files) {
        const formData = new FormData();
        formData.append("company", companyName);
        formData.append("file", file);

        const res = await fetch(
          "https://espoint.onrender.com/espoint/upload_content_files",
          {
            method: "POST",
            body: formData,
          }
        );

        if (!res.ok) {
          throw new Error(`Upload failed (${res.status})`);
        }

        const data = await res.json();
        if (data.url) {
          uploadedUrls.push(data.url);
        }
      }

      setLogoUrls((prev) => [...prev, ...uploadedUrls]);
    } catch (err) {
      console.error(" Upload failed", err);
      alert("Upload failed: " + (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  // ✅ Submit service
  const handleUploadService = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const rentalObj: Record<
      string,
      { item: string; quantity: string; duration_hours: string }
    > = {};
    rentalItems.forEach((ri, idx) => {
      if (ri.item) {
        rentalObj[String(idx + 1)] = {
          item: ri.item,
          quantity: ri.quantity || "1",
          duration_hours: ri.duration_hours || "1",
        };
      }
    });

    const payload: CreateServiceContentPayload = {
      created_by: createdBy,
      service: services.find((s) => s.id === selectedService)?.name || serviceName,
      service_id: selectedService,  
      service_unit: selectedService, 
      username: createdBy,           
      data: {
        branding: { logo_url: logoUrls }, 
        eligible_roles: "",               
        service_hours: { start: hoursStart, end: hoursEnd },
        rental_items: rentalObj,
        discount_percent: discountPercent,
        duration_minutes: durationMinutes,
        base_price: basePrice,
        category,
        name:
          name ||
          services.find((s) => s.id === selectedService)?.name ||
          serviceName,
        status,
        description,
      },
    };

    try {
    console.log("Submitting payload:", payload);
    await ServicesAPI.createServiceContent(payload);
    setMessage(" Service content uploaded successfully!");
    } catch (err) {
    console.error("Upload failed", err);
    if (err instanceof Error) {
    setMessage("Failed to upload content: " + err.message);
    } else {
    setMessage("Failed to upload content");
    }
    } finally {
    setLoading(false);
    }
  };
  /* const fetchContentById = async () => {
    if(!contentId){
      alert("Please enter a content_id");
      return;
    }
    setLoadingContent(true);

    try{
      const res = await fetch( `https://espoint.onrender.com/espoint/get_content/${contentId}`)
      if(res.ok){
        throw new Error(`Request failed: ${res.status}`)
      }
      const data = await res.json();
      setContentData(data);
    } catch (err){
      console.error("failed to fetch content:", err);
      setContentData(null)
    }finally{
     setLoadingContent(false);
    }

  } */

  return (
   <div className="max-w-3xl mx-auto py-8">
  <Card className="shadow-xl rounded-2xl bg-white border border-gray-100">
    <CardHeader>
      <CardTitle className="text-2xl font-extrabold text-gray-800">
        Upload Service Content
      </CardTitle>
    </CardHeader>
    <CardContent>
      <form onSubmit={handleUploadService} className="space-y-6">
        {/* Service Selector */}
        <div>
          <Label className="font-medium text-gray-700">Select Service</Label>
          <select
            className="mt-2 w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-300 focus:outline-none transition"
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            required
          >
            <option value="">Choose service</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Created By */}
        <div>
          <Label className="font-medium text-gray-700">Created By</Label>
          <Input
            value={createdBy}
            onChange={(e) => setCreatedBy(e.target.value)}
            required
            className="rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-300"
          />
        </div>

        {/* Description */}
        <div>
          <Label className="font-medium text-gray-700">Description</Label>
          <textarea
            className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-300 transition resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        {/* Upload Logos */}
        <div>
          <Label className="font-medium text-gray-700">Upload Logos</Label>
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handleLogoUpload}
            className="rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-300 mt-2"
          />

          {uploading && (
            <p className="text-sm text-gray-500 mt-1">Uploading...</p>
          )}

          {logoUrls.length > 0 && (
            <div className="mt-3 flex gap-3 flex-wrap">
              {logoUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="w-20 h-20 border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center hover:shadow-md transition"
                >
                  <Image
                    src={url}
                    alt={`logo-${idx}`}
                    className="object-cover w-full h-full"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hours */}
        <div className="flex gap-4">
          <div className="flex-1">
            <Label className="font-medium text-gray-700">Start Time</Label>
            <Input
              type="time"
              value={hoursStart}
              onChange={(e) => setHoursStart(e.target.value)}
              className="rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div className="flex-1">
            <Label className="font-medium text-gray-700">End Time</Label>
            <Input
              type="time"
              value={hoursEnd}
              onChange={(e) => setHoursEnd(e.target.value)}
              className="rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-300"
            />
          </div>
        </div>

        {/* Rental Items */}
        <div>
          <Label className="font-semibold text-lg text-gray-800">Rental Items</Label>
          <div className="space-y-3 mt-2">
            {rentalItems.map((ri, idx) => (
              <div
                key={idx}
                className="grid grid-cols-3 gap-3 items-center border border-gray-200 rounded-xl p-3 bg-gray-50 hover:bg-gray-100 transition"
              >
                <div>
                  <Label className="text-sm text-gray-600">Item</Label>
                  <Input
                    value={ri.item}
                    onChange={(e) => {
                      const newItems = [...rentalItems];
                      newItems[idx].item = e.target.value;
                      setRentalItems(newItems);
                    }}
                    className="rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Quantity</Label>
                  <Input
                    type="number"
                    value={ri.quantity}
                    onChange={(e) => {
                      const newItems = [...rentalItems];
                      newItems[idx].quantity = e.target.value;
                      setRentalItems(newItems);
                    }}
                    className="rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Duration (hours)</Label>
                  <Input
                    type="number"
                    value={ri.duration_hours}
                    onChange={(e) => {
                      const newItems = [...rentalItems];
                      newItems[idx].duration_hours = e.target.value;
                      setRentalItems(newItems);
                    }}
                    className="rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </div>
            ))}
          </div>
          <Button
            type="button"
            onClick={addRentalItem}
            className="mt-3 w-full bg-black hover:bg-black text-white rounded-xl transition"
          >
            + Add Rental Item
          </Button>
        </div>

        {/* Base Price & Category */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="font-medium text-gray-700">Base Price</Label>
            <Input
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className="rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div>
            <Label className="font-medium text-gray-700">Category</Label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-300"
            />
          </div>
        </div>

        {/* Discount & Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Discount Percent (%)</Label>
            <Input
              type="number"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              className="rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div>
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-300"
            />
          </div>
        </div>

        {/* Name */}
        <div>
          <Label className="font-medium text-gray-700">Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter service name"
            className="rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-300"
          />
        </div>

        {/* Status */}
        <div>
          <Label className="font-medium text-gray-700">Status</Label>
          <select
            className="mt-2 w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-300 transition"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
            <option value="active">Active</option>
          </select>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-black hover:bg-black text-white font-semibold rounded-xl transition"
        >
          {loading ? "Uploading..." : "Upload Service"}
        </Button>

        {message && <p className="mt-2 text-sm text-center text-gray-600">{message}</p>}
      </form>
    </CardContent>
  </Card>
</div>

  );
}
