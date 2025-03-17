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

  // Server-side validation: time_in must be before time_out
  if (time_in >= time_out) {
    return NextResponse.json(
      { error: "Time in must be before time out" },
      { status: 400 }
    );
  }

  const total_dayhours = calculateTotalHours(time_in, time_out);

  const { data: originalLog, error: originalLogError } = await supabase
    .from("timelogs")
    .select("trainee_id, total_dayhours, date")
    .eq("time_id", time_id)
    .single();

  if (originalLogError || !originalLog) {
    return NextResponse.json(
      { error: "Time log not found or error fetching original data" },
      { status: 404 }
    );
  }

  // Validate that the date isn’t today
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

  const { error: timelogError } = await supabase
    .from("timelogs")
    .update({
      time_in,
      time_out,
      total_dayhours,
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

  const { data: summaryData, error: summaryFetchError } = await supabase
    .from("attendancesummary")
    .select("accomplished_hours, remaining_hours")
    .eq("trainee_id", originalLog.trainee_id)
    .single();

  if (summaryFetchError || !summaryData) {
    return NextResponse.json({ error: "Error fetching attendance summary" }, { status: 500 });
  }

  const newAccomplishedHours = summaryData.accomplished_hours + hoursDifference;
  const newRemainingHours = hoursToRender - newAccomplishedHours;

  const { error: summaryError } = await supabase
    .from("attendancesummary")
    .update({
      accomplished_hours: newAccomplishedHours,
      remaining_hours: newRemainingHours >= 0 ? newRemainingHours : 0,
    })
    .eq("trainee_id", originalLog.trainee_id);

  if (summaryError) {
    return NextResponse.json({ error: summaryError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, total_dayhours });
}