"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, LogOut } from "lucide-react";

export function AdminHeader() {
              return (
                            <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-[#0a0a0a] text-white">
                                          <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                                                        <div className="flex items-center gap-2">
                                                                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-black">
                                                                                    <LayoutDashboard className="h-5 w-5" />
                                                                      </div>
                                                                      <span className="text-xl font-bold tracking-tight text-[var(--primary)]">
                                                                                    ESPOINT <span className="text-white font-light">ADMIN</span>
                                                                      </span>
                                                        </div>

                                                        <nav className="hidden md:flex items-center gap-6">
                                                                      <Link href="/dashboard" className="text-sm font-medium hover:text-[var(--primary)] transition-colors">
                                                                                    Dashboard
                                                                      </Link>
                                                                      <Link href="/dashboard/services" className="text-sm font-medium hover:text-[var(--primary)] transition-colors">
                                                                                    Services
                                                                      </Link>
                                                                      <Link href="/dashboard/bookings" className="text-sm font-medium hover:text-[var(--primary)] transition-colors">
                                                                                    Bookings
                                                                      </Link>
                                                                      <Link href="/dashboard/users" className="text-sm font-medium hover:text-[var(--primary)] transition-colors">
                                                                                    Users
                                                                      </Link>
                                                        </nav>

                                                        <div className="flex items-center gap-4">
                                                                      <Button variant="ghost" size="sm" className="hidden sm:flex text-gray-400 hover:text-white hover:bg-white/10">
                                                                                    <LogOut className="mr-2 h-4 w-4" />
                                                                                    Logout
                                                                      </Button>
                                                                      <Button className="bg-[var(--primary)] text-black hover:bg-[var(--primary)]/90 font-semibold rounded-full px-6">
                                                                                    Bookings
                                                                      </Button>
                                                        </div>
                                          </div>
                            </header>
              );
}
