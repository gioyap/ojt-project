// app/protected/page.tsx
import { AppSidebar } from "@/components/client/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { TimeLogForm } from "@/components/trainee/time-log-form";
import { TimeLogsList } from "@/components/trainee/time-logs-list";
import { AttendanceSummary } from "@/components/trainee/attendance-summary";
import { getAttendanceSummaryByTraineeId } from "@/app/actions";
import CommentsList from "@/components/trainee/comments-list";
import GenerateReportButton from "@/components/trainee/generate-report-button";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const { data: timeLogs, error: timeLogsError } = await supabase
    .from("timelogs")
    .select("*")
    .eq("trainee_id", user.id)
    .order("date", { ascending: false });

  if (timeLogsError) {
    console.error("Error fetching time logs:", timeLogsError);
  }

  const { summary: attendanceSummary } = await getAttendanceSummaryByTraineeId(user.id);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarTrigger className="fixed top-4 left-[20px] md:left-[260px] text-black p-2 shadow-lg" />

      {/* Responsive Layout */}
      <div className="min-h-screen p-4 2xl:p-8 bg-white/70 dark:bg-gray-900 w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-extrabold text-3xl text-primary dark:text-white tracking-wide text-center flex-1">
            INTERN DASHBOARD
          </h2>
        </div>

        {/* Centering the columns */}
        <div className="flex justify-center lg:ml-10 xl:ml-44 2xl:ml-0">
          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6 w-full">
            {/* Left Column */}
            <div className="space-y-6 2xl:h-[75vh] overflow-y-auto">
              <TimeLogForm traineeId={user.id} />
              <CommentsList timeLogs={timeLogs || []} traineeId={user.id} />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <AttendanceSummary summary={attendanceSummary} />
              <TimeLogsList timeLogs={timeLogs || []} />
              <GenerateReportButton />
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}