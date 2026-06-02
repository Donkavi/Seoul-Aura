"use client";

import { useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import VerifyPhone from "@/components/auth/VerifyPhone";

function VerifyPhoneContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("callbackUrl") || "/account";

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/account");
    else if (status === "authenticated" && (session?.user as { phoneVerified?: boolean })?.phoneVerified) {
      router.replace(redirectTo);
    }
  }, [status, session, router, redirectTo]);

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-rose-500" />
      </div>
    );
  }

  return <VerifyPhone redirectTo={redirectTo} />;
}

export default function VerifyPhonePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-rose-25" />}>
      <VerifyPhoneContent />
    </Suspense>
  );
}
