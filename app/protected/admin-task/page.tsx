"use client";

import { AppSidebar } from "@/components/client/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/client";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminTaskPage() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [interns, setInterns] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("all");
  const [selectedTraineeId, setSelectedTraineeId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTraineeDetails, setSelectedTraineeDetails] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<"week" | "month" | "all">("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  const ROWS_PER_PAGE = 7;

  useEffect(() => {
    async function fetchData() {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        redirect("/sign-in");
      }
      setUser(userData.user);

      const { data: internsData, error: internsError } = await supabase
        .from("interns")
        .select("*, department(dept_name)");

      if (internsError) {
        console.error("Error fetching interns:", internsError);
        return;
      }
      setInterns(internsData || []);

      const { data: departmentsData, error: departmentsError } = await supabase
        .from("department")
        .select("dept_id, dept_name");

      if (departmentsError) {
        console.error("Error fetching departments:", departmentsError);
        return;
      }
      setDepartments(departmentsData || []);
    }

    fetchData();
  }, [supabase]);

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDepartmentId(e.target.value);
  };

  const filteredInterns =
    selectedDepartmentId === "all"
      ? interns
      : interns.filter((intern) => String(intern.dept_id) === String(selectedDepartmentId));

  const handleRowClick = async (traineeId: string) => {
    const { data: tasksData, error: tasksError } = await supabase
      .from("timelogs") // Assuming tasks are stored in timelogs table
      .select("date, comments")
      .eq("trainee_id", traineeId)
      .order("date", { ascending: true });

    if (tasksError || !tasksData) {
      console.error("Error fetching tasks:", tasksError);
      return;
    }

    const selectedTrainee = interns.find((intern) => intern.id === traineeId);
    if (!selectedTrainee) {
      console.error("Trainee not found");
      return;
    }

    setSelectedTraineeId(traineeId);
    setSelectedTraineeDetails(selectedTrainee);
    setTasks(tasksData);
    setFilteredTasks(tasksData);
    setIsModalOpen(true);
    setCurrentPage(1);
    setFilterType("all");
    setSelectedMonth("");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTraineeId(null);
    setSelectedTraineeDetails(null);
    setTasks([]);
    setFilteredTasks([]);
    setCurrentPage(1);
    setFilterType("all");
    setSelectedMonth("");
  };

  const getMonthOptions = () => {
    if (!selectedTraineeDetails?.start_date || tasks.length === 0) return [];
    const startDate = new Date(selectedTraineeDetails.start_date);
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
    const startDate = new Date(selectedTraineeDetails?.start_date);
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

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarTrigger className="fixed top-4 left-[260px]" />
      <div className="flex-1 w-full flex flex-col gap-12 max-w-5xl p-5">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-2xl mb-4">LIST OF INTERNS TASK</h2>
          <select
            title="Department"
            value={selectedDepartmentId}
            onChange={handleDepartmentChange}
            className="px-4 py-2 rounded-full text-sm font-medium border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.dept_id} value={dept.dept_id}>
                {dept.dept_name}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto w-full">
          {filteredInterns.length === 0 ? (
            <p className="text-gray-500">
              {selectedDepartmentId === "all"
                ? "No interns available."
                : "No interns found for this department."}
            </p>
          ) : (
            <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    First Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    University
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInterns.map((intern: any) => (
                  <tr
                    key={intern.id}
                    onClick={() => handleRowClick(intern.id)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">{intern.first_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{intern.last_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{intern.university}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {intern.department?.dept_name || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{intern.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-800">
                    {selectedTraineeDetails?.first_name} {selectedTraineeDetails?.last_name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedTraineeDetails?.university}</p>
                  <p className="text-sm text-gray-600">{selectedTraineeDetails?.host_company}</p>
                </div>
                <button
                  onClick={closeModal}
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
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">Task Accomplishments</h4>
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => filterTasks("week")}
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
                      onClick={() => filterTasks("all")}
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Comments
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedTasks.map((task, index) => (
                        <tr
                          key={`${task.date}-${index}`} // Using date and index as key since there's no unique ID
                          className={`transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100`}
                        >
                          <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                            {new Intl.DateTimeFormat("en-US", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }).format(new Date(task.date))}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{task.comments || "No comments"}</td>
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
                      className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium disabled:opacity-50 hover:bg-gray-200 transition-colors"
                    >
                      Previous
                    </button>
                    <div className="flex gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            currentPage === page
                              ? "bg-blue-600 text-white"
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
                      className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium disabled:opacity-50 hover:bg-gray-200 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </SidebarProvider>
  );
}