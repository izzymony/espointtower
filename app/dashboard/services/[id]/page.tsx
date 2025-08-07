"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Users, Calendar, Clock, Mail, Activity } from "lucide-react"

interface Member {
  id: string
  name: string
  email: string
  position: string
}

interface ServiceMember {
  memberId: string
  memberName: string
  role: string
  assignedBy: string
  assignedAt: string
  assignedByName: string
}

interface Service {
  id: string
  name: string
  description: string
  members: ServiceMember[]
  availability: string[]
  createdAt: string
}

const DAYS_OF_WEEK_MAP: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
}

export default function ServiceDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [service, setService] = useState<Service | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const serviceId = params.id as string

    // Load service
    const savedServices = localStorage.getItem("services")
    if (savedServices) {
      const services = JSON.parse(savedServices)
      const foundService = services.find((s: Service) => s.id === serviceId)
      setService(foundService || null)
    }

    // Load members
    const savedMembers = localStorage.getItem("members")
    if (savedMembers) {
      const membersData = JSON.parse(savedMembers)
      setMembers(
        membersData.map((m: any) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          position: m.position,
        })),
      )
    }

    setLoading(false)
  }, [params.id])

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800"
      case "bookings":
        return "bg-blue-100 text-blue-800"
      case "content-creator":
        return "bg-green-100 text-green-800"
      case "customer-service":
        return "bg-yellow-100 text-yellow-800"
      case "technical-support":
        return "bg-red-100 text-red-800"
      case "manager":
        return "bg-indigo-100 text-indigo-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPositionColor = (position: string) => {
    switch (position) {
      case "admin":
        return "bg-purple-100 text-purple-800"
      case "manager":
        return "bg-blue-100 text-blue-800"
      case "staff":
        return "bg-green-100 text-green-800"
      case "intern":
        return "bg-orange-100 text-orange-800"
      case "contractor":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getMemberDetails = (memberId: string) => {
    return members.find((m) => m.id === memberId)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading service details...</div>
      </div>
    )
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push("/dashboard/services")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Services
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{service.name}</h1>
          <p className="text-muted-foreground">Service ID: #{service.id.slice(-6)}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Service Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{service.description}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Created</h3>
              <p className="text-muted-foreground">{new Date(service.createdAt).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Availability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {service.availability.map((day) => (
                <Badge key={day} variant="outline" className="justify-center">
                  {DAYS_OF_WEEK_MAP[day] || day}
                </Badge>
              ))}
            </div>
            {service.availability.length === 0 && <p className="text-muted-foreground text-sm">No availability set</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assigned Staff Members ({service.members.length})
          </CardTitle>
          <CardDescription>Staff members assigned to this service and their roles</CardDescription>
        </CardHeader>
        <CardContent>
          {service.members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No staff members assigned to this service yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Service Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {service.members.map((serviceMember) => {
                  const memberDetails = getMemberDetails(serviceMember.memberId)
                  return (
                    <TableRow key={serviceMember.memberId}>
                      <TableCell className="font-medium">{memberDetails?.name || serviceMember.memberName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {memberDetails?.email || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPositionColor(memberDetails?.position || "")}>
                          {memberDetails?.position || "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(serviceMember.role)}>
                          {serviceMember.role.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Role Assignment History
          </CardTitle>
          <CardDescription>Track who assigned roles to staff members</CardDescription>
        </CardHeader>
        <CardContent>
          {service.members.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No role assignments to display.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Assigned By</TableHead>
                  <TableHead>Assigned Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {service.members.map((serviceMember) => (
                  <TableRow key={serviceMember.memberId}>
                    <TableCell className="font-medium">{serviceMember.memberName}</TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(serviceMember.role)}>
                        {serviceMember.role.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{serviceMember.assignedByName || serviceMember.assignedBy}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {new Date(serviceMember.assignedAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Staff:</span>
              <span className="font-semibold">{service.members.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Available Days:</span>
              <span className="font-semibold">{service.availability.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service ID:</span>
              <span className="font-mono text-sm">#{service.id.slice(-6)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Staff Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from(new Set(service.members.map((m) => m.role))).map((role) => (
                <div key={role} className="flex justify-between">
                  <span className="text-muted-foreground capitalize">{role.replace("-", " ")}:</span>
                  <span className="font-semibold">{service.members.filter((m) => m.role === role).length}</span>
                </div>
              ))}
              {service.members.length === 0 && <p className="text-muted-foreground text-sm">No roles assigned</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => router.push(`/dashboard/services`)}
            >
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
  )
}
