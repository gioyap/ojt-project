"use client";

interface SummaryData {
  accomplished_hours: number;
  remaining_hours: number;
  days_present: number;
  days_late: number;
}

interface AttendanceSummaryProps {
  summary: SummaryData;
}

export function AttendanceSummary({ summary }: AttendanceSummaryProps) {
  return (
    <div className="w-full max-w-4xl bg-white p-6 rounded-xl shadow-lg border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">Attendance Summary</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="text-center">
          <p className="text-sm text-gray-600">Accomplished Hours</p>
          <p className="text-lg font-semibold text-blue-600">{summary.accomplished_hours}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Remaining Hours</p>
          <p className="text-lg font-semibold text-blue-600">{summary.remaining_hours}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Days Present</p>
          <p className="text-lg font-semibold text-green-600">{summary.days_present}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Days Late</p>
          <p className="text-lg font-semibold text-orange-500">{summary.days_late}</p>
        </div>
      </div>
    </div>
  );
}