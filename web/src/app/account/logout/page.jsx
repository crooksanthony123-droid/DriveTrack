import useAuth from "@/utils/useAuth";
import { useEffect } from "react";

function LogoutPage() {
  const { signOut } = useAuth();

  useEffect(() => {
    signOut({ callbackUrl: "/account/signin", redirect: true });
  }, [signOut]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#001f3f] p-4 text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ff851b] mx-auto mb-4"></div>
        <p className="text-xl font-medium">Signing you out...</p>
      </div>
    </div>
  );
}

export default LogoutPage;
