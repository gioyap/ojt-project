import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function Login(props: { searchParams: Promise<Message> }) {
	const searchParams = await props.searchParams;

	// Extract the `role` query parameter from the URL
	const role =
		typeof searchParams === "object" && "role" in searchParams
			? searchParams.role
			: null;

	return (
		<div
			className="relative w-full min-h-screen flex items-center justify-center"
			style={{
				backgroundImage: "url('/landing-bg.png')",
				backgroundRepeat: "no-repeat",
				backgroundSize: "cover",
				backgroundPosition: "center",
			}}
		>
			<div className="w-full max-w-md bg-white bg-opacity-90 backdrop-blur-lg rounded-lg shadow-lg p-8 text-center">
				{role === "trainee" && (
					<form className="w-full">
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
							<div className="text-left">
								<Label
									htmlFor="email"
									className="text-sm font-medium text-gray-700"
								>
									Email
								</Label>
								<Input
									name="email"
									placeholder="you@example.com"
									required
									className="w-full px-4 py-2 border bg-white text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
							</div>
							<div className="text-left">
								<Label
									htmlFor="password"
									className="text-sm font-medium text-gray-700"
								>
									Password
								</Label>
								<Input
									type="password"
									name="password"
									placeholder="Your password"
									required
									className="w-full px-4 py-2 border bg-white text-black border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
								/>
							</div>
							<SubmitButton
								pendingText="Signing In..."
								className="w-full bg-pink-500 text-white py-2 rounded-lg hover:bg-pink-700 transition duration-300"
							>
								Sign in as Trainee
							</SubmitButton>
							<FormMessage message={searchParams} />
						</div>
					</form>
				)}

				{role === "admin" && (
					<form className="w-full">
						<h2 className="text-2xl font-bold text-gray-900 mb-6">
							Admin Sign In
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
							<div className="text-left">
								<Label
									htmlFor="email"
									className="text-sm font-medium text-gray-700"
								>
									Email
								</Label>
								<Input
									name="email"
									placeholder="admin@example.com"
									required
									className="w-full px-4 py-2 border bg-white text-black border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
								/>
							</div>
							<div className="text-left">
								<Label
									htmlFor="password"
									className="text-sm font-medium text-gray-700"
								>
									Password
								</Label>
								<Input
									type="password"
									name="password"
									placeholder="Your password"
									required
									className="w-full px-4 py-2 border bg-white text-black border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
								/>
							</div>
							<SubmitButton
								pendingText="Signing In..."
								className="w-full bg-pink-500 text-white py-2 rounded-lg hover:bg-pink-700 transition duration-300"
							>
								Sign in as Admin
							</SubmitButton>
							<FormMessage message={searchParams} />
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
