import React, { useEffect, useState } from "react";
import { Briefcase } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ServiceCount {
  active: number;
}

const ServicesCount = () => {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [serviceCount, setServiceCount] = useState<ServiceCount | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (!storedUser?.username) {
      setError("No user found ");
      return;
    }
    setUser(storedUser);

    const username = storedUser.username;
    const url = `https://espoint.onrender.com/espoint/get_all_service_count/${username}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("failed to fetch");
        return res.json();
      })
      .then((data) => {
        if (data.msg) {
          setServiceCount(data.msg); // msg = { active: 2 }
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="text-red-500 mt-20">{error}</div>;
  if (!serviceCount) return <div className="mt-20">No services</div>;

  return (
    <div className="">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Active Services
            <Briefcase className="h-5 w-5 text-muted-foreground" />
          </CardTitle>
          <CardDescription>Currently active services</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{serviceCount.active}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServicesCount;
