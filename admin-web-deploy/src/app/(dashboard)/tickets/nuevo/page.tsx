import { Suspense } from "react";
import { Spinner } from "@vecinosimple/ui";
import NuevoTicketForm from "./NuevoTicketForm";

export default function NuevoTicketPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[400px]"><Spinner size="lg" /></div>}>
      <NuevoTicketForm />
    </Suspense>
  );
}
