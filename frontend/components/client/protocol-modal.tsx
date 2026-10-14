"use client";

import { Button, Modal } from "@/components/ui";
import { SERVICE_PROTOCOLS } from "@/lib/data/service-content";
import type { SalonService } from "@/types";

interface ProtocolModalProps {
  service: SalonService;
  onClose: () => void;
  onBook: (service: SalonService) => void;
}

export function ProtocolModal({
  service,
  onClose,
  onBook,
}: ProtocolModalProps) {
  const protocol = SERVICE_PROTOCOLS[service.id];

  return (
    <Modal
      onClose={onClose}
      size="md"
      title={`${service.category} Protocol`}
      description={service.name}
    >
      <p className="mb-4 text-slate-600 text-xs leading-relaxed">
        {service.description}
      </p>

      <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <h4 className="mb-2.5 font-bold text-slate-800 text-xs uppercase tracking-wider">
          Step-by-Step Experience
        </h4>
        <ul className="space-y-2 text-slate-700 text-xs">
          {(protocol?.steps ?? []).map((step) => (
            <li key={step} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-6 space-y-3 text-xs">
        <div>
          <span className="block font-bold text-slate-900">
            Featured Formulations:
          </span>
          <span className="text-slate-600">{protocol?.products}</span>
        </div>
        <div>
          <span className="block font-bold text-slate-900">Ideal For:</span>
          <span className="text-slate-600">{protocol?.idealFor}</span>
        </div>
      </div>

      <Button variant="primary" fullWidth onClick={() => onBook(service)}>
        Proceed to Book & Authorize Hold
      </Button>
    </Modal>
  );
}
