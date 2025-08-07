"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Edit, Trash2, Eye, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"

interface ServiceMember {
  memberId: string
  memberName: string
  role: string
  assignedBy: string
  assignedAt: string
  assignedByName: string
}

interface Member {
  id: string
  name: string
  email: string
  position: string
}

interface Service {
  id: string
  name: string
  description: string
  members: ServiceMember[]
  availability: string[]
  createdAt: string
  createdBy: string
  createdByName: string
  auditTrail: AuditEntry[]
}

interface AuditEntry {
  id: string
  action: "member_added" | "member_removed" | "role_changed" | "service_created" | "service_updated"
  memberId?: string
  memberName?: string
  oldRole?: string
  newRole?: string
  performedBy: string
  performedByName: string
  timestamp: string
  details: string
}

const STAFF_ROLES = [
  { value: "bookings", label: "Bookings" },
  { value: "admin", label: "Admin" },
  { value: "content-creator", label: "Content Creator" },
  { value: "customer-service", label: "Customer Service" },
  { value: "technical-support", label: "Technical Support" },
  { value: "manager", label: "Manager" },
] as const

const DAYS_OF_WEEK = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
] as const

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    members: [] as ServiceMember[],
    availability: [] as string[],
  })
  const [currentUser, setCurrentUser] = useState<{ username: string; name?: string } | null>(null)

  const router = useRouter()

  useEffect(() => {
    // Get current user
    const userData = localStorage.getItem("user")
    if (userData) {
      const user = JSON.parse(userData)
      setCurrentUser(user)
    }

    // Load services
    const savedServices = localStorage.getItem("services")
    if (savedServices) {
      setServices(JSON.parse(savedServices))
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
  }, [])

  const saveServices = (updatedServices: Service[]) => {
    setServices(updatedServices)
    localStorage.setItem("services", JSON.stringify(updatedServices))
  }

  const handleAddService = () => {
    if (!formData.name || !formData.description || !currentUser) return

    const auditTrail: AuditEntry[] = [
      {
        id: Date.now().toString(),
        action: "service_created",
        performedBy: currentUser.username,
        performedByName: currentUser.name || currentUser.username,
        timestamp: new Date().toISOString(),
        details: `Service "${formData.name}" created`,
      },
      ...formData.members.map((member, index) => ({
        id: (Date.now() + index + 1).toString(),
        action: "member_added" as const,
        memberId: member.memberId,
        memberName: member.memberName,
        newRole: member.role,
        performedBy: currentUser.username,
        performedByName: currentUser.name || currentUser.username,
        timestamp: new Date().toISOString(),
        details: `Added ${member.memberName} as ${member.role}`,
      })),
    ]

    const newService: Service = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      members: formData.members,
      availability: formData.availability,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.username,
      createdByName: currentUser.name || currentUser.username,
      auditTrail: auditTrail,
    }

    const updatedServices = [...services, newService]
    saveServices(updatedServices)

    setFormData({ name: "", description: "", members: [], availability: [] })
    setIsAddDialogOpen(false)
  }

  const handleEditService = () => {
    if (!editingService || !formData.name || !formData.description) return

    const updatedServices = services.map((service) =>
      service.id === editingService.id
        ? {
            ...service,
            name: formData.name,
            description: formData.description,
            members: formData.members,
            availability: formData.availability,
          }
        : service,
    )

    saveServices(updatedServices)
    setEditingService(null)
    setFormData({ name: "", description: "", members: [], availability: [] })
    setIsEditDialogOpen(false)
  }

  const handleDeleteService = (id: string) => {
    const updatedServices = services.filter((service) => service.id !== id)
    saveServices(updatedServices)
  }

  const openEditDialog = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description,
      members: service.members,
      availability: service.availability,
    })
    setIsEditDialogOpen(true)
  }

  const addMemberToService = (memberId: string, role: string) => {
    const member = members.find((m) => m.id === memberId)
    if (!member || !currentUser) return

    const existingMember = formData.members.find((m) => m.memberId === memberId)

    const newMember: ServiceMember = {
      memberId: member.id,
      memberName: member.name,
      role: role,
      assignedBy: currentUser.username,
      assignedAt: new Date().toISOString(),
      assignedByName: currentUser.name || currentUser.username,
    }

    setFormData((prev) => ({
      ...prev,
      members: [...prev.members.filter((m) => m.memberId !== memberId), newMember],
    }))
  }

  const removeMemberFromService = (memberId: string) => {
    setFormData((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.memberId !== memberId),
    }))
  }

  const handleAvailabilityChange = (day: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      availability: checked ? [...prev.availability, day] : prev.availability.filter((d) => d !== day),
    }))
  }

  const viewServiceDetails = (serviceId: string) => {
    router.push(`/dashboard/services/${serviceId}`)
  }

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Services</h1>
          <p className="text-muted-foreground">Manage services, assign staff members, and set availability.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Service</DialogTitle>
              <DialogDescription>Create a new service and assign staff members.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter service name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter service description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Availability</Label>
                <div className="grid grid-cols-2 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={day.value}
                        checked={formData.availability.includes(day.value)}
                        onCheckedChange={(checked) => handleAvailabilityChange(day.value, checked as boolean)}
                      />
                      <Label htmlFor={day.value} className="text-sm">
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Assign Staff Members</Label>
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex gap-2">
                    <Select
                      onValueChange={(memberId) => {
                        const defaultRole = "staff"
                        addMemberToService(memberId, defaultRole)
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select member to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {members
                          .filter((m) => !formData.members.some((sm) => sm.memberId === m.id))
                          .map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name} ({member.position})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    {formData.members.map((serviceMember) => (
                      <div key={serviceMember.memberId} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <span className="flex-1 text-sm font-medium">{serviceMember.memberName}</span>
                        <Select
                          value={serviceMember.role}
                          onValueChange={(role) => addMemberToService(serviceMember.memberId, role)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STAFF_ROLES.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeMemberFromService(serviceMember.memberId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddService}>Add Service</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
          <CardDescription>Manage your services and assigned staff members.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Staff Members</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No services found. Add your first service to get started.
                  </TableCell>
                </TableRow>
              ) : (
                services.map((service) => (
                  <TableRow key={service.id} className="cursor-pointer hover:bg-gray-50">
                    <TableCell className="font-mono text-sm">#{service.id.slice(-6)}</TableCell>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{service.description}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {service.members.slice(0, 2).map((member) => (
                          <Badge key={member.memberId} className={getRoleColor(member.role)} variant="secondary">
                            {member.memberName}
                          </Badge>
                        ))}
                        {service.members.length > 2 && (
                          <Badge variant="outline">+{service.members.length - 2} more</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">{service.availability.length} days</span>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(service.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => viewServiceDetails(service.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(service)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteService(service.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>Update service information and staff assignments.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Service Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter service name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Enter service description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Availability</Label>
              <div className="grid grid-cols-2 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-${day.value}`}
                      checked={formData.availability.includes(day.value)}
                      onCheckedChange={(checked) => handleAvailabilityChange(day.value, checked as boolean)}
                    />
                    <Label htmlFor={`edit-${day.value}`} className="text-sm">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assign Staff Members</Label>
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex gap-2">
                  <Select
                    onValueChange={(memberId) => {
                      const defaultRole = "staff"
                      addMemberToService(memberId, defaultRole)
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select member to add" />
                    </SelectTrigger>
                    <SelectContent>
                      {members
                        .filter((m) => !formData.members.some((sm) => sm.memberId === m.id))
                        .map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name} ({member.position})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  {formData.members.map((serviceMember) => (
                    <div key={serviceMember.memberId} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <span className="flex-1 text-sm font-medium">{serviceMember.memberName}</span>
                      <Select
                        value={serviceMember.role}
                        onValueChange={(role) => addMemberToService(serviceMember.memberId, role)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STAFF_ROLES.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeMemberFromService(serviceMember.memberId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditService}>Update Service</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
