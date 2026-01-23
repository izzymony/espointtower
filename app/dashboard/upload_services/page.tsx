
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { ServicesAPI, CreateServiceContentPayload, Service } from "@/utils/servicesApi";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Clock, Image as ImageIcon, Tag, Percent, Clock as ClockIcon, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";

export default function ServicePage() {
  return (
    <Suspense fallback={<div>Loading form...</div>}>
      <ServiceForm />
    </Suspense>
  );
}

function ServiceForm() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [createdBy, setCreatedBy] = useState("Admin User");
  const [description, setDescription] = useState("");
  const [logoUrls, setLogoUrls] = useState<string[]>([]);
  const [hoursStart, setHoursStart] = useState("");
  const [hoursEnd, setHoursEnd] = useState("");
  const [rentalItems, setRentalItems] = useState<
    { item: string; quantity: string; duration_hours: string }[]
  >([{ item: "", quantity: "", duration_hours: "" }]);
  const [basePrice, setBasePrice] = useState("");
  const [category, setCategory] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [name, setName] = useState("");
  const [serviceNameFromContent, setServiceNameFromContent] = useState("");
  const [status, setStatus] = useState("approved");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const searchParams = useSearchParams();
  const router = useRouter();
  const queryServiceId = searchParams.get("service_id");
  const queryContentId = searchParams.get("content_id");
  const isEditMode = !!queryContentId;

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (storedUser.username) {
      setCreatedBy(storedUser.username);
    }

    const fetchServices = async () => {
      try {
        const data = await ServicesAPI.getAllService();
        setServices(data);
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    const fetchContent = async () => {
      if (!queryContentId) {
        if (queryServiceId) setSelectedService(queryServiceId);
        return;
      }

      console.log("Edit Mode Detected. Content ID:", queryContentId);
      setLoading(true);
      try {
        const contentData = await ServicesAPI.getContent(queryContentId) as any;
        console.log("Fetched Content Data Raw:", contentData);

        if (contentData && contentData.msg) {
          const content = contentData.msg;
          // Robust store data extraction: check 'store', 'data', or the object itself
          const store = content.store || content.data || (content.branding ? content : null);

          if (!store) {
            console.error("Could not find store data in content message:", content);
            return;
          }

          console.log("Extracted Store Data:", store);

          setSelectedService(content.service_id || content.service_unit || "");
          setServiceNameFromContent(content.service || "");
          setName(store.name || "");
          setDescription(store.description || "");
          setLogoUrls(store.branding?.logo_url || []);
          setHoursStart(store.service_hours?.start || "");
          setHoursEnd(store.service_hours?.end || "");
          setBasePrice(store.base_price?.toString() || "");
          setCategory(store.category || "");
          setDiscountPercent(store.discount_percent?.toString() || "");
          setDurationMinutes(store.duration_minutes?.toString() || "");
          setStatus(store.status || "active");

          if (store.rental_items) {
            // Handle both array and object structures for rental_items
            const items = Object.values(store.rental_items).map((ri: any) => ({
              item: ri.item || "",
              quantity: ri.quantity?.toString() || "",
              duration_hours: ri.duration_hours?.toString() || ""
            }));
            setRentalItems(items.length > 0 ? items : [{ item: "", quantity: "", duration_hours: "" }]);
          }
        } else {
          console.warn("API returned no msg for content_id:", queryContentId);
        }
      } catch (error) {
        console.error("Error fetching content details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [queryContentId, queryServiceId]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const urls = files.map((f) => URL.createObjectURL(f));
      setLogoUrls([...logoUrls, ...urls]);
      setSelectedFiles([...selectedFiles, ...files]);
    }
  };

  const removeLogo = (indexToRemove: number) => {
    setLogoUrls(logoUrls.filter((_, idx) => idx !== indexToRemove));
    setSelectedFiles(selectedFiles.filter((_, idx) => idx !== indexToRemove));
  };

  const addRentalItem = () => {
    setRentalItems([...rentalItems, { item: "", quantity: "", duration_hours: "" }]);
  };

  const removeRentalItem = (index: number) => {
    const copy = [...rentalItems];
    copy.splice(index, 1);
    setRentalItems(copy);
  };

  const updateRentalItem = (index: number, field: keyof typeof rentalItems[0], value: string) => {
    const copy = [...rentalItems];
    copy[index] = { ...copy[index], [field]: value };
    setRentalItems(copy);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedService) {
      alert("Please select a service.");
      return;
    }

    if (!name.trim() || !description.trim()) {
      alert("Please fill in the service name and description.");
      return;
    }

    setSubmitting(true);

    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const serviceObj = services.find((s) => s.id === selectedService);

      // Process logos: Keep existing ones that are still in logoUrls, and convert new files
      const base64Logos = await Promise.all(selectedFiles.map(fileToBase64));
      const existingLogos = logoUrls.filter(url => !url.startsWith('blob:')); // Filter out blob URLs
      const finalLogos = [...existingLogos, ...base64Logos];

      const payload: CreateServiceContentPayload = {
        ...(isEditMode && queryContentId ? { content_id: queryContentId } : {}),
        created_by: createdBy,
        service: serviceObj?.name || serviceNameFromContent || "",
        service_id: selectedService,
        service_unit: selectedService, // Using service ID (UUID) as unit
        username: storedUser.username || "guest",
        data: {
          branding: {
            logo_url: finalLogos,
          },
          eligible_roles: "all", // Default or add selection
          service_hours: {
            start: hoursStart,
            end: hoursEnd,
          },
          rental_items: rentalItems.reduce((acc, ri, idx) => {
            if (ri.item.trim()) {
              acc[ri.item] = ri;
            }
            return acc;
          }, {} as Record<string, typeof rentalItems[0]>),
          discount_percent: discountPercent,
          duration_minutes: durationMinutes,
          base_price: basePrice,
          category: category,
          name: name,
          status: status,
          description: description,
        },
      };

      if (isEditMode && queryContentId) {
        await ServicesAPI.updateServiceContent(payload);
        alert("Service updated successfully!");
      } else {
        await ServicesAPI.createServiceContent(payload);
        alert("Service saved successfully!");
      }
      router.back();
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to save service. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const statusConfig = {
    approved: { label: "Approved", variant: "default" as const },
    pending: { label: "Pending", variant: "secondary" as const },
    suspended: { label: "Suspended", variant: "destructive" as const },
    active: { label: "Active", variant: "outline" as const }, // changed from "success"
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pt-6">

      {/* HERO HEADER - Infused Design */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0a0a0a] px-8 py-12 shadow-2xl">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl"></div>

        <div className="relative z-10 flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
              {isEditMode ? "Update" : "Create"} <span className="text-primary">Service</span>
            </h1>
            <p className="text-gray-400 max-w-lg text-lg">
              {isEditMode
                ? "Modify your existing service details and pricing information."
                : "Add new service offerings to your portfolio with comprehensive details and pricing."}
            </p>
          </div>
          {isEditMode && (
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-white hover:bg-white/10 rounded-full h-12 px-6 flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </Button>
          )}
        </div>
      </div>

      <Card className="shadow-xl rounded-3xl bg-white border-none ring-1 ring-border/10 overflow-hidden">
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-8 pt-8 px-8 pb-10">

            {/* Service Selector & Created By */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label htmlFor="service-select" className="text-sm font-semibold text-foreground/80">
                  Choose Service
                </Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger id="service-select" className="h-12 rounded-2xl border-border/50 bg-muted/20 focus:ring-primary/50 text-base">
                    <SelectValue placeholder="-- Select Service --" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label htmlFor="created-by" className="text-sm font-semibold text-foreground/80">
                  Created By
                </Label>
                <Input
                  id="created-by"
                  value={createdBy}
                  readOnly
                  className="h-12 bg-muted/10 text-muted-foreground rounded-2xl border-border/30 font-medium"
                />
              </div>
            </div>

            {/* Service Name */}
            <div className="space-y-3">
              <Label htmlFor="service-name" className="text-sm font-semibold text-foreground/80">
                Service Name <span className="text-primary">*</span>
              </Label>
              <Input
                id="service-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-2xl border-border/50 bg-muted/20 focus:border-primary focus:ring-primary/20 text-lg font-medium placeholder:text-muted-foreground/40"
                placeholder="Enter service name"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-3">
              <Label htmlFor="description" className="text-sm font-semibold text-foreground/80">
                Description <span className="text-primary">*</span>
              </Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-4 border border-border/50 bg-muted/20 text-foreground rounded-2xl resize-vertical focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/40 text-base"
                rows={5}
                placeholder="Enter a detailed description of the service..."
                required
              />
            </div>

            {/* Upload Logos */}
            <div className="space-y-3">
              <Label htmlFor="logo-upload" className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" />
                Upload Logos
              </Label>
              <div className="border-2 border-dashed border-border hover:border-primary transition-all duration-300 rounded-3xl p-8 flex flex-col items-center justify-center bg-muted/10 hover:bg-muted/20 group cursor-pointer" onClick={() => document.getElementById('logo-upload')?.click()}>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <div className="p-4 bg-primary/10 rounded-full mb-4 group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <p className="font-medium text-foreground">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-1">Supported formats: JPG, PNG, WEBP</p>
              </div>

              {logoUrls.length > 0 && (
                <div className="flex flex-wrap gap-4 mt-6">
                  {logoUrls.map((url, idx) => (
                    <div key={idx} className="relative w-28 h-28 border border-border/20 overflow-hidden rounded-2xl shadow-sm group">
                      <Image src={url} alt={`logo-${idx}`} fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); removeLogo(idx); }}
                          className="w-10 h-10 text-white hover:text-red-400 hover:bg-white/10 rounded-full"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Operating Hours */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Operating Hours
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-muted/10 rounded-3xl border border-border/30">
                <div className="space-y-2">
                  <Label htmlFor="hours-start" className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Start Time</Label>
                  <Input
                    id="hours-start"
                    type="time"
                    value={hoursStart}
                    onChange={(e) => setHoursStart(e.target.value)}
                    className="h-12 rounded-xl border-border/50 bg-white focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hours-end" className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">End Time</Label>
                  <Input
                    id="hours-end"
                    type="time"
                    value={hoursEnd}
                    onChange={(e) => setHoursEnd(e.target.value)}
                    className="h-12 rounded-xl border-border/50 bg-white focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            {/* Rental Items */}
            <div className="space-y-4">
              <Label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                Rental Items
              </Label>
              <div className="bg-muted/10 border border-border/30 rounded-3xl p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-4 font-semibold text-foreground text-sm bg-white/50 border border-border/20 rounded-xl p-4">
                  <span className="hidden sm:block">Item</span>
                  <span>Quantity</span>
                  <span>Duration (hrs)</span>
                  <span className="text-center">Action</span>
                </div>
                {rentalItems.map((ri, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 items-end bg-white border border-border/40 rounded-2xl p-4 mb-4 shadow-sm hover:shadow-md transition-shadow">
                    <Input
                      value={ri.item}
                      onChange={(e) => updateRentalItem(idx, "item", e.target.value)}
                      placeholder="e.g., Tent"
                      className="rounded-xl border-border/50 bg-transparent"
                    />
                    <Input
                      value={ri.quantity}
                      onChange={(e) => updateRentalItem(idx, "quantity", e.target.value)}
                      placeholder="Qty"
                      type="number"
                      className="rounded-xl border-border/50 bg-transparent"
                    />
                    <Input
                      value={ri.duration_hours}
                      onChange={(e) => updateRentalItem(idx, "duration_hours", e.target.value)}
                      placeholder="Hours"
                      type="number"
                      className="rounded-xl border-border/50 bg-transparent"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRentalItem(idx)}
                      className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive w-full sm:w-auto h-10"
                      disabled={rentalItems.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addRentalItem}
                  className="w-full sm:w-auto mt-2 border-primary text-primary hover:bg-primary hover:text-black font-semibold rounded-full px-6 transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Rental Item
                </Button>
              </div>
            </div>

            {/* Pricing & Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="base-price" className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  Base Price
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">SL</span>
                  <Input
                    id="base-price"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-8 h-11 rounded-xl border-border/50 bg-muted/10 focus:ring-primary/20 font-medium"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-semibold text-foreground/80">
                  Category
                </Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Outdoor"
                  className="h-11 rounded-xl border-border/50 bg-muted/10 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount" className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-primary" />
                  Discount %
                </Label>
                <Input
                  id="discount"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  type="number"
                  placeholder="0"
                  className="h-11 rounded-xl border-border/50 bg-muted/10 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-primary" />
                  Duration (min)
                </Label>
                <Input
                  id="duration"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  type="number"
                  placeholder="60"
                  className="h-11 rounded-xl border-border/50 bg-muted/10 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-3">
              <Label htmlFor="status" className="text-sm font-semibold text-foreground/80">
                Status
              </Label>
              <div className="flex items-center gap-4">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status" className="w-[180px] h-11 rounded-xl border-border/50 bg-muted/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge variant={statusConfig[status as keyof typeof statusConfig]?.variant || "default"} className="h-8 px-3 rounded-lg text-xs uppercase tracking-wider shadow-sm">
                  {statusConfig[status as keyof typeof statusConfig]?.label}
                </Badge>
              </div>
            </div>

            <div className="pt-8 flex justify-end">
              <Button
                type="submit"
                disabled={submitting}
                className="bg-primary text-black font-bold text-lg px-10 py-6 rounded-full hover:bg-primary/90 shadow-[0_0_25px_rgba(255,193,7,0.4)] transition-all transform hover:scale-105"
              >
                {submitting ? "Saving..." : (isEditMode ? "Update Service" : "Save Service")}
              </Button>
            </div>

          </CardContent>
        </form>
      </Card>
    </div>
  );
}
