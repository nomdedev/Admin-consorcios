import { Suspense } from 'react';

import { Spinner } from 'ui';

import UsuariosListContent from './UsuariosListContent';

export default function UsuariosPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[400px]"><Spinner size="lg" /></div>}>
      <UsuariosListContent />
    </Suspense>
  );
}
