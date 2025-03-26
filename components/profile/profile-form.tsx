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
  profile_picture?: string;
}

interface Department {
  dept_id: string;
  dept_name: string;
}

const HOST_COMPANIES = ["Flawless", "FINA", "Beauty and Butter", "MTSI"];
const SCHEDULES = ["8AM - 5PM", "9AM - 6PM"];
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function ProfileForm({ 
  intern, 
  deptName 
}: { 
  intern: Intern; 
  deptName: string 
}) {
  const supabase = createClient();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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

  // Initialize with existing profile picture
  useEffect(() => {
    if (intern.profile_picture) {
      setImagePreview(intern.profile_picture);
    }
  }, [intern]);

  // Fetch departments
  useEffect(() => {
    async function fetchDepartments() {
      const { data, error } = await supabase
        .from("department")
        .select("dept_id, dept_name");
      if (!error) {
        setDepartments(data);
      } else {
        console.error("Error fetching departments:", error);
        toast.error("Failed to load departments");
      }
    }
    fetchDepartments();
  }, []);

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error("Only JPG, PNG, and WebP images are allowed");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Upload image to Supabase Storage
  const uploadImage = async () => {
    if (!selectedImage) {
      toast.error("Please select an image first");
      return;
    }

    setUploading(true);

    try {
      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `${intern.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, selectedImage, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(filePath);

      // Update database
      const { error: updateError } = await supabase
        .from("interns")
        .update({ profile_picture: publicUrl })
        .eq("id", intern.id);

      if (updateError) throw updateError;

      setImagePreview(publicUrl);
      toast.success("Profile picture updated successfully!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from("interns")
        .update({
          ...formData,
          profile_picture: imagePreview || intern.profile_picture
        })
        .eq("id", intern.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(error.message || "Failed to update profile");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl bg-white p-6 rounded-xl shadow-lg border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Edit Profile</h2>

      {/* Profile Picture Upload Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Profile Picture
        </label>
        <div className="flex items-center">
          <div className="mr-4">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">No image</span>
              </div>
            )}
          </div>
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              placeholder="Choose an image file"
              title="Upload your profile picture"
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
              disabled={uploading}
            />
       
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">First Name</label>
            <input
            title="First Name"
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
              className="w-full p-2 mt-1 border border-blue-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Last Name</label>
            <input
            title="Last Name"
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
              className="w-full p-2 mt-1 border border-blue-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Phone Number</label>
            <input
            title="Phone Number"
              type="text"
              name="phone_no"
              value={formData.phone_no}
              onChange={handleChange}
              required
              className="w-full p-2 mt-1 border border-blue-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">University</label>
            <input
            title="University"
              type="text"
              name="university"
              value={formData.university}
              onChange={handleChange}
              required
              className="w-full p-2 mt-1 border border-blue-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-purple-500"
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
              className="w-full p-2 mt-1 border border-blue-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-purple-500"
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
              className="w-full p-2 mt-1 border border-blue-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Department</label>
            <select
              title="Department"
              name="dept_id"
              value={formData.dept_id}
              onChange={handleChange}
              required
              className="w-full p-2 mt-1 border border-blue-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept.dept_id} value={dept.dept_id}>
                  {dept.dept_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Program</label>
            <input
            title="Program"
              type="text"
              name="program"
              value={formData.program}
              onChange={handleChange}
              required
              className="w-full p-2 mt-1 border border-blue-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-purple-500"
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
              className="w-full p-2 mt-1 border border-blue-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-purple-500"
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
              className="w-full p-2 mt-1 border border-blue-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-purple-500"
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
              className="w-full p-2 mt-1 border border-blue-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select company</option>
              {HOST_COMPANIES.map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Schedule</label>
            <label htmlFor="schedule" className="text-sm font-medium text-gray-700">Schedule</label>
            <select
              id="schedule"
              name="schedule"
              value={formData.schedule}
              onChange={handleChange}
              required
              className="w-full p-2 mt-1 border border-blue-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select schedule</option>
              {SCHEDULES.map((schedule) => (
                <option key={schedule} value={schedule}>
                  {schedule}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

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