"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import WorkspaceLayout from "@/components/layout/WorkspaceLayout";

export default function WorkspacePage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("repomind_user");
    if (!user) {
      router.push("/login");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <WorkspaceLayout />;
}