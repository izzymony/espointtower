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
      console.error("❌ Upload failed", err);
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
      service_id: selectedService,   // ✅ added
      service_unit: selectedService, // ✅ added
      username: createdBy,           // ✅ added
      data: {
        branding: { logo_url: logoUrls }, // ✅ only logo_url inside branding
        eligible_roles: "",               // ✅ added
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
    setMessage("✅ Service content uploaded successfully!");
    } catch (err) {
    console.error("Upload failed", err);
    if (err instanceof Error) {
    setMessage("❌ Failed to upload content: " + err.message);
    } else {
    setMessage("❌ Failed to upload content");
    }
    } finally {
    setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Card className="shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            Upload Service Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUploadService} className="space-y-6">
            {/* Service Selector */}
            <div>
              <Label className="font-medium">Select Service</Label>
              <select
                className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring focus:outline-none"
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
              <Label className="font-medium">Created By</Label>
              <Input
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value)}
                required
                className="rounded-lg"
              />
            </div>

            {/* Description */}
            <div>
              <Label className="font-medium">Description</Label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 focus:ring"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {/* Upload Logos */}
            <div>
              <Label className="font-medium">Upload Logos</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleLogoUpload}
                className="rounded-lg"
              />

              {uploading && (
                <p className="text-sm text-gray-500">Uploading...</p>
              )}

              {logoUrls.length > 0 && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {logoUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="w-20 h-20 border rounded overflow-hidden flex items-center justify-center"
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
                <Label className="font-medium">Start Time</Label>
                <Input
                  type="time"
                  value={hoursStart}
                  onChange={(e) => setHoursStart(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label className="font-medium">End Time</Label>
                <Input
                  type="time"
                  value={hoursEnd}
                  onChange={(e) => setHoursEnd(e.target.value)}
                />
              </div>
            </div>

            {/* Rental Items */}
            <div>
              <Label className="font-semibold text-lg">Rental Items</Label>
              <div className="space-y-3 mt-2">
                {rentalItems.map((ri, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-3 gap-3 items-center border rounded-lg p-3 bg-gray-50"
                  >
                    <div>
                      <Label className="text-sm">Item</Label>
                      <Input
                        value={ri.item}
                        onChange={(e) => {
                          const newItems = [...rentalItems];
                          newItems[idx].item = e.target.value;
                          setRentalItems(newItems);
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Quantity</Label>
                      <Input
                        type="number"
                        value={ri.quantity}
                        onChange={(e) => {
                          const newItems = [...rentalItems];
                          newItems[idx].quantity = e.target.value;
                          setRentalItems(newItems);
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Duration (hours)</Label>
                      <Input
                        type="number"
                        value={ri.duration_hours}
                        onChange={(e) => {
                          const newItems = [...rentalItems];
                          newItems[idx].duration_hours = e.target.value;
                          setRentalItems(newItems);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                onClick={addRentalItem}
                className="mt-3 w-full"
              >
                + Add Rental Item
              </Button>
            </div>

            {/* Base Price */}
            <div>
              <Label className="font-medium">Base Price</Label>
              <Input
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
              />
            </div>

            {/* Category */}
            <div>
              <Label className="font-medium">Category</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            {/* Discount */}
            <div>
              <Label>Discount Percent (%)</Label>
              <Input
                type="number"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
              />
            </div>

            {/* Duration */}
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </div>

            {/* Name */}
            <div>
              <Label className="font-medium">Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter service name"
              />
            </div>

            {/* Status */}
            <div>
              <Label className="font-medium">Status</Label>
              <select
                className="mt-1 w-full border rounded-lg px-3 py-2"
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
            <Button type="submit" disabled={loading} className="w-full py-2">
              {loading ? "Uploading..." : "Upload Service"}
            </Button>

            {message && <p className="mt-2 text-sm text-center">{message}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
