"use client";

import { useState, useMemo, useCallback, type DragEvent } from "react";
import { StageColumn } from "./stage-column";
import { DealCard } from "./deal-card";
import { StatusDropZones } from "./status-drop-zones";
import { DealDetail } from "./deal-detail";
import { Skeleton } from "@/components/ui/skeleton";
import { useUpdateOpportunityStatus, useUpdateOpportunity } from "@/hooks/use-opportunities";
import { formatCurrency } from "@/lib/utils";
import type { Pipeline, Opportunity } from "@/types/opportunity";

interface PipelineBoardProps {
  pipeline: Pipeline | undefined;
  opportunities: Opportunity[];
  isLoading: boolean;
}

// Confetti component
function ConfettiExplosion({ onDone }: { onDone: () => void }) {
  const colors = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.5}s`,
    size: Math.random() * 8 + 4,
    rotation: Math.random() * 360,
  }));

  // Auto cleanup
  setTimeout(onDone, 3000);

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece absolute top-0"
          style={{
            left: p.left,
            animationDelay: p.delay,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export function PipelineBoard({
  pipeline,
  opportunities,
  isLoading,
}: PipelineBoardProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const updateStatus = useUpdateOpportunityStatus();
  const updateOpportunity = useUpdateOpportunity();

  const stages = pipeline?.stages?.sort((a, b) => a.position - b.position) || [];

  // Pipeline summary funnel
  const summaryData = useMemo(() => {
    if (!stages.length || !opportunities.length) return [];
    const total = opportunities.length;
    return stages.map((stage) => {
      const stageOpps = opportunities.filter((o) => o.pipelineStageId === stage.id);
      const count = stageOpps.length;
      const value = stageOpps.reduce((sum, o) => sum + (o.monetaryValue || 0), 0);
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      return { stage, count, value, pct };
    });
  }, [stages, opportunities]);

  const handleDragStart = useCallback((e: DragEvent, opportunityId: string) => {
    setDraggedId(opportunityId);
    e.dataTransfer.setData("text/plain", opportunityId);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDrop = useCallback((e: DragEvent, stageId: string) => {
    e.preventDefault();
    const oppId = draggedId || e.dataTransfer.getData("text/plain");
    if (!oppId) return;

    const opp = opportunities.find((o) => o.id === oppId);
    if (opp && opp.pipelineStageId === stageId) {
      setDraggedId(null);
      return;
    }

    updateStatus.mutate({ id: oppId, stageId });
    setDraggedId(null);
  }, [draggedId, opportunities, updateStatus]);

  const handleStatusDrop = useCallback((status: string) => {
    if (!draggedId) return;
    if (status === "won") {
      setShowConfetti(true);
    }
    updateOpportunity.mutate({ id: draggedId, status });
    setDraggedId(null);
  }, [draggedId, updateOpportunity]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
  }, []);

  const handleCardClick = useCallback((opp: Opportunity) => {
    setSelectedOpp(opp);
    setDetailOpen(true);
  }, []);

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="min-w-[300px] space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Pipeline summary funnel bar */}
      {summaryData.length > 0 && (
        <div className="mb-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-1 h-8">
            {summaryData.map((data, i) => (
              <div
                key={data.stage.id}
                className="relative group flex-1 h-full"
                style={{
                  flex: `${Math.max(data.pct, 5)} 0 0`,
                }}
              >
                <div
                  className="h-full rounded-md transition-all duration-300"
                  style={{
                    backgroundColor: `hsl(${220 - i * 30}, 70%, ${55 + i * 5}%)`,
                    opacity: 0.85,
                  }}
                />
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  <p className="font-medium">{data.stage.name}</p>
                  <p className="text-gray-300">{data.count} deals &middot; {formatCurrency(data.value)} &middot; {data.pct}%</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center mt-2 gap-3 overflow-x-auto">
            {summaryData.map((data, i) => (
              <div key={data.stage.id} className="flex items-center gap-1.5 shrink-0">
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{
                    backgroundColor: `hsl(${220 - i * 30}, 70%, ${55 + i * 5}%)`,
                  }}
                />
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                  {data.stage.name}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                  {data.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 400px)" }}>
        {stages.map((stage) => {
          const stageOpps = opportunities.filter((o) => o.pipelineStageId === stage.id);
          const totalValue = stageOpps.reduce((sum, o) => sum + (o.monetaryValue || 0), 0);

          return (
            <StageColumn
              key={stage.id}
              stage={stage}
              count={stageOpps.length}
              totalValue={totalValue}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {stageOpps.map((opp) => (
                <DealCard
                  key={opp.id}
                  opportunity={opp}
                  onDragStart={(e) => handleDragStart(e, opp.id)}
                  onDragEnd={handleDragEnd}
                  isDragging={draggedId === opp.id}
                  onClick={() => handleCardClick(opp)}
                />
              ))}
            </StageColumn>
          );
        })}
      </div>

      {/* Status drop zones - shown when dragging */}
      <StatusDropZones
        isDragging={draggedId !== null}
        onDropStatus={handleStatusDrop}
      />

      {/* Deal detail modal */}
      <DealDetail
        open={detailOpen}
        onOpenChange={setDetailOpen}
        opportunity={selectedOpp}
        pipeline={pipeline || null}
      />

      {/* Confetti */}
      {showConfetti && <ConfettiExplosion onDone={() => setShowConfetti(false)} />}
    </div>
  );
}
