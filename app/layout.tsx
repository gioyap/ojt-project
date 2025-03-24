import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { ToastContainer } from "react-toastify"; // Import ToastContainer
import "react-toastify/dist/ReactToastify.css"; // Import styles for Toastify
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
	? `https://${process.env.VERCEL_URL}`
	: "http://localhost:3000";

export const metadata = {
	metadataBase: new URL(defaultUrl),
	title: "RSC InternHub",
	description: "RSC GROUP INTERNSHIP HUB",
};

const geistSans = Geist({
	display: "swap",
	subsets: ["latin"],
});

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={geistSans.className} suppressHydrationWarning>
			<body className="bg-background text-foreground">
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					{/* Toast Notification Container */}
					<ToastContainer
						position="top-right"
						autoClose={5000}
						hideProgressBar
					/>

					{/* HEADER PART */}
					<main className="w-full">
						{/* MAIN CONTENT */}
						<div>{children}</div>
					</main>
				</ThemeProvider>
			</body>
		</html>
	);
}
