import { AppSidebar } from "@/components/client/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { TimeLogForm } from "@/components/trainee/time-log-form";
import { TimeLogsList } from "@/components/trainee/time-logs-list";
import { AttendanceSummary } from "@/components/trainee/attendance-summary";
import { getAttendanceSummaryByTraineeId } from "@/app/actions";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch time logs
  const { data: timeLogs, error: timeLogsError } = await supabase
    .from("timelogs")
    .select("*")
    .eq("trainee_id", user.id)
    .order("date", { ascending: false });

  if (timeLogsError) {
    console.error("Error fetching time logs:", timeLogsError);
  }

  // Fetch attendance summary
  const { summary: attendanceSummary } = await getAttendanceSummaryByTraineeId(user.id);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarTrigger className="fixed top-4 left-[260px] text-white p-2 shadow-lg" />
      <div className="flex-1 w-full flex justify-center items-start min-h-screen p-8">
        <div className="flex flex-col gap-12 w-full max-w-5xl">
          <div className="flex flex-col gap-6 items-start">
            <h2 className="font-extrabold text-3xl text-white tracking-wide">
              INTERN DASHBOARD
            </h2>
            <TimeLogForm traineeId={user.id} />
            <AttendanceSummary summary={attendanceSummary} />
            <TimeLogsList timeLogs={timeLogs || []} />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}