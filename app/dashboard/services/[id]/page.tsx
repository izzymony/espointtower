'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ServicesAPI, Service, ServiceMember } from "@/utils/servicesApi";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Calendar, Users } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const ServiceDetailPage = () => {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    ServicesAPI.getUnit(id)
      .then((result) => setService(result))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading service details...</div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Service Not Found</h2>
          <p className="text-muted-foreground mb-4">The service you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/dashboard/services")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Services
          </Button>
        </div>
      </div>
    )
  }

  // ✅ helper to style status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-700">{status}</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-700">{status}</Badge>;
      case "suspended":
        return <Badge className="bg-red-500/20 text-red-700">{status}</Badge>;
      default:
        return <Badge className="bg-gray-300 text-gray-700">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{service.name}</h1>
          <p className="text-muted-foreground">
            Service ID: <span className="font-mono">#{service.id}</span>
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard/services")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Services
        </Button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Service Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Service Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Description</h3>
                <CardDescription className="text-muted-foreground break-words">
                  {service.description || <span className="italic">Not provided</span>}
                </CardDescription>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Created</h3>
                <p className="text-muted-foreground">
                  {service.createdAt ? new Date(service.createdAt).toLocaleString() : "N/A"}
                </p>
              </div>
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Status</h3>
                {getStatusBadge(service.status || "active")}
              </div>
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Created By</h3>
                <span className="text-muted-foreground">{service.createdBy || "Unknown"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Availability */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Availability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {service.availability && Object.keys(service.availability).length > 0 ? (
                  Object.entries(service.availability).map(([day, times]) => (
                    <div key={day} className="flex items-center gap-3">
                      <Badge className="capitalize">{day}</Badge>
                      <span className="font-mono text-sm">
                        {times.start} - {times.end}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="italic text-muted-foreground">No availability set</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Assigned Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(service.members) && service.members.length > 0 ? (
                <ul className="space-y-3">
                  {service.members.map((member: ServiceMember, idx) => (
                    <li key={member.memberId ?? idx} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <span className="font-semibold">{member.memberName}</span>
                        {Array.isArray(member.roles) && member.roles.length > 0 && (
                          <span className="ml-2 text-xs italic text-muted-foreground">
                            ({member.roles.join(", ")})
                          </span>
                        )}
                      </div>

                    </li>
                  ))}
                </ul>
              ) : (
                <span className="italic text-muted-foreground">No assigned members.</span>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full bg-transparent">
                Edit Service
              </Button>
              <Button variant="outline" className="w-full bg-transparent">
                Export Details
              </Button>
              <Button variant="outline" className="w-full bg-transparent">
                Contact Staff
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ServiceDetailPage;
