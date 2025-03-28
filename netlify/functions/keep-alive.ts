import { Handler } from "@netlify/functions";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Environment variables for Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Initialize Supabase client
const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

export const handler: Handler = async () => {
	try {
		// Sample query to keep the DB alive
		const { data, error } = await supabase
			.from("attendancesummary") // Query any table
			.select("*")
			.limit(1);

		if (error) {
			console.error("Error keeping Supabase alive:", error);
			return {
				statusCode: 500,
				body: JSON.stringify({
					message: "Error keeping DB alive",
					error: error.message,
				}),
			};
		}

		console.log("Supabase is alive:", data);

		return {
			statusCode: 200,
			body: JSON.stringify({ message: "Supabase ping successful", data }),
		};
	} catch (err: any) {
		console.error("Unexpected error:", err);
		return {
			statusCode: 500,
			body: JSON.stringify({ message: "Unexpected error", error: err.message }),
		};
	}
};
