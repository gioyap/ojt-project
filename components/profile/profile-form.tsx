"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Intern {
  id?: string;
  first_name?: string;
  last_name?: string;
  phone_no?: string;
  university?: string;
  start_date?: string;
  hours_to_render?: string;
  dept_id?: string;
  program?: string;
  year_level?: number;
  section?: string;
  host_company?: string;
  schedule?: string;
}

interface Department {
  dept_id: string;
  dept_name: string;
}

const HOST_COMPANIES = ["Flawless", "FINA", "Beauty and Butter", "MTSI"];
const SCHEDULES = ["8AM - 5PM", "9AM - 6PM"];

export default function ProfileForm({
  intern,
  deptName,
}: {
  intern: Intern;
  deptName: string;
}) {
  const supabase = createClient();

  const [formData, setFormData] = useState({
    first_name: intern.first_name || "",
    last_name: intern.last_name || "",
    phone_no: intern.phone_no || "",
    university: intern.university || "",
    start_date: intern.start_date || "",
    hours_to_render: intern.hours_to_render || "",
    dept_id: intern.dept_id || "",
    program: intern.program || "",
    year_level: intern.year_level || "",
    section: intern.section || "",
    host_company: intern.host_company || "",
    schedule: intern.schedule || "",
  });

  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    async function fetchDepartments() {
      const { data, error } = await supabase
        .from("department")
        .select("dept_id, dept_name");
      if (!error) {
        setDepartments(data);
      } else {
        console.error("Error fetching departments:", error);
      }
    }
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (departments.length > 0 && formData.dept_id === "") {
      setFormData((prev) => ({ ...prev, dept_id: intern.dept_id || "" }));
    }
  }, [departments, intern.dept_id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { error } = await supabase
      .from("interns")
      .update(formData)
      .eq("id", intern.id);

    if (error) {
      toast.error("Failed to update profile. Try again.");
      console.error("Update error:", error);
    } else {
      toast.success("Profile updated successfully!");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-4xl bg-white p-6 rounded-xl shadow-lg border border-gray-200"
    >
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Edit Profile</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Personal Details */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
              className="w-full p-2 mt-1 border border-blue-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-purple-500 placeholder-gray-400 shadow-sm"
              placeholder="Enter your first name"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
              className="w-full p-2 mt-1 border border-blue-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-purple-500 placeholder-gray-400 shadow-sm"
              placeholder="Enter your last name"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="text"
              name="phone_no"
              value={formData.phone_no}
              onChange={handleChange}
              required
              className="w-full p-2 mt-1 border border-blue-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-purple-500 placeholder-gray-400 shadow-sm"
              placeholder="Enter your phone number"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">University</label>
            <input
              type="text"
              name="university"
              value={formData.university}
              onChange={handleChange}
              required
              className="w-full p-2 mt-1 border border-blue-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-purple-500 placeholder-gray-400 shadow-sm"
              placeholder="Enter your university"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Start Date</label>
            <input
              title="Start Date"
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
              className="w-full p-2 mt-1 border border-blue-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-purple-500 shadow-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Hours to Render</label>
            <input
              title="Hours to Render"
              type="number"
              name="hours_to_render"
              value={formData.hours_to_render}
              onChange={handleChange}
              required
              className="w-full p-2 mt-1 border border-blue-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-purple-500 shadow-sm"
            />
          </div>
        </div>

        {/* Right Column: Academic & Internship Details */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Department</label>
            <select
              title="Department"
              name="dept_id"
              value={formData.dept_id}
              onChange={handleChange}
              required
              className="w-full p-2 mt-1 border border-blue-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-purple-500 shadow-sm"
            >
              <option value="" disabled>
                Select a department
              </option>
              {departments.map((dept) => (
                <option key={dept.dept_id} value={dept.dept_id}>
                  {dept.dept_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Program/Course</label>
            <input
              title="Program"
              type="text"
              name="program"
              value={formData.program}
              onChange={handleChange}
              required
              className="w-full p-2 mt-1 border border-blue-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-purple-500 shadow-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Year Level</label>
            <input
              title="Year Level"
              type="number"
              name="year_level"
              value={formData.year_level}
              onChange={handleChange}
              required
              className="w-full p-2 mt-1 border border-blue-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-purple-500 shadow-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Section</label>
            <input
              title="Section"
              type="text"
              name="section"
              value={formData.section}
              onChange={handleChange}
              required
              className="w-full p-2 mt-1 border border-blue-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-purple-500 shadow-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Host Company</label>
            <select
              title="Host Company"
              name="host_company"
              value={formData.host_company}
              onChange={handleChange}
              required
              className="w-full p-2 mt-1 border border-blue-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-purple-500 shadow-sm"
            >
              <option value="" disabled>
                Select a host company
              </option>
              {HOST_COMPANIES.map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Schedule</label>
            <select
              title="Schedule"
              name="schedule"
              value={formData.schedule}
              onChange={handleChange}
              required
              className="w-full p-2 mt-1 border border-blue-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-purple-500 shadow-sm"
            >
              <option value="" disabled>
                Select a schedule
              </option>
              {SCHEDULES.map((schedule) => (
                <option key={schedule} value={schedule}>
                  {schedule}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Submit Button (Full Width) */}
      <button
        type="submit"
        className="w-full mt-6 bg-pink-600 text-white font-semibold py-2 rounded-lg shadow-md hover:bg-pink-700 transition-all"
      >
        Update Profile
      </button>

      <ToastContainer position="top-right" autoClose={5000} hideProgressBar />
    </form>
  );
}