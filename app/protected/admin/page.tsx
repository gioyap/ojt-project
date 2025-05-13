"use client";

import { AppSidebar } from "@/components/client/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/client";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { TraineeModal } from "@/components/admin/TraineeModal";

export default function ProtectedPage() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [interns, setInterns] = useState<any[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("all");
  const [selectedTraineeId, setSelectedTraineeId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTraineeDetails, setSelectedTraineeDetails] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

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

      const { data: attendanceSummaryData, error: attendanceSummaryError } = await supabase
        .from("attendancesummary")
        .select("trainee_id, accomplished_hours");

      if (attendanceSummaryError) {
        console.error("Error fetching attendance summary:", attendanceSummaryError);
        return;
      }
      setAttendanceSummary(attendanceSummaryData || []);
    }

    fetchData();
  }, [supabase]);

  const getHoursData = (traineeId: string) => {
    const trainee = interns.find(intern => intern.id === traineeId);
    const traineeSummary = attendanceSummary.find(summary => summary.trainee_id === traineeId);
    
    return {
      accomplished: traineeSummary ? Math.round(parseFloat(traineeSummary.accomplished_hours) || 0) : 0,
      total: trainee ? Math.round(trainee.hours_to_render) || 0 : 0
    };
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDepartmentId(e.target.value);
    setCurrentPage(1);
  };

  const filteredInterns =
    selectedDepartmentId === "all"
      ? interns
      : interns.filter(
          (intern) => String(intern.dept_id) === String(selectedDepartmentId)
        );

  const totalPages = Math.ceil(filteredInterns.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedInterns = filteredInterns.slice(startIndex, endIndex);

  const handleRowClick = (traineeId: string) => {
    const selectedTrainee = interns.find((intern) => intern.id === traineeId);
    if (!selectedTrainee) {
      console.error("Trainee not found");
      return;
    }

    setSelectedTraineeId(traineeId);
    setSelectedTraineeDetails(selectedTrainee);
    setIsModalOpen(true);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-col min-h-screen w-full bg-white/70 dark:bg-gray-900">
        <SidebarTrigger className="relative -top-12 left-4 p-4 shadow-lg hover:from-blue-800 hover:to-purple-700 transition-all" />

        <div className="flex-1 w-full flex flex-col gap-4 sm:gap-6 p-2 sm:p-4 md:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-black text-center sm:text-left">
              INTERNS TIME LOGS
            </h1>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                title="Department"
                value={selectedDepartmentId}
                onChange={handleDepartmentChange}
                className="w-full sm:w-48 p-2 sm:p-2.5 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.dept_id} value={dept.dept_id}>
                    {dept.dept_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="w-full">
            {filteredInterns.length === 0 ? (
              <p className="text-gray-500 text-center text-sm sm:text-base p-4">
                {selectedDepartmentId === "all"
                  ? "No interns available."
                  : "No interns found for this department."}
              </p>
            ) : (
              <>
                <div className="block sm:hidden space-y-4">
                  {paginatedInterns.map((intern: any) => {
                    const hours = getHoursData(intern.id);
                    return (
                      <div
                        key={intern.id}
                        onClick={() => handleRowClick(intern.id)}
                        className="bg-white p-4 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all cursor-pointer"
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-700">First Name</span>
                            <span className="text-sm text-gray-900">{intern.first_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-700">Last Name</span>
                            <span className="text-sm text-gray-900">{intern.last_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-700">University</span>
                            <span className="text-sm text-gray-900">{intern.university}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-700">Department</span>
                            <span className="text-sm text-gray-900">
                              {intern.department?.dept_name || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-700">Accomplished</span>
                            <span className="text-sm text-gray-900">
                              {hours.accomplished}/{hours.total} Hrs
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-700">Status</span>
                            <span
                              className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                                intern.status === "Active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-green-300 text-green-800"
                              }`}
                            >
                              {intern.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="hidden sm:block overflow-x-auto w-full">
                  <table className="min-w-full bg-white rounded-lg shadow-md overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          First Name
                        </th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Name
                        </th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          University
                        </th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Accomplished
                        </th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedInterns.map((intern: any) => {
                        const hours = getHoursData(intern.id);
                        return (
                          <tr
                            key={intern.id}
                            onClick={() => handleRowClick(intern.id)}
                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-900">
                              {intern.first_name}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-900">
                              {intern.last_name}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-900">
                              {intern.university}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-900">
                              {intern.department?.dept_name || "N/A"}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-900">
                              {hours.accomplished}/{hours.total} Hrs
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-900">
                              <span
                                className={`inline-block px-2 sm:px-3 py-1 text-xs font-semibold rounded-full ${
                                  intern.status === "Active"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-green-300 text-green-800"
                                }`}
                              >
                                {intern.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-full sm:w-auto px-3 py-1.5 sm:px-4 sm:py-2 bg-pink-400 text-white rounded-lg shadow-md hover:bg-pink-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all text-sm sm:text-base"
                  >
                    Previous
                  </button>
                  <div className="flex gap-1 sm:gap-2 flex-wrap justify-center">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
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
                      )
                    )}
                  </div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="w-full sm:w-auto px-3 py-1.5 sm:px-4 sm:py-2 bg-pink-400 text-white rounded-lg shadow-md hover:bg-pink-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all text-sm sm:text-base"
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <TraineeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          traineeId={selectedTraineeId || ""}
          traineeDetails={selectedTraineeDetails}
        />
      </div>
    </SidebarProvider>
  );
}