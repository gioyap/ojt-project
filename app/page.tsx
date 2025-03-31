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
		.select("*, editcount") // Include editcount in the query
		.eq("trainee_id", user.id)
		.order("date", { ascending: false });

	if (timeLogsError) {
		console.error("Error fetching time logs:", timeLogsError);
	}

	const { summary: attendanceSummary } = await getAttendanceSummaryByTraineeId(
		user.id
	);

	return (
		<SidebarProvider>
			<AppSidebar />
			<div className="flex flex-col min-h-screen w-full bg-white/70 dark:bg-gray-900">
				{/* Sidebar Trigger */}
				<SidebarTrigger className="relative -top-12 left-4 p-4 shadow-lg hover:from-blue-800 hover:to-purple-700 transition-all" />

				{/* Main Content */}
				<div className="p-2 sm:p-4 md:p-6 2xl:p-8 flex-1">
					<div className="flex justify-between items-center mb-4 sm:mb-6">
						<h2 className="font-extrabold text-2xl sm:text-3xl text-primary dark:text-white tracking-wide text-center flex-1">
							INTERN DASHBOARD
						</h2>
					</div>

					{/* Responsive Grid */}
					<div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-2 gap-4 sm:gap-6 w-full max-w-screen-2xl mx-auto">
						{/* Left Column */}
						<div className="space-y-4 sm:space-y-6 md:h-[80vh] md:overflow-y-auto">
							<TimeLogForm traineeId={user.id} />
							<CommentsList timeLogs={timeLogs || []} traineeId={user.id} />
						</div>

						{/* Right Column */}
						<div className="space-y-4 sm:space-y-6">
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
