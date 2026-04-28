import { useState } from "react";
import useAuth from "@/utils/useAuth";

function SignInPage() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { signInWithCredentials } = useAuth();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      await signInWithCredentials({
        email,
        password,
        callbackUrl: "/",
        redirect: true,
      });
    } catch (err) {
      setError("Invalid email or password");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#001f3f] p-4 font-sans text-white">
      <form
        noValidate
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
      >
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-2 text-3xl font-bold text-[#001f3f]">
            DriveTrack
          </div>
          <p className="text-gray-600 italic text-sm">
            Instructor Management System
          </p>
        </div>

        <h1 className="mb-8 text-center text-2xl font-bold text-[#001f3f]">
          Welcome Back
        </h1>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="instructor@example.com"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-[#ff851b] focus:ring-1 focus:ring-[#ff851b]"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-[#ff851b] focus:ring-1 focus:ring-[#ff851b]"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-500 font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#001f3f] px-4 py-3 text-base font-bold text-white transition-all hover:bg-[#003366] active:scale-95 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <a
              href="/account/signup"
              className="font-bold text-[#ff851b] hover:underline"
            >
              Create one
            </a>
          </div>
        </div>
      </form>
    </div>
  );
}

export default SignInPage;
