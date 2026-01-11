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
    <div className="space-y-8 ">
      {/* HERO HEADER - Implemented based on reference design */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0a0a0a] px-8 py-12 shadow-2xl">
        {/* Abstract background elements to mimic the reference image glow */}
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
              System <span className="text-primary">Settings</span>
            </h1>
            <p className="text-gray-400 max-w-lg text-lg">
              Manage team members, permissions, and system configurations to empower your business operations.
            </p>
          </div>

          {role === "admin" && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-12 px-8 rounded-full bg-primary text-black hover:bg-primary/90 font-bold text-base shadow-[0_0_20px_rgba(255,193,7,0.3)] transition-all hover:scale-105">
                  <Plus className="mr-2 h-5 w-5" /> Add Member
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] rounded-2xl border-border/50 shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">Add New Member</DialogTitle>
                  <DialogDescription>Create a new member account.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="border-border/60 rounded-xl bg-muted/20" />
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
                        className="pr-20 border-border/60 rounded-xl bg-muted/20"
                      />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary rounded-lg"
                          onClick={() => setShowPasscode(!showPasscode)}
                        >
                          {showPasscode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary rounded-lg"
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
                      <SelectTrigger className="border-border/60 rounded-xl bg-muted/20">
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
                      <SelectTrigger className="border-border/60 rounded-xl bg-muted/20">
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
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="rounded-full border-border">
                    Cancel
                  </Button>
                  <Button onClick={handleAddMember} className="bg-primary text-black hover:bg-primary/90 font-bold rounded-full px-6">Add Member</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* MEMBERS TABLE */}
      <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden ring-1 ring-border/10">
        <CardHeader className="bg-white border-b border-border/10 pb-6 pt-6 px-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <div className="h-8 w-1 bg-primary rounded-full"></div>
                Members List
              </CardTitle>
            </div>
            <div className="flex items-center gap-3 bg-muted/30 p-1 rounded-full border border-border/20">
              <label className="text-sm font-medium text-muted-foreground pl-3">Filter:</label>
              <Select value={filterStatus} onValueChange={(value: Member["status"]) => setFilterStatus(value)}>
                <SelectTrigger className="w-[140px] bg-white border-0 shadow-sm rounded-full h-8 text-xs font-medium">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
              <p className="text-muted-foreground">Loading members...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-destructive bg-destructive/5 m-4 rounded-2xl">{error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/20 bg-muted/5">
                  <TableHead className="font-bold text-foreground pl-8 h-12">Name</TableHead>
                  <TableHead className="font-bold text-foreground h-12">Added By</TableHead>
                  <TableHead className="font-bold text-foreground h-12">Labels</TableHead>
                  <TableHead className="font-bold text-foreground h-12">Status</TableHead>
                  <TableHead className="font-bold text-foreground h-12">Created on</TableHead>
                  {role === "admin" && <TableHead className="font-bold text-foreground text-right pr-8 h-12">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.filter((m) => filterStatus === "approved" || m.status === filterStatus).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={role === "admin" ? 6 : 5} className="text-center py-12 text-muted-foreground">
                      No members found matching filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  members
                    .filter((m) => filterStatus === "approved" || m.status === filterStatus)
                    .map((m, idx) => (
                      <TableRow key={idx} className="hover:bg-primary/5 border-border/20 transition-colors">
                        <TableCell className="font-semibold pl-8 py-4">{m.name}</TableCell>
                        <TableCell className="text-muted-foreground py-4">{m.addedBy || "-"}</TableCell>
                        <TableCell className="py-4">
                          <Badge variant="outline" className="font-medium bg-white text-foreground border-border/40 px-3 py-1 rounded-full uppercase text-[10px] tracking-wider">{m.labels}</Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge className={`${getStatusColor(m.status)} font-bold shadow-none border-0 px-3 py-1 rounded-full uppercase text-[10px] tracking-wider`}>{m.status}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm py-4">{m.createdAt}</TableCell>
                        {role === "admin" && (
                          <TableCell className="flex justify-end gap-2 pr-8 py-4">
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => openEditDialog(m)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => handleDeleteMember(m.name)}>
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
