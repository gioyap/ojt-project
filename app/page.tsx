import { FaUserGraduate, FaUserShield, FaUserCog } from "react-icons/fa";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative w-full min-h-screen">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/landing-bg.png')" }}
      ></div>

      {/* Content Wrapper */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center bg-white bg-opacity-80 p-6 rounded-lg shadow-lg">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            RSC GROUP INTERNSHIP
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Please select your role to continue.
          </p>
          <div className="space-y-4">
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
            <Link
              href="/sign-in?role=superadmin"
              className="bg-yellow-600 text-white px-8 py-4 rounded-lg shadow-lg hover:bg-yellow-700 transition duration-300 text-xl font-semibold flex items-center justify-center space-x-2"
            >
              <FaUserCog className="w-6 h-6" />
              <span>SUPERADMIN</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}