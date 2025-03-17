// components/admin/TraineeModal.tsx
"use client";

import { useEffect, useState } from "react";
import {
  getTimelogsByTraineeId,
  getAttendanceSummaryByTraineeId,
} from "@/app/actions";

interface TraineeModalProps {
  isOpen: boolean;
  onClose: () => void;
  traineeId: string;
  traineeDetails: any;
}

export const TraineeModal: React.FC<TraineeModalProps> = ({
  isOpen,
  onClose,
  traineeId,
  traineeDetails,
}) => {
  const [timelogs, setTimelogs] = useState<any[]>([]);
  const [filteredTimelogs, setFilteredTimelogs] = useState<any[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<"week" | "month" | "all">("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [error, setError] = useState<string | null>(null); // Add error state

  const ROWS_PER_PAGE = 7;

  useEffect(() => {
    if (isOpen && traineeId) {
      fetchData();
    }
  }, [isOpen, traineeId]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { timelogs, error: timelogsError } = await getTimelogsByTraineeId(traineeId);
      if (timelogsError || !timelogs) {
        setError("Error fetching timelogs");
        return;
      }
      setTimelogs(timelogs);
      setFilteredTimelogs(timelogs);

      const { summary, error: summaryError } = await getAttendanceSummaryByTraineeId(traineeId);
      if (summaryError) {
        setError("Error fetching attendance summary");
        return;
      }
      setAttendanceSummary(summary);
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const getMonthOptions = () => {
    if (!traineeDetails?.start_date || timelogs.length === 0) return [];
    const startDate = new Date(traineeDetails.start_date);
    const today = new Date();
    const monthSet = new Set<string>();

    timelogs.forEach((log) => {
      const logDate = new Date(log.date);
      if (logDate >= startDate && logDate <= today) {
        const monthYear = logDate.toLocaleString("default", {
          month: "long",
          year: "numeric",
        });
        const value = `${logDate.getFullYear()}-${logDate.getMonth()}`;
        monthSet.add(JSON.stringify({ value, label: monthYear }));
      }
    });

    return Array.from(monthSet)
      .map((item) => JSON.parse(item))
      .sort((a, b) => {
        const [yearA, monthA] = a.value.split("-").map(Number);
        const [yearB, monthB] = b.value.split("-").map(Number);
        return yearA - yearB || monthA - monthB;
      });
  };

  const filterTimelogs = (
    type: "week" | "month" | "all",
    monthValue?: string
  ) => {
    const startDate = new Date(traineeDetails?.start_date);
    const today = new Date();

    if (type === "all") {
      setFilteredTimelogs(timelogs);
    } else if (type === "week") {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const filtered = timelogs.filter((log) => {
        const logDate = new Date(log.date);
        return (
          logDate >= startDate && logDate >= startOfWeek && logDate <= endOfWeek
        );
      });
      setFilteredTimelogs(filtered);
    } else if (type === "month" && monthValue) {
      const [year, month] = monthValue.split("-").map(Number);
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      const filtered = timelogs.filter((log) => {
        const logDate = new Date(log.date);
        return (
          logDate >= startDate &&
          logDate >= startOfMonth &&
          logDate <= endOfMonth
        );
      });
      setFilteredTimelogs(filtered);
    }
    setCurrentPage(1);
    setFilterType(type);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const monthValue = e.target.value;
    setSelectedMonth(monthValue);
    if (monthValue) {
      filterTimelogs("month", monthValue);
    }
  };

  const totalPages = Math.ceil(filteredTimelogs.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = startIndex + ROWS_PER_PAGE;
  const paginatedTimelogs = filteredTimelogs.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getRemainingHoursDisplay = () => {
    const remainingHours =
      attendanceSummary?.remaining_hours !== undefined
        ? attendanceSummary.remaining_hours
        : traineeDetails?.hours_to_render || 0;

    return remainingHours <= 0 ? "Completed" : remainingHours;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-semibold text-gray-800">
                {traineeDetails?.first_name} {traineeDetails?.last_name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {traineeDetails?.university}
              </p>
              <p className="text-sm text-gray-600">
                {traineeDetails?.host_company}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close Modal"
            >
              <svg
                className="h-6 w-6 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {error ? (
            <p className="text-red-500 text-sm">{error}</p>
          ) : isLoading ? (
            <div className="flex flex-col gap-2">
              <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ) : (
            <>
              {attendanceSummary && (
                <div className="p-2 rounded-lg mb-6">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
                      <p className="text-xs text-gray-600 uppercase">
                        Accomplished Hours
                      </p>
                      <p className="text-lg font-semibold text-blue-800">
                        {attendanceSummary.accomplished_hours || "0"}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg shadow-sm">
                      <p className="text-xs text-gray-600 uppercase">
                        Remaining Hours
                      </p>
                      <p className="text-lg font-semibold text-green-800">
                        {getRemainingHoursDisplay()}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg shadow-sm">
                      <p className="text-xs text-gray-600 uppercase">
                        Days Present
                      </p>
                      <p className="text-lg font-semibold text-purple-800">
                        {attendanceSummary.days_present || "0"}
                      </p>
                    </div>
                    <div className="bg-red-100 p-4 rounded-lg shadow-sm">
                      <p className="text-xs text-gray-600 uppercase">Days Absent</p>
                      <p className="text-lg font-semibold text-red-500">
                        {attendanceSummary.days_absent || "0"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">Timelogs</h4>
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => filterTimelogs("week")}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        filterType === "week"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      This Week
                    </button>
                    <select
                      title="Month"
                      value={selectedMonth}
                      onChange={handleMonthChange}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        filterType === "month" && selectedMonth
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <option value="">Select Month</option>
                      {getMonthOptions().map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => filterTimelogs("all")}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        filterType === "all"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      All
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Time In
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Time Out
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Hours
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedTimelogs.map((log, index) => (
                        <tr
                          key={log.time_id}
                          className={`transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100`}
                        >
                          <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                            {new Intl.DateTimeFormat("en-US", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }).format(new Date(log.date))}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-center whitespace-nowrap">
                            {new Date(
                              `1970-01-01T${log.time_in}`
                            ).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-center whitespace-nowrap">
                            {new Date(
                              `1970-01-01T${log.time_out}`
                            ).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-center whitespace-nowrap">
                            {log.total_dayhours} Hrs
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                            {log.status_logs}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="mt-4 flex justify-between items-center">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-pink-400 text-white rounded-lg shadow-md hover:bg-pink-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                    >
                      Previous
                    </button>
                    <div className="flex gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                              currentPage === page
                                ? "bg-yellow-600 text-black"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {page}
                          </button>
                        )
                      )}
                    </div>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-pink-400 text-white rounded-lg shadow-md hover:bg-pink-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};