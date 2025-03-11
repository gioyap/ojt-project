import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/client/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import CommentsList from "@/components/trainee/comments-list"; // Client component for pagination

export default async function CommentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const { data: timeLogs, error } = await supabase
    .from("timelogs")
    .select("date, comments")
    .eq("trainee_id", user.id)
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching time logs:", error);
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarTrigger className="fixed top-4 left-[260px] text-white p-2 shadow-lg" />
      <div className="flex-1 w-full flex justify-center items-start min-h-screen p-8">
        <div className="w-full max-w-2xl flex flex-col gap-12">
          <h2 className="font-extrabold text-3xl text-white tracking-wide text-center">
            TASKS ACCOMPLISHMENT
          </h2>
          <CommentsList timeLogs={timeLogs || []} traineeId={user.id} />
        </div>
      </div>
    </SidebarProvider>
  );
}