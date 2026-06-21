import { Spinner } from "@vecinosimple/ui";
import { Suspense } from "react";

import NuevoGastoForm from "./NuevoGastoForm";

export default function NuevoGastoPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[400px]"><Spinner size="lg" /></div>}>
      <NuevoGastoForm />
    </Suspense>
  );
}
