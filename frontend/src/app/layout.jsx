import "./globals.css";
import { Inter } from "next/font/google";
import Sidebar from "@/components/Sidebar"; // Import Sidebar
import ThemeProvider from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Trello Clone - Kanban",
  description: "Project Management App",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-white dark:bg-[#1E1F22]`}>
        <ThemeProvider>
          <div className="flex h-screen overflow-hidden">
            {/* Sidebar is now global */}
            <Sidebar />
            
            {/* Main Content Area */}
            <main className="flex-1 overflow-auto relative">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}