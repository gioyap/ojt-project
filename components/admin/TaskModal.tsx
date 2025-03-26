"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  traineeId: string;
  traineeDetails: any;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  traineeId,
  traineeDetails,
}) => {
  const supabase = createClient();
  const [tasks, setTasks] = useState<any[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<"week" | "month" | "all">("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ROWS_PER_PAGE = 7;

  useEffect(() => {
    if (isOpen && traineeId) {
      fetchTasks();
    }
  }, [isOpen, traineeId]);

  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: tasksData, error: tasksError } = await supabase
        .from("timelogs")
        .select("date, comments")
        .eq("trainee_id", traineeId)
        .order("date", { ascending: true });

      if (tasksError || !tasksData) {
        setError("Error fetching tasks");
        return;
      }

      setTasks(tasksData);
      setFilteredTasks(tasksData);
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const getMonthOptions = () => {
    if (!traineeDetails?.start_date || tasks.length === 0) return [];
    const startDate = new Date(traineeDetails.start_date);
    const today = new Date();
    const monthSet = new Set<string>();

    tasks.forEach((task) => {
      const taskDate = new Date(task.date);
      if (taskDate >= startDate && taskDate <= today) {
        const monthYear = taskDate.toLocaleString("default", {
          month: "long",
          year: "numeric",
        });
        const value = `${taskDate.getFullYear()}-${taskDate.getMonth()}`;
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

  const filterTasks = (type: "week" | "month" | "all", monthValue?: string) => {
    const startDate = new Date(traineeDetails?.start_date);
    const today = new Date();

    if (type === "all") {
      setFilteredTasks(tasks);
    } else if (type === "week") {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const filtered = tasks.filter((task) => {
        const taskDate = new Date(task.date);
        return taskDate >= startDate && taskDate >= startOfWeek && taskDate <= endOfWeek;
      });
      setFilteredTasks(filtered);
    } else if (type === "month" && monthValue) {
      const [year, month] = monthValue.split("-").map(Number);
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);

      const filtered = tasks.filter((task) => {
        const taskDate = new Date(task.date);
        return taskDate >= startDate && taskDate >= startOfMonth && taskDate <= endOfMonth;
      });
      setFilteredTasks(filtered);
    }
    setCurrentPage(1);
    setFilterType(type);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const monthValue = e.target.value;
    setSelectedMonth(monthValue);
    if (monthValue) {
      filterTasks("month", monthValue);
    }
  };

  const totalPages = Math.ceil(filteredTasks.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = startIndex + ROWS_PER_PAGE;
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0">
            <div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 break-words">
                {traineeDetails?.first_name} {traineeDetails?.last_name}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">
                {traineeDetails?.university}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 break-words">
                {traineeDetails?.host_company}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 sm:p-2 rounded-full hover:bg-gray-100 transition-colors self-end sm:self-start"
              aria-label="Close Modal"
            >
              <svg
                className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500"
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

        <div className="p-4 sm:p-6">
          {error ? (
            <p className="text-red-500 text-xs sm:text-sm text-center">{error}</p>
          ) : isLoading ? (
            <div className="flex flex-col gap-2">
              <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-center mb-3 sm:mb-4 gap-3 sm:gap-0">
                <h4 className="text-base sm:text-lg font-semibold text-gray-800">
                  Task Accomplishments
                </h4>
                <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
                  <button
                    onClick={() => filterTasks("week")}
                    className={`w-full sm:w-auto px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
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
                    className={`w-full sm:w-40 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                    onClick={() => filterTasks("all")}
                    className={`w-full sm:w-auto px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                      filterType === "all"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    All
                  </button>
                </div>
              </div>

              {/* Card layout for phones */}
              <div className="block sm:hidden space-y-3">
                {paginatedTasks.map((task, index) => (
                  <div
                    key={`${task.date}-${index}`}
                    className={`p-4 rounded-lg border border-gray-200 shadow-sm ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-gray-100 transition-colors`}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between">
                        <span className="text-xs font-medium text-gray-600">Date</span>
                        <span className="text-xs text-gray-900 whitespace-nowrap">
                          {new Intl.DateTimeFormat("en-US", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }).format(new Date(task.date))}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-600">Comments</span>
                        <span className="text-xs text-gray-900 break-words">
                          {task.comments || "No comments"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Table for small screens and above */}
              <div className="hidden sm:block rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Comments
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedTasks.map((task, index) => (
                      <tr
                        key={`${task.date}-${index}`}
                        className={`transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100`}
                      >
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                          {new Intl.DateTimeFormat("en-US", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }).format(new Date(task.date))}
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 break-words">
                          {task.comments || "No comments"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-full sm:w-auto px-3 py-1.5 sm:px-4 sm:py-2 bg-pink-400 text-white rounded-lg shadow-md hover:bg-pink-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all text-xs sm:text-sm"
                  >
                    Previous
                  </button>
                  <div className="flex gap-1 sm:gap-2 flex-wrap justify-center">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-2 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                          currentPage === page
                            ? "bg-yellow-600 text-black"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="w-full sm:w-auto px-3 py-1.5 sm:px-4 sm:py-2 bg-pink-400 text-white rounded-lg shadow-md hover:bg-pink-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all text-xs sm:text-sm"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};