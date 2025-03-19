import { AppSidebar } from "@/components/client/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { TimeLogForm } from "@/components/trainee/time-log-form";
import { TimeLogsList } from "@/components/trainee/time-logs-list";
import { AttendanceSummary } from "@/components/trainee/attendance-summary";
import { getAttendanceSummaryByTraineeId } from "@/app/actions";
import CommentsList from "@/components/trainee/comments-list";

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

	const { summary: attendanceSummary } = await getAttendanceSummaryByTraineeId(
		user.id
	);

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarTrigger className="fixed top-4 left-[20px] md:left-[260px] text-black p-2 shadow-lg" />

			{/* Responsive Layout */}
			<div className="min-h-screen p-4 2xl:p-8 bg-white/70 w-full">
				<h2 className="font-extrabold text-3xl text-primary tracking-wide mb-6 text-center">
					INTERN DASHBOARD
				</h2>

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
						</div>
					</div>
				</div>
			</div>
		</SidebarProvider>
	);
}
