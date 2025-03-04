"use client";

import { Suspense } from "react"; // Import Suspense
import { useSearchParams } from "next/navigation"; // Import useSearchParams
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useActionState } from "react";
import { signInAction } from "@/app/actions";

export default function Login() {
	return (
		<Suspense fallback={<Loading />}>
			<LoginForm />
		</Suspense>
	);
}

// Extract the logic into a separate client component
function LoginForm() {
	const searchParams = useSearchParams();
	const role = searchParams.get("role");

	const initialState: Message = { message: "" };
	const [state, formAction, isPending] = useActionState<Message, FormData>(
		signInAction,
		initialState
	);

	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
				{role === "trainee" && (
					<form action={formAction}>
						<h2 className="text-2xl font-bold text-gray-900 mb-2">
							Trainee Sign In
						</h2>
						<p className="text-sm text-gray-600 mb-8">
							Don't have an account?{" "}
							<Link
								className="text-blue-600 font-medium hover:underline"
								href="/sign-up"
							>
								Sign up
							</Link>
						</p>
						<div className="space-y-4">
							<div>
								<Label htmlFor="email">Email</Label>
								<Input
									name="email"
									type="email"
									placeholder="you@example.com"
									required
								/>
							</div>
							<div>
								<Label htmlFor="password">Password</Label>
								<Input
									name="password"
									type="password"
									placeholder="Your password"
									required
								/>
							</div>
							<input type="hidden" name="role" value="trainee" />
							<SubmitButton
								pendingText="Signing In..."
								className="w-full bg-pink-500 text-white py-2 rounded-lg hover:bg-pink-700"
							>
								Sign in as Trainee
							</SubmitButton>
							<FormMessage message={state} />
						</div>
					</form>
				)}

				{role === "admin" && (
					<form action={formAction}>
						<h2 className="text-2xl font-bold text-gray-900 mb-6">
							Admin Sign In
						</h2>
						<div className="space-y-4">
							<div>
								<Label htmlFor="email">Email</Label>
								<Input
									name="email"
									type="email"
									placeholder="admin@example.com"
									required
								/>
							</div>
							<div>
								<Label htmlFor="password">Password</Label>
								<Input
									name="password"
									type="password"
									placeholder="Your password"
									required
								/>
							</div>
							<input type="hidden" name="role" value="admin" />
							<SubmitButton
								pendingText="Signing In..."
								className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-700"
							>
								Sign in as Admin
							</SubmitButton>
							<FormMessage message={state} />
						</div>
					</form>
				)}

				{!role && (
					<p className="text-sm text-gray-600 mt-4 text-center">
						Please select a role to sign in.
					</p>
				)}
			</div>
		</div>
	);
}

// Fallback UI while searchParams are loading
function Loading() {
	return <p className="text-center text-gray-500">Loading...</p>;
}
