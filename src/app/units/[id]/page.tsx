'use client';

import { use } from 'react';
import { useUnit } from '@/lib/hooks/useUnit';
import { UnitEditor } from '@/components/unit-editor/UnitEditor';

export default function UnitEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { unit, loading, updateUnit } = useUnit(id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-muted">Loading...</span>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted">Unit not found.</p>
        <a href="/" className="text-teal hover:text-teal-light">
          Back to home
        </a>
      </div>
    );
  }

  return <UnitEditor unit={unit} updateUnit={updateUnit} />;
}
