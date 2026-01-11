

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
  { value: "booking", label: "Bookings" },
  { value: "admin", label: "Admin" },
  { value: "content", label: "Content" },

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
  members: ServiceMember[]; // ServiceMember now has 'roles: string[]'
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

  const router = useRouter()

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
    const data = await ServicesAPI.getAllService();
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
                role: Object.fromEntries(
                  (m.roles || []).map((role) => [
                    role,
                    {
                      issuedby: currentUser.username,
                      status: "active",
                      issuedtime: new Date().toISOString(),
                    },
                  ])
                ),
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
      await ServicesAPI.deleteUnit({ service_id: id, username: currentUser.username });
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
                role: Object.fromEntries(
                  (m.roles || []).map((role) => [
                    role,
                    {
                      issuedby: currentUser.username,
                      status: "active",
                      issuedtime: new Date().toISOString(),
                    },
                  ])
                ),
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

  // New addMemberToService for multi-role
  const addMemberToService = (memberId: string, role: string[] = []) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;
    const newMember: ServiceMember = {
      memberId: member.id,
      memberName: member.name,
      // <-- REQUIRED!
      roles: role
    };
    setFormData((prev) => ({
      ...prev,
      members: [
        ...prev.members.filter((m) => m.memberId !== memberId),
        newMember
      ],
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

    // Helper type covers both possible shapes
    type PossibleMember =
      | ServiceMember                          // modern: { memberId, memberName, roles }
      | { memberId: string; memberName: string; role?: string }; // legacy

    // Normalize members array so all have `roles: string[]`
    const members: ServiceMember[] = Array.isArray(service.members)
      ? service.members.map((m: PossibleMember) => {
        if ('roles' in m && Array.isArray(m.roles)) {
          return m;
        } else if ('role' in m && typeof m.role === 'string') {
          return {
            memberId: m.memberId,
            memberName: m.memberName,

            roles: m.role ? [m.role] : [],
          };
        }
        // fallback for empty or malformed
        return {
          memberId: m.memberId,
          memberName: m.memberName,

          roles: [],
        };
      })
      : [];

    setFormData({
      name: service.name,
      description: service.description || "",
      availability: service.availability || {},
      members,
    });
    setIsEditDialogOpen(true);
  };

  // This function is used to update only the roles of a member
  const updateMemberRoles = (memberId: string, newRoles: string[]) => {
    setFormData((prev) => ({
      ...prev,
      members: prev.members.map((m) =>
        m.memberId === memberId ? { ...m, roles: newRoles } : m
      ),
    }));
  };

  return (
    <div className="space-y-8 pt-6">

      {/* HERO HEADER - Infused Design */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0a0a0a] px-8 py-12 shadow-2xl">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
              Services <span className="text-primary">Management</span>
            </h1>
            <p className="text-gray-400 max-w-lg text-lg">
              Manage your service offerings, assign staff members, and configure availability schedules.
            </p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-black font-bold text-lg px-8 py-6 rounded-full hover:bg-primary/90 shadow-[0_0_20px_rgba(255,193,7,0.4)] transition-all transform hover:scale-105">
                <Plus className="mr-2 h-5 w-5" /> Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto rounded-3xl border-border/50 shadow-2xl bg-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Add New Service</DialogTitle>
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
                updateMemberRoles={updateMemberRoles}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="rounded-full border-border/50">
                  Cancel
                </Button>
                <Button onClick={handleAddService} className="rounded-full bg-primary text-black font-bold hover:bg-primary/90">Add Service</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="shadow-xl rounded-3xl bg-white border-none ring-1 ring-border/10 overflow-hidden">
        <CardHeader className="pl-8 pt-8 pb-4">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <div className="h-8 w-1 bg-primary rounded-full"></div>
            Service Offerings
          </CardTitle>
          <CardDescription className="pl-3">
            View and manage all active services.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border/10">
                  <TableHead className="w-[100px] pl-8 font-semibold text-foreground/70">ID</TableHead>
                  <TableHead className="font-semibold text-foreground/70">Name</TableHead>
                  <TableHead className="font-semibold text-foreground/70">Created By</TableHead>
                  <TableHead className="font-semibold text-foreground/70">Created Date</TableHead>
                  <TableHead className="text-right pr-8 font-semibold text-foreground/70">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      No services found.
                    </TableCell>
                  </TableRow>
                ) : (
                  services.map((service) => (
                    <TableRow key={service.id} className="cursor-pointer hover:bg-primary/5 transition-colors border-b border-border/10 group" onClick={() => router.push(`/dashboard/services/${service.id}`)}>
                      <TableCell className="font-mono text-xs text-muted-foreground pl-8 py-5">{service.id.slice(0, 8)}...</TableCell>
                      <TableCell className="font-semibold text-foreground py-5">{service.name}</TableCell>
                      <TableCell className="text-muted-foreground py-5">{service.createdBy || "-"}</TableCell>
                      <TableCell className="text-muted-foreground py-5">
                        {service.createdAt
                          ? new Date(service.createdAt).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right space-x-2 pr-8 py-5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                          onClick={(e) => { e.stopPropagation(); openEditDialog(service); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                          onClick={(e) => { e.stopPropagation(); handleDeleteService(service.id); }}
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
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto rounded-3xl border-border/50 shadow-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Edit Service</DialogTitle>
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
            updateMemberRoles={updateMemberRoles}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="rounded-full border-border/50">
              Cancel
            </Button>
            <Button onClick={handleEditService} className="rounded-full bg-primary text-black font-bold hover:bg-primary/90">Update Service</Button>
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
  updateMemberRoles,
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  members: Member[];
  addMember: (memberId: string, roles?: string[]) => void;
  removeMember: (memberId: string) => void;
  updateMemberRoles: (memberId: string, newRoles: string[]) => void;
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
        <Select
          onValueChange={(memberId) => addMember(memberId, [])}
          value=""
        >
          <SelectTrigger>
            <SelectValue placeholder="Select approved member" />
          </SelectTrigger>
          <SelectContent>
            {members
              .filter(
                (m) => !formData.members?.some((sm: ServiceMember) => sm.memberId === m.id)
              )
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
            {/* Multi-select UI for roles */}
            <div className="flex flex-wrap gap-2">
              {STAFF_ROLES.map((role) => (
                <label key={role.value} className="flex items-center gap-1">
                  <Checkbox
                    checked={serviceMember.roles?.includes(role.value)}
                    onCheckedChange={(checked) => {
                      const newRoles = checked
                        ? [...(serviceMember.roles || []), role.value]
                        : (serviceMember.roles || []).filter((r) => r !== role.value);
                      updateMemberRoles(serviceMember.memberId, Array.from(new Set(newRoles)));
                    }}
                  />
                  <span>{role.label}</span>
                </label>
              ))}
            </div>
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