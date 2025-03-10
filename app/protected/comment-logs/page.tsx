import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/client/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CommentTextarea } from "@/components/trainee/comment-textarea";

export default async function CommentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch timelogs with comments
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
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 justify-center">
          <div className="w-full max-w-2xl flex flex-col gap-12 p-2">
            <h2 className="font-bold text-3xl mb-2 mt-8 text-center">
              COMMENTS PAGE
            </h2>
            <div className="grid grid-cols-1 gap-5 w-full text-left">
              {timeLogs?.map((log) => (
                <CommentTextarea
                  key={log.date}
                  initialComment={log.comments}
                  date={log.date}
                  traineeId={user.id}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
