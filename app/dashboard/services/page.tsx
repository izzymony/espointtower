"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import {
  ServicesAPI,
  Service,
  Member,
  ServiceMember,
  CreateUnitPayload,
  RemoveMemberRolePayload,
  ConfirmMemberRolePayload
} from "@/utils/servicesApi";

const STAFF_ROLES = [
  { value: "bookings", label: "Bookings" },
  { value: "admin", label: "Admin" },
  { value: "content-creator", label: "Content Creator" },
  { value: "customer-service", label: "Customer Service" },
  { value: "technical-support", label: "Technical Support" },
  { value: "manager", label: "Manager" },
] as const;

const DAYS_OF_WEEK = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
] as const;

interface CurrentUser {
  username: string;
  name?: string;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<CreateUnitPayload>({
    name: "",
    description: "",
    availability: [],
    members: [],
    createdBy: "",
  });
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user: CurrentUser = JSON.parse(userData);
      setCurrentUser(user);
      setFormData((prev) => ({ ...prev, createdBy: user.username }));

      refreshServices(user.username);
      ServicesAPI.getMembersRecords(user.username, "approved")
        .then(setMembers)
        .catch(console.error);
    }
  }, []);

  const refreshServices = async (username?: string) => {
    const staff = username || currentUser?.username;
    if (!staff) return;
    const data = await ServicesAPI.getAllService(staff);
    setServices(data);
  };

  const handleAddService = async () => {
    if (!formData.name || !formData.description || !currentUser) return;
    try {
      await ServicesAPI.createUnit(formData);
      await refreshServices();
      setIsAddDialogOpen(false);
      setFormData({ name: "", description: "", availability: [], members: [], createdBy: currentUser.username });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!currentUser) return;
    try {
      await ServicesAPI.deleteUnit({ serviceId: id, staff: currentUser.username });
      await refreshServices();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditService = async () => {
    if (!editingService || !currentUser) return;
    try {
      await ServicesAPI.createUnit({
        ...formData,
        createdBy: currentUser.username,
      });
      await refreshServices();
      setIsEditDialogOpen(false);
      setEditingService(null);
    } catch (err) {
      console.error(err);
    }
  };

  const addMemberToService = async (memberId: string, role: string, serviceId?: string) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;

    const newMember: ServiceMember = { memberId: member.id, memberName: member.name, role };

    if (serviceId && currentUser) {
      const payload: ConfirmMemberRolePayload = { memberId: member.id, role };
      await ServicesAPI.confirmMemberRole(payload);
      await refreshServices();
    }

    setFormData((prev) => ({
      ...prev,
      members: [...prev.members!.filter((m) => m.memberId !== memberId), newMember],
    }));
  };

  const removeMemberFromService = async (memberId: string, serviceId?: string) => {
    if (serviceId && currentUser) {
      const payload: RemoveMemberRolePayload = { memberId, role: "" };
      await ServicesAPI.removeMemberRole(payload);
      await refreshServices();
    }

    setFormData((prev) => ({
      ...prev,
      members: prev.members!.filter((m) => m.memberId !== memberId),
    }));
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      availability: service.availability || [],
      members: service.members || [],
      createdBy: currentUser?.username || "",
    });
    setIsEditDialogOpen(true);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-purple-100 text-purple-800";
      case "bookings": return "bg-blue-100 text-blue-800";
      case "content-creator": return "bg-green-100 text-green-800";
      case "customer-service": return "bg-yellow-100 text-yellow-800";
      case "technical-support": return "bg-red-100 text-red-800";
      case "manager": return "bg-indigo-100 text-indigo-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Services</h1>
          <p className="text-muted-foreground">Manage services, assign staff members, and set availability.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Service</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Service</DialogTitle>
              <DialogDescription>Create a new service and assign staff members.</DialogDescription>
            </DialogHeader>
            <ServiceForm
              formData={formData}
              setFormData={setFormData}
              members={members}
              addMember={addMemberToService}
              removeMember={removeMemberFromService}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
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
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Staff Members</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.length === 0 ? (
                <TableRow><TableCell colSpan={5}>No services found.</TableCell></TableRow>
              ) : (
                services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>{service.name}</TableCell>
                    <TableCell>{service.description}</TableCell>
                    <TableCell>
                      {service.members?.map((m) => (
                        <Badge key={m.memberId} className={getRoleColor(m.role)}>{m.memberName}</Badge>
                      ))}
                    </TableCell>
                    <TableCell>{service.createdAt ? new Date(service.createdAt).toLocaleDateString() : "-"}</TableCell>
                    <TableCell className="space-x-1">
                      <Button size="sm" onClick={() => router.push(`/dashboard/services/${service.id}`)}><Eye /></Button>
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(service)}><Edit /></Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteService(service.id)}><Trash2 /></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>Update service info and staff assignments.</DialogDescription>
          </DialogHeader>
          <ServiceForm
            formData={formData}
            setFormData={setFormData}
            members={members}
            addMember={(memberId, role) => addMemberToService(memberId, role, editingService?.id)}
            removeMember={(memberId) => removeMemberFromService(memberId, editingService?.id)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditService}>Update Service</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ServiceForm({
  formData,
  setFormData,
  members,
  addMember,
  removeMember
}: {
  formData: CreateUnitPayload;
  setFormData: React.Dispatch<React.SetStateAction<CreateUnitPayload>>;
  members: Member[];
  addMember: (memberId: string, role: string) => void;
  removeMember: (memberId: string) => void;
}) {
  return (
    <>
      <Label>Service Name</Label>
      <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />

      <Label>Description</Label>
      <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />

      <Label>Availability</Label>
      <div className="grid grid-cols-2 gap-2">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day.value} className="flex items-center gap-2">
            <Checkbox
              checked={formData.availability?.includes(day.value)}
              onCheckedChange={(checked) => {
                setFormData((prev) => ({
                  ...prev,
                  availability: checked
                    ? [...(prev.availability || []), day.value]
                    : (prev.availability || []).filter((d) => d !== day.value),
                }));
              }}
            />
            {day.label}
          </div>
        ))}
      </div>

      <Label>Assign Approved Members</Label>
      <Select onValueChange={(memberId) => addMember(memberId, "staff")}>
        <SelectTrigger>
          <SelectValue placeholder="Select approved member" />
        </SelectTrigger>
        <SelectContent>
          {members
            .filter((m) => !formData.members?.some((sm) => sm.memberId === m.id))
            .map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      <div className="space-y-2 mt-2">
        {formData.members?.map((serviceMember) => (
          <div key={serviceMember.memberId} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
            <span className="flex-1">{serviceMember.memberName}</span>
            <Select
              value={serviceMember.role}
              onValueChange={(role) => addMember(serviceMember.memberId, role)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAFF_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => removeMember(serviceMember.memberId)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}
