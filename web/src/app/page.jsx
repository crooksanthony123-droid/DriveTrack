import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  FileText,
  Clock,
  Plus,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  CalendarDays,
} from "lucide-react";
import { format } from "date-fns";
import useUser from "@/utils/useUser";

export default function DashboardPage() {
  const { data: user } = useUser();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });

  // Prefer the instructor's saved full name from settings, then fall back to auth account name
  const instructorName = settings?.full_name || user?.name || "Instructor";

  if (isLoading)
    return (
      <div className="animate-pulse space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#001f3f]">Dashboard</h1>
          <p className="text-gray-500">Welcome back, {instructorName} 👋</p>
        </div>
        <a
          href="/lessons"
          className="flex items-center gap-2 rounded-lg bg-[#ff851b] px-4 py-2 font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="h-5 w-5" />
          New Lesson
        </a>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-[#001f3f]/10 p-3 text-[#001f3f]">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Active Students
              </p>
              <h3 className="text-2xl font-bold text-[#001f3f]">
                {stats?.totalStudents}
              </h3>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-orange-100 p-3 text-[#ff851b]">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Unpaid Invoices
              </p>
              <h3 className="text-2xl font-bold text-[#001f3f]">
                {stats?.unpaidInvoices.count}
              </h3>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#001f3f] p-6 shadow-lg sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-4 text-white">
            <div className="rounded-xl bg-white/20 p-3">
              <TrendingUp className="h-6 w-6 text-[#ff851b]" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/60">
                Outstanding Amount
              </p>
              <h3 className="text-2xl font-bold">
                ${stats?.unpaidInvoices.amount.toFixed(2)}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Today's Lessons */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#001f3f]">
              Today's Schedule
            </h2>
            <span className="text-sm text-gray-500">
              {format(new Date(), "MMMM do, yyyy")}
            </span>
          </div>

          <div className="space-y-4">
            {stats?.todayLessons.length > 0 ? (
              stats.todayLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-gray-100 hover:border-[#ff851b] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center rounded-lg bg-gray-50 px-3 py-2 min-w-[70px]">
                      <span className="text-xs font-bold text-gray-400 uppercase">
                        {lesson.lesson_time.slice(0, 5)}
                      </span>
                      <Clock className="h-4 w-4 text-[#ff851b]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#001f3f]">
                        {lesson.student_name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {lesson.lesson_type} • {lesson.duration} hrs
                      </p>
                    </div>
                  </div>
                  <div
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      lesson.status === "Completed"
                        ? "bg-green-100 text-green-700"
                        : lesson.status === "Cancelled"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {lesson.status}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
                <CalendarDays className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">
                  No lessons scheduled for today
                </p>
                <a
                  href="/lessons"
                  className="text-[#ff851b] text-sm font-bold mt-2 inline-block hover:underline"
                >
                  Plan your week
                </a>
              </div>
            )}
          </div>

          {/* Upcoming Lessons */}
          {stats?.upcomingLessons?.length > 0 && (
            <div className="space-y-3 mt-6">
              <h2 className="text-xl font-bold text-[#001f3f]">
                Upcoming Lessons
              </h2>
              {stats.upcomingLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-gray-100 hover:border-[#ff851b] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center rounded-lg bg-gray-50 px-3 py-2 min-w-[70px]">
                      <span className="text-xs font-bold text-[#ff851b]">
                        {format(new Date(lesson.lesson_date), "EEE d MMM")}
                      </span>
                      <span className="text-xs text-gray-400">
                        {lesson.lesson_time.slice(0, 5)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-[#001f3f]">
                        {lesson.student_name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {lesson.lesson_type} • {lesson.duration} hrs
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                    Scheduled
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[#001f3f]">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4">
            {[
              {
                label: "New Student",
                icon: Plus,
                color: "bg-[#001f3f]",
                href: "/students",
              },
              {
                label: "Create Invoice",
                icon: FileText,
                color: "bg-[#001f3f]",
                href: "/invoices",
              },
              {
                label: "View Schedule",
                icon: CalendarDays,
                color: "bg-[#001f3f]",
                href: "/lessons",
              },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg ${action.color} p-2 text-white`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <span className="font-bold text-[#001f3f]">
                    {action.label}
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-[#ff851b] transition-colors" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
