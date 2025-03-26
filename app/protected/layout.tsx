import HeaderAuth from "@/components/header-auth";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default async function Layout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div
			className="w-full lg:h-screen 2xl:overflow-hidden bg-cover bg-center"
			style={{ backgroundImage: "url('/bg-mainpge.png')" }}
		>
			<nav className="bg-pink-400 w-full flex justify-end border-b border-b-foreground/10 h-16">
				<div className="w-full max-w-5xl flex justify-end items-center p-3 px-5 text-sm">
					<HeaderAuth />
				</div>
			</nav>
			{children}
		</div>
	);
}