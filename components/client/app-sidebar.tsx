"use client";

import { useEffect, useState } from "react";
import { Home, User, MessageSquareQuote, LogOut } from "lucide-react";
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
import { signOutAction } from "@/app/actions";

interface User {
  name: string;
  university: string;
  dept: string;
  role: string;
  profile_picture?: string; // Add profile_picture to the interface
}

const traineeItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Profile", url: "/protected/profile", icon: User },
  { title: "Logout", action: "logout", icon: LogOut },
];

const adminItems = [
  { title: "Intern Time Logs", url: "/protected/admin/department", icon: Home },
  {
    title: "Intern Tasks",
    url: "/protected/admin-task/department",
    icon: MessageSquareQuote,
  },
  { title: "Logout", action: "logout", icon: LogOut },
];

const superadminItems = [
  { title: "Intern Time Logs", url: "/protected/admin", icon: Home },
  {
    title: "Intern Tasks",
    url: "/protected/admin-task",
    icon: MessageSquareQuote,
  },
  { title: "Logout", action: "logout", icon: LogOut },
];

export function AppSidebar() {
  const [user, setUser] = useState<{
    name: string;
    dept?: string;
    role?: string;
    profile_picture?: string; // Add profile_picture to state
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchUser() {
      const data: { 
        error?: string; 
        user?: null; 
        message?: string; 
        name?: string; 
        role?: string; 
        dept?: string; 
        university?: string; 
        profile_picture?: string; 
      } = await getIntern();

      if (data.error) {
        console.error("Error fetching user:", data.error);
        setError(data.error);
      } else {
        // Ensure profile_picture is correctly fetched from Supabase and use it in the state
        const profilePictureUrl = data.profile_picture 
          ? data.profile_picture // Profile picture URL from Supabase
          : ""; // Handle case where profile_picture might be empty

        setUser({
          name: data.name || "",
          dept: data.dept,
          role: data.role,
          profile_picture: profilePictureUrl // Add profile picture from data
        });
      }
      setIsLoading(false);
    }

    fetchUser();
  }, []);

  const getMenuItems = () => {
    if (user?.role === "superadmin") {
      return superadminItems;
    } else if (user?.role === "admin") {
      return adminItems;
    } else {
      return traineeItems;
    }
  };

  const menuItems = getMenuItems();

  const handleLogout = async () => {
    await signOutAction();
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel></SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-3 py-4 border-b">
              {/* Profile Picture Section */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0">
                  {user?.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">No image</span>
                    </div>
                  )}
                </div>
                {error ? (
                  <p className="text-red-500 text-sm">{error}</p>
                ) : isLoading ? (
                  <div className="flex flex-col gap-2">
                    <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : user ? (
                  <div className="flex flex-col">
                    <span className="font-medium text-lg">{user.name}</span>
                    {user.role === "admin" && (
                      <>
                        <span className="text-xs text-gray-500">
                          {user.dept || "No Department"} Department
                        </span>
                        <span className="text-xs text-gray-500">
                          {user.role?.toUpperCase()}
                        </span>
                      </>
                    )}
                    {user.role === "trainee" && (
                      <span className="text-xs text-gray-500">
                        {user.dept || "No Department"} Department
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No user data found</p>
                )}
              </div>
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
                menuItems.map((item) =>
                  item.action === "logout" ? (
                    <SidebarMenuItem key={item.title} onClick={handleLogout}>
                      <SidebarMenuButton asChild>
                        <a className="flex items-center gap-2 cursor-pointer">
                          <item.icon size={18} />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ) : (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <a href={item.url} className="flex items-center gap-2">
                          <item.icon size={18} />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
