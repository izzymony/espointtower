'use client'
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ServicesAPI, Service, ServiceMember, ServiceRole, ServiceStaff, UpdateUnitPayload, RemoveStaffPayload } from "@/utils/servicesApi";
import { memberApi } from "@/utils/memberApi";
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ArrowLeft, Clock, Calendar, Users } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface CurrentUser {
  username: string;
  name?: string;
}

interface ApiMember {
  id?: string;
  member?: string;
  name?: string;
  status?: string;
}

interface SelectableMember {
  id: string;
  name: string;
}

// Helper for role status badge - Memoized
const getStatusBadge = (status: string) => {
  const normalized = status?.toLowerCase() || "";
  switch (normalized) {
    case "approved":
    case "active":
      return <Badge className="bg-[#FFC107] text-[#0a0a0a] border-none font-bold px-3">{status}</Badge>;
    case "pending":
      return <Badge className="bg-white/10 text-[#FFC107] border border-[#FFC107]/20 font-bold px-3">{status}</Badge>;
    case "suspended":
    case "cancelled":
      return <Badge className="bg-red-500/20 text-red-500 border border-red-500/20 font-bold px-3">{status}</Badge>;
    default:
      return <Badge className="bg-white/5 text-gray-400 border border-white/5 font-bold px-3">{status}</Badge>;
  }
};

const ServiceDetailPage = () => {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
  const router = useRouter();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string>("");

  // Add Staff modal state
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [availableMembers, setAvailableMembers] = useState<SelectableMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [addActionLoading, setAddActionLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  // Confirmation popups (remove/confirm role/staff)
  const [confirmPopup, setConfirmPopup] = useState<null | {
    type: "confirmRole" | "removeRole" | "removeStaff",
    member: ServiceMember,
    role?: string
  }>(null);

  const [showEditService, setShowEditService] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAvailability, setEditAvailability] = useState<Record<string, { start: string; end: string }>>({});
  const [editStatus, setEditStatus] = useState("active");
  const [editedMembers, setEditedMembers] = useState<Record<string, string[]>>({});
  const [newMembers, setNewMembers] = useState<Array<{ id: string, roles: string[] }>>([]);
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // 🚀 PERFORMANCE OPTIMIZATIONS

  // Memoized available roles to prevent re-creation
  const availableRolesList = useMemo(() => ["admin", "content", "booking"], []);

  // Memoized current service staff IDs
  const currentServiceStaffIds = useMemo(() =>
    service?.members?.map(m => m.memberId) || [],
    [service?.members]
  );

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setCurrentUser(JSON.parse(storedUser));
    } catch (e) {
      setCurrentUser(null);
    }
  }, []);

  // Service fetch - Optimized
  const refreshService = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const s = await ServicesAPI.getUnit(id);
      setService(s);
      setEditName(s.name);
      setEditDescription(s.description || '');
      setEditStatus(s.status || "active");
      setEditAvailability(s.availability || {});

      const initialEditedMembers: Record<string, string[]> = {};
      s.members?.forEach(member => {
        initialEditedMembers[member.memberId] = [...new Set(member.roles)];
      });
      setEditedMembers(initialEditedMembers);
    } catch (e) {
      console.error("Failed to fetch service", e);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    refreshService();
  }, [id, refreshService]);

  // 🚀 OPTIMIZED MEMBER FETCHING - Only fetch when needed
  const fetchAvailableMembers = useCallback(async () => {
    if (!service?.createdBy) return;

    try {
      const approvedMembers = await memberApi.getMembers(service.createdBy, "approved");

      const selectable = approvedMembers
        .filter((m: ApiMember) => {
          const memberId = m.id || m.member;
          return memberId && !currentServiceStaffIds.includes(memberId);
        })
        .map((m: ApiMember) => ({
          id: m.id || m.member || '',
          name: m.name || m.member || m.id || 'Unknown Member'
        }));

      setAvailableMembers(selectable);
      setAvailableRoles(availableRolesList);
    } catch (e) {
      console.error("Failed to fetch available members", e);
      setAvailableMembers([]);
      setAvailableRoles([]);
    }
  }, [service?.createdBy, currentServiceStaffIds, availableRolesList]);

  // Only fetch members when modals are opened
  useEffect(() => {
    if (showAddStaff || showEditService) {
      fetchAvailableMembers();
    }
  }, [showAddStaff, showEditService, fetchAvailableMembers]);

  // 🚀 OPTIMIZED MEMBER MANAGEMENT FUNCTIONS with useCallback
  const handleAddNewMember = useCallback(() => {
    if (availableMembers.length === 0) return;
    const firstAvailableMember = availableMembers.find(m =>
      !newMembers.some(nm => nm.id === m.id) &&
      !currentServiceStaffIds.includes(m.id)
    );
    if (!firstAvailableMember) return;
    setNewMembers(prev => [...prev, { id: firstAvailableMember.id, roles: [] }]);
  }, [availableMembers, newMembers, currentServiceStaffIds]);

  const handleRemoveNewMember = useCallback((index: number) => {
    setNewMembers(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleNewMemberRoleChange = useCallback((index: number, role: string, checked: boolean) => {
    setNewMembers(prev => {
      const updated = [...prev];
      if (checked) {
        if (!updated[index].roles.includes(role)) {
          updated[index].roles.push(role);
        }
      } else {
        updated[index].roles = updated[index].roles.filter(r => r !== role);
      }
      return updated;
    });
  }, []);

  const handleExistingMemberRoleChange = useCallback((memberId: string, role: string, checked: boolean) => {
    setEditedMembers(prev => {
      const updated = { ...prev };
      if (checked) {
        updated[memberId] = [...(updated[memberId] || []), role];
      } else {
        updated[memberId] = (updated[memberId] || []).filter(r => r !== role);
      }
      return updated;
    });
  }, []);

  const handleNewMemberSelect = useCallback((index: number, memberId: string) => {
    setNewMembers(prev => {
      const updated = [...prev];
      updated[index].id = memberId;
      return updated;
    });
  }, []);

  const doRemoveStaff = async (member: ServiceMember) => {
    setActionLoading("remove:" + member.memberId);
    try {
      if (!currentUser || !currentUser.username) {
        throw new Error("No valid user found");
      }

      const payload: RemoveStaffPayload = {
        service_id: service!.id,
        username: currentUser.username,
        staff: member.memberId
      };

      await ServicesAPI.removeStaff(payload);
      await refreshService();
    } catch (err) {
      console.error("Failed to remove member", err);
      alert("Failed to remove member.");
    } finally {
      setActionLoading("");
      setConfirmPopup(null);
    }
  };

  const handleRemoveRole = (member: ServiceMember, role: string) => {
    setConfirmPopup({ type: "removeRole", member, role });
  };

  const handleConfirmRole = (member: ServiceMember, role: string) => {
    setConfirmPopup({ type: "confirmRole", member, role });
  };

  const doRemoveRole = async (member: ServiceMember, role: string) => {
    setActionLoading("removerole:" + member.memberId + ":" + role);
    try {
      if (!currentUser || !currentUser.username) throw new Error("Invalid user");
      await ServicesAPI.removeMemberRole({ service_id: service!.id, username: currentUser.username, staff: member.memberId, role });
      await refreshService();
    } finally {
      setActionLoading("");
      setConfirmPopup(null);
    }
  };

  const doConfirmRole = async (member: ServiceMember, role: string) => {
    setActionLoading("confirm:" + member.memberId + ":" + role);
    try {
      await ServicesAPI.confirmMemberRole({ service_id: service!.id, staff: member.memberId, role });
      await refreshService();
    } finally {
      setActionLoading("");
      setConfirmPopup(null);
    }
  };

  // Add member as staff
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || selectedRoles.length === 0) {
      setAddError("Please select a member and at least one role.");
      return;
    }
    if (!currentUser || !currentUser.username) {
      setAddError("No user found. Please login.");
      return;
    }

    setAddActionLoading(true);
    setAddError(null);

    try {
      const now = new Date().toISOString();
      const roleObj: Record<string, ServiceRole> = {};

      selectedRoles.forEach(role => {
        roleObj[role] = {
          issuedby: currentUser.username,
          status: "pending",
          issuedtime: now
        };
      });

      const updatePayload: UpdateUnitPayload = {
        service_id: service!.id,
        username: currentUser.username,
        data: {
          staffs: {
            [selectedMember]: {
              status: "approved",
              issuedby: currentUser.username,
              issuedtime: now,
              role: roleObj
            }
          }
        }
      };

      await ServicesAPI.updateUnit(updatePayload);
      setShowAddStaff(false);
      setSelectedMember("");
      setSelectedRoles([]);
      await refreshService();
    } catch (err) {
      if (err instanceof Error) {
        setAddError(err.message);
      } else {
        setAddError("Failed to add staff");
      }
    }
    setAddActionLoading(false);
  };

  // Edit service
  const handleEditService = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || !currentUser.username) {
      setEditError("No user found. Please login.");
      return;
    }

    setEditLoading(true);
    setEditError(null);

    try {
      const now = new Date().toISOString();
      const staffs: Record<string, ServiceStaff> = {};

      // Process existing members with role changes
      Object.entries(editedMembers).forEach(([memberId, roles]) => {
        const roleObj: Record<string, ServiceRole> = {};
        roles.forEach(role => {
          roleObj[role] = {
            issuedby: currentUser.username,
            status: "pending",
            issuedtime: now
          };
        });

        staffs[memberId] = {
          status: "approved",
          issuedby: currentUser.username,
          issuedtime: now,
          role: roleObj
        };
      });

      // Process new members
      newMembers.forEach(newMember => {
        if (newMember.roles.length > 0) {
          const roleObj: Record<string, ServiceRole> = {};
          newMember.roles.forEach(role => {
            roleObj[role] = {
              issuedby: currentUser.username,
              status: "pending",
              issuedtime: now
            };
          });

          staffs[newMember.id] = {
            status: "approved",
            issuedby: currentUser.username,
            issuedtime: now,
            role: roleObj
          };
        }
      });

      const updatePayload: UpdateUnitPayload = {
        service_id: service!.id,
        username: currentUser.username,
        data: {
          service_name: editName,
          description: editDescription,
          status: editStatus,
          timetable: editAvailability,
          staffs: Object.keys(staffs).length > 0 ? staffs : undefined
        }
      };

      await ServicesAPI.updateUnit(updatePayload);
      setShowEditService(false);
      setNewMembers([]);
      await refreshService();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setEditError(err.message);
      } else {
        setEditError("Failed to update service");
      }
    }
    setEditLoading(false);
  };

  const handleDeleteService = async (id: string) => {
    if (!currentUser || !currentUser.username) return;
    try {
      await ServicesAPI.deleteUnit({ service_id: id, username: currentUser.username });
      router.push("/dashboard/services");
    } catch (err) {
      alert("Failed to delete service.");
    }
  };

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
          <p className="text-muted-foreground mb-4">The service you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push("/dashboard/services")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Services
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pt-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2 py-0.5 rounded-full bg-[#FFC107]/10 border border-[#FFC107]/20 text-[10px] font-black uppercase tracking-widest text-[#FFC107]">
              Service Details
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#0a0a0a]">
            {service.name.split(' ')[0]} <span className="text-[#FFC107]">{service.name.split(' ').slice(1).join(' ')}</span>
          </h1>
          <p className="text-gray-500 mt-2 flex items-center gap-2">
            Ref ID: <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md text-xs">#{service.id}</span>
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/services")}
          className="rounded-2xl border-gray-200 hover:bg-gray-50 text-gray-600 font-bold px-6 h-12 transition-all hover:gap-3"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Fleet
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* Service Info */}
          <Card className="group relative border-none shadow-xl rounded-[3rem] bg-[#0a0a0a] text-white p-8 overflow-hidden hover:shadow-2xl transition-all duration-300">
            {/* Abstract Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#FFC107]/10 to-transparent rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:scale-125"></div>

            <CardHeader className="p-0 mb-8 relative z-10">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[#FFC107]">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[#FFC107] text-[10px] font-black uppercase tracking-[0.25em] mb-1">DATA SHEET</p>
                    <CardTitle className="text-2xl font-bold text-white tracking-tight">Main Intelligence</CardTitle>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 space-y-8 relative z-10">
              <div>
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Core Description</h3>
                <div className="p-5 rounded-[2rem] bg-white/5 border border-white/5 text-gray-300 leading-relaxed text-sm">
                  {service.description || "Initializing system description..."}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="p-5 rounded-[2rem] bg-white/5 border border-white/5">
                  <h3 className="text-[10px] font-black text-[#FFC107] uppercase tracking-widest mb-1">System Status</h3>
                  <div className="mt-2">
                    {getStatusBadge(service.status || "active")}
                  </div>
                </div>
                <div className="p-5 rounded-[2rem] bg-white/5 border border-white/5">
                  <h3 className="text-[10px] font-black text-[#FFC107] uppercase tracking-widest mb-1">Admin Origin</h3>
                  <p className="text-lg font-bold text-white mt-1">
                    {service.createdBy || "System"}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Initialized: {service.createdAt ? new Date(service.createdAt).toLocaleDateString() : "N/A"}
                  </span>
                  <span className="font-mono opacity-50">v1.2.0.stable</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Availability */}
          <Card className="group relative border-none shadow-xl rounded-[3rem] bg-[#0a0a0a] text-white p-8 overflow-hidden hover:shadow-2xl transition-all duration-300">
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#FFC107]/5 rounded-full blur-3xl -ml-10 -mb-10"></div>

            <CardHeader className="p-0 mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[#FFC107]">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[#FFC107] text-[10px] font-black uppercase tracking-[0.25em] mb-1">TEMPORAL</p>
                  <CardTitle className="text-2xl font-bold text-white tracking-tight">Active Hours</CardTitle>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {service.availability && Object.keys(service.availability).length > 0 ? (
                  Object.entries(service.availability).map(([day, times]) => (
                    <div key={day} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group/day">
                      <span className="text-sm font-bold uppercase tracking-wider text-gray-100">{day}</span>
                      <span className="font-mono text-sm text-[#FFC107] tabular-nums">
                        {times.start} — {times.end}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-8 text-center text-gray-500 italic bg-white/5 rounded-[2rem]">
                    No temporal data synchronized.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Members/Staff Management */}
          <Card className="group relative border-none shadow-xl rounded-[3rem] bg-[#0a0a0a] text-white p-8 overflow-hidden hover:shadow-2xl transition-all duration-300">
            <div className="absolute top-1/2 -left-12 w-32 h-32 bg-[#FFC107]/5 rounded-full blur-3xl transition-all group-hover:scale-150"></div>

            <CardHeader className="p-0 mb-8 relative z-10 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[#FFC107]">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[#FFC107] text-[10px] font-black uppercase tracking-[0.25em] mb-1">PERSONNEL</p>
                  <CardTitle className="text-2xl font-bold text-white tracking-tight">Active Staff</CardTitle>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddStaff(true)}
                className="bg-[#FFC107] hover:bg-[#FFC107]/90 text-[#0a0a0a] border-none font-bold rounded-xl px-4 h-10 transition-transform active:scale-95 shadow-lg shadow-[#FFC107]/10"
              >
                + Deploy Staff
              </Button>
            </CardHeader>

            <CardContent className="p-0 relative z-10">
              {Array.isArray(service.members) && service.members.length > 0 ? (
                <div className="space-y-4">
                  {service.members.map((member) => (
                    <div key={member.memberId} className="p-5 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-all group/member">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center font-bold text-[#FFC107]">
                            {member.memberName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-lg text-white block group-hover/member:text-[#FFC107] transition-colors">{member.memberName}</span>
                            <div className="mt-1">
                              {getStatusBadge(member.status || "active")}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={actionLoading === "remove:" + member.memberId}
                          onClick={() => setConfirmPopup({ type: "removeStaff", member })}
                          className="text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Roles */}
                      <div className="flex flex-wrap items-center gap-2 px-1">
                        {Array.isArray(member.roles) && member.roles.length > 0 ? (
                          member.roles.map((role) => (
                            <div key={role} className="flex items-center gap-1.5 p-1 px-3 rounded-full bg-white/5 border border-white/5 group/role hover:border-[#FFC107]/20 transition-all">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{role}</span>
                              <div className="flex items-center gap-1 opacity-0 group-hover/role:opacity-100 transition-opacity">
                                {member.status !== "approved" && (
                                  <button
                                    className="p-1 hover:text-[#FFC107] transition-colors"
                                    onClick={() => handleConfirmRole(member, role)}
                                    title="Confirm Role"
                                  >
                                    <Clock className="w-3 h-3" />
                                  </button>
                                )}
                                <button
                                  className="p-1 hover:text-red-400 transition-colors"
                                  onClick={() => handleRemoveRole(member, role)}
                                  title="Remove Role"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs italic text-gray-500">No clearance levels assigned</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center bg-white/5 rounded-[2.5rem] border-2 border-dashed border-white/5">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-gray-600" />
                  </div>
                  <p className="text-gray-500 font-medium">No personnel assigned to this unit.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions Section */}
          <Card className="group relative border-none shadow-xl rounded-[3rem] bg-[#0a0a0a] text-white p-8 overflow-hidden hover:shadow-2xl transition-all duration-300">
            <CardHeader className="p-0 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[#FFC107]">
                  <Plus className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl font-bold text-white tracking-tight">Command Actions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 space-y-3">
              <Button
                variant="outline"
                className="w-full h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold hover:bg-white/10 hover:border-[#FFC107]/50 transition-all text-base gap-3"
                onClick={() => setShowEditService(true)}
              >
                Modify Unit Parameters
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-14 rounded-2xl bg-white/5 border-white/10 text-gray-300 font-bold hover:bg-white/10 transition-all text-sm">
                  Export Log
                </Button>
                <Button variant="outline" className="h-14 rounded-2xl bg-white/5 border-white/10 text-gray-300 font-bold hover:bg-white/10 transition-all text-sm">
                  Contact Team
                </Button>
              </div>
              <Button
                variant="outline"
                className="w-full h-14 rounded-2xl bg-red-500/5 border-red-500/20 text-red-500 font-bold hover:bg-red-500/10 hover:border-red-500/50 transition-all text-base mt-4"
                onClick={() => {
                  if (confirm("DANGER: This will permanently decommission this unit. Proceed?")) {
                    handleDeleteService(service.id);
                  }
                }}
              >
                Decommission Unit
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Staff Modal - Dark Theme */}
      {showAddStaff && (
        <div className="fixed inset-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAddStaff(false)}>
          <div
            className="bg-[#0a0a0a] border border-white/10 shadow-2xl rounded-[3rem] p-8 w-full max-w-md relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-2xl bg-[#FFC107]/10 text-[#FFC107]">
                <Plus className="w-6 h-6" />
              </div>
              <h2 className="font-bold text-2xl text-white tracking-tight">Personnel Deployment</h2>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#FFC107]">Select Member</label>
                <select
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#FFC107]/20 appearance-none font-medium"
                  value={selectedMember}
                  onChange={e => setSelectedMember(e.target.value)}
                  required
                >
                  <option value="" className="bg-[#0a0a0a]">Available personnel...</option>
                  {availableMembers.map(m =>
                    <option key={m.id} value={m.id} className="bg-[#0a0a0a]">{m.name}</option>
                  )}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#FFC107]">Assign Roles</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableRoles.map(role => (
                    <label key={role} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${selectedRoles.includes(role) ? 'bg-[#FFC107]/10 border-[#FFC107]/30 text-[#FFC107]' : 'bg-white/5 border-white/5 text-gray-400'}`}>
                      <input
                        type="checkbox"
                        className="sr-only"
                        value={role}
                        checked={selectedRoles.includes(role)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedRoles([...selectedRoles, role]);
                          } else {
                            setSelectedRoles(selectedRoles.filter(r => r !== role));
                          }
                        }}
                      />
                      <span className="text-xs font-bold uppercase tracking-wider">{role}</span>
                    </label>
                  ))}
                </div>
              </div>

              {addError && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">{addError}</div>}

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={addActionLoading}
                  className="flex-1 h-14 rounded-2xl bg-[#FFC107] hover:bg-[#FFC107]/90 text-[#0a0a0a] font-black uppercase tracking-widest text-xs transition-all active:scale-95"
                >
                  {addActionLoading ? "Transmitting..." : "Initialize Profile"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddStaff(false)}
                  className="h-14 px-6 rounded-2xl bg-white/5 border-white/10 text-white font-bold hover:bg-white/10 transition-all text-xs uppercase tracking-widest"
                >
                  Abord
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Pop-up Dialog - Premium Styling */}
      {confirmPopup && (
        <div className="fixed inset-0 z-[60] bg-[#0a0a0a]/90 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setConfirmPopup(null)}>
          <div
            className="bg-[#0a0a0a] border border-white/10 shadow-2xl rounded-[3rem] p-10 w-full max-w-sm relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFC107]/5 rounded-full blur-3xl -mr-10 -mt-10"></div>

            <div className="relative z-10 text-center">
              <div className={`w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center ${confirmPopup.type === 'confirmRole' ? 'bg-[#FFC107]/10 text-[#FFC107]' : 'bg-red-500/10 text-red-500'}`}>
                {confirmPopup.type === 'confirmRole' ? <Clock className="w-8 h-8" /> : <Trash2 className="w-8 h-8" />}
              </div>

              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
                {confirmPopup.type === "confirmRole" ? "Authorize Role" : "Security Override"}
              </h3>

              <p className="text-gray-400 text-sm leading-relaxed mb-8">
                {confirmPopup.type === "confirmRole" ? (
                  <>Authorize <span className="text-white font-bold">{confirmPopup.role}</span> status for <span className="text-[#FFC107] font-bold">{confirmPopup.member.memberName}</span>?</>
                ) : confirmPopup.type === "removeRole" ? (
                  <>Revoke <span className="text-white font-bold">{confirmPopup.role}</span> access from <span className="text-red-400 font-bold">{confirmPopup.member.memberName}</span>?</>
                ) : (
                  <>Completely remove <span className="text-white font-bold">{confirmPopup.member.memberName}</span> from this unit? This action is logged.</>
                )}
              </p>

              <div className="flex flex-col gap-3">
                <Button
                  className={`h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95 ${confirmPopup.type === 'confirmRole' ? 'bg-[#FFC107] hover:bg-[#FFC107]/90 text-[#0a0a0a]' : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'}`}
                  onClick={() => {
                    if (confirmPopup.type === "confirmRole") doConfirmRole(confirmPopup.member, confirmPopup.role!);
                    else if (confirmPopup.type === "removeRole") doRemoveRole(confirmPopup.member, confirmPopup.role!);
                    else doRemoveStaff(confirmPopup.member);
                  }}
                  disabled={!!actionLoading}
                >
                  {actionLoading ? "Processing..." : "Confirm Protocol"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setConfirmPopup(null)}
                  className="h-14 rounded-2xl text-gray-500 font-bold hover:text-white transition-all text-xs uppercase tracking-widest"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal - Dark Theme */}
      {showEditService && (
        <div className="fixed inset-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowEditService(false)}>
          <div
            className="bg-[#0a0a0a] border border-white/10 shadow-2xl rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-10 py-8 border-b border-white/5 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-[#FFC107]/10 text-[#FFC107]">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-2xl text-white tracking-tight">Modify Unit Parameters</h2>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Direct System Override</p>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-10 py-8 space-y-10 custom-scrollbar">
              {editError && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                  {editError}
                </div>
              )}

              <form onSubmit={handleEditService} id="edit-service-form" className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#FFC107] px-1">Unit Designation</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:ring-2 focus:ring-[#FFC107]/20 font-bold text-lg"
                      required
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#FFC107] px-1">Operational Status</label>
                    <select
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:ring-2 focus:ring-[#FFC107]/20 font-bold appearance-none"
                    >
                      <option value="active" className="bg-[#0a0a0a]">ACTIVE</option>
                      <option value="suspended" className="bg-[#0a0a0a]">SUSPENDED</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#FFC107] px-1">Mission briefing</label>
                  <textarea
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-5 text-white outline-none focus:ring-2 focus:ring-[#FFC107]/20 min-h-[120px] leading-relaxed resize-none"
                  />
                </div>

                {/* Availability Section */}
                <div className="space-y-6 pt-6 border-t border-white/5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#FFC107]">Temporal Windows</label>
                    <div className="relative">
                      <select
                        className="bg-[#FFC107]/10 text-[#FFC107] border border-[#FFC107]/20 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest outline-none cursor-pointer hover:bg-[#FFC107]/20 transition-all"
                        defaultValue=""
                        onChange={(e) => {
                          const newDay = e.target.value;
                          if (newDay && !editAvailability[newDay]) {
                            setEditAvailability({ ...editAvailability, [newDay]: { start: "09:00", end: "17:00" } });
                          }
                          e.target.value = "";
                        }}
                      >
                        <option value="" className="bg-[#0a0a0a]">+ Add Period</option>
                        {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
                          .filter(d => !Object.keys(editAvailability).includes(d))
                          .map(d => <option key={d} value={d} className="bg-[#0a0a0a]">{d.toUpperCase()}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(editAvailability).map(([day, times]) => (
                      <div key={day} className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 group/editday hover:border-white/10 transition-all">
                        <span className="w-24 capitalize text-xs font-black tracking-widest text-gray-400">{day}</span>
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="time"
                            value={times.start}
                            onChange={(e) => setEditAvailability({ ...editAvailability, [day]: { ...times, start: e.target.value } })}
                            className="bg-white/5 border-none rounded-xl px-3 py-2 text-white text-sm outline-none focus:ring-1 focus:ring-[#FFC107] font-mono"
                          />
                          <span className="text-gray-600">—</span>
                          <input
                            type="time"
                            value={times.end}
                            onChange={(e) => setEditAvailability({ ...editAvailability, [day]: { ...times, end: e.target.value } })}
                            className="bg-white/5 border-none rounded-xl px-3 py-2 text-white text-sm outline-none focus:ring-1 focus:ring-[#FFC107] font-mono"
                          />
                        </div>
                        <button
                          type="button"
                          className="p-2 text-gray-600 hover:text-red-400 transition-colors"
                          onClick={() => {
                            const copy = { ...editAvailability };
                            delete copy[day];
                            setEditAvailability(copy);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="px-10 py-8 border-t border-white/5 bg-white/[0.02]">
              <div className="flex gap-4">
                <Button
                  type="submit"
                  form="edit-service-form"
                  disabled={editLoading}
                  className="flex-1 h-14 rounded-2xl bg-[#FFC107] hover:bg-[#FFC107]/90 text-[#0a0a0a] font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95"
                >
                  {editLoading ? "Transmitting..." : "Update Fleet Matrix"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditService(false)}
                  className="h-14 px-10 rounded-2xl bg-white/5 border-white/10 text-white font-bold hover:bg-white/10 transition-all text-sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceDetailPage;