import { FaUserGraduate, FaUserShield } from "react-icons/fa";
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
			<div className=" relative animate-in fade-in-5 duration-1000 z-10 flex flex-col items-start  w-auto justify-center min-h-screen p-8 sm:p-16 md:p-24 lg:p-60">
				<div className="text-center bg-white bg-opacity-80 p-8 rounded-lg shadow-lg w-full sm:w-max md:w-max lg:w-max">
					<h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
						RSC GROUP INTERNSHIP
					</h1>
					<p className="text-base sm:text-lg text-gray-600 mb-8">
						Please select your role to continue.
					</p>
					<div className="space-y-4 w-full">
						<Link
							href="/sign-in?role=trainee"
							className="bg-red-600 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-lg shadow-lg hover:bg-red-700 transition duration-300 text-lg sm:text-xl font-semibold flex items-center justify-center space-x-2"
						>
							<FaUserGraduate className="w-5 h-5 sm:w-6 sm:h-6" />
							<span>TRAINEE</span>
						</Link>
						<Link
							href="/sign-in?role=admin"
							className="bg-blue-600 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-lg shadow-lg hover:bg-blue-700 transition duration-300 text-lg sm:text-xl font-semibold flex items-center justify-center space-x-2"
						>
							<FaUserShield className="w-5 h-5 sm:w-6 sm:h-6" />
							<span>ADMIN</span>
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
