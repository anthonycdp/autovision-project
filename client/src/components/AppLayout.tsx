import { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

// CKDEV-NOTE: Main application layout with sidebar navigation and content area
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* AIDEV-NOTE: Fixed sidebar with navigation and user info */}
      <Sidebar />
      {/* AIDEV-NOTE: Scrollable main content area for page components */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}