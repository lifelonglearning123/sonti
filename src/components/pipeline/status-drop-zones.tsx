"use client";

import { useState, type DragEvent } from "react";
import { XCircle, AlertTriangle, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusDropZonesProps {
  isDragging: boolean;
  onDropStatus: (status: string) => void;
}

interface ZoneConfig {
  status: string;
  label: string;
  borderColor: string;
  hoverBg: string;
  hoverBorder: string;
  textColor: string;
  hoverTextColor: string;
  icon: React.ReactNode;
}

const zones: ZoneConfig[] = [
  {
    status: "lost",
    label: "LOST",
    borderColor: "border-red-300",
    hoverBg: "bg-red-50",
    hoverBorder: "border-red-400",
    textColor: "text-red-400",
    hoverTextColor: "text-red-600",
    icon: <XCircle className="h-5 w-5" />,
  },
  {
    status: "abandoned",
    label: "ABANDONED",
    borderColor: "border-amber-300",
    hoverBg: "bg-amber-50",
    hoverBorder: "border-amber-400",
    textColor: "text-amber-400",
    hoverTextColor: "text-amber-600",
    icon: <AlertTriangle className="h-5 w-5" />,
  },
  {
    status: "won",
    label: "WON",
    borderColor: "border-green-300",
    hoverBg: "bg-green-50",
    hoverBorder: "border-green-400",
    textColor: "text-green-400",
    hoverTextColor: "text-green-600",
    icon: <Trophy className="h-5 w-5" />,
  },
];

export function StatusDropZones({ isDragging, onDropStatus }: StatusDropZonesProps) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: DragEvent, status: string) => {
    e.preventDefault();
    setHoveredZone(null);
    onDropStatus(status);
  };

  if (!isDragging) return null;

  return (
    <div className="flex gap-4 mt-4 px-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
      {zones.map((zone) => {
        const isHovered = hoveredZone === zone.status;
        return (
          <div
            key={zone.status}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 h-16 rounded-xl border-2 border-dashed transition-all duration-150",
              isHovered
                ? `${zone.hoverBg} ${zone.hoverBorder} ${zone.hoverTextColor} scale-[1.02]`
                : `${zone.borderColor} ${zone.textColor}`
            )}
            onDragOver={handleDragOver}
            onDragEnter={() => setHoveredZone(zone.status)}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setHoveredZone(null);
              }
            }}
            onDrop={(e) => handleDrop(e, zone.status)}
          >
            {zone.icon}
            <span className="text-sm font-bold tracking-wide">{zone.label}</span>
          </div>
        );
      })}
    </div>
  );
}
