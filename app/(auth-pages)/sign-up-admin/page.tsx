import { signUpAdminAction } from "@/app/actions"; // Updated import
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";
import { createClient } from "@/utils/supabase/server";

export default async function SignupAdmin(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

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
    <div
      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/landing-bg.png')" }} 
    >
      <div className="min-h-screen flex items-center justify-start p-4">
        <form className="flex flex-col min-w-[400px] max-w-lg ml-[240px] bg-white p-8 rounded-lg shadow-lg animate-in fade-in-5 duration-1000">
          <h1 className="text-2xl font-medium">Admin Sign Up</h1>
          <p className="text-sm text-foreground">
            Already have an account?{" "}
            <Link className="text-primary font-medium underline" href="/">
              Sign in
            </Link>
          </p>
          <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
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

            {/* Submit Button */}
            <SubmitButton formAction={signUpAdminAction} pendingText="Signing up...">
              Sign up
            </SubmitButton>

            {/* Form Message (for errors or success messages) */}
            <FormMessage message={searchParams} />
          </div>
        </form>
      </div>
    </div>
  );
}
