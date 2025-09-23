
"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Clock, Image as ImageIcon, Tag, Percent, Clock as ClockIcon } from "lucide-react";
import Image from "next/image";

export default function ServiceForm() {
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
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
  const [status, setStatus] = useState("approved");

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const urls = Array.from(e.target.files).map((f) => URL.createObjectURL(f));
      setLogoUrls([...logoUrls, ...urls]);
    }
  };

  const removeLogo = (indexToRemove: number) => {
    setLogoUrls(logoUrls.filter((_, idx) => idx !== indexToRemove));
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add validation here if needed
    if (!name.trim() || !description.trim()) {
      alert("Please fill in the service name and description.");
      return;
    }
    alert("Form submitted!");
  };

 const statusConfig = {
  approved: { label: "Approved", variant: "default" as const },
  pending: { label: "Pending", variant: "secondary" as const },
  suspended: { label: "Suspended", variant: "destructive" as const },
  active: { label: "Active", variant: "outline" as const }, // changed from "success"
};

  return (
    <div className="max-w-5xl mx-auto py-10 ">
      <Card className="shadow-2xl rounded-3xl bg-white">
        <CardHeader className="pb-6">
          <CardTitle className="text-3xl font-bold text-black flex items-center gap-2">
            <ImageIcon className="w-8 h-8 text-black" />
            Create Service
          </CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-8">

            {/* Service Selector & Created By */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="service-select" className="text-sm font-medium text-gray-700">
                  Choose Service
                </Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger id="service-select" className="rounded-xl">
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
              <div className="space-y-2">
                <Label htmlFor="created-by" className="text-sm font-medium text-gray-700">
                  Created By
                </Label>
                <Input
                  id="created-by"
                  value={createdBy}
                  readOnly
                  className="bg-gray-100 text-black rounded-xl border-gray-300"
                  placeholder="Admin User"
                />
              </div>
            </div>

            {/* Service Name */}
            <div className="space-y-2">
              <Label htmlFor="service-name" className="text-sm font-medium text-gray-700">
                Service Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="service-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl border-gray-300 focus:border-black"
                placeholder="Enter service name"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Description <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 text-black rounded-xl resize-vertical focus:border-black"
                rows={4}
                placeholder="Enter a detailed description of the service..."
                required
              />
            </div>

            {/* Upload Logos */}
            <div className="space-y-2">
              <Label htmlFor="logo-upload" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Upload Logos
              </Label>
              <Input
                id="logo-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleLogoUpload}
                className="rounded-xl border-gray-300"
              />
              {logoUrls.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4">
                  {logoUrls.map((url, idx) => (
                    <div key={idx} className="relative w-20 h-20 border border-gray-300 overflow-hidden rounded-xl shadow-sm">
                      <Image src={url} alt={`logo-${idx}`} fill className="object-cover" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLogo(idx)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Operating Hours */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Operating Hours
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="hours-start" className="text-xs text-gray-600">Start Time</Label>
                  <Input
                    id="hours-start"
                    type="time"
                    value={hoursStart}
                    onChange={(e) => setHoursStart(e.target.value)}
                    className="rounded-xl border-gray-300"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="hours-end" className="text-xs text-gray-600">End Time</Label>
                  <Input
                    id="hours-end"
                    type="time"
                    value={hoursEnd}
                    onChange={(e) => setHoursEnd(e.target.value)}
                    className="rounded-xl border-gray-300"
                  />
                </div>
              </div>
            </div>

            {/* Rental Items */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Rental Items
              </Label>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4 font-semibold text-black text-sm bg-white rounded-lg p-3">
                  <span className="hidden sm:block">Item</span>
                  <span>Quantity</span>
                  <span>Duration (hrs)</span>
                  <span className="text-center">Action</span>
                </div>
                {rentalItems.map((ri, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 items-end bg-white rounded-lg p-3 shadow-sm">
                    <Input
                      value={ri.item}
                      onChange={(e) => updateRentalItem(idx, "item", e.target.value)}
                      placeholder="e.g., Tent"
                      className="rounded-xl border-gray-300"
                    />
                    <Input
                      value={ri.quantity}
                      onChange={(e) => updateRentalItem(idx, "quantity", e.target.value)}
                      placeholder="e.g., 2"
                      type="number"
                      className="rounded-xl border-gray-300"
                    />
                    <Input
                      value={ri.duration_hours}
                      onChange={(e) => updateRentalItem(idx, "duration_hours", e.target.value)}
                      placeholder="e.g., 24"
                      type="number"
                      className="rounded-xl border-gray-300"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeRentalItem(idx)}
                      className="rounded-xl border-red-300 text-red-600 hover:bg-red-50 w-full sm:w-auto"
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
                  className="w-full sm:w-auto bg-black text-white hover:bg-gray-800 rounded-xl mt-3"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Rental Item
                </Button>
              </div>
            </div>

            {/* Pricing & Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="base-price" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Base Price 
                </Label>
                <Input
                  id="base-price"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="rounded-xl border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                  Category
                </Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Outdoor"
                  className="rounded-xl border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Percent className="w-4 h-4" />
                  Discount %
                </Label>
                <Input
                  id="discount"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  type="number"
                  placeholder="0"
                  className="rounded-xl border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <ClockIcon className="w-4 h-4" />
                  Duration (minutes)
                </Label>
                <Input
                  id="duration"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  type="number"
                  placeholder="60"
                  className="rounded-xl border-gray-300"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                Status
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status" className="rounded-xl">
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
              <Badge variant={statusConfig[status as keyof typeof statusConfig]?.variant || "default"} className="mt-2">
                {statusConfig[status as keyof typeof statusConfig]?.label}
              </Badge>
            </div>

            {/* Submit */}
            <div className="pt-6 flex justify-end">
              <Button
                type="submit"
                className="bg-black text-white px-8 py-3 rounded-xl hover:bg-gray-800 shadow-lg transition-colors"
              >
                Save Service
              </Button>
            </div>

          </CardContent>
        </form>
      </Card>
    </div>
  );
}
