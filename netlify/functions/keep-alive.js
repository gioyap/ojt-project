import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Use service role key for background jobs

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function handler() {
	try {
		// Sample query to keep the DB alive
		const { data, error } = await supabase
			.from("attendancesummary") // You can use any table
			.select("*")
			.limit(1);

		if (error) {
			console.error("Error keeping Supabase alive:", error);
			return {
				statusCode: 500,
				body: JSON.stringify({ message: "Error keeping DB alive" }),
			};
		}

		console.log("Supabase is alive:", data);

		return {
			statusCode: 200,
			body: JSON.stringify({ message: "Supabase ping successful" }),
		};
	} catch (err) {
		console.error("Unexpected error:", err);
		return {
			statusCode: 500,
			body: JSON.stringify({ message: "Unexpected error" }),
		};
	}
}
