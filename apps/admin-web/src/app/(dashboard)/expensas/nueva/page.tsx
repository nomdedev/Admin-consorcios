import { Spinner } from "@vecinosimple/ui";
import { Suspense } from "react";

import NuevaExpensaForm from "./NuevaExpensaForm";

export default function NuevaExpensaPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[400px]"><Spinner size="lg" /></div>}>
      <NuevaExpensaForm />
    </Suspense>
  );
}
