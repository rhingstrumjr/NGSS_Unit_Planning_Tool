'use client';

const statusColors = {
  unanswered: 'bg-surface-light text-muted',
  'in-progress': 'bg-amber/20 text-amber',
  answered: 'bg-green/20 text-green',
};

const statusLabels = {
  unanswered: 'Unanswered',
  'in-progress': 'In Progress',
  answered: 'Answered',
};

interface StatusBadgeProps {
  status: 'unanswered' | 'in-progress' | 'answered';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`text-sm px-2 py-0.5 rounded-full font-medium ${statusColors[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
