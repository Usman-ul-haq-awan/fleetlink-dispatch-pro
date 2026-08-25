import React from 'react';
import { cn } from '@/lib/utils';

const statusColors = {
  // Lead statuses
  'Imported': 'bg-blue-100 text-blue-700',
  'Queued': 'bg-slate-100 text-slate-700',
  'Researching': 'bg-purple-100 text-purple-700',
  'SAFER Complete': 'bg-indigo-100 text-indigo-700',
  'SMS Complete': 'bg-indigo-100 text-indigo-700',
  'Registration Complete': 'bg-indigo-100 text-indigo-700',
  'Insurance Complete': 'bg-indigo-100 text-indigo-700',
  'Safety Complete': 'bg-indigo-100 text-indigo-700',
  'Equipment Complete': 'bg-indigo-100 text-indigo-700',
  'Contact Complete': 'bg-indigo-100 text-indigo-700',
  'Qualified': 'bg-green-100 text-green-700',
  'Needs Review': 'bg-amber-100 text-amber-700',
  'Failed': 'bg-red-100 text-red-700',
  'Ready for Outreach': 'bg-cyan-100 text-cyan-700',
  'Contacted': 'bg-blue-100 text-blue-700',
  'Interested': 'bg-emerald-100 text-emerald-700',
  'Human Handoff': 'bg-orange-100 text-orange-700',
  'Onboarding': 'bg-violet-100 text-violet-700',
  'Active Client': 'bg-green-200 text-green-800',
  'Do Not Contact': 'bg-red-200 text-red-800',
  // Safety statuses
  'Not Assessed': 'bg-slate-100 text-slate-600',
  'Review Required': 'bg-amber-100 text-amber-700',
  'High Risk': 'bg-red-100 text-red-700',
  'Insufficient Data': 'bg-orange-100 text-orange-700',
  // Call outcomes
  'No Answer': 'bg-slate-100 text-slate-700',
  'Voicemail': 'bg-blue-100 text-blue-700',
  'Very Interested': 'bg-green-200 text-green-800',
  'Callback Requested': 'bg-cyan-100 text-cyan-700',
  'Not Interested': 'bg-red-100 text-red-700',
  'Already Has Dispatcher': 'bg-amber-100 text-amber-700',
  'Wrong Number': 'bg-red-100 text-red-700',
  'Converted': 'bg-green-200 text-green-800',
  'Pending': 'bg-slate-100 text-slate-600',
};

export default function StatusBadge({ status, className }) {
  const colorClass = statusColors[status] || 'bg-slate-100 text-slate-700';
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
        colorClass,
        className
      )}
    >
      {status || 'Unknown'}
    </span>
  );
}