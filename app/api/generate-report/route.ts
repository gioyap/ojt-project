import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const week = parseInt(searchParams.get("week") || "0");
    if (!week) return NextResponse.json({ error: "Week parameter is required" }, { status: 400 });

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return NextResponse.json({ error: "User not authenticated" }, { status: 401 });

    const { data: internData, error: internError } = await supabase
      .from("interns")
      .select("first_name, last_name, university, start_date, hours_to_render, dept_id, program, year_level, section, schedule, host_company")
      .eq("id", user.id)
      .single();
    if (internError || !internData) return NextResponse.json({ error: "Failed to fetch intern data" }, { status: 500 });

    const { data: deptData, error: deptError } = await supabase
      .from("department")
      .select("dept_name")
      .eq("dept_id", internData.dept_id)
      .single();
    const deptName = deptData?.dept_name || "N/A";

    const { data: supervisorData, error: supervisorError } = await supabase
      .from("supervisors")
      .select("first_name, last_name")
      .eq("dept_id", internData.dept_id)
      .limit(1)
      .maybeSingle();
    const supervisorName = supervisorData ? `${supervisorData.first_name} ${supervisorData.last_name}` : "Supervisor Name";

    const traineeStart = new Date(internData.start_date);
    let weekStart = new Date(traineeStart);
    const dayOfWeek = weekStart.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(weekStart.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);

    const selectedWeekStart = new Date(weekStart);
    selectedWeekStart.setDate(selectedWeekStart.getDate() + (week - 1) * 7);
    const selectedWeekEnd = new Date(selectedWeekStart);
    selectedWeekEnd.setDate(selectedWeekEnd.getDate() + 4);
    selectedWeekEnd.setHours(23, 59, 59, 999);

    const actualStart = traineeStart > selectedWeekStart ? traineeStart : selectedWeekStart;

    // Fetch timelogs for the selected week
    const { data: timelogsData, error: timelogsError } = await supabase
      .from("timelogs")
      .select("date, time_in, time_out, total_dayhours, status_logs, comments")
      .eq("trainee_id", user.id)
      .gte("date", actualStart.toISOString().split("T")[0])
      .lte("date", selectedWeekEnd.toISOString().split("T")[0])
      .order("date", { ascending: true });
    if (timelogsError) return NextResponse.json({ error: "Failed to fetch timelogs" }, { status: 500 });

    const filteredTimelogs = (timelogsData || []).filter((log) => {
      const logDate = new Date(log.date);
      return logDate.getDay() >= 1 && logDate.getDay() <= 5;
    });

    // Fetch all timelogs up to the current week to calculate total accumulated hours
    const { data: allTimelogsData, error: allTimelogsError } = await supabase
      .from("timelogs")
      .select("total_dayhours")
      .eq("trainee_id", user.id)
      .lte("date", selectedWeekEnd.toISOString().split("T")[0]);
    if (allTimelogsError) return NextResponse.json({ error: "Failed to fetch all timelogs" }, { status: 500 });

    // Calculate timelog summary
    const hoursToRender = internData.hours_to_render || 0;
    const accumulatedHoursThisWeek = filteredTimelogs.reduce((sum, log) => sum + (log.total_dayhours || 0), 0);
    const totalAccumulatedHours = allTimelogsData.reduce((sum, log) => sum + (log.total_dayhours || 0), 0);
    const totalRemainingHours = Math.max(hoursToRender - totalAccumulatedHours, 0);

    const companyLogos = {
      "Beauty and Butter": "https://dgqbospvmigwtrtfkvor.supabase.co/storage/v1/object/public/companies/logos/bbIcon.png",
      "FINA": "https://dgqbospvmigwtrtfkvor.supabase.co/storage/v1/object/public/companies/logos/finaIcon.png",
      "Flawless": "https://dgqbospvmigwtrtfkvor.supabase.co/storage/v1/object/public/companies/logos/flawlessIcon.png",
      "MTSI": "https://dgqbospvmigwtrtfkvor.supabase.co/storage/v1/object/public/companies/logos/mtsilogo.png",
    };
    const logoUrl = companyLogos[internData.host_company as keyof typeof companyLogos] || companyLogos["Flawless"];

    const fullName = `${internData.first_name} ${internData.last_name}`;
    return NextResponse.json({
      internData: {
        fullName,
        university: internData.university || "N/A",
        startDate: internData.start_date || "N/A",
        hoursToRender,
        deptName,
        program: internData.program || "N/A",
        yearLevel: internData.year_level || "N/A",
        section: internData.section || "N/A",
        schedule: internData.schedule || "N/A",
        timelogs: filteredTimelogs,
        hostCompany: internData.host_company || "Flawless",
      },
      timelogSummary: {
        hoursToRender,
        accumulatedHoursThisWeek,
        totalAccumulatedHours,
        totalRemainingHours,
      },
      week,
      supervisorName,
      logoUrl,
    });
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json({ error: "Failed to generate report data" }, { status: 500 });
  }
}