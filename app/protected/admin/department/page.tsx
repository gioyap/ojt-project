"use client";

import { AppSidebar } from "@/components/client/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/client";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { TraineeModal } from "@/components/admin/TraineeModal";

export default function DepartmentAdminPage() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [interns, setInterns] = useState<any[]>([]);
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

      const { data: supervisorData, error: supervisorError } = await supabase
        .from("supervisors")
        .select("dept_id")
        .eq("id", userData.user.id)
        .single();

      if (supervisorError) {
        console.error("Error fetching supervisor data:", supervisorError);
        return;
      }

      const departmentId = supervisorData?.dept_id;

      const { data: internsData, error: internsError } = await supabase
        .from("interns")
        .select("*, department(dept_name)")
        .eq("dept_id", departmentId);

      if (internsError) {
        console.error("Error fetching interns:", internsError);
        return;
      }
      setInterns(internsData || []);
    }

    fetchData();
  }, [supabase]);

  const totalPages = Math.ceil(interns.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedInterns = interns.slice(startIndex, endIndex);

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
        {/* Sidebar Trigger */}
        <SidebarTrigger className="fixed top-2 left-2 sm:top-4 sm:left-4 md:left-[260px] text-black p-2 shadow-lg z-50" />

        {/* Main Content */}
        <div className="flex-1 w-full flex flex-col gap-4 sm:gap-6 p-2 sm:p-4 md:p-6">
          {/* Header Section */}
          <div className="flex justify-between items-center">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-black text-center sm:text-left">
              INTERNS TIME LOGS
            </h1>
          </div>

          {/* Interns Table */}
          <div className="w-full">
            {interns.length === 0 ? (
              <p className="text-gray-500 text-center text-sm sm:text-base p-4">
                No interns available.
              </p>
            ) : (
              <>
                {/* Card layout for phones */}
                <div className="block sm:hidden space-y-4">
                  {paginatedInterns.map((intern: any) => (
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
                  ))}
                </div>

                {/* Table for small screens and above */}
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
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedInterns.map((intern: any) => (
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
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-full sm:w-auto px-3 py-1.5 sm:px-4 sm:py-2 bg-pink-400 text-white rounded-lg shadow-md hover:bg-pink-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all text-sm sm:text-base"
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
                    className="w-full sm:w-auto px-3 py-1.5 sm:px-4 sm:py-2 bg-pink-400 text-white rounded-lg shadow-md hover:bg-pink-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all text-sm sm:text-base"
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Trainee Modal */}
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