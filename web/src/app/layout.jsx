import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useUser from "@/utils/useUser";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  FileText,
  LogOut,
  User,
  Menu,
  X,
  Settings,
} from "lucide-react";
import { Toaster } from "sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppLayout({ children }) {
  const { data: user, loading } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#001f3f]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-[#ff851b]" />
      </div>
    );
  }

  const isAuthPage =
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/account");

  // Redirect to signin if not authenticated and not on an account page
  if (!user && !isAuthPage && typeof window !== "undefined") {
    window.location.href = "/account/signin";
    return null;
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Lessons", href: "/lessons", icon: CalendarDays },
    { name: "Students", href: "/students", icon: Users },
    { name: "Invoices", href: "/invoices", icon: FileText },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const NavContent = () => (
    <div className="flex h-full flex-col bg-[#001f3f] text-white">
      <div className="flex items-center gap-2 p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff851b] text-xl font-bold">
          DT
        </div>
        <span className="text-xl font-bold tracking-tight">DriveTrack</span>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-4">
        {navItems.map((item) => (
          <a
            key={item.name}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-white/10 ${
              typeof window !== "undefined" &&
              window.location.pathname === item.href
                ? "bg-white/10 text-[#ff851b]"
                : ""
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </a>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <User className="h-4 w-4" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">
              {user?.name || "Instructor"}
            </p>
          </div>
        </div>
        <a
          href="/account/logout"
          className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-white/10"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </a>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 md:flex md:flex-col">
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="relative flex w-64 flex-col bg-[#001f3f]">
            <div
              className="absolute right-4 top-4 text-white md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="h-6 w-6" />
            </div>
            <NavContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#ff851b] font-bold text-white text-xs">
              DT
            </div>
            <span className="font-bold text-[#001f3f]">DriveTrack</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-[#001f3f]"
          >
            <Menu className="h-6 w-6" />
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

export default function RootLayout({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppLayout>{children}</AppLayout>
    </QueryClientProvider>
  );
}
