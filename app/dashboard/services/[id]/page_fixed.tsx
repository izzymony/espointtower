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
  const [editAvailability, setEditAvailability] = useState<Record<string, {start: string; end: string}>>({});
  const [editStatus, setEditStatus] = useState("active");
  const [editedMembers, setEditedMembers] = useState<Record<string, string[]>>({});
  const [newMembers, setNewMembers] = useState<Array<{id: string, roles: string[]}>>([]);
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          {/* Members/Staff Management */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Assigned Members
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowAddStaff(true)}>
                + Add Staff
              </Button>
            </CardHeader>
            <CardContent>
              {Array.isArray(service.members) && service.members.length > 0 ? (
                <ul className="space-y-4">
                  {service.members.map((member) => (
                    <li key={member.memberId} className="border-b pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold">{member.memberName}</span>
                          {member.status && (
                            <span className="ml-2 align-middle">{getStatusBadge(member.status)}</span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={actionLoading === "remove:" + member.memberId}
                          onClick={() => doRemoveStaff(member)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          {actionLoading === "remove:" + member.memberId ? "...Removing" : "Remove"}
                        </Button>
                      </div>
                      {/* Roles Display & Actions */}
                      {Array.isArray(member.roles) && member.roles.length > 0 && (
                        <ul className="flex flex-wrap items-center gap-2 mt-2 px-2">
                          {member.roles.map((role) => (
                            <li key={role} className="flex items-center gap-1">
                              <Badge>{role}</Badge>
                              {/* Confirm role button (shown only if not approved) */}
                              {member.status !== "approved" && (
                                <Button
                                  variant="outline"
                                  disabled={actionLoading === "confirm:" + member.memberId + ":" + role}
                                  onClick={() => handleConfirmRole(member, role)}
                                >
                                  {actionLoading === "confirm:" + member.memberId + ":" + role
                                    ? "Confirming..."
                                    : "Confirm"}
                                </Button>
                              )}
                              {/* Remove individual role */}
                              <Button
                                variant="ghost"
                                disabled={actionLoading === "removerole:" + member.memberId + ":" + role}
                                onClick={() => handleRemoveRole(member, role)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                      {(!member.roles || member.roles.length === 0) && (
                        <span className="ml-2 text-xs italic text-muted-foreground">No roles assigned</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="italic text-muted-foreground">No assigned members.</span>
              )}
            </CardContent>
          </Card>

          {/* Add Staff Modal */}
          {showAddStaff && (
            <div className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center" onClick={() => setShowAddStaff(false)}>
              <div
                className="bg-white dark:bg-slate-900 shadow-xl rounded-lg p-6 min-w-[340px] relative"
                onClick={e => e.stopPropagation()}
              >
                <h2 className="font-bold text-lg mb-4">Add Staff/Member to Service</h2>
                <form onSubmit={handleAddStaff}>
                  {/* Select Member */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium">Member:</label>
                    <select
                      className="mt-1 w-full border rounded px-2 py-1 dark:bg-slate-800"
                      value={selectedMember}
                      onChange={e => setSelectedMember(e.target.value)}
                      required
                    >
                      <option value="">Select member</option>
                      {availableMembers.map(m =>
                        <option key={m.id} value={m.id}>{m.name}</option>
                      )}
                    </select>
                  </div>
                  {/* Select Roles */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium">Roles:</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {availableRoles.map(role => (
                        <label key={role} className="inline-flex items-center gap-1">
                          <input
                            type="checkbox"
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
                          {role}
                        </label>
                      ))}
                    </div>
                  </div>
                  {addError && <div className="text-red-500 text-sm mb-2">{addError}</div>}
                  <div className="flex gap-2 items-center mt-4">
                    <Button type="submit" variant="default" disabled={addActionLoading}>
                      {addActionLoading ? "Adding..." : "Add Staff"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddStaff(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Confirm Pop-up Dialog */}
          {confirmPopup && (
            <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center" onClick={() => setConfirmPopup(null)}>
              <div
                className="bg-white dark:bg-slate-800 rounded-xl shadow-lg px-6 py-6 w-full max-w-[360px] relative"
                onClick={e => e.stopPropagation()}
              >
                {confirmPopup.type === "confirmRole" && (
                  <>
                    <div className="text-lg font-semibold mb-2">Confirm Role</div>
                    <div className="mb-4">
                      Confirm <span className="font-medium">{confirmPopup.role}</span> role for member <span className="font-medium">{confirmPopup.member.memberName}</span>?
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        onClick={() => doConfirmRole(confirmPopup.member, confirmPopup.role!)}
                        disabled={actionLoading === "confirm:" + confirmPopup.member.memberId + ":" + confirmPopup.role}
                      >
                        {actionLoading === "confirm:" + confirmPopup.member.memberId + ":" + confirmPopup.role
                          ? "Confirming..."
                          : "Yes, Confirm"
                        }
                      </Button>
                      <Button variant="outline" onClick={() => setConfirmPopup(null)}>Cancel</Button>
                    </div>
                  </>
                )}
                {confirmPopup.type === "removeRole" && (
                  <>
                    <div className="text-lg font-semibold mb-2">Remove Role</div>
                    <div className="mb-4">
                      Remove <span className="font-medium">{confirmPopup.role}</span> role from member <span className="font-medium">{confirmPopup.member.memberName}</span>?
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={() => doRemoveRole(confirmPopup.member, confirmPopup.role!)}
                        disabled={actionLoading === "removerole:" + confirmPopup.member.memberId + ":" + confirmPopup.role}
                      >
                        {actionLoading === "removerole:" + confirmPopup.member.memberId + ":" + confirmPopup.role
                          ? "Removing..."
                          : "Yes, Remove"
                        }
                      </Button>
                      <Button variant="outline" onClick={() => setConfirmPopup(null)}>Cancel</Button>
                    </div>
                  </>
                )}
                {confirmPopup.type === "removeStaff" && (
                  <>
                    <div className="text-lg font-semibold mb-2">Remove Staff/Member</div>
                    <div className="mb-4">
                      Remove member <span className="font-medium">{confirmPopup.member.memberName}</span> and all their roles from this service?
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={() => doRemoveStaff(confirmPopup.member)}
                        disabled={actionLoading === "remove:" + confirmPopup.member.memberId}
                      >
                        {actionLoading === "remove:" + confirmPopup.member.memberId
                          ? "Removing..."
                          : "Yes, Remove"
                        }
                      </Button>
                      <Button variant="outline" onClick={() => setConfirmPopup(null)}>Cancel</Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full bg-transparent" onClick={() => setShowEditService(true)}>
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

      {/* 🎨 MODERN Edit Service Modal - FIXED */}
      {showEditService && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowEditService(false)}>
          <div 
            className="bg-white shadow-2xl rounded-3xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col border-0"
            onClick={e => e.stopPropagation()}
          >
            {/* Modern Header */}
            <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Edit Service</h2>
                  <p className="text-sm text-gray-500 mt-1">Update service details and manage team members</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditService(false)}
                  className="rounded-full h-10 w-10 p-0 hover:bg-gray-100"
                >
                  ✕
                </Button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {editError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="text-red-800 text-sm font-medium">{editError}</div>
                </div>
              )}
              
              <form onSubmit={handleEditService} className="space-y-8" id="edit-service-form">
                {/* Basic Info Card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Service Name</label>
                      <input 
                        type="text" 
                        value={editName} 
                        onChange={e => setEditName(e.target.value)} 
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                        placeholder="Enter service name"
                        required 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select 
                        value={editStatus} 
                        onChange={e => setEditStatus(e.target.value)} 
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="active">🟢 Active</option>
                        <option value="suspended">🔴 Suspended</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea 
                      value={editDescription} 
                      onChange={e => setEditDescription(e.target.value)} 
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none" 
                      rows={4}
                      placeholder="Describe your service..."
                    />
                  </div>
                </div>

                {/* Availability Card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Availability Schedule
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(editAvailability).map(([day, times]) => (
                      <div key={day} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <span className="w-24 capitalize text-sm font-medium text-gray-700">{day}</span>
                        <input 
                          type="time" 
                          value={times.start} 
                          onChange={(e) => setEditAvailability({ ...editAvailability, [day]: { ...times, start: e.target.value } })} 
                          className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                        />
                        <span className="text-gray-400 font-medium">to</span>
                        <input 
                          type="time" 
                          value={times.end} 
                          onChange={(e) => setEditAvailability({ ...editAvailability, [day]: { ...times, end: e.target.value } })} 
                          className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                          onClick={() => {
                            const copy = { ...editAvailability };
                            delete copy[day];
                            setEditAvailability(copy);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <div className="flex items-center gap-2 mt-4">
                      <select 
                        className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                        defaultValue="" 
                        onChange={(e) => {
                          const newDay = e.target.value;
                          if (newDay && !editAvailability[newDay]) {
                            setEditAvailability({ ...editAvailability, [newDay]: { start: "09:00", end: "17:00" } });
                          }
                          e.target.value = "";
                        }}
                      >
                        <option value="">+ Add Day</option>
                        {["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]
                          .filter(d => !Object.keys(editAvailability).includes(d))
                          .map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Existing Members Card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Current Team Members
                  </h3>
                  {service.members && service.members.length > 0 ? (
                    <div className="space-y-4">
                      {service.members.map(member => (
                        <div key={member.memberId} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                          <div className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 text-sm font-medium">
                                {member.memberName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            {member.memberName}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {availableRoles.map(role => (
                              <label key={role} className="group relative">
                                <input 
                                  type="checkbox" 
                                  className="sr-only"
                                  checked={(editedMembers[member.memberId] || member.roles).includes(role)}
                                  onChange={e => handleExistingMemberRoleChange(
                                    member.memberId, 
                                    role, 
                                    e.target.checked
                                  )}
                                />
                                <div className={`
                                  px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-all duration-200
                                  ${(editedMembers[member.memberId] || member.roles).includes(role)
                                    ? 'bg-black text-white shadow-md'
                                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                  }
                                `}>
                                  {role.charAt(0).toUpperCase() + role.slice(1)}
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No team members assigned yet</p>
                    </div>
                  )}   
                </div>

                {/* Add New Members Card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      Add New Members
                    </h3>
                    <Button 
                      type="button" 
                      size="sm"
                      className="bg-black hover:bg-gray-800 text-white rounded-full px-4 py-2 font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                      onClick={handleAddNewMember}
                      disabled={availableMembers.length === 0}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                  </div>
                  
                  {newMembers.length > 0 ? (
                    <div className="space-y-4">
                      {newMembers.map((newMember, index) => (
                        <div key={index} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                          <div className="flex justify-between items-center mb-3">
                            <select 
                              value={newMember.id}
                              onChange={e => handleNewMemberSelect(index, e.target.value)}
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent mr-3"
                            >
                              {availableMembers.map(member => (
                                <option key={member.id} value={member.id}>
                                  {member.name}
                                </option>
                              ))}
                            </select>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                              onClick={() => handleRemoveNewMember(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {availableRoles.map(role => (
                              <label key={role} className="group relative">
                                <input 
                                  type="checkbox"
                                  className="sr-only"
                                  checked={newMember.roles.includes(role)}
                                  onChange={e => handleNewMemberRoleChange(
                                    index,
                                    role,
                                    e.target.checked
                                  )}
                                />
                                <div className={`
                                  px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-all duration-200
                                  ${newMember.roles.includes(role)
                                    ? 'bg-black text-white shadow-md'
                                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                  }
                                `}>
                                  {role.charAt(0).toUpperCase() + role.slice(1)}
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <p className="text-sm">Click &quot;Add Member&quot; to assign new team members</p>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Modern Footer */}
            <div className="px-8 py-6 border-t border-gray-100 bg-gray-50">
              <div className="flex gap-3 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditService(false)}
                  className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  form="edit-service-form" 
                  className="px-8 py-2 bg-black hover:bg-gray-800 text-white rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                  disabled={editLoading}
                >
                  {editLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
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