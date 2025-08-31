'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ServicesAPI, Service, ServiceMember, ServiceRole, ServiceStaff, UpdateUnitPayload, RemoveStaffPayload } from "@/utils/servicesApi";
import { memberApi } from "@/utils/memberApi";
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ArrowLeft, Clock, Calendar, Users, Upload } from 'lucide-react';
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

// Helper for role status badge
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

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setCurrentUser(JSON.parse(storedUser));
    } catch (e) {
      setCurrentUser(null);
    }
  }, []);

  // Service fetch
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

  // Fetch available members for add staff
  useEffect(() => {
    if (!id || !showAddStaff) return;
    
    const fetchAvailableMembers = async () => {
      try {
        const userContext = service?.createdBy;
        const approvedMembers = await memberApi.getMembers(userContext, "approved")
        
        const currentServiceStaffIds = service?.members?.map(m => m.memberId) || [];
        
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
        setAvailableRoles(["admin", "content", "booking"]);
      } catch (e) {
        console.error("Failed to fetch available members", e);
        setAvailableMembers([]);
        setAvailableRoles([]);
      }
    };

    fetchAvailableMembers();
  }, [showAddStaff, id, service?.createdBy, service?.members]);

  // Member management functions
  const handleAddNewMember = () => {
    if (availableMembers.length === 0) return;
    const firstAvailableMember = availableMembers.find(m => 
      !newMembers.some(nm => nm.id === m.id) &&
      !(service?.members || []).some(sm => sm.memberId === m.id)
    );
     if (!firstAvailableMember) return;
    setNewMembers([...newMembers, { id: firstAvailableMember.id, roles: [] }]);
  };

  const handleRemoveNewMember = (index: number) => {
    const updated = [...newMembers];
    updated.splice(index, 1);
    setNewMembers(updated);
  };

  const handleNewMemberRoleChange = (index: number, role: string, checked: boolean) => {
    const updated = [...newMembers];
    if (checked) {
      updated[index].roles.push(role);
    } else {
      updated[index].roles = updated[index].roles.filter(r => r !== role);
    }
    setNewMembers(updated);
  };

  const handleExistingMemberRoleChange = (memberId: string, role: string, checked: boolean) => {
    const updated = { ...editedMembers };
    if (checked) {
      updated[memberId] = [...(updated[memberId] || []), role];
    } else {
      updated[memberId] = (updated[memberId] || []).filter(r => r !== role);
    }
    setEditedMembers(updated);
  };

  const handleNewMemberSelect = (index: number, memberId: string) => {
    const updated = [...newMembers];
    updated[index].id = memberId;
    setNewMembers(updated);
  };

  const handleRemoveStaff = (member: ServiceMember) => {
    setConfirmPopup({ type: "removeStaff", member });
  };

  const doRemoveStaff = async (member: ServiceMember) => {
  setActionLoading("remove:" + member.memberId);
  try {
    if (!currentUser || !currentUser.username) {
      throw new Error("No valid user found");
    }

    const payload: RemoveStaffPayload = {
      service_id: service!.id,         // the service you’re editing
      username: currentUser.username,  // the admin / logged in user
      staff: member.memberId           // the member you want to remove
    };

    await ServicesAPI.removeStaff(payload);
    await refreshService(); // reload after removal
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

  /* const doRemoveStaff = async (member: ServiceMember) => {
    setActionLoading("remove:" + member.memberId);
    try {
      if (!currentUser || !currentUser.username) throw new Error("Invalid user");
      await ServicesAPI.removeStaff({ service_id: service!.id, username: currentUser.username, staff: member.memberId });
      await refreshService();
    } finally {
      setActionLoading("");
      setConfirmPopup(null);
    }
  }; */

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
    } catch (err: any) {
      setAddError(err?.message || "Failed to add staff");
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
          <p className="text-muted-foreground mb-4">The service you're looking for doesn't exist.</p>
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

      {/* Edit Service Modal */}
      {showEditService && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowEditService(false)}>
          <div 
            className="bg-white dark:bg-black shadow-xl rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-300 dark:border-gray-700"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">Edit Service</h2>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {editError && <div className="text-red-500 text-sm mb-4">{editError}</div>}
              <form onSubmit={handleEditService} className="space-y-4" id="edit-service-form">
                {/* Basic Info */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Name:</label>
                    <input 
                      type="text" 
                      value={editName} 
                      onChange={e => setEditName(e.target.value)} 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" 
                      required 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Description:</label>
                    <textarea 
                      value={editDescription} 
                      onChange={e => setEditDescription(e.target.value)} 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" 
                      rows={3} 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Status:</label>
                    <select 
                      value={editStatus} 
                      onChange={e => setEditStatus(e.target.value)} 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                {/* Availability Editor */}
                <div className="border-t border-gray-300 dark:border-gray-700 pt-4">
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">Availability:</label>
                  <div className="space-y-2">
                    {Object.entries(editAvailability).map(([day, times]) => (
                      <div key={day} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded">
                        <span className="w-20 capitalize text-sm font-medium text-gray-900 dark:text-white">{day}</span>
                        <input 
                          type="time" 
                          value={times.start} 
                          onChange={(e) => setEditAvailability({ ...editAvailability, [day]: { ...times, start: e.target.value } })} 
                          className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" 
                        />
                        <span className="text-gray-600 dark:text-gray-400">-</span>
                        <input 
                          type="time" 
                          value={times.end} 
                          onChange={(e) => setEditAvailability({ ...editAvailability, [day]: { ...times, end: e.target.value } })} 
                          className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" 
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          className="text-black hover:text-gray-700 dark:text-white dark:hover:text-gray-300"
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
                    
                    <div className="flex items-center gap-2 mt-3">
                      <select 
                        className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" 
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

                {/* Existing Members */}
                <div className="border-t border-gray-300 dark:border-gray-700 pt-4">
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">Existing Members:</label>   
                  {service.members && service.members.length > 0 ? (
                    <div className="space-y-3">
                      {service.members.map(member => (
                        <div key={member.memberId} className="border border-gray-300 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
                          <div className="font-semibold text-gray-900 dark:text-white mb-2">{member.memberName}</div>
                          <div className="flex flex-wrap gap-3">
                            {availableRoles.map(role => (
                              <label key={role} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  className="rounded text-black focus:ring-black dark:text-white dark:focus:ring-white"
                                  checked={(editedMembers[member.memberId] || member.roles).includes(role)}
                                  onChange={e => handleExistingMemberRoleChange(
                                    member.memberId, 
                                    role, 
                                    e.target.checked
                                  )}
                                />
                                <span className="text-sm text-gray-900 dark:text-white">{role}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400 italic text-sm">No members assigned</p>
                  )}   
                </div>

                {/* Add New Members */}
                <div className="border-t border-gray-300 dark:border-gray-700 pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white">
                      Add New Members
                    </label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-black border-black dark:border-white"
                      onClick={handleAddNewMember}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Member
                    </Button>
                  </div>
                  
                  {newMembers.length > 0 ? (
                    <div className="space-y-3">
                      {newMembers.map((newMember, index) => (
                        <div key={index} className="border border-gray-300 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
                          <div className="flex justify-between items-center mb-3">
                            <select 
                              value={newMember.id}
                              onChange={e => handleNewMemberSelect(index, e.target.value)}
                              className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                              className="text-black hover:text-gray-700 dark:text-white dark:hover:text-gray-300"
                              onClick={() => handleRemoveNewMember(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex flex-wrap gap-3">
                            {availableRoles.map(role => (
                              <label key={role} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                <input 
                                  type="checkbox"
                                  className="rounded text-black focus:ring-black dark:text-white dark:focus:ring-white"
                                  checked={newMember.roles.includes(role)}
                                  onChange={e => handleNewMemberRoleChange(
                                    index,
                                    role,
                                    e.target.checked
                                  )}
                                />
                                <span className="text-sm text-gray-900 dark:text-white">{role}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400 italic text-sm">No new members added</p>
                  )}
                </div>
              </form>
            </div>

            {/* Footer with Actions */}
            <div className="px-6 py-4 border-t border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditService(false)}
                  className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  form="edit-service-form" 
                  variant="default"
                  className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-black"
                  disabled={editLoading}
                >
                  {editLoading ? "Saving..." : "Save Changes"}
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