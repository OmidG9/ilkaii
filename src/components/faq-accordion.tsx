"use client";

import { useId, useState } from "react";
import { Minus, Plus } from "lucide-react";

export function FaqAccordion({ items, defaultOpen = 0 }: { items: Array<{ question: string; answer: string }>; defaultOpen?: number }) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const baseId = useId();

  return (
    <div className="divide-y divide-line">
      {items.map((item, index) => {
        const expanded = open === index;
        const buttonId = `${baseId}-button-${index}`;
        const panelId = `${baseId}-panel-${index}`;
        return (
          <div key={item.question} className="py-1">
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpen(expanded ? null : index)}
                className="flex w-full items-start justify-between gap-5 py-5 text-right text-sm font-medium leading-7 transition-colors hover:text-primary sm:text-[15px]"
              >
                <span>{item.question}</span>
                <span className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-primary">
                  {expanded ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!expanded}
              className="pb-6 pl-10 pr-1 text-sm leading-8 text-ink/60"
            >
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}
