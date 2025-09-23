"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, RefreshCw } from "lucide-react"
import axios from "axios"
import Image from "next/image"
interface Member {
  member: string
  label: string
  status: string
}

export default function SignInPage() {
  const [username, setUsername] = useState("")
  const [passcode, setPasscode] = useState("")
  const [showPasscode, setShowPasscode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const generateRandomPasscode = () => {
    const randomPasscode = Math.random().toString(36).substring(2, 10).toUpperCase()
    setPasscode(randomPasscode)
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
 /*    e.preventDefault();
if(passcode.length < 6){
  setError("Purchase must be at least characters");
  setIsLoading(false);
  return;
} */
    try {
      const checkUserUrl = `https://espoint.onrender.com/espoint/get_members_records/${username}/approved`
      const userRes = await axios.get(checkUserUrl)

      if (!userRes.data || !userRes.data.msg) {
        throw new Error("Invalid server response")
      }

      const currentUser: Member | undefined = (userRes.data.msg as Member[]).find(
        (m) => m.member === username
      )

      if (!currentUser) {
        throw new Error("User not found or not approved")
      }

      localStorage.setItem(
        "user",
        JSON.stringify({
          username,
          passcode,
          role: currentUser.label,
          status: currentUser.status
        })
      )

      router.push("/dashboard")
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Login failed")
      }
    } finally {
      setIsLoading(false)
    }
  }

 

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <div className="mb-6">
        <Image
          src="/espointtower.jpg"
          alt="Espoint Logo"
          width={110}
          height={110}
          className="mx-auto rounded-md shadow-lg"
          priority
        />
      </div>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the member management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passcode">Passcode</Label>
              <div className="relative">
                <Input
                  id="passcode"
                  type={showPasscode ? "text" : "password"}
                  placeholder="Enter your passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  required
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
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
