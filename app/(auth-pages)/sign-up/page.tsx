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
      <form className="flex flex-col min-w-64 max-w-64 mx-auto">
        <h1 className="text-2xl font-medium">Sign up</h1>
        <p className="text-sm text text-foreground">
          Already have an account?{" "}
          <Link className="text-primary font-medium underline" href="/sign-in">
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

          {/* Phone Number Field */}
          <Label htmlFor="phone_no">Phone Number</Label>
          <Input
            id="phone_no"
            name="phone_no"
            type="tel"
            placeholder="1234567890"
            required
          />

          {/* University Field */}
          <Label htmlFor="university">University</Label>
          <Input
            id="university"
            name="university"
            placeholder="Your University"
            required
          />

          {/* Start Date Field */}
          <Label htmlFor="start_date">Start Date</Label>
          <Input id="start_date" name="start_date" type="date" required />

          {/* End Date Field */}
          <Label htmlFor="end_date">End Date</Label>
          <Input id="end_date" name="end_date" type="date" required />

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

          {/* Status Field
          <Label htmlFor="status">Status</Label>
          <Input id="status" name="status" placeholder="Active" required /> */}

          {/* Submit Button */}
          <SubmitButton formAction={signUpAction} pendingText="Signing up...">
            Sign up
          </SubmitButton>

          {/* Form Message (for errors or success messages) */}
          <FormMessage message={searchParams} />
        </div>
      </form>
      <SmtpMessage />
    </>
  );
}