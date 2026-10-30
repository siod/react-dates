import type { ReactNode } from 'react';

export interface CalendarWeekProps {
  children: ReactNode;
}

export default function CalendarWeek({ children }: CalendarWeekProps) {
  return (
    <tr>
      {children}
    </tr>
  );
}
