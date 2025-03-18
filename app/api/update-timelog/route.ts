import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const calculateTotalHours = (timeIn: string, timeOut: string): number => {
  const inHours = Math.floor(Number(timeIn.split(":")[0]));
  const outHours = Math.floor(Number(timeOut.split(":")[0]));

  const workStartHour = 8;
  const breakStart = 12;
  const breakEnd = 13;
  const maxWorkEndHour = 18;

  let effectiveStartHour = inHours;
  if (inHours < workStartHour) {
    effectiveStartHour = workStartHour;
  }
  if (inHours >= breakStart && inHours < breakEnd) {
    effectiveStartHour = breakEnd;
  }

  let effectiveEndHour = outHours;
  if (outHours > maxWorkEndHour) {
    effectiveEndHour = maxWorkEndHour;
  }

  let totalHours = effectiveEndHour - effectiveStartHour;
  if (effectiveStartHour < breakStart && effectiveEndHour > breakStart) {
    totalHours -= 1;
  }

  return Math.max(0, totalHours);
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const { time_id, time_in, time_out } = await request.json();

  // Validate input
  if (!time_id || !time_in || !time_out) {
    return NextResponse.json(
      { error: "Missing required fields: time_id, time_in, or time_out" },
      { status: 400 }
    );
  }

  if (time_in >= time_out) {
    return NextResponse.json(
      { error: "Time in must be before time out" },
      { status: 400 }
    );
  }

  const total_dayhours = calculateTotalHours(time_in, time_out);

  // Fetch original log with status_logs included
  const { data: originalLog, error: originalLogError } = await supabase
    .from("timelogs")
    .select("trainee_id, total_dayhours, date, status_logs")
    .eq("time_id", time_id)
    .single();

  if (originalLogError || !originalLog) {
    return NextResponse.json(
      { error: "Time log not found or error fetching original data" },
      { status: 404 }
    );
  }

  const logDate = new Date(originalLog.date);
  const today = new Date();
  logDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  if (logDate.getTime() === today.getTime()) {
    return NextResponse.json(
      { error: "Editing time log for today's date is not allowed" },
      { status: 400 }
    );
  }

  const originalHours = originalLog.total_dayhours;
  const hoursDifference = total_dayhours - originalHours;
  const wasAbsent = originalLog.status_logs === "Absent";
  const statusChangeToPresent = wasAbsent && total_dayhours > 0;

  // Update timelogs with status_logs
  const { error: timelogError } = await supabase
    .from("timelogs")
    .update({
      time_in,
      time_out,
      total_dayhours,
      status_logs: total_dayhours > 0 ? "Present" : "Absent",
    })
    .eq("time_id", time_id);

  if (timelogError) {
    return NextResponse.json({ error: timelogError.message }, { status: 500 });
  }

  const { data: internData, error: internError } = await supabase
    .from("interns")
    .select("hours_to_render")
    .eq("id", originalLog.trainee_id)
    .single();

  if (internError || !internData) {
    return NextResponse.json({ error: "Error fetching intern data" }, { status: 500 });
  }

  const hoursToRender = internData.hours_to_render;

  // Fetch summary with days_present and days_absent
  const { data: summaryData, error: summaryFetchError } = await supabase
    .from("attendancesummary")
    .select("accomplished_hours, remaining_hours, days_present, days_absent")
    .eq("trainee_id", originalLog.trainee_id)
    .single();

  if (summaryFetchError || !summaryData) {
    return NextResponse.json({ error: "Error fetching attendance summary" }, { status: 500 });
  }

  const newAccomplishedHours = summaryData.accomplished_hours + hoursDifference;
  const newRemainingHours = hoursToRender - newAccomplishedHours;
  
  // Update days_present/days_absent only if status changed from Absent to Present
  let updatedDaysPresent = summaryData.days_present;
  let updatedDaysAbsent = summaryData.days_absent;
  
  if (statusChangeToPresent) {
    updatedDaysPresent += 1;
    updatedDaysAbsent = Math.max(0, updatedDaysAbsent - 1);
  }

  const { error: summaryError } = await supabase
    .from("attendancesummary")
    .update({
      accomplished_hours: newAccomplishedHours,
      remaining_hours: newRemainingHours >= 0 ? newRemainingHours : 0,
      days_present: updatedDaysPresent,
      days_absent: updatedDaysAbsent,
    })
    .eq("trainee_id", originalLog.trainee_id);

  if (summaryError) {
    return NextResponse.json({ error: summaryError.message }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    total_dayhours,
    status_logs: total_dayhours > 0 ? "Present" : "Absent"
  });
}