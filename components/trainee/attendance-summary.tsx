"use client";

interface SummaryData {
  accomplished_hours: number;
  remaining_hours: number;
  days_present: number;
  days_absent: number;
}

interface AttendanceSummaryProps {
  summary: SummaryData;
}

export function AttendanceSummary({ summary }: AttendanceSummaryProps) {
  // Check if remaining hours is zero or negative (completed)
  const isCompleted = summary.remaining_hours <= 0;

  return (
    <div className="w-full max-w-4xl bg-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl shadow-sm sm:shadow-lg border border-gray-200">
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6 text-center sm:text-left">
        Attendance Summary
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="text-center py-2">
          <p className="text-xs sm:text-sm text-gray-600">Accomplished Hours</p>
          <p className="text-xl sm:text-2xl font-semibold text-blue-600">
            {summary.accomplished_hours}
          </p>
        </div>
        <div className="text-center py-2">
          <p className="text-xs sm:text-sm text-gray-600">Remaining Hours</p>
          <p className="text-xl sm:text-2xl font-semibold text-blue-600">
            {isCompleted ? "Completed" : summary.remaining_hours}
          </p>
        </div>
        <div className="text-center py-2">
          <p className="text-xs sm:text-sm text-gray-600">Days Present</p>
          <p className="text-xl sm:text-2xl font-semibold text-green-600">
            {summary.days_present}
          </p>
        </div>
        <div className="text-center py-2">
          <p className="text-xs sm:text-sm text-gray-600">Days Absent</p>
          <p className="text-xl sm:text-2xl font-semibold text-red-500">
            {summary.days_absent}
          </p>
        </div>
      </div>
    </div>
  );
}