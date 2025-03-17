"use client";

import { useEffect, useState } from "react";
import { Home, User, MessageSquareQuote } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { getIntern } from "@/app/actions";

interface User {
  name: string;
  university: string;
  dept: string;
}

// Sidebar menu items for trainees
const traineeItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Profile", url: "/protected/profile", icon: User },
  {
    title: "Comments",
    url: "/protected/comment-logs",
    icon: MessageSquareQuote,
  },
];

// Sidebar menu items for admins
const adminItems = [
	{title: "Intern Time Logs", url: "/protected/admin", icon: Home },
	{title: "Intern Tasks", url: "/protected/admin-task", icon: MessageSquareQuote }
];

export function AppSidebar() {
  const [user, setUser] = useState<{
    name: string;
    university?: string;
    dept?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchUser() {
      const data = await getIntern();

      if (data.error) {
        console.error("Error fetching user:", data.error);
        setError(data.error);
      } else {
        if (data.message === "ADMIN") {
          setIsAdmin(true);
          setUser({
            name: data.name,
            dept: data.dept, // Ensure this is correctly set
          });
        } else {
          setUser({
            name: data.name ?? "",
            university: data.university,
            dept: data.dept, // Ensure this is correctly set
          });
        }
      }
      setIsLoading(false);
    }

    fetchUser();
  }, []);

  // Debugging: Log the user data
  useEffect(() => {
    console.log("User Data:", user);
  }, [user]);

  const menuItems = isAdmin ? adminItems : traineeItems;

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel></SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-3 py-4 border-b">
              {error ? (
                <p className="text-red-500 text-sm">{error}</p>
              ) : isLoading ? (
                <div className="flex flex-col gap-2">
                  <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ) : isAdmin ? (
                <div className="flex flex-col">
                  <span className="font-medium text-xl">{user?.name}</span>
                  <span className="text-xs text-gray-500">
                    {user?.dept || "No Department"} Department
                  </span>
                </div>
              ) : user ? (
                <div className="flex flex-col">
                  <span className="font-medium text-xl">{user.name}</span>
                  <span className="text-xs text-gray-500">
                    {user.university}
                  </span>
                  <span className="text-xs text-gray-500">
                    {user.dept || "No Department"} Department
                  </span>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No user data found</p>
              )}
            </div>

            <SidebarMenu className="pt-4">
              {isLoading ? (
                <div className="flex flex-col gap-2">
                  {[1, 2].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 animate-pulse"
                    >
                      <div className="w-6 h-6 bg-gray-200 rounded"></div>
                      <div className="w-20 h-4 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.url} className="flex items-center gap-2">
                        <item.icon size={18} />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
