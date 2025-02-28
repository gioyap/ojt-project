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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign up</h1>
        <p className="text-sm text-gray-600 mb-6">
          Already have an account?{" "}
          <Link className="text-blue-600 font-medium hover:underline" href="/sign-in">
            Sign in
          </Link>
        </p>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1 */}
          <div className="space-y-4">
            {/* Username */}
            <div>
              <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                Username
              </Label>
              <Input
                name="username"
                placeholder="Your username"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <Input
                type="password"
                name="password"
                placeholder="Your password"
                minLength={6}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>

            {/* TID */}
            <div>
              <Label htmlFor="tid" className="text-sm font-medium text-gray-700">
                TID
              </Label>
              <Input
                name="tid"
                placeholder="TID"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>

            {/* First Name */}
            <div>
              <Label htmlFor="first_name" className="text-sm font-medium text-gray-700">
                First Name
              </Label>
              <Input
                name="first_name"
                placeholder="Your first name"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>

            {/* Last Name */}
            <div>
              <Label htmlFor="last_name" className="text-sm font-medium text-gray-700">
                Last Name
              </Label>
              <Input
                name="last_name"
                placeholder="Your last name"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <Input
                name="email"
                placeholder="you@example.com"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>

            {/* Phone Number */}
            <div>
              <Label htmlFor="phone_no" className="text-sm font-medium text-gray-700">
                Phone Number
              </Label>
              <Input
                name="phone_no"
                placeholder="Your phone number"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>

            {/* University */}
            <div>
              <Label htmlFor="university" className="text-sm font-medium text-gray-700">
                University
              </Label>
              <Input
                name="university"
                placeholder="Your university"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>

            {/* Start Date */}
            <div>
              <Label htmlFor="start_date" className="text-sm font-medium text-gray-700">
                Start Date
              </Label>
              <Input
                type="date"
                name="start_date"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>

            {/* End Date */}
            <div>
              <Label htmlFor="end_date" className="text-sm font-medium text-gray-700">
                End Date
              </Label>
              <Input
                type="date"
                name="end_date"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>
          </div>

          {/* Full Width Fields */}
          <div className="md:col-span-2 space-y-4">
            {/* Department ID */}
            <div>
              <Label htmlFor="dept_id" className="text-sm font-medium text-gray-700">
                Department ID
              </Label>
              <Input
                name="dept_id"
                placeholder="Department ID"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>

            {/* Supervisor ID */}
            <div>
              <Label htmlFor="sup_id" className="text-sm font-medium text-gray-700">
                Supervisor ID
              </Label>
              <Input
                name="sup_id"
                placeholder="Supervisor ID"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2">
            <SubmitButton
              formAction={signUpAction}
              pendingText="Signing up..."
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-300"
            >
              Sign up
            </SubmitButton>
          </div>

          {/* Form Message */}
          <div className="md:col-span-2">
            <FormMessage message={searchParams} />
          </div>
        </form>
      </div>
    </div>
  );
}