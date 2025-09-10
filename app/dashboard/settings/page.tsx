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
import { Plus, Edit, Trash2, Eye, RefreshCw, EyeOff } from "lucide-react";
import { memberApi } from "@/utils/memberApi";

// ---- Types ----
export interface Member {
  name: string;
  status: "approved" | "suspended" | "pending";
  labels: "admin" | "regular";
  addedBy?: string;
  createdAt?: string;
}

const LABELS: { value: Member["labels"]; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "regular", label: "Regular" },
];

interface ApiMember {
  member: string;
  label: "admin" | "regular";
  status: "approved" | "pending" | "suspended";
  added_by?: string;
  created?: string;
}

// ---- Component ----
export default function SettingsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"approved" | "pending" | "suspended">("approved");
  const [error, setError] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    labels: Member["labels"];
    status: Member["status"];
    passcode: string;
  }>({
    name: "",
    labels: "regular",
    status: "pending",
    passcode: "",
  });

  const generateRandomPasscode = () => {
    const randomPasscode = Math.random().toString(36).substring(5, 10).toUpperCase();
    setFormData((prev) => ({ ...prev, passcode: randomPasscode }));
  };

  const router = useRouter();
  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {};
  const role: Member["labels"] = user.role || "regular";
  const username: string = user.username || "";

  // ---- Fetch Members ----
  const fetchMembers = async (status: Member["status"] = "approved") => {
    if (!username) return;
    setLoading(true);
    setError("");
    try {
      const data: ApiMember[] = await memberApi.getMembers(username, status);
      setMembers(
        data.map((m) => ({
          name: m.member,
          labels: m.label,
          status: m.status,
          addedBy: m.added_by,
          createdAt: m.created,
        }))
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load members");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!username) {
      alert("You must be logged in to access this page.");
      router.push("/dashboard");
      return;
    }
    fetchMembers(filterStatus);
  }, [username, filterStatus]);

  // ---- Add Member ----
  const handleAddMember = async () => {
    if (!formData.name || !formData.passcode) return alert("Please fill in all fields");
    try {
      if (role !== "admin") throw new Error("Only admins can add members");

      await memberApi.createMember(
        username,
        username,
        formData.name,
        formData.labels,
        formData.passcode,
        formData.status
      );

      fetchMembers(filterStatus);
      setIsAddDialogOpen(false);
      setFormData({ name: "", labels: "regular", status: "pending", passcode: "" });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to add member");
    }
  };

  // ---- Delete Member ----
  const handleDeleteMember = async (memberName: string) => {
    if (!confirm(`Delete member "${memberName}"?`)) return;
    try {
      if (role !== "admin") throw new Error("Only admins can delete members");
      await memberApi.deleteMember(username, username, memberName);
      setMembers((prev) => prev.filter((m) => m.name !== memberName));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete member");
    }
  };

  
  const handleEditMember = async () => {
    if (!editingMember) return;
    try {
      if (role !== "admin") throw new Error("Only admins can edit members");

      await memberApi.updateMemberLabel(username, username, editingMember.name, formData.labels);
      await memberApi.changeMemberStatus(editingMember.name, formData.status, username, username);

      if (formData.passcode && formData.passcode.length >= 5) {
        await memberApi.changeMemberPasscode(editingMember.name, username, username, formData.passcode);
      }

      setMembers((prev) =>
        prev.map((m) =>
          m.name === editingMember.name ? { ...m, labels: formData.labels, status: formData.status } : m
        )
      );

      setIsEditDialogOpen(false);
      setEditingMember(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to edit member");
    }
  };

  const openEditDialog = (member: Member) => {
    setEditingMember(member);
    setFormData({ name: member.name, labels: member.labels, status: member.status, passcode: "" });
    setIsEditDialogOpen(true);
  };

  // ---- Badge Colors ----
  const getStatusColor = (status: Member["status"]) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage members and configure system settings.</p>
        </div>

        { (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Member</DialogTitle>
                <DialogDescription>Create a new member account.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passcode">Passcode</Label>
                  <div className="relative">
                    <Input
                      id="passcode"
                      type={showPasscode ? "text" : "password"}
                      placeholder="Enter passcode"
                      value={formData.passcode}
                      onChange={(e) => setFormData((prev) => ({ ...prev, passcode: e.target.value }))}
                      required
                      maxLength={5}
                      className="pr-20"
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setShowPasscode(!showPasscode)}
                      >
                        {showPasscode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={generateRandomPasscode}
                        title="Generate random passcode"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Labels</Label>
                  <Select
                    value={formData.labels}
                    onValueChange={(value: Member["labels"]) => setFormData({ ...formData, labels: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LABELS.map((label) => (
                        <SelectItem key={label.value} value={label.value}>
                          {label.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: Member["status"]) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMember}>Add Member</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* MEMBERS TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>List of members and who added them.</CardDescription>
          <div className="flex gap-2">
            <label>Status:</label>
            <Select value={filterStatus} onValueChange={(value: Member["status"]) => setFilterStatus(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading members...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Added By</TableHead>
                  <TableHead>Labels</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created on</TableHead>
                  {role === "admin" && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.filter((m) => filterStatus === "approved" || m.status === filterStatus).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={role === "admin" ? 6 : 5} className="text-center">
                      No members found.
                    </TableCell>
                  </TableRow>
                ) : (
                  members
                    .filter((m) => filterStatus === "approved" || m.status === filterStatus)
                    .map((m, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{m.name}</TableCell>
                        <TableCell>{m.addedBy || "-"}</TableCell>
                        <TableCell>
                          <Badge>{m.labels}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(m.status)}>{m.status}</Badge>
                        </TableCell>
                        <TableCell>{m.createdAt}</TableCell>
                        {role === "admin" && (
                          <TableCell className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEditDialog(m)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteMember(m.name)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* EDIT DIALOG */}
      {role === "admin" && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Member</DialogTitle>
              <DialogDescription>Update member information.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={formData.name} disabled />
              </div>
              <div className="space-y-2">
                <Label>Labels</Label>
                <Select
                  value={formData.labels}
                  onValueChange={(value: Member["labels"]) => setFormData({ ...formData, labels: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LABELS.map((label) => (
                      <SelectItem key={label.value} value={label.value}>
                        {label.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="passcode">Passcode</Label>
                <div className="relative">
                  <Input
                    id="passcode"
                    type={showPasscode ? "text" : "password"}
                    placeholder="Enter passcode"
                    onChange={(e) => setFormData((prev) => ({ ...prev, passcode: e.target.value }))}
                    required
                    value={formData.passcode}
                    className="pr-20"
                  />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setShowPasscode(!showPasscode)}
                    >
                      {showPasscode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={generateRandomPasscode}
                      title="Generate random passcode"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Member["status"]) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditMember}>Update Member</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
