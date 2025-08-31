'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ServicesAPI, Service } from '@/utils/servicesApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, Save } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

const EditServicePage = () => {
  const params = useParams()
  const router = useRouter()
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : ''

  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('active')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    ServicesAPI.getUnit(id)
      .then((res) => {
        setService(res)
        setName(res.name || '')
        setDescription(res.description || '')
        setStatus(res.status || 'active')
      })
      .catch((err) => {
        console.error(err)
        setError('Failed to load service')
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleSave = async () => {
    if (!service) return
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const payload = {
        service_id: service.id,
        username: service.createdBy || 'admin',
        data: {
          service_name: name,
          description,
          status,
        },
      }

      await ServicesAPI.updateUnit(payload) // ✅ use updateUnit API
      setSuccess(true)
      // Redirect after short delay
      setTimeout(() => router.push(`/dashboard/services/${service.id}`), 1500)
    } catch (err) {
      console.error('Save failed', err)
      setError('Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading service...</div>
  }

  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-xl font-bold mb-4">Service Not Found</h2>
        <Button onClick={() => router.push('/dashboard/services')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Services
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Service</h1>
        <Button variant="outline" onClick={() => router.push(`/dashboard/services/${service.id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Service Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Service Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <div className="mt-2">
              <Badge
                className={
                  status === 'active'
                    ? 'bg-green-500/20 text-green-700'
                    : status === 'pending'
                    ? 'bg-yellow-500/20 text-yellow-700'
                    : 'bg-red-500/20 text-red-700'
                }
              >
                {status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">Changes saved! Redirecting...</p>}
    </div>
  )
}

export default EditServicePage
