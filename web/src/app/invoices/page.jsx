import React, { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  FileText,
  CheckCircle2,
  Download,
  X,
  Building2,
  Phone,
  Mail,
  Hash,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [hourlyRate, setHourlyRate] = useState(65);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [pdfReady, setPdfReady] = useState(false);

  // Load jsPDF + autoTable from CDN
  useEffect(() => {
    const loadScript = (src, id) =>
      new Promise((resolve, reject) => {
        if (document.getElementById(id)) {
          resolve();
          return;
        }
        const s = document.createElement("script");
        s.src = src;
        s.id = id;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });

    loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
      "jspdf-lib",
    )
      .then(() =>
        loadScript(
          "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.29/jspdf.plugin.autotable.min.js",
          "jspdf-autotable-lib",
        ),
      )
      .then(() => setPdfReady(true))
      .catch(() => console.error("Failed to load PDF library"));
  }, []);

  // Data Fetching
  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const res = await fetch("/api/invoices");
      if (!res.ok) throw new Error("Failed to fetch invoices");
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

  const { data: allLessons = [] } = useQuery({
    queryKey: ["lessons"],
    queryFn: async () => {
      const res = await fetch("/api/lessons");
      if (!res.ok) throw new Error("Failed to fetch lessons");
      return res.json();
    },
  });

  const { data: settings = {} } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });

  // Pre-fill hourly rate from settings
  useEffect(() => {
    if (settings?.default_hourly_rate) {
      setHourlyRate(settings.default_hourly_rate);
    }
  }, [settings?.default_hourly_rate]);

  // Mutations
  const createInvoiceMutation = useMutation({
    mutationFn: async (newInvoice) => {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newInvoice),
      });
      if (!res.ok) throw new Error("Failed to create invoice");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Invoice generated");
      setShowAddModal(false);
      setSelectedStudentId("");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await fetch("/api/invoices/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Invoice status updated");
    },
  });

  // Logic
  const filteredInvoices = invoices.filter((inv) =>
    filter === "all" ? true : inv.status === filter,
  );

  const studentCompletedLessons = useMemo(() => {
    if (!selectedStudentId) return [];
    return allLessons.filter(
      (l) =>
        l.student_id === parseInt(selectedStudentId) &&
        l.status === "Completed",
    );
  }, [selectedStudentId, allLessons]);

  const totalHours = studentCompletedLessons.reduce(
    (sum, l) => sum + parseFloat(l.duration),
    0,
  );
  const totalAmount = totalHours * parseFloat(hourlyRate || 0);

  const getInvoiceLessons = (invoice) => {
    if (
      invoice.lesson_ids &&
      Array.isArray(invoice.lesson_ids) &&
      invoice.lesson_ids.length > 0
    ) {
      return allLessons.filter((l) => invoice.lesson_ids.includes(l.id));
    }
    return allLessons.filter(
      (l) => l.student_id === invoice.student_id && l.status === "Completed",
    );
  };

  const handleCreateInvoice = (e) => {
    e.preventDefault();
    if (!selectedStudentId || totalAmount <= 0) return;
    createInvoiceMutation.mutate({
      student_id: parseInt(selectedStudentId),
      rate_per_hour: parseFloat(hourlyRate),
      total_amount: totalAmount,
      lesson_ids: studentCompletedLessons.map((l) => l.id),
    });
  };

  const downloadPDF = (invoice) => {
    if (!pdfReady || !window.jspdf) {
      toast.error("PDF library loading, please try again in a moment");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 0;

    // Header band
    doc.setFillColor(0, 31, 63);
    doc.rect(0, 0, pageWidth, 45, "F");

    // Orange accent bar
    doc.setFillColor(255, 133, 27);
    doc.rect(0, 45, pageWidth, 3, "F");

    // "INVOICE" title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont(undefined, "bold");
    doc.text("INVOICE", margin, 22);

    doc.setFontSize(11);
    doc.setFont(undefined, "normal");
    doc.setTextColor(255, 255, 255, 0.7);
    doc.text(`#${invoice.id}`, margin, 32);

    // Instructor info (right side of header)
    const instName = settings?.full_name || "Driving Instructor";
    const instBiz = settings?.business_name || "";
    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(instName, pageWidth - margin, 14, { align: "right" });
    doc.setFont(undefined, "normal");
    doc.setFontSize(9);
    doc.setTextColor(220, 220, 220);
    if (instBiz) doc.text(instBiz, pageWidth - margin, 21, { align: "right" });
    if (settings?.phone)
      doc.text(settings.phone, pageWidth - margin, instBiz ? 28 : 21, {
        align: "right",
      });
    if (settings?.email)
      doc.text(settings.email, pageWidth - margin, instBiz ? 35 : 28, {
        align: "right",
      });
    if (settings?.abn)
      doc.text(`ABN: ${settings.abn}`, pageWidth - margin, instBiz ? 42 : 35, {
        align: "right",
      });

    y = 58;

    // Date & Status
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.text(`Date Issued:`, margin, y);
    doc.setTextColor(0, 31, 63);
    doc.setFont(undefined, "bold");
    doc.text(
      format(new Date(invoice.created_at), "MMMM do, yyyy"),
      margin + 24,
      y,
    );

    const statusColor =
      invoice.status === "Paid" ? [22, 163, 74] : [220, 38, 38];
    doc.setTextColor(...statusColor);
    doc.text(`● ${invoice.status}`, pageWidth - margin, y, { align: "right" });

    y += 14;

    // Bill To section
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 30, 3, 3, "F");
    doc.setTextColor(150, 150, 150);
    doc.setFont(undefined, "normal");
    doc.setFontSize(8);
    doc.text("BILL TO", margin + 5, y + 9);
    doc.setTextColor(0, 31, 63);
    doc.setFontSize(13);
    doc.setFont(undefined, "bold");
    doc.text(invoice.student_name, margin + 5, y + 18);
    doc.setFont(undefined, "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const contactParts = [invoice.student_phone, invoice.student_email].filter(
      Boolean,
    );
    if (contactParts.length > 0) {
      doc.text(contactParts.join("  |  "), margin + 5, y + 26);
    }

    y += 38;

    // Lessons table
    const invoiceLessons = getInvoiceLessons(invoice);
    const tableRows = invoiceLessons.map((l) => {
      const amt = parseFloat(l.duration) * parseFloat(invoice.rate_per_hour);
      return [
        format(new Date(l.lesson_date), "dd MMM yyyy"),
        l.lesson_type,
        `${l.duration} hr${parseFloat(l.duration) !== 1 ? "s" : ""}`,
        `$${amt.toFixed(2)}`,
      ];
    });

    doc.autoTable({
      startY: y,
      head: [["Date", "Lesson Type", "Duration", "Amount"]],
      body:
        tableRows.length > 0
          ? tableRows
          : [["—", "No lessons recorded", "—", "—"]],
      headStyles: {
        fillColor: [0, 31, 63],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: "bold",
        cellPadding: 5,
      },
      bodyStyles: { fontSize: 9, textColor: [50, 50, 50], cellPadding: 5 },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      columnStyles: { 3: { halign: "right", fontStyle: "bold" } },
      margin: { left: margin, right: margin },
    });

    y = doc.lastAutoTable.finalY + 8;

    // Total box
    const totalBoxW = 80;
    const totalBoxX = pageWidth - margin - totalBoxW;
    doc.setFillColor(0, 31, 63);
    doc.roundedRect(totalBoxX, y, totalBoxW, 22, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text("TOTAL DUE", totalBoxX + 5, y + 9);
    doc.setTextColor(255, 133, 27);
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text(
      `$${parseFloat(invoice.total_amount).toFixed(2)}`,
      totalBoxX + totalBoxW - 5,
      y + 16,
      { align: "right" },
    );

    y += 35;

    // Footer
    const footer =
      settings?.invoice_footer ||
      "Thank you for choosing DriveTrack for your driving education.";
    doc.setTextColor(160, 160, 160);
    doc.setFontSize(8);
    doc.setFont(undefined, "italic");
    doc.text(footer, pageWidth / 2, y, { align: "center" });

    doc.save(
      `invoice-${invoice.id}-${invoice.student_name.replace(/\s+/g, "_")}.pdf`,
    );
    toast.success("PDF downloaded!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#001f3f]">Invoicing</h1>
          <p className="text-gray-500">Track payments and bill students</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#ff851b] px-6 py-3 font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Generate Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {["all", "Unpaid", "Paid"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition-colors whitespace-nowrap ${
              filter === f
                ? "bg-[#001f3f] text-white"
                : "bg-white text-gray-500 hover:bg-gray-100 border"
            }`}
          >
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      {/* Invoice List */}
      <div className="space-y-4">
        {filteredInvoices.length > 0 ? (
          filteredInvoices.map((inv) => (
            <div
              key={inv.id}
              className="group rounded-2xl bg-white p-5 shadow-sm border border-gray-100 hover:border-[#ff851b] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`rounded-xl p-3 ${
                    inv.status === "Paid"
                      ? "bg-green-100 text-green-600"
                      : "bg-orange-100 text-[#ff851b]"
                  }`}
                >
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-[#001f3f]">
                    {inv.student_name}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Inv #{inv.id} •{" "}
                    {format(new Date(inv.created_at), "MMM do, yyyy")}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 flex-1">
                <div className="text-right">
                  <p className="text-lg font-bold text-[#001f3f]">
                    ${parseFloat(inv.total_amount).toFixed(2)}
                  </p>
                  <p className="text-[10px] uppercase font-bold text-gray-400">
                    ${inv.rate_per_hour}/hr
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {inv.status === "Unpaid" ? (
                    <button
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: inv.id,
                          status: "Paid",
                        })
                      }
                      className="rounded-lg bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700 transition-colors"
                    >
                      Mark Paid
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 text-green-600 font-bold text-xs uppercase bg-green-50 px-3 py-2 rounded-lg">
                      <CheckCircle2 className="h-4 w-4" />
                      Paid
                    </div>
                  )}
                  <button
                    onClick={() => setViewingInvoice(inv)}
                    title="View / Download PDF"
                    className="p-2 text-gray-400 hover:text-[#001f3f] transition-colors rounded-lg hover:bg-gray-100"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No invoices found</p>
          </div>
        )}
      </div>

      {/* Generate Invoice Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#001f3f]/80 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-[#001f3f] mb-6">
              Generate Student Invoice
            </h2>
            <form onSubmit={handleCreateInvoice} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">
                  Select Student
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
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

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">
                  Hourly Rate ($)
                </label>
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-[#ff851b]"
                />
              </div>

              {selectedStudentId && (
                <div className="rounded-xl bg-gray-50 p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Completed Lessons:</span>
                    <span className="font-bold text-[#001f3f]">
                      {studentCompletedLessons.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Hours:</span>
                    <span className="font-bold text-[#001f3f]">
                      {totalHours} hrs
                    </span>
                  </div>
                  <div className="pt-2 border-t flex justify-between items-center">
                    <span className="font-bold text-[#001f3f]">
                      Total Amount:
                    </span>
                    <span className="text-2xl font-bold text-[#ff851b]">
                      ${totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  createInvoiceMutation.isPending ||
                  !selectedStudentId ||
                  totalAmount <= 0
                }
                className="w-full rounded-xl bg-[#001f3f] py-4 font-bold text-white transition-all hover:bg-[#003366] disabled:opacity-50"
              >
                {createInvoiceMutation.isPending
                  ? "Generating..."
                  : "Generate Invoice"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Viewer Modal */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#001f3f]/80 backdrop-blur-sm"
            onClick={() => setViewingInvoice(null)}
          />
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Invoice header band */}
            <div className="bg-[#001f3f] p-8 flex justify-between items-start flex-shrink-0">
              <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tight italic">
                  Invoice
                </h2>
                <p className="text-white/40 font-bold text-sm mt-1">
                  #{viewingInvoice.id}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-lg">
                  {settings?.full_name || "Driving Instructor"}
                </p>
                {settings?.business_name && (
                  <p className="text-white/60 text-sm">
                    {settings.business_name}
                  </p>
                )}
                {settings?.phone && (
                  <p className="text-white/60 text-sm flex items-center justify-end gap-1">
                    <Phone className="h-3 w-3" /> {settings.phone}
                  </p>
                )}
                {settings?.email && (
                  <p className="text-white/60 text-sm flex items-center justify-end gap-1">
                    <Mail className="h-3 w-3" /> {settings.email}
                  </p>
                )}
                {settings?.abn && (
                  <p className="text-white/60 text-sm flex items-center justify-end gap-1">
                    <Hash className="h-3 w-3" /> ABN: {settings.abn}
                  </p>
                )}
              </div>
            </div>
            <div className="h-1 bg-[#ff851b]" />

            <div className="overflow-y-auto flex-1 p-8 space-y-6">
              {/* Date & Status */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400 mb-1">
                    Date Issued
                  </p>
                  <p className="font-bold text-[#001f3f]">
                    {format(
                      new Date(viewingInvoice.created_at),
                      "MMMM do, yyyy",
                    )}
                  </p>
                </div>
                <span
                  className={`rounded-full px-4 py-1 text-sm font-bold ${
                    viewingInvoice.status === "Paid"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {viewingInvoice.status}
                </span>
              </div>

              {/* Bill To */}
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs font-bold uppercase text-gray-400 mb-2">
                  Bill To
                </p>
                <h3 className="text-xl font-bold text-[#001f3f]">
                  {viewingInvoice.student_name}
                </h3>
                {viewingInvoice.student_phone && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Phone className="h-3.5 w-3.5" />{" "}
                    {viewingInvoice.student_phone}
                  </p>
                )}
                {viewingInvoice.student_email && (
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />{" "}
                    {viewingInvoice.student_email}
                  </p>
                )}
              </div>

              {/* Lessons breakdown table */}
              <div>
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#001f3f] text-white">
                      <th className="text-left text-xs font-bold uppercase py-3 px-4 rounded-tl-lg">
                        Date
                      </th>
                      <th className="text-left text-xs font-bold uppercase py-3 px-4">
                        Type
                      </th>
                      <th className="text-left text-xs font-bold uppercase py-3 px-4">
                        Duration
                      </th>
                      <th className="text-right text-xs font-bold uppercase py-3 px-4 rounded-tr-lg">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {getInvoiceLessons(viewingInvoice).length > 0 ? (
                      getInvoiceLessons(viewingInvoice).map((l, i) => {
                        const amt =
                          parseFloat(l.duration) *
                          parseFloat(viewingInvoice.rate_per_hour);
                        return (
                          <tr
                            key={l.id}
                            className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                          >
                            <td className="py-3 px-4 text-sm text-[#001f3f]">
                              {format(new Date(l.lesson_date), "d MMM yyyy")}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {l.lesson_type}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {l.duration} hrs
                            </td>
                            <td className="py-3 px-4 text-sm font-bold text-[#001f3f] text-right">
                              ${amt.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="py-6 text-center text-gray-400 italic text-sm"
                        >
                          No lesson records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Total */}
              <div className="bg-[#001f3f] rounded-2xl p-5 flex justify-between items-center">
                <div>
                  <p className="text-white/60 text-sm">
                    Rate: ${viewingInvoice.rate_per_hour}/hr
                  </p>
                  <p className="text-white font-bold text-lg">
                    Total Balance Due
                  </p>
                </div>
                <span className="text-3xl font-black text-[#ff851b]">
                  ${parseFloat(viewingInvoice.total_amount).toFixed(2)}
                </span>
              </div>

              {/* Footer */}
              <p className="text-center text-xs text-gray-400 italic">
                {settings?.invoice_footer ||
                  "Thank you for choosing DriveTrack for your driving education."}
              </p>

              {/* Download button */}
              <button
                onClick={() => downloadPDF(viewingInvoice)}
                disabled={!pdfReady}
                className="flex items-center gap-2 mx-auto rounded-xl bg-[#001f3f] px-6 py-3 text-sm font-bold text-white hover:bg-[#003366] transition-all disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {pdfReady ? "Download PDF" : "Loading PDF library..."}
              </button>
            </div>

            <button
              onClick={() => setViewingInvoice(null)}
              className="absolute top-4 right-4 p-2 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
