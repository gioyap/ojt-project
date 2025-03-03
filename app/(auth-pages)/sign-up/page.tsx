import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
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

          {/* Department ID Field */}
          <Label htmlFor="dept_id">Department ID</Label>
          <Input
            id="dept_id"
            name="dept_id"
            type="number"
            placeholder="1"
            required
          />

          {/* Status Field */}
          <Label htmlFor="status">Status</Label>
          <Input id="status" name="status" placeholder="Active" required />

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