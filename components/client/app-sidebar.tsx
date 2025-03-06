"use client";

import { useEffect, useState } from "react";
import { Home, User } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
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
];

// Sidebar menu items for admins
const adminItems = [
  { title: "Home", url: "/", icon: Home },
];

export function AppSidebar() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Add loading state

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getIntern();

        if (data.error) {
          throw new Error(data.error);
        }

        // Check if the user is an admin
        if (data.message === "ADMIN") {
          setIsAdmin(true);
        } else if (data.name && data.university && data.department) {
          setUser({ name: data.name, university: data.university, dept: data.department });
        } else {
          throw new Error("Invalid user data");
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setIsLoading(false); // Set loading to false after fetching data
      }
    };

    fetchUser();
  }, []);

  // Determine which menu items to display based on the user's role
  const menuItems = isAdmin ? adminItems : traineeItems;

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel></SidebarGroupLabel>
          <SidebarGroupContent>
            {/* User Info Section */}
            <div className="px-3 py-4 border-b">
              {error ? (
                <p className="text-red-500 text-sm">{error}</p>
              ) : isLoading ? (
                // Loading state for user info
                <div className="flex flex-col gap-2">
                  <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div> {/* Name placeholder */}
                  <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div> {/* University placeholder */}
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div> {/* Department placeholder */}
                </div>
              ) : isAdmin ? (
                <div className="flex flex-col">
                  <span className="font-medium text-xl">ADMIN</span>
                </div>
              ) : user ? (
                <div className="flex flex-col">
                  <span className="font-medium text-xl">{user.name}</span>
                  <span className="text-xs text-gray-500">{user.university}</span>
                  <span className="text-xs text-gray-500">{user.dept} Department</span>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No user data found</p>
              )}
            </div>

            {/* Sidebar Menu */}
            <SidebarMenu className="pt-4">
              {isLoading ? (
                // Loading state for menu items
                <div className="flex flex-col gap-2">
                  {[1, 2].map((item) => (
                    <div key={item} className="flex items-center gap-2 animate-pulse">
                      <div className="w-6 h-6 bg-gray-200 rounded"></div> {/* Icon placeholder */}
                      <div className="w-20 h-4 bg-gray-200 rounded"></div> {/* Text placeholder */}
                    </div>
                  ))}
                </div>
              ) : (
                // Render actual menu items
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