import React from 'react';
import { format } from 'date-fns';
import clsx from 'clsx';

const EVENT_COLORS = {
  created: 'bg-blue-500',
  MATERIAL_CERTIFIED: 'bg-blue-500',
  TEST_REPORT_ISSUED: 'bg-purple-500',
  LCA_DATA: 'bg-green-500',
  CERTIFICATION_GRANTED: 'bg-orange-500',
  ASSEMBLY_COMPLETED: 'bg-indigo-500',
  SHIPMENT: 'bg-teal-500',
  RECEIVED: 'bg-teal-500',
  DELIVERED: 'bg-teal-500',
  TRANSFER: 'bg-cyan-500',
  HANDOVER: 'bg-cyan-500',
  ACCEPTED: 'bg-green-500',
  REPAIR: 'bg-pink-500',
  MAINTENANCE: 'bg-pink-500',
  DISMANTLING: 'bg-red-500',
  RECYCLING: 'bg-yellow-500',
  default: 'bg-gray-500',
};

export function Timeline({ events, className }) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No events recorded yet
      </div>
    );
  }

  return (
    <div className={clsx('relative', className)}>
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
      <div className="space-y-6">
        {events.map((event, index) => {
          const color = EVENT_COLORS[event.event_type] || EVENT_COLORS.default;
          return (
            <div key={event.id || index} className="relative pl-10">
              <div
                className={clsx(
                  'absolute left-2 w-4 h-4 rounded-full border-2 border-white',
                  color
                )}
              />
              <div className="card">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-medium">{formatEventType(event.event_type)}</span>
                  <span className="text-xs text-gray-500">
                    {event.timestamp
                      ? format(new Date(event.timestamp), 'MMM d, yyyy HH:mm')
                      : event.created_at
                      ? format(new Date(event.created_at), 'MMM d, yyyy HH:mm')
                      : ''}
                  </span>
                </div>
                {event.actor_organization_id && (
                  <p className="text-xs text-gray-500 mb-2">
                    By: {event.actor_organization_id}
                  </p>
                )}
                {event.changes && (
                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32">
                    {typeof event.changes === 'string'
                      ? event.changes
                      : JSON.stringify(event.changes, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatEventType(type) {
  if (!type) return 'Event';
  return type
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

export function SupplyChainTimeline({ shipments }) {
  return (
    <Timeline
      events={shipments?.map((s) => ({
        id: s.id,
        event_type: s.status === 'delivered' ? 'DELIVERED' : 'SHIPMENT',
        timestamp: s.arrival_date || s.departure_date,
        changes: {
          from: s.from_location,
          to: s.to_location,
          carrier: s.carrier_name,
          status: s.status,
        },
      }))}
    />
  );
}

export default Timeline;
