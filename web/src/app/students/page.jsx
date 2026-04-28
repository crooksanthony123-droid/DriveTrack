import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  ChevronRight,
  UserCircle,
  Clock,
  BarChart3,
  X,
  Pencil,
  Trash2,
  CheckCircle2,
  Save,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const DURATION_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3];

const statusColors = {
  Active: "bg-green-100 text-green-700",
  Inactive: "bg-gray-100 text-gray-500",
  "Test Passed": "bg-blue-100 text-blue-700",
};

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [deletingLessonId, setDeletingLessonId] = useState(null);

  // Data Fetching
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const res = await fetch("/api/students");
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    },
  });

  const { data: studentLessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ["student-lessons", selectedStudent?.id],
    queryFn: async () => {
      if (!selectedStudent) return [];
      const res = await fetch("/api/lessons");
      if (!res.ok) throw new Error("Failed to fetch lessons");
      const all = await res.json();
      return all
        .filter((l) => l.student_id === selectedStudent.id)
        .sort((a, b) => new Date(b.lesson_date) - new Date(a.lesson_date));
    },
    enabled: !!selectedStudent,
  });

  // Mutations
  const addStudentMutation = useMutation({
    mutationFn: async (newStudent) => {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudent),
      });
      if (!res.ok) throw new Error("Failed to create student");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student added successfully");
      setShowAddModal(false);
    },
  });

  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, ...fields }) => {
      const res = await fetch("/api/students", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...fields }),
      });
      if (!res.ok) throw new Error("Failed to update student");
      return res.json();
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setSelectedStudent(updated);
      toast.success("Student updated");
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: async (data) => {
      const res = await fetch("/api/lessons/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update lesson");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["student-lessons", selectedStudent?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      toast.success("Lesson updated");
      setEditingLesson(null);
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch("/api/lessons/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete lesson");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["student-lessons", selectedStudent?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      toast.success("Lesson deleted");
      setDeletingLessonId(null);
    },
  });

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleAddStudent = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    addStudentMutation.mutate(data);
  };

  const handleEditLesson = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    updateLessonMutation.mutate({ id: editingLesson.id, ...data });
  };

  const calculateHours = (lessons) =>
    lessons
      .filter((l) => l.status === "Completed")
      .reduce((sum, l) => sum + parseFloat(l.duration), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#001f3f]">
            Student Management
          </h1>
          <p className="text-gray-500">Profiles, Logbooks & Progress</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#ff851b] px-6 py-3 font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Add Student
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or email..."
          className="w-full rounded-2xl bg-white py-4 pl-12 pr-4 shadow-sm border border-gray-100 outline-none focus:border-[#ff851b]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filteredStudents.map((student) => (
          <div
            key={student.id}
            onClick={() => setSelectedStudent(student)}
            className="group cursor-pointer rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:border-[#ff851b] transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#001f3f]/5 text-[#001f3f]">
                  <UserCircle className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#001f3f]">
                    {student.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        statusColors[student.status] || statusColors.Active
                      }`}
                    >
                      {student.status || "Active"}
                    </span>
                    <p className="text-xs text-gray-400">
                      Since {format(new Date(student.start_date), "MMM yyyy")}
                    </p>
                  </div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-[#ff851b] transition-colors" />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Phone className="h-4 w-4 text-[#ff851b]" />
                {student.phone || "No phone"}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Mail className="h-4 w-4 text-[#ff851b]" />
                <span className="truncate">{student.email || "No email"}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase text-gray-400">
                <span>License: {student.licence_type}</span>
                <span>Target: {student.target_hours}h</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-[#ff851b] transition-all"
                  style={{ width: "15%" }}
                />
              </div>
            </div>
          </div>
        ))}

        {filteredStudents.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center lg:col-span-2">
            <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No students found</p>
          </div>
        )}
      </div>

      {/* Student Profile / Logbook Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#001f3f]/80 backdrop-blur-sm"
            onClick={() => {
              setSelectedStudent(null);
              setEditingLesson(null);
            }}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden">
            {/* Sticky header */}
            <div className="flex items-center justify-between bg-white px-8 py-5 border-b flex-shrink-0">
              <h2 className="text-2xl font-bold text-[#001f3f]">
                Student Logbook
              </h2>
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setEditingLesson(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-8 space-y-6">
              {/* Header Info + Status */}
              <div className="flex items-start gap-6 flex-wrap">
                <div className="h-20 w-20 rounded-2xl bg-[#001f3f] flex items-center justify-center text-white flex-shrink-0">
                  <UserCircle className="h-12 w-12" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-3xl font-bold text-[#001f3f]">
                    {selectedStudent.name}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
                      {selectedStudent.licence_type}
                    </span>
                    <span className="text-sm text-gray-500 font-medium">
                      Joined{" "}
                      {format(
                        new Date(selectedStudent.start_date),
                        "MMMM yyyy",
                      )}
                    </span>
                  </div>
                  {selectedStudent.phone && (
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" /> {selectedStudent.phone}
                    </p>
                  )}
                  {selectedStudent.email && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" /> {selectedStudent.email}
                    </p>
                  )}
                </div>
                {/* Status selector */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">
                    Status
                  </label>
                  <select
                    value={selectedStudent.status || "Active"}
                    onChange={(e) =>
                      updateStudentMutation.mutate({
                        id: selectedStudent.id,
                        status: e.target.value,
                      })
                    }
                    className={`rounded-lg border px-3 py-1.5 text-sm font-bold outline-none cursor-pointer ${
                      statusColors[selectedStudent.status] ||
                      statusColors.Active
                    }`}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Test Passed">Test Passed</option>
                  </select>
                </div>
              </div>

              {/* Progress Tracker */}
              <div className="rounded-2xl bg-gray-50 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-[#ff851b]" />
                    <span className="font-bold text-[#001f3f]">
                      Learning Progress
                    </span>
                  </div>
                  <span className="text-sm font-bold text-[#ff851b]">
                    {Math.min(
                      100,
                      Math.round(
                        (calculateHours(studentLessons) /
                          (selectedStudent.target_hours || 120)) *
                          100,
                      ),
                    )}
                    % Complete
                  </span>
                </div>
                <div className="h-4 w-full rounded-full bg-white border overflow-hidden">
                  <div
                    className="h-full bg-[#ff851b] transition-all duration-1000"
                    style={{
                      width: `${Math.min(100, (calculateHours(studentLessons) / (selectedStudent.target_hours || 120)) * 100)}%`,
                    }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="text-center">
                    <p className="text-xs font-bold uppercase text-gray-400">
                      Completed
                    </p>
                    <p className="text-2xl font-bold text-[#001f3f]">
                      {calculateHours(studentLessons)}h
                    </p>
                  </div>
                  <div className="text-center border-x">
                    <p className="text-xs font-bold uppercase text-gray-400">
                      Lessons
                    </p>
                    <p className="text-2xl font-bold text-[#001f3f]">
                      {studentLessons.length}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold uppercase text-gray-400">
                      Target
                    </p>
                    <p className="text-2xl font-bold text-[#001f3f]">
                      {selectedStudent.target_hours}h
                    </p>
                  </div>
                </div>
              </div>

              {/* Lesson History — scrollable */}
              <div className="space-y-3">
                <h4 className="text-lg font-bold text-[#001f3f] flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Lesson History ({studentLessons.length})
                </h4>
                {lessonsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-gray-100 rounded-xl" />
                    ))}
                  </div>
                ) : studentLessons.length > 0 ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {studentLessons.map((l) => (
                      <div
                        key={l.id}
                        className="rounded-xl border border-gray-100 p-4 hover:border-[#ff851b] transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-[#001f3f]">
                                {format(
                                  new Date(l.lesson_date),
                                  "EEE, MMM do yyyy",
                                )}
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                  l.status === "Completed"
                                    ? "bg-green-100 text-green-700"
                                    : l.status === "No-Show"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : l.status === "Cancelled"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {l.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {l.lesson_type} • {l.duration} hrs •{" "}
                              {l.lesson_time?.slice(0, 5)}
                            </p>
                            {l.notes && (
                              <p className="text-sm italic text-gray-600 bg-gray-50 p-2 rounded-lg border-l-2 border-[#ff851b] mt-2">
                                "{l.notes}"
                              </p>
                            )}
                          </div>

                          {/* Edit / Delete buttons */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingLesson(l);
                              }}
                              className="p-1.5 text-gray-400 hover:text-[#001f3f] hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit lesson"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingLessonId(l.id);
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete lesson"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Delete confirmation */}
                        {deletingLessonId === l.id && (
                          <div className="mt-3 p-3 bg-red-50 rounded-lg flex items-center justify-between gap-2">
                            <p className="text-sm text-red-700 font-medium">
                              Delete this lesson?
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setDeletingLessonId(null)}
                                className="px-3 py-1 text-xs font-bold rounded-lg border border-gray-200 hover:bg-gray-100"
                              >
                                No
                              </button>
                              <button
                                onClick={() =>
                                  deleteLessonMutation.mutate(l.id)
                                }
                                disabled={deleteLessonMutation.isPending}
                                className="px-3 py-1 text-xs font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                Yes, delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-gray-400 italic">
                    No lesson history yet
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lesson Modal */}
      {editingLesson && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#001f3f]/80 backdrop-blur-sm"
            onClick={() => setEditingLesson(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-[#001f3f] mb-5">
              Edit Lesson
            </h2>
            <form onSubmit={handleEditLesson} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    Date
                  </label>
                  <input
                    type="date"
                    name="lesson_date"
                    defaultValue={editingLesson.lesson_date?.split("T")[0]}
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
                    defaultValue={editingLesson.lesson_time?.slice(0, 5)}
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
                    defaultValue={editingLesson.duration}
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
                    Type
                  </label>
                  <select
                    name="lesson_type"
                    defaultValue={editingLesson.lesson_type}
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
                  Status
                </label>
                <select
                  name="status"
                  defaultValue={editingLesson.status}
                  className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-[#ff851b]"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="No-Show">No-Show</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Notes</label>
                <textarea
                  name="notes"
                  defaultValue={editingLesson.notes || ""}
                  placeholder="Lesson notes..."
                  className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-[#ff851b] h-20"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLesson(null)}
                  className="flex-1 rounded-xl border border-gray-200 py-3 font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateLessonMutation.isPending}
                  className="flex-1 rounded-xl bg-[#001f3f] py-3 font-bold text-white hover:bg-[#003366] disabled:opacity-50"
                >
                  {updateLessonMutation.isPending
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#001f3f]/80 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-[#001f3f] mb-6">
              Register New Student
            </h2>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Jane Smith"
                  className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-[#ff851b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="0412 345 678"
                    className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-[#ff851b]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="jane@example.com"
                    className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-[#ff851b]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    Licence Type
                  </label>
                  <select
                    name="licence_type"
                    required
                    className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-[#ff851b]"
                  >
                    <option value="Learner">Learner</option>
                    <option value="Probationary">Probationary (P1/P2)</option>
                    <option value="Full">Full Licence</option>
                    <option value="International">International</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue="Active"
                    className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-[#ff851b]"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Test Passed">Test Passed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    Target Hours
                  </label>
                  <input
                    type="number"
                    name="target_hours"
                    defaultValue="120"
                    required
                    className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-[#ff851b]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    defaultValue={format(new Date(), "yyyy-MM-dd")}
                    required
                    className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-[#ff851b]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={addStudentMutation.isPending}
                className="w-full rounded-xl bg-[#001f3f] py-4 font-bold text-white transition-all hover:bg-[#003366] disabled:opacity-50"
              >
                {addStudentMutation.isPending
                  ? "Adding..."
                  : "Add Student Profile"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
