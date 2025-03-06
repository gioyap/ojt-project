import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/profile/profile-form";
import { AppSidebar } from "@/components/client/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

type Intern = {
  id: string;
  name: string;
  email: string;
  department: {
    dept_name: string;
  };
};

export default async function ProfilePage() {
  const supabase = await createClient();

  // Get the current user's session
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login"); // Redirect to login if not authenticated
  }

  interface ProfileFormProps {
    intern: Intern;
    deptName: string;
  }

  // Fetch intern data including department name
  const { data: intern, error } = await supabase
    .from("interns")
    .select("*, department(dept_name)")
    .eq("id", user.id)
    .single();

  if (error || !intern) {
    console.error("Error fetching intern data:", error);
    return <div className="p-5 text-red-500">Error loading profile data. Please try again later.</div>;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarTrigger className="fixed top-4 left-[260px]" />
      
      <div className="flex-1 w-full flex flex-col gap-12 max-w-5xl p-5">
        <h2 className="font-bold text-2xl mb-4">PROFILE PAGE</h2>
        <ProfileForm intern={intern} deptName={intern.department.dept_name} />
      </div>
    </SidebarProvider>
  );
}
