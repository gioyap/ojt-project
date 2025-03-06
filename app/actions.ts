"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const firstName = formData.get("first_name")?.toString();
  const lastName = formData.get("last_name")?.toString();
  const phoneNo = formData.get("phone_no")?.toString();
  const university = formData.get("university")?.toString();
  const startDate = formData.get("start_date")?.toString();
  const hoursToRender = formData.get("hours_to_render")?.toString();
  const deptId = formData.get("dept_id")?.toString();
  const program = formData.get("program")?.toString();
  const yearLevel = formData.get("year_level")?.toString();
  const section = formData.get("section")?.toString();
  const hostCompany = formData.get("host_company")?.toString();
  const schedule = formData.get("schedule")?.toString();
  const status = "Active";

  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  // Validate required fields
  if (
    !email ||
    !password ||
    !firstName ||
    !lastName ||
    !phoneNo ||
    !university ||
    !startDate ||
    !hoursToRender ||
    !deptId ||
    !program ||
    !yearLevel ||
    !section ||
    !hostCompany ||
    !schedule
  ) {
    return encodedRedirect("error", "/sign-up", "All fields are required");
  }

  // Step 1: Sign up the user with Supabase Auth
  const fullName = `${firstName} ${lastName}`;
  const createdAt = new Date().toISOString();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        full_name: fullName,
        created_at: createdAt,
      },
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  }

  const user = data.user;
  if (!user) {
    return encodedRedirect("error", "/sign-up", "User not found after signup");
  }

  console.log("User ID:", user.id); // Debugging to check UUID format

  // Step 2: Insert additional user info into `users` table
  const { error: userError } = await supabase.from("users").insert([
    {
      id: user.id,
      full_name: fullName,
      email: user.email,
      created_at: createdAt,
      role: "trainee",
    },
  ]);

  if (userError) {
    console.error("Database Error (users):", userError);
    return encodedRedirect(
      "error",
      "/sign-up",
      "User created, but profile saving failed."
    );
  }

  // Step 3: Insert intern-specific info into `interns` table
  const { error: internError } = await supabase.from("interns").insert([
    {
      id: user.id, // UUID from auth
      first_name: firstName,
      last_name: lastName,
      phone_no: isNaN(parseFloat(phoneNo)) ? null : parseFloat(phoneNo),
      university,
      start_date: startDate.split("T")[0], // Format YYYY-MM-DD
      hours_to_render: isNaN(parseInt(hoursToRender, 10)) ? null : parseInt(hoursToRender, 10),
      dept_id: isNaN(parseInt(deptId, 10)) ? null : parseInt(deptId, 10),
      program,
      year_level: isNaN(parseInt(yearLevel, 10)) ? null : parseInt(yearLevel, 10),
      section,
      host_company: hostCompany,
      schedule,
      status,
    },
  ]);

  if (internError) {
    console.error("Database Error (interns):", JSON.stringify(internError, null, 2));
    return encodedRedirect(
      "error",
      "/sign-up",
      `User created, but intern details saving failed. Error: ${internError.message}`
    );
  }

  return encodedRedirect(
    "success",
    "/sign-up",
    "Thanks for signing up! Please check your email for a verification link."
  );
};


export type Message = {
  message: string;
};

export const signInAction = async (
  state: Message, 
  formData: FormData
): Promise<Message> => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const formRole = formData.get("role") as string; 

  const supabase = await createClient();

  // Step 1: Authenticate the user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    return { message: authError.message }; // Return error message
  }

  // Step 2: Fetch the user's role from the `users` table
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("role")
    .eq("id", authData.user?.id)
    .single();

  if (userError) {
    return { message: "Failed to fetch user data." };
  }

  const userRole = userData?.role;

  // Step 3: Validate the user's role
  if (userRole !== formRole) {
    await supabase.auth.signOut();
    return { message: "You do not have permission to access this page." };
  }

  // Step 4: Redirect based on role
  if (formRole === "admin") {
    redirect("/protected/admin");
  } else if (formRole === "trainee") {
    redirect("/protected");
  }

  // **Important**: Add a return statement after redirect to satisfy TypeScript
  return { message: "Redirecting..." };
};


export const forgotPasswordAction = async (formData: FormData) => {
	const email = formData.get("email")?.toString();
	const supabase = await createClient();
	const origin = (await headers()).get("origin");
	const callbackUrl = formData.get("callbackUrl")?.toString();

	if (!email) {
		return encodedRedirect("error", "/forgot-password", "Email is required");
	}

	const { error } = await supabase.auth.resetPasswordForEmail(email, {
		redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
	});

	if (error) {
		console.error(error.message);
		return encodedRedirect(
			"error",
			"/forgot-password",
			"Could not reset password"
		);
	}

	if (callbackUrl) {
		return redirect(callbackUrl);
	}

	return encodedRedirect(
		"success",
		"/forgot-password",
		"Check your email for a link to reset your password."
	);
};

export const resetPasswordAction = async (formData: FormData) => {
	const supabase = await createClient();

	const password = formData.get("password") as string;
	const confirmPassword = formData.get("confirmPassword") as string;

	if (!password || !confirmPassword) {
		encodedRedirect(
			"error",
			"/protected/reset-password",
			"Password and confirm password are required"
		);
	}

	if (password !== confirmPassword) {
		encodedRedirect(
			"error",
			"/protected/reset-password",
			"Passwords do not match"
		);
	}

	const { error } = await supabase.auth.updateUser({
		password: password,
	});

	if (error) {
		encodedRedirect(
			"error",
			"/protected/reset-password",
			"Password update failed"
		);
	}

	encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
	const supabase = await createClient();
	await supabase.auth.signOut();
	return redirect("/");
};

export async function getIntern() { 
  const supabase = await createClient();

  // Get the authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized", user: null };
  }

  // Check if the user is an admin
  const { data: userRole, error: roleError } = await supabase
    .from("users") // Assuming you have a table for user roles
    .select("role")
    .eq("id", user.id)
    .single();

  if (roleError || !userRole) {
    return { error: "Error fetching user role", user: null };
  }

  if (userRole.role === "admin") {
    return { message: "ADMIN", user: null };
  }

  // Define the expected type
  type InternData = {
    first_name: string;
    last_name: string;
    university: string;
    department?: { dept_name: string }; // Ensure department is an object
  };

  // Fetch intern details with department name
  const { data: intern, error: internError } = await supabase
    .from("interns")
    .select("first_name, last_name, university, department:dept_id(dept_name)")
    .eq("id", user.id)
    .single<InternData>(); // Cast result to InternData

  if (internError) {
    console.error("Supabase error:", internError);
    return { error: "Error fetching intern", user: null };
  }

  if (!intern) {
    console.warn("No intern found for user ID:", user.id);
    return { error: "Intern not found", user: null };
  }

  return {
    name: `${intern.first_name} ${intern.last_name}`,
    university: intern.university,
    department: intern.department?.dept_name || "Unknown",
  };
}







