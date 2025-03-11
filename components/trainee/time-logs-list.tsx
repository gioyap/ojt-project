"use client";

import { useState } from "react";

interface TimeLog {
  time_id: number;
  date: string;
  time_in: string;
  time_out: string;
  total_dayhours: number;
  status_logs: string;
}

export function TimeLogsList({ timeLogs }: { timeLogs: TimeLog[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 3;

  if (timeLogs.length === 0) {
    return <p className="text-gray-400 text-lg">No time logs found yet.</p>;
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  // Calculate total pages and paginated logs
  const totalPages = Math.ceil(timeLogs.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedLogs = timeLogs.slice(startIndex, endIndex);

  // Handle page navigation
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-6">
      <h3 className="text-2xl font-semibold text-white">Your Recent Time Logs</h3>
      <div className="space-y-4">
        {paginatedLogs.map((log) => (
          <div
            key={log.time_id}
            className="bg-white p-5 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <p className="text-lg font-medium text-gray-800">
                {new Date(log.date).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">In:</span> {formatTime(log.time_in)} |{" "}
                <span className="font-medium">Out:</span> {formatTime(log.time_out)}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Hours</p>
                <p className="text-lg font-semibold text-blue-600">{log.total_dayhours}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Status</p>
                <p
                  className={`text-lg font-semibold ${
                    log.status_logs === "Present" ? "text-green-600" : "text-orange-500"
                  }`}
                >
                  {log.status_logs}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-pink-400 text-black rounded-lg shadow-md hover:bg-pink-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
          >
            Previous
          </button>
          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-2 py-1 rounded-full text-xs font-light transition-colors ${
                  currentPage === page
                    ? "bg-yellow-600 text-black"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-pink-400 text-black rounded-lg shadow-md hover:bg-pink-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}