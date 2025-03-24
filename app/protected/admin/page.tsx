// app/protected/admin
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
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("all");
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
    setCurrentPage(1); // Reset to the first page when department changes
  };

  const filteredInterns =
    selectedDepartmentId === "all"
      ? interns
      : interns.filter((intern) => String(intern.dept_id) === String(selectedDepartmentId));

  // Pagination logic
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
      <SidebarTrigger className="relative -top-12 left-4 p-4" />
      <div className="flex-1 w-full flex flex-col gap-8 p-6">
        {/* Header Section */}
        <div className="flex justify-between items-center">
  <h1 className="text-3xl font-bold" style={{ color: 'black' }}>INTERNS TIME LOGS</h1>
  <div className="flex items-center gap-4">
            <select
              title="Department"
              value={selectedDepartmentId}
              onChange={handleDepartmentChange}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
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

        {/* Interns Table */}
        <div className="overflow-x-auto w-full">
          {filteredInterns.length === 0 ? (
            <p className="text-gray-500">
              {selectedDepartmentId === "all"
                ? "No interns available."
                : "No interns found for this department."}
            </p>
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