"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { memberApi } from "@/utils/api"
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
import { Plus, Edit, RefreshCw, Trash2 } from "lucide-react"

interface Member {
  id: string
  name: string
  email: string
  passcode: string
  status: "active" | "inactive" | "pending"
  position: "admin" | "manager" | "staff" | "intern" | "contractor"
  createdAt: string
}

const POSITIONS = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "staff", label: "Staff" },
  { value: "intern", label: "Intern" },
  { value: "contractor", label: "Contractor" },
] as const

export default function SettingsPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [error, setError] = useState('')
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    passcode: "",
    status: "pending" as Member["status"],
    position: "staff" as Member["position"],
  })

  

  const [currentUser, setCurrentUser] = useState<{ username: string; position?: string } | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)


  const fetchMembers = async () => {
    setLoading(true);
    try{
      const data = await memberApi.getMembers();
      setMembers(data);
    } catch(error){
      setError("Failed to load members");

    }finally{
      setLoading(false)
    }
  }

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const user = JSON.parse(userData)
      setCurrentUser(user)

      // Check if current user is admin by looking at members data
      const savedMembers = localStorage.getItem("members")
      if (savedMembers) {
        const membersData = JSON.parse(savedMembers)
        const currentMember = membersData.find((m: Member) => m.email === user.username || m.name === user.username)
        setIsAdmin(currentMember?.position === "admin")
      }
    }
  }, [])

  useEffect(() => {
    const savedMembers = localStorage.getItem("members")
    if (savedMembers) {
      setMembers(JSON.parse(savedMembers))
    }
  }, [])

  const saveMembers = (updatedMembers: Member[]) => {
    setMembers(updatedMembers)
    localStorage.setItem("members", JSON.stringify(updatedMembers))
  }

  const generateRandomPasscode = () => {
    const randomPasscode = Math.random().toString(36).substring(2, 10).toUpperCase()
    setFormData((prev) => ({ ...prev, passcode: randomPasscode }))
  }

   const handleAddMember = () => {
    if (!formData.name || !formData.email || !formData.passcode) return

    const newMember: Member = {
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      passcode: formData.passcode,
      status: formData.status,
      position: formData.position,
      createdAt: new Date().toISOString(),
    }

    const updatedMembers = [...members, newMember]
    saveMembers(updatedMembers)

    setFormData({ name: "", email: "", passcode: "", status: "pending", position: "staff" })
    setIsAddDialogOpen(false)
  } 

   
  const handleEditMember = () => {
    if (!editingMember || !formData.name || !formData.email || !formData.passcode) return

    const updatedMembers = members.map((member) =>
      member.id === editingMember.id
        ? {
            ...member,
            name: formData.name,
            email: formData.email,
            passcode: formData.passcode,
            status: formData.status,
            position: formData.position,
          }
        : member,
    )

    saveMembers(updatedMembers)
    setEditingMember(null)
    setFormData({ name: "", email: "", passcode: "", status: "pending", position: "staff" })
    setIsEditDialogOpen(false)
  }

  const handleDeleteMember = (id: string) => {
    const updatedMembers = members.filter((member) => member.id !== id)
    saveMembers(updatedMembers)
  }

  const openEditDialog = (member: Member) => {
    setEditingMember(member)
    setFormData({
      name: member.name,
      email: member.email,
      passcode: member.passcode,
      status: member.status,
      position: member.position,
    })
    setIsEditDialogOpen(true)
  }

  const getStatusColor = (status: Member["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPositionColor = (position: Member["position"]) => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage members, update passcodes, and configure system settings.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Member</DialogTitle>
              <DialogDescription>Create a new member account with generated or custom passcode.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter member name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Select
                  value={formData.position}
                  onValueChange={(value: Member["position"]) => setFormData((prev) => ({ ...prev, position: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map((position) => (
                      <SelectItem key={position.value} value={position.value}>
                        {position.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="passcode">Passcode</Label>
                <div className="flex gap-2">
                  <Input
                    id="passcode"
                    value={formData.passcode}
                    onChange={(e) => setFormData((prev) => ({ ...prev, passcode: e.target.value }))}
                    placeholder="Enter or generate passcode"
                  />
                  <Button type="button" variant="outline" onClick={generateRandomPasscode}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Member["status"]) => setFormData((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>Manage member accounts, update passcodes, and change status.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Passcode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No members found. Add your first member to get started.
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge className={getPositionColor(member.position)}>
                        {POSITIONS.find((p) => p.value === member.position)?.label || member.position}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{member.passcode}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(member.status)}>{member.status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(member.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(member)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteMember(member.id)}>
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>Update member information and passcode.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter member name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-position">Position</Label>
              <Select
                value={formData.position}
                onValueChange={(value: Member["position"]) => setFormData((prev) => ({ ...prev, position: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((position) => (
                    <SelectItem key={position.value} value={position.value}>
                      {position.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-passcode">Passcode</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-passcode"
                  value={formData.passcode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, passcode: e.target.value }))}
                  placeholder="Enter or generate passcode"
                />
                <Button type="button" variant="outline" onClick={generateRandomPasscode}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: Member["status"]) => setFormData((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
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
    </div>
  )
}
