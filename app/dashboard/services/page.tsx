"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2 } from "lucide-react";
import {
  ServicesAPI,
  Service,
  Member,
  ServiceMember,
} from "@/utils/servicesApi";

// Staff roles
const STAFF_ROLES = [
  { value: "bookings", label: "Bookings" },
  { value: "admin", label: "Admin" },
  { value: "content-creator", label: "Content Creator" },
  { value: "customer-service", label: "Customer Service" },
  { value: "technical-support", label: "Technical Support" },
  { value: "manager", label: "Manager" },
] as const;

// Days of week
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

interface FormData {
  name: string;
  description: string;
  availability: Record<string, { start: string; end: string }>;
  members: ServiceMember[];
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    availability: {},
    members: [],
  });

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user: CurrentUser = JSON.parse(userData);
      setCurrentUser(user);
      refreshServices(user.username);

      // fetch approved members
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
      const payload = {
        admin: currentUser.username,
        username: currentUser.username,
        service_name: formData.name,
        createdBy: currentUser.username,
        data: {
          description: formData.description,
          status: "active",
          timetable: formData.availability,
          staffs: Object.fromEntries(
            formData.members.map((m: ServiceMember) => [
              m.memberName,
              {
                status: "approved",
                issuedby: currentUser.username,
                issuedtime: new Date().toISOString(),
                role: {
                  [m.role]: {
                    issuedby: currentUser.username,
                    status: "active",
                    issuedtime: new Date().toISOString(),
                  },
                },
              },
            ])
          ),
        },
      };

      await ServicesAPI.createUnit(payload);
      await refreshServices();
      setIsAddDialogOpen(false);
      setFormData({ name: "", description: "", availability: {}, members: [] });
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
      const payload = {
        admin: currentUser.username,
        username: currentUser.username,
        service_name: formData.name,
        createdBy: currentUser.username,
        data: {
          description: formData.description,
          status: "active",
          timetable: formData.availability,
          staffs: Object.fromEntries(
            formData.members.map((m: ServiceMember) => [
              m.memberName,
              {
                status: "approved",
                issuedby: currentUser.username,
                issuedtime: new Date().toISOString(),
                role: {
                  [m.role]: {
                    issuedby: currentUser.username,
                    status: "active",
                    issuedtime: new Date().toISOString(),
                  },
                },
              },
            ])
          ),
        },
      };

      await ServicesAPI.createUnit(payload);
      await refreshServices();
      setIsEditDialogOpen(false);
      setEditingService(null);
    } catch (err) {
      console.error(err);
    }
  };

  const addMemberToService = (memberId: string, role: string) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;

    const newMember: ServiceMember = { memberId: member.id, memberName: member.name, role };

    setFormData((prev) => ({
      ...prev,
      members: [...prev.members.filter((m) => m.memberId !== memberId), newMember],
    }));
  };

  const removeMemberFromService = (memberId: string) => {
    setFormData((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.memberId !== memberId),
    }));
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      availability: service.availability || {},
      members: service.members || [],
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Services</h1>
          <p className="text-muted-foreground">
            Manage services, assign staff members, and set availability.
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Service</DialogTitle>
              <DialogDescription>
                Create a new service and assign staff members.
              </DialogDescription>
            </DialogHeader>
            <ServiceForm
              formData={formData}
              setFormData={setFormData}
              members={members}
              addMember={addMemberToService}
              removeMember={removeMemberFromService}
            />
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
          <CardDescription>
            Manage your services and assigned staff members.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      No services found.
                    </TableCell>
                  </TableRow>
                ) : (
                  services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-mono text-xs">{service.id}</TableCell>
                      <TableCell>{service.name}</TableCell>
                      <TableCell>{service.createdBy || "-"}</TableCell>
                      <TableCell>
                        {service.createdAt
                          ? new Date(service.createdAt).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(service)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteService(service.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update service info and staff assignments.
            </DialogDescription>
          </DialogHeader>
          <ServiceForm
            formData={formData}
            setFormData={setFormData}
            members={members}
            addMember={addMemberToService}
            removeMember={removeMemberFromService}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditService}>Update Service</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ----- Service Form (only inputs, no Dialog) -----
function ServiceForm({
  formData,
  setFormData,
  members,
  addMember,
  removeMember,
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  members: Member[];
  addMember: (memberId: string, role: string) => void;
  removeMember: (memberId: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Service Name */}
      <div className="space-y-2">
        <Label>Service Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      {/* Availability */}
      <div className="space-y-2">
        <Label>Availability</Label>
        <div className="space-y-3">
          {DAYS_OF_WEEK.map((day) => {
            const currentDay = formData.availability?.[day.value];
            return (
              <div key={day.value} className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Checkbox
                  checked={!!currentDay}
                  onCheckedChange={(checked) => {
                    setFormData((prev) => {
                      const newAvailability = { ...prev.availability };
                      if (checked) {
                        newAvailability[day.value] = { start: "09:00", end: "17:00" };
                      } else {
                        delete newAvailability[day.value];
                      }
                      return { ...prev, availability: newAvailability };
                    });
                  }}
                />
                <span className="w-24 sm:w-28">{day.label}</span>
                {currentDay && (
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <Input
                      type="time"
                      value={currentDay.start}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          availability: {
                            ...prev.availability,
                            [day.value]: {
                              ...prev.availability[day.value],
                              start: e.target.value,
                            },
                          },
                        }))
                      }
                      className="w-24"
                    />
                    <span>-</span>
                    <Input
                      type="time"
                      value={currentDay.end}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          availability: {
                            ...prev.availability,
                            [day.value]: {
                              ...prev.availability[day.value],
                              end: e.target.value,
                            },
                          },
                        }))
                      }
                      className="w-24"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Members Dropdown */}
      <div className="space-y-2">
        <Label>Assign Approved Members</Label>
        <Select onValueChange={(memberId) => addMember(memberId, "staff")} value="">
          <SelectTrigger>
            <SelectValue placeholder="Select approved member" />
          </SelectTrigger>
          <SelectContent>
            {members
              .filter((m) => !formData.members?.some((sm: ServiceMember) => sm.memberId === m.id))
              .map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Assigned Members */}
      <div className="space-y-2">
        {formData.members?.map((serviceMember) => (
          <div
            key={serviceMember.memberId}
            className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 rounded text-black"
          >
            <span className="flex-1 min-w-[120px]">{serviceMember.memberName}</span>
            <Select
              value={serviceMember.role}
              onValueChange={(role) => addMember(serviceMember.memberId, role)}
            >
              <SelectTrigger className="w-full sm:w-40">
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
              onClick={() => removeMember(serviceMember.memberId)}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
