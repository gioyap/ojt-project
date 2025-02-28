"use client";

import { useEffect, useState } from "react";
import { Calendar, Home, Inbox, Search, Settings } from "lucide-react";
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

interface User {
	name: string;
	role: string;
}

// Menu items.
const items = [
	{
		title: "Home",
		url: "#",
		icon: Home,
	},
	{
		title: "Inbox",
		url: "#",
		icon: Inbox,
	},
	{
		title: "Calendar",
		url: "#",
		icon: Calendar,
	},
	{
		title: "Search",
		url: "#",
		icon: Search,
	},
	{
		title: "Settings",
		url: "#",
		icon: Settings,
	},
];

export function AppSidebar() {
	const [users, setUsers] = useState<User[]>([]);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchUsers = async () => {
			try {
				const res = await fetch("/api/users");
				const data = await res.json();

				if (!res.ok) throw new Error(data.error || "Failed to fetch users");

				setUsers(data);
			} catch (err) {
				if (err instanceof Error) {
					setError(err.message);
				} else {
					setError("An unknown error occurred");
				}
			}
		};

		fetchUsers();
	}, []);

	const user = users.length > 0 ? users[0] : null;

	return (
		<Sidebar>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Application</SidebarGroupLabel>
					<SidebarGroupContent>
						{/* User Info Section */}
						<div className="px-3 py-4 border-b">
							{error ? (
								<p className="text-red-500 text-sm">{error}</p>
							) : user ? (
								<div className="flex flex-col">
									<span className="font-medium text-lg">{user.name}</span>
									<span className="text-sm text-gray-500">{user.role}</span>
								</div>
							) : (
								<p className="text-gray-400 text-sm">Loading user...</p>
							)}
						</div>

						{/* Sidebar Menu */}
						<SidebarMenu className="pt-4">
							{items.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton asChild>
										<a href={item.url} className="flex items-center gap-2">
											<item.icon size={18} />
											<span>{item.title}</span>
										</a>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}
