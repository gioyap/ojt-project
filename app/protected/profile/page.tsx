import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/profile/profile-form";
import { AppSidebar } from "@/components/client/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

type Intern = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_no: string;
  university: string;
  start_date: string;
  hours_to_render: string;
  dept_id: string;
  program: string;
  year_level: number;
  section: string;
  host_company: string;
  schedule: string;
  profile_picture: string | null; // This will hold the URL to the profile picture
  department: {
    dept_name: string;
  };
};

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: intern, error } = await supabase
    .from("interns")
    .select("*, department(dept_name)")
    .eq("id", user.id)
    .single();

  if (error || !intern) {
    console.error("Error fetching intern data:", error);
    return (
      <SidebarProvider>
        <AppSidebar />
        <div className="flex-1 w-full flex justify-center items-start min-h-screen bg-gradient-to-br from-blue-900 to-gray-900 p-8">
          <div className="text-red-500 text-lg">Error loading profile data. Please try again later.</div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarTrigger className="relative -top-12 left-4 p-4 shadow-lg hover:from-blue-800 hover:to-purple-700 transition-all" />
      <div className="flex-1 w-full flex justify-center items-start min-h-screen p-8">
        <div className="flex flex-col gap-12 w-full max-w-5xl items-center">
          <h2 className="font-extrabold text-3xl text-black tracking-wide text-center">
            PROFILE PAGE
          </h2>
          {/* Passing intern and deptName to ProfileForm component */}
          <ProfileForm intern={intern} deptName={intern.department.dept_name} />
        </div>
      </div>
    </SidebarProvider>
  );
}
