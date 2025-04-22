import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";
import { createClient } from "@/utils/supabase/server";

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient(); // Await the createClient function

  // Fetch departments from the department table
  const { data: departments, error } = await supabase
    .from("department")
    .select("dept_id, dept_name");

  if (error) {
    console.error("Error fetching departments:", error);
    return (
      <div className="w-full flex-1 flex items-center h-screen sm:max-w-md justify-center gap-2 p-4">
        <FormMessage message={{ message: "Failed to load departments." }} />
      </div>
    );
  }

  if ("message" in searchParams) {
    return (
      <div className="w-full flex-1 flex items-center h-screen sm:max-w-md justify-center gap-2 p-4">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  return (
    <>
      {/* Background Wrapper */}
      <div
        className="relative w-full min-h-screen bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/landing-bg.png')" }}
      >
        {/* Form Container */}
        <form className="flex flex-col w-full max-w-4xl mx-auto bg-white bg-opacity-80 p-8 rounded-lg shadow-lg mt-16 sm:mt-8">
          <h1 className="text-2xl font-medium text-center">Sign up</h1>
          <p className="text-sm text-center text-foreground mt-2">
            Already have an account?{" "}
            <Link className="text-primary font-medium underline" href="/">
              Sign in
            </Link>
          </p>

          {/* Grid Layout for Two Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
            {/* Left Column */}
            <div className="flex flex-col gap-6">
              {/* Email Field */}
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" placeholder="you@example.com" required />

              {/* Password Field */}
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder="Your password"
                minLength={6}
                required
              />

              {/* First Name Field */}
              <Label htmlFor="first_name">First Name</Label>
              <Input id="first_name" name="first_name" placeholder="John" required />

              {/* Last Name Field */}
              <Label htmlFor="last_name">Last Name</Label>
              <Input id="last_name" name="last_name" placeholder="Doe" required />

              {/* University Field */}
              <Label htmlFor="university">University</Label>
              <Input
                id="university"
                name="university"
                placeholder="Your University"
                required
              />
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-6">
              {/* Phone Number Field */}
              <Label htmlFor="phone_no">Phone Number</Label>
              <Input
                id="phone_no"
                name="phone_no"
                type="tel"
                placeholder="1234567890"
                required
              />

              {/* Start Date Field */}
              <Label htmlFor="start_date">Start Date</Label>
              <Input id="start_date" name="start_date" type="date" required />

              {/* Hours to Render Field */}
              <Label htmlFor="hours_to_render">Hours to Render</Label>
              <Input
                id="hours_to_render"
                name="hours_to_render"
                type="number"
                placeholder="100"
                required
              />

              {/* Department Dropdown */}
              <Label htmlFor="dept_id">Department</Label>
              <select
                title="department"
                id="dept_id"
                name="dept_id"
                className="p-2 border rounded-md"
                required
              >
                <option value="">Select a department</option>
                {departments?.map((dept) => (
                  <option key={dept.dept_id} value={dept.dept_id}>
                    {dept.dept_name}
                  </option>
                ))}
              </select>

              {/* Program Field */}
              <Label htmlFor="program">Program/Course</Label>
              <Input id="program" name="program" placeholder="Your Program" required />
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col sm:flex-row gap-6 mt-8">
            {/* Year Level Field */}
            <div className="flex flex-col w-full sm:w-1/2">
              <Label htmlFor="year_level">Year Level</Label>
              <Input id="year_level" name="year_level" type="number" placeholder="4" required />
            </div>

            {/* Section Field */}
            <div className="flex flex-col w-full sm:w-1/2">
              <Label htmlFor="section">Section</Label>
              <Input id="section" name="section" placeholder="A" required />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 mt-8">
            {/* Host Company Field */}
            <div className="flex flex-col w-full sm:w-1/2">
              <Label htmlFor="host_company">Host Company</Label>
              <select
                title="host_company"
                id="host_company"
                name="host_company"
                className="p-2 border rounded-md"
                required
              >
                <option value="">Select a host company</option>
                <option value="Flawless">Flawless</option>
                <option value="FINA">FINA</option>
                <option value="Beauty and Butter">Beauty and Butter</option>
                <option value="MTSI">MTSI</option>
              </select>
            </div>

            {/* Schedule Field */}
            <div className="flex flex-col w-full sm:w-1/2">
              <Label htmlFor="schedule">Schedule</Label>
              <select
                title="schedule"
                id="schedule"
                name="schedule"
                className="p-2 border rounded-md"
                required
              >
                <option value="">Select a schedule</option>
                <option value="8AM - 5PM">8AM - 5PM</option>
                <option value="9AM - 6PM">9AM - 6PM</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <SubmitButton formAction={signUpAction} pendingText="Signing up...">
            Sign up
          </SubmitButton>

          {/* Form Message (for errors or success messages) */}
          <FormMessage message={searchParams} />
        </form>
      </div>
    </>
  );
}