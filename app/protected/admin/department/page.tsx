// app/protected/admin/department/page.tsx
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
  const [currentPage, setCurrentPage] = useState(1); // Pagination state
  const rowsPerPage = 10; // Number of rows per page

  useEffect(() => {
    async function fetchData() {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        redirect("/sign-in");
      }
      setUser(userData.user);

      // Fetch the department ID of the logged-in admin
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

      // Fetch interns for the specific department
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

  // Pagination logic
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
      <SidebarTrigger className="relative -top-12 left-4 p-4 " />
      <div className="flex-1 w-full flex flex-col gap-8 p-6">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-black">INTERNS TIME LOGS</h1>
        </div>

        {/* Interns Table */}
        <div className="overflow-x-auto w-full">
          {interns.length === 0 ? (
            <p className="text-gray-500">No interns available.</p>
          ) : (
            <>
              <table className="min-w-full bg-white rounded-lg shadow-md overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      First Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      University
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {intern.first_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {intern.last_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {intern.university}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {intern.department?.dept_name || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span
                          className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
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

              {/* Pagination Controls */}
              <div className="mt-4 flex justify-between items-center">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-pink-400 text-white rounded-lg shadow-md hover:bg-pink-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
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
                  className="px-4 py-2 bg-pink-400 text-white rounded-lg shadow-md hover:bg-pink-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
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
    </SidebarProvider>
  );
}