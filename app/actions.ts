"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signUpAction = async (formData: FormData) => {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  // Extract form data
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const username = formData.get("username")?.toString();
  const firstName = formData.get("first_name")?.toString();
  const lastName = formData.get("last_name")?.toString();
  const phoneNo = formData.get("phone_no")?.toString();
  const university = formData.get("university")?.toString();
  const startDate = formData.get("start_date")?.toString();
  const endDate = formData.get("end_date")?.toString();
  const deptId = formData.get("dept_id")?.toString();
  const supId = formData.get("sup_id")?.toString();
  const tid = formData.get("tid")?.toString();

  // Validate required fields
  if (
    !email ||
    !password ||
    !username ||
    !firstName ||
    !lastName ||
    !phoneNo ||
    !university ||
    !startDate ||
    !endDate ||
    !deptId ||
    !supId ||
    !tid
  ) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "All fields are required",
    );
  }

  try {
    // Step 1: Create user in Supabase authentication
    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (authError) {
      console.error(authError.code + " " + authError.message);
      return encodedRedirect("error", "/sign-up", authError.message);
    }

    // Step 2: Insert user into the `users` table
    const { error: userError } = await supabase.from("users").insert([
      {
        username,
        password, // Note: Passwords should be hashed before storing in production
        role: "trainee",
        name: `${firstName} ${lastName}`,
      },
    ]);

    if (userError) {
      console.error(userError.message);
      return encodedRedirect("error", "/sign-up", "Failed to create user");
    }

    // Step 3: Insert trainee into the `interns` table
    const { error: internError } = await supabase.from("interns").insert([
      {
        trainee_id: tid,
        first_name: firstName,
        last_name: lastName,
        email,
        phone_no: phoneNo,
        university,
        start_date: startDate,
        end_date: endDate,
        dept_id: deptId,
        sup_id: supId,
      },
    ]);

    if (internError) {
      console.error(internError.message);
      return encodedRedirect("error", "/sign-up", "Failed to create trainee");
    }

    // Success
    return encodedRedirect(
      "success",
      "/sign-up",
      "Thanks for signing up! Please check your email for a verification link.",
    );
  } catch (err) {
    console.error(err);
    return encodedRedirect("error", "/sign-up", "An unexpected error occurred");
  }
};