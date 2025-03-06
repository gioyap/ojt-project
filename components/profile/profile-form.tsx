"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast, ToastContainer } from "react-toastify"; // Import toast and ToastContainer
import "react-toastify/dist/ReactToastify.css"; // Import Toastify styles

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

  // Form state
  const [formData, setFormData] = useState({
    first_name: intern.first_name,
    last_name: intern.last_name,
    phone_no: intern.phone_no,
    university: intern.university,
    start_date: intern.start_date,
    hours_to_render: intern.hours_to_render,
    dept_id: intern.dept_id || "",
    program: intern.program || "",
    year_level: intern.year_level || "",
    section: intern.section || "",
    host_company: intern.host_company || "",
    schedule: intern.schedule || "",
  });

  const [departments, setDepartments] = useState<Department[]>([]);

  // Fetch department options from database
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

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { error } = await supabase
      .from("interns")
      .update(formData)
      .eq("id", intern.id);

    if (error) {
      toast.error("Failed to update profile. Try again."); // Show error toast
      console.error("Update error:", error);
    } else {
      toast.success("Profile updated successfully!"); // Show success toast
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-lg">
      <h2 className="text-xl font-bold">Edit Profile</h2>

      <label>First Name</label>
      <input
        type="text"
        name="first_name"
        value={formData.first_name}
        onChange={handleChange}
        required
        className="p-2 border rounded-md"
        placeholder="Enter your first name"
      />

      <label>Last Name</label>
      <input
        type="text"
        name="last_name"
        value={formData.last_name}
        onChange={handleChange}
        required
        className="p-2 border rounded-md"
        placeholder="Enter your last name"
      />

      <label>Phone Number</label>
      <input
        type="text"
        name="phone_no"
        value={formData.phone_no}
        onChange={handleChange}
        required
        className="p-2 border rounded-md"
        placeholder="Enter your phone number"
      />

      <label>University</label>
      <input
        type="text"
        name="university"
        value={formData.university}
        onChange={handleChange}
        required
        className="p-2 border rounded-md"
        placeholder="Enter your university"
      />

      <label>Start Date</label>
      <input
        title="Start Date"
        type="date"
        name="start_date"
        value={formData.start_date}
        onChange={handleChange}
        required
        className="p-2 border rounded-md"
      />

      <label>Hours to Render</label>
      <input
        title="Hours to Render"
        type="number"
        name="hours_to_render"
        value={formData.hours_to_render}
        onChange={handleChange}
        required
        className="p-2 border rounded-md"
      />

      <label>Department</label>
      <select
        title="Department"
        name="dept_id"
        value={formData.dept_id}
        onChange={handleChange}
        required
        className="p-2 border rounded-md"
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

      <label>Program/Course</label>
      <input
        title="Program"
        type="text"
        name="program"
        value={formData.program}
        onChange={handleChange}
        required
        className="p-2 border rounded-md"
      />

      <label>Year Level</label>
      <input
        title="Year Level"
        type="number"
        name="year_level"
        value={formData.year_level}
        onChange={handleChange}
        required
        className="p-2 border rounded-md"
      />

      <label>Section</label>
      <input
        title="Section"
        type="text"
        name="section"
        value={formData.section}
        onChange={handleChange}
        required
        className="p-2 border rounded-md"
      />

      <label>Host Company</label>
      <select
        title="Host Company"
        name="host_company"
        value={formData.host_company}
        onChange={handleChange}
        required
        className="p-2 border rounded-md"
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

      <label>Schedule</label>
      <select
        title="Schedule"
        name="schedule"
        value={formData.schedule}
        onChange={handleChange}
        required
        className="p-2 border rounded-md"
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

      <button type="submit" className="bg-blue-500 text-white p-2 rounded-md">
        Update Profile
      </button>

      {/* Toast Container */}
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar />
    </form>
  );
}
