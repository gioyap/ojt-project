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
	const { summary: attendanceSummary } = await getAttendanceSummaryByTraineeId(
		user.id
	);

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarTrigger className="fixed top-4 left-[260px] text-black p-2 shadow-lg" />

			{/* Page Background with Image */}
			<div
				className="h-screen overflow-hidden"
				style={{
					backgroundImage: "url('/landing-bg.png')",
					backgroundSize: "cover",
					backgroundPosition: "center",
				}}
			>
				{/* Grid Layout */}
				<div className="grid grid-cols-3 gap-6 p-10 h-full bg-white/50 backdrop-blur-md rounded-lg">
					{/* Main Content Area */}
					<div className="col-span-2 flex flex-col gap-10 items-center">
						<h2 className="font-extrabold text-3xl text-primary tracking-wide">
							INTERN DASHBOARD
						</h2>

						{/* Scrollable Center Section */}
						<div className="flex flex-col gap-6 h-[75vh] overflow-y-auto border rounded-lg shadow-md p-6 bg-white/80">
							<TimeLogForm traineeId={user.id} />
							<CommentsList timeLogs={timeLogs || []} traineeId={user.id} />
						</div>
					</div>

					{/* Sidebar */}
					<div className="col-span-1 flex flex-col gap-6 pr-6">
						<div>
							<h3 className="font-bold text-xl mb-4 text-gray-800">
								Attendance Summary
							</h3>
							<AttendanceSummary summary={attendanceSummary} />
						</div>
						<div>
							<h3 className="font-bold text-xl mb-4 text-gray-800">
								Time Logs
							</h3>
							<TimeLogsList timeLogs={timeLogs || []} />
						</div>
					</div>
				</div>
			</div>
		</SidebarProvider>
	);
}
