import { Spinner } from "@vecinosimple/ui";
import { Suspense } from "react";

import NuevoComunicadoForm from "./NuevoComunicadoForm";

export default function NuevoComunicadoPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[400px]"><Spinner size="lg" /></div>}>
      <NuevoComunicadoForm />
    </Suspense>
  );
}
