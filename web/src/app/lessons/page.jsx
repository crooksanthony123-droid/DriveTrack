import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import { format, startOfWeek, addDays, isSameDay, addWeeks } from "date-fns";
import { toast } from "sonner";

const DURATION_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3];

export default function LessonsPage() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0);

  // Data Fetching
  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ["lessons"],
    queryFn: async () => {
      const res = await fetch("/api/lessons");
      if (!res.ok) throw new Error("Failed to fetch lessons");
      return res.json();
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const res = await fetch("/api/students");
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    },
  });

  // Mutations
  const addLessonMutation = useMutation({
    mutationFn: async (newLesson) => {
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLesson),
      });
      if (!res.ok) throw new Error("Failed to create lesson");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Lesson scheduled successfully");
      setShowAddModal(false);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await fetch("/api/lessons/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Status updated");
    },
  });

  // Calendar Logic
  const weekStart = startOfWeek(addWeeks(new Date(), weekOffset), {
    weekStartsOn: 1,
  });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const lessonsByDay = lessons.reduce((acc, lesson) => {
    const dateStr = lesson.lesson_date.split("T")[0];
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(lesson);
    return acc;
  }, {});

  const handleAddLesson = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    addLessonMutation.mutate(data);
  };

  const weekLabel = `${format(weekStart, "d MMM")} – ${format(addDays(weekStart, 6), "d MMM yyyy")}`;

  const statusConfig = {
    Completed: {
      color: "bg-green-100 text-green-700",
      btnColor: "bg-green-600 hover:bg-green-700",
      icon: CheckCircle2,
    },
    Cancelled: {
      color: "bg-red-100 text-red-700",
      btnColor: "border border-red-200 text-red-600 hover:bg-red-50",
      icon: XCircle,
    },
    "No-Show": {
      color: "bg-yellow-100 text-yellow-700",
      btnColor: "border border-yellow-200 text-yellow-600 hover:bg-yellow-50",
      icon: AlertTriangle,
    },
    Scheduled: {
      color: "bg-blue-100 text-blue-700",
      btnColor: "",
      icon: Clock,
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#001f3f]">Lesson Booking</h1>
          <p className="text-gray-500">Manage your teaching schedule</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#ff851b] px-6 py-3 font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Schedule Lesson
        </button>
      </div>

      {/* Week Calendar */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
        {/* Week navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-[#001f3f] transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <p className="text-sm font-bold text-[#001f3f]">{weekLabel}</p>
            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="text-xs text-[#ff851b] font-medium hover:underline"
              >
                Back to today
              </button>
            )}
          </div>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-[#001f3f] transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <div className="flex min-w-[500px] justify-between gap-2">
            {weekDays.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const dayLessons = lessonsByDay[dateStr] || [];
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDate);

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDate(day)}
                  className={`flex-1 cursor-pointer rounded-xl p-3 transition-all ${
                    isSelected
                      ? "bg-[#001f3f] text-white"
                      : isToday
                        ? "bg-orange-50 border border-[#ff851b]"
                        : "hover:bg-gray-50"
                  }`}
                >
                  <div className="text-center mb-3">
                    <p
                      className={`text-xs font-bold uppercase ${
                        isSelected
                          ? "text-white/60"
                          : isToday
                            ? "text-[#ff851b]"
                            : "text-gray-400"
                      }`}
                    >
                      {format(day, "eee")}
                    </p>
                    <p
                      className={`text-lg font-bold ${isToday && !isSelected ? "text-[#ff851b]" : ""}`}
                    >
                      {format(day, "d")}
                    </p>
                  </div>
                  <div className="space-y-1">
                    {dayLessons.slice(0, 3).map((l) => (
                      <div
                        key={l.id}
                        className={`h-1.5 rounded-full ${
                          l.status === "Completed"
                            ? "bg-green-400"
                            : l.status === "Cancelled"
                              ? "bg-red-300"
                              : l.status === "No-Show"
                                ? "bg-yellow-400"
                                : "bg-[#ff851b]"
                        }`}
                      />
                    ))}
                    {dayLessons.length > 3 && (
                      <p className="text-[10px] text-center font-bold text-gray-400">
                        +{dayLessons.length - 3}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Day Lessons */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#001f3f]">
          {format(selectedDate, "EEEE, MMMM do")}
        </h2>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {lessonsByDay[format(selectedDate, "yyyy-MM-dd")]?.length > 0 ? (
            lessonsByDay[format(selectedDate, "yyyy-MM-dd")].map((lesson) => {
              const sc = statusConfig[lesson.status] || statusConfig.Scheduled;
              return (
                <div
                  key={lesson.id}
                  className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="rounded-xl bg-[#001f3f]/5 p-3 flex flex-col items-center justify-center min-w-[80px]">
                        <span className="text-xs font-bold text-gray-400 uppercase">
                          {lesson.lesson_time.slice(0, 5)}
                        </span>
                        <Clock className="h-4 w-4 text-[#ff851b] mt-1" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[#001f3f]">
                          {lesson.student_name}
                        </h3>
                        <p className="text-sm font-medium text-gray-500">
                          {lesson.lesson_type} • {lesson.duration} hrs
                        </p>
                        {lesson.pickup_location && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {lesson.pickup_location}
                          </p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${sc.color}`}
                    >
                      {lesson.status}
                    </span>
                  </div>

                  {lesson.notes && (
                    <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 italic border-l-2 border-[#ff851b]">
                      "{lesson.notes}"
                    </div>
                  )}

                  {/* One-tap status buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t flex-wrap">
                    <button
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: lesson.id,
                          status: "Completed",
                        })
                      }
                      disabled={
                        lesson.status === "Completed" ||
                        updateStatusMutation.isPending
                      }
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-green-600 py-2 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-40 transition-colors min-w-[80px]"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Done
                    </button>
                    <button
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: lesson.id,
                          status: "No-Show",
                        })
                      }
                      disabled={
                        lesson.status === "No-Show" ||
                        updateStatusMutation.isPending
                      }
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-yellow-300 py-2 text-xs font-bold text-yellow-700 hover:bg-yellow-50 disabled:opacity-40 transition-colors min-w-[80px]"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      No-Show
                    </button>
                    <button
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: lesson.id,
                          status: "Cancelled",
                        })
                      }
                      disabled={
                        lesson.status === "Cancelled" ||
                        updateStatusMutation.isPending
                      }
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-red-200 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors min-w-[80px]"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center lg:col-span-2">
              <CalendarDays className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">
                No lessons for this day
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-2 text-[#ff851b] text-sm font-bold hover:underline"
              >
                Schedule one
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Lesson Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#001f3f]/80 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-[#001f3f] mb-6">
              Schedule New Lesson
            </h2>
            <form onSubmit={handleAddLesson} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">
                  Select Student
                </label>
                <select
                  name="student_id"
                  required
                  className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-[#ff851b]"
                >
                  <option value="">Choose a student...</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    Date
                  </label>
                  <input
                    type="date"
                    name="lesson_date"
                    defaultValue={format(selectedDate, "yyyy-MM-dd")}
                    required
                    className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-[#ff851b]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    Time
                  </label>
                  <input
                    type="time"
                    name="lesson_time"
                    required
                    className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-[#ff851b]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    Duration
                  </label>
                  <select
                    name="duration"
                    defaultValue="1"
                    required
                    className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-[#ff851b]"
                  >
                    {DURATION_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d} hr{d !== 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    Lesson Type
                  </label>
                  <select
                    name="lesson_type"
                    required
                    className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-[#ff851b]"
                  >
                    <option value="Manual">Manual</option>
                    <option value="Automatic">Automatic</option>
                    <option value="Highway">Highway</option>
                    <option value="Parking">Parking</option>
                    <option value="Mock Test">Mock Test</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-[#ff851b]" />
                    Pick-up Location
                  </span>
                </label>
                <input
                  type="text"
                  name="pickup_location"
                  placeholder="e.g. 42 Oak Street, Suburb"
                  className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-[#ff851b]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">
                  Lesson Notes
                </label>
                <textarea
                  name="notes"
                  placeholder="Focus on reverse parking..."
                  className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-[#ff851b] h-24"
                />
              </div>

              <button
                type="submit"
                disabled={addLessonMutation.isPending}
                className="w-full rounded-xl bg-[#001f3f] py-4 font-bold text-white transition-all hover:bg-[#003366] disabled:opacity-50"
              >
                {addLessonMutation.isPending ? "Scheduling..." : "Book Lesson"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
