import { Suspense } from "react";
import { Spinner } from "@vecinosimple/ui";
import NuevaExpensaForm from "./NuevaExpensaForm";

export default function NuevaExpensaPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[400px]"><Spinner size="lg" /></div>}>
      <NuevaExpensaForm />
    </Suspense>
  );
}
