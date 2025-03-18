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


// Removed duplicate Message type declaration

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
    .select("role, id")
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
  if (userRole === "superadmin") {
    redirect("/protected/admin");
  } else if (userRole === "admin") {
    redirect("/protected/admin/department");
  } else if (userRole === "trainee") {
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

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized", user: null };
  }

  // Define the expected type
  type InternData = {
    first_name: string;
    last_name: string;
    university: string;
    department?: { dept_name: string } | { dept_name: string }[]; // Handle both cases
  };

  // Fetch the user's role from the `users` table
  const { data: userRole, error: roleError } = await supabase
    .from("users")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (roleError || !userRole) {
    return { error: "Error fetching user role", user: null };
  }

  // Handle superadmin role
  if (userRole.role === "superadmin") {
    return {
      message: "SUPERADMIN",
      name: userRole.full_name,
      role: "superadmin",
    };
  }

  // Handle admin role
  if (userRole.role === "admin") {
    const { data: admin, error: adminError } = await supabase
      .from("supervisors")
      .select("first_name, last_name, dept_id, department:dept_id(dept_name)")
      .eq("id", user.id)
      .single();

    if (adminError) {
      console.error("Error fetching admin details:", adminError);
      return { error: "Error fetching admin details", user: null };
    }

    // Access the department name correctly (handle both array and object cases)
    const departmentName = Array.isArray(admin.department)
      ? admin.department[0]?.dept_name || "Unknown"
      : (admin.department as { dept_name: string })?.dept_name || "Unknown";

    return {
      message: "ADMIN",
      name: `${admin.first_name} ${admin.last_name}`,
      dept: departmentName,
      role: "admin",
    };
  }

  // Handle trainee role
  if (userRole.role === "trainee") {
    const { data: intern, error: internError } = await supabase
      .from("interns")
      .select("first_name, last_name, university, dept_id, department:dept_id(dept_name)")
      .eq("id", user.id)
      .single();

    if (internError) {
      console.error("Error fetching intern:", internError);
      return { error: "Error fetching intern", user: null };
    }

    // Access the department name correctly (handle both array and object cases)
    const departmentName = Array.isArray(intern.department)
      ? intern.department[0]?.dept_name || "Unknown"
      : (intern.department as { dept_name: string })?.dept_name || "Unknown";

    return {
      name: `${intern.first_name} ${intern.last_name}`,
      university: intern.university,
      dept: departmentName,
      role: "trainee",
    };
  }

  // Default return for unknown roles
  return { error: "Unknown role", user: null };
}

export async function updateComment(date: string, traineeId: string, comment: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("timelogs")
    .update({ comments: comment })
    .eq("date", date)
    .eq("trainee_id", traineeId);

  if (error) {
    console.error("Error updating comment:", error);
    throw new Error("Failed to update comment");
  }

  return { success: true };
}

export async function getTimelogsByTraineeId(traineeId: string) {
  const supabase = await createClient();

  const { data: timelogs, error } = await supabase
      .from("timelogs")
      .select("*")
      .eq("trainee_id", traineeId)
      .order("date", { ascending: true });

  if (error) {
      console.error("Error fetching timelogs:", error);
      return { error: "Error fetching timelogs", timelogs: null };
  }

  return { timelogs };
}

export async function getAttendanceSummaryByTraineeId(traineeId: string) {
  const supabase = await createClient();

  const { data: summary, error: summaryError } = await supabase
    .from("attendancesummary")
    .select("accomplished_hours, remaining_hours, days_present, days_absent")
    .eq("trainee_id", traineeId)
    .maybeSingle(); // Use maybeSingle to handle no rows gracefully

  if (summaryError || !summary) {
    console.warn("No attendance summary found, fetching from interns table:", summaryError?.message || "No data");

    // Fallback to interns table for remaining_hours
    const { data: internData, error: internError } = await supabase
      .from("interns")
      .select("hours_to_render")
      .eq("id", traineeId)
      .single();

    if (internError || !internData) {
      console.error("Error fetching intern data:", internError);
      return {
        summary: {
          accomplished_hours: 0,
          remaining_hours: 0,
          days_present: 0,
          days_absent: 0,
        },
        error: null,
      };
    }

    return {
      summary: {
        accomplished_hours: 0,
        remaining_hours: internData.hours_to_render || 0,
        days_present: 0,
        days_absent: 0,
      },
      error: null,
    };
  }

  return { summary, error: null };
}




// New signUpAdminAction for admin signup
export const signUpAdminAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const firstName = formData.get("first_name")?.toString();
  const lastName = formData.get("last_name")?.toString();
  const deptId = formData.get("dept_id")?.toString();

  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  // Validate required fields
  if (!email || !password || !firstName || !lastName || !deptId) {
    return encodedRedirect("error", "/sign-up-admin", "All fields are required");
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
    return encodedRedirect("error", "/sign-up-admin", error.message);
  }

  const user = data.user;
  if (!user) {
    return encodedRedirect("error", "/sign-up-admin", "User not found after signup");
  }

  console.log("User ID:", user.id); // Debugging to check UUID format

  // Step 2: Insert additional user info into `users` table
  const { error: userError } = await supabase.from("users").insert([
    {
      id: user.id,
      full_name: fullName,
      email: user.email,
      created_at: createdAt,
      role: "admin", // Set role to "supervisor" for admins
    },
  ]);

  if (userError) {
    console.error("Database Error (users):", userError);
    return encodedRedirect(
      "error",
      "/sign-up-admin",
      "User created, but profile saving failed."
    );
  }

  // Step 3: Insert admin-specific info into `supervisors` table
  const { error: supervisorError } = await supabase.from("supervisors").insert([
    {
      id: user.id, // UUID from auth
      first_name: firstName,
      last_name: lastName,
      dept_id: parseInt(deptId, 10), // Convert to bigint
    },
  ]);

  if (supervisorError) {
    console.error("Database Error (supervisors):", JSON.stringify(supervisorError, null, 2));
    return encodedRedirect(
      "error",
      "/sign-up-admin",
      `User created, but supervisor details saving failed. Error: ${supervisorError.message}`
    );
  }

  return encodedRedirect(
    "success",
    "/sign-up-admin",
    "Thanks for signing up! Please check your email for a verification link."
  );
};

// Existing signInAction remains unchanged
export type Message = {
  message: string;
};





