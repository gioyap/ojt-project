import Hero from "@/components/hero";
import ConnectSupabaseSteps from "@/components/tutorial/connect-supabase-steps";
import SignUpUserSteps from "@/components/tutorial/sign-up-user-steps";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { FaUserGraduate, FaUserShield } from "react-icons/fa";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">FLAWLESS INTERNSHIP</h1>
        <p className="text-lg text-gray-600 mb-8">
          Please select your role to continue.
        </p>
        <div className="flex flex-col space-y-4">
          <Link
            href="/sign-in?role=trainee"
            className="bg-blue-600 text-white px-8 py-4 rounded-lg shadow-lg hover:bg-blue-700 transition duration-300 text-xl font-semibold flex items-center justify-center space-x-2"
          >
            <FaUserGraduate className="w-6 h-6" />
            <span>TRAINEE</span>
          </Link>
          <Link
            href="/sign-in?role=admin"
            className="bg-purple-600 text-white px-8 py-4 rounded-lg shadow-lg hover:bg-purple-700 transition duration-300 text-xl font-semibold flex items-center justify-center space-x-2"
          >
            <FaUserShield className="w-6 h-6" />
            <span>ADMIN</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
