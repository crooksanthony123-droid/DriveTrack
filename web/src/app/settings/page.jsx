import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Settings,
  User,
  Building2,
  Phone,
  Mail,
  Hash,
  DollarSign,
  FileText,
  Save,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    full_name: "",
    business_name: "",
    phone: "",
    email: "",
    abn: "",
    default_hourly_rate: "65",
    invoice_footer:
      "Thank you for choosing DriveTrack for your driving education.",
  });
  const [saved, setSaved] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });

  useEffect(() => {
    if (settings) {
      setForm({
        full_name: settings.full_name || "",
        business_name: settings.business_name || "",
        phone: settings.phone || "",
        email: settings.email || "",
        abn: settings.abn || "",
        default_hourly_rate: settings.default_hourly_rate?.toString() || "65",
        invoice_footer:
          settings.invoice_footer ||
          "Thank you for choosing DriveTrack for your driving education.",
      });
    }
  }, [settings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (data) => {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings saved successfully");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
    onError: () => {
      toast.error("Failed to save settings");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveSettingsMutation.mutate({
      ...form,
      default_hourly_rate: parseFloat(form.default_hourly_rate) || 65,
    });
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-gray-200 rounded-xl" />
        <div className="h-64 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#001f3f]">Settings</h1>
        <p className="text-gray-500">
          Manage your instructor profile and invoice preferences
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal / Business Details */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-lg bg-[#001f3f]/10 p-2">
              <User className="h-5 w-5 text-[#001f3f]" />
            </div>
            <h2 className="text-lg font-bold text-[#001f3f]">
              Instructor Details
            </h2>
          </div>
          <p className="text-sm text-gray-500 -mt-3">
            This information appears on your invoices.
          </p>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
              <User className="h-4 w-4 text-[#ff851b]" />
              Full Name
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={handleChange("full_name")}
              placeholder="Your full name"
              className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-[#ff851b] transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-[#ff851b]" />
              Business Name
            </label>
            <input
              type="text"
              value={form.business_name}
              onChange={handleChange("business_name")}
              placeholder="e.g. Smith Driving School (optional)"
              className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-[#ff851b] transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-[#ff851b]" />
                Phone Number
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={handleChange("phone")}
                placeholder="0412 345 678"
                className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-[#ff851b] transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-[#ff851b]" />
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-[#ff851b] transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
              <Hash className="h-4 w-4 text-[#ff851b]" />
              ABN (Australian Business Number)
            </label>
            <input
              type="text"
              value={form.abn}
              onChange={handleChange("abn")}
              placeholder="12 345 678 901"
              className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-[#ff851b] transition-colors"
            />
          </div>
        </div>

        {/* Invoice Preferences */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-lg bg-[#001f3f]/10 p-2">
              <FileText className="h-5 w-5 text-[#001f3f]" />
            </div>
            <h2 className="text-lg font-bold text-[#001f3f]">
              Invoice Preferences
            </h2>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-[#ff851b]" />
              Default Hourly Rate ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                $
              </span>
              <input
                type="number"
                value={form.default_hourly_rate}
                onChange={handleChange("default_hourly_rate")}
                step="0.01"
                min="0"
                placeholder="65"
                className="w-full rounded-xl border border-gray-200 p-3 pl-8 outline-none focus:border-[#ff851b] transition-colors"
              />
            </div>
            <p className="text-xs text-gray-400">
              This is pre-filled when generating invoices.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">
              Invoice Footer Message
            </label>
            <textarea
              value={form.invoice_footer}
              onChange={handleChange("invoice_footer")}
              rows={3}
              placeholder="A thank you message shown at the bottom of every invoice..."
              className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-[#ff851b] transition-colors resize-none"
            />
            <p className="text-xs text-gray-400">
              This message appears at the bottom of every invoice PDF.
            </p>
          </div>
        </div>

        {/* Save button */}
        <button
          type="submit"
          disabled={saveSettingsMutation.isPending}
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-4 font-bold text-white transition-all ${
            saved ? "bg-green-600" : "bg-[#001f3f] hover:bg-[#003366]"
          } disabled:opacity-50`}
        >
          {saved ? (
            <>
              <CheckCircle2 className="h-5 w-5" />
              Saved!
            </>
          ) : saveSettingsMutation.isPending ? (
            "Saving..."
          ) : (
            <>
              <Save className="h-5 w-5" />
              Save Settings
            </>
          )}
        </button>
      </form>
    </div>
  );
}
