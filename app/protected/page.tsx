import { AppSidebar } from "@/components/client/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { TimeLogForm } from "@/components/trainee/time-log-form";
import { TimeLogsList } from "@/components/trainee/time-logs-list";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const { data: timeLogs, error } = await supabase
    .from("timelogs")
    .select("*")
    .eq("trainee_id", user.id)
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching time logs:", error);
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarTrigger className="fixed top-4 left-[260px]" />
      <div className="flex-1 w-full flex flex-col gap-12 max-w-5xl p-5">
        <div className="flex flex-col gap-2 items-start">
          <h2 className="font-bold text-2xl mb-4">TRAINEE PAGE</h2>
          <TimeLogForm traineeId={user.id} />
          <TimeLogsList timeLogs={timeLogs || []} />
        </div>
      </div>
    </SidebarProvider>
  );
}