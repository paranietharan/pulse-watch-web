"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { DashboardShellContext } from "@/components/layout/DashboardShellContext";

export default function DashboardShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, refreshUnavailable, refreshSession } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !refreshUnavailable) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, refreshUnavailable, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#07090e]">
        <LoadingSpinner text="Checking session..." />
      </div>
    );
  }

  if (!isAuthenticated && refreshUnavailable) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p role="status">The service is unavailable. Your session will be checked again when you retry.</p>
        <button type="button" onClick={() => void refreshSession()} className="underline">Retry</button>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardShellContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      <div className="min-h-screen bg-neutral-50/60 dark:bg-[#07090e] text-neutral-900 dark:text-neutral-100 flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 lg:pl-60 flex flex-col min-h-screen">
          {children}
        </div>
      </div>
    </DashboardShellContext.Provider>
  );
}
