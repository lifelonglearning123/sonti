"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Pipeline, Opportunity, OpportunitySearchResponse, CreateOpportunityInput } from "@/types/opportunity";

async function fetchAPI(path: string, options?: RequestInit) {
  const res = await fetch(`/api/ghl/${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `Error ${res.status}`);
  }
  return res.json();
}

export function usePipelines(locationId: string) {
  return useQuery<{ pipelines: Pipeline[] }>({
    queryKey: ["pipelines", locationId],
    queryFn: () => fetchAPI(`opportunities/pipelines?locationId=${locationId}`),
    enabled: !!locationId,
  });
}

export function useOpportunities(locationId: string, pipelineId: string) {
  return useQuery<OpportunitySearchResponse>({
    queryKey: ["opportunities", locationId, pipelineId],
    queryFn: () =>
      fetchAPI(`opportunities/search?location_id=${locationId}&pipeline_id=${pipelineId}&limit=100`),
    enabled: !!locationId && !!pipelineId,
  });
}

export function useCreateOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOpportunityInput) =>
      fetchAPI("opportunities", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
    },
  });
}

export function useOpportunity(opportunityId: string) {
  return useQuery<{ opportunity: Opportunity }>({
    queryKey: ["opportunity", opportunityId],
    queryFn: () => fetchAPI(`opportunities/${opportunityId}`),
    enabled: !!opportunityId,
  });
}

export function useUpdateOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; monetaryValue?: number; pipelineStageId?: string; status?: string }) =>
      fetchAPI(`opportunities/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
    },
  });
}

export function useDeleteOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchAPI(`opportunities/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
    },
  });
}

export function useUpdateOpportunityStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stageId }: { id: string; stageId: string }) =>
      fetchAPI(`opportunities/${id}`, {
        method: "PUT",
        body: JSON.stringify({ pipelineStageId: stageId }),
      }),
    onMutate: async ({ id, stageId }) => {
      // Cancel in-flight queries so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["opportunities"] });

      // Snapshot every opportunities query for rollback
      const previousQueries = queryClient.getQueriesData<OpportunitySearchResponse>({
        queryKey: ["opportunities"],
      });

      // Optimistically move the card to the new stage
      queryClient.setQueriesData<OpportunitySearchResponse>(
        { queryKey: ["opportunities"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            opportunities: old.opportunities.map((opp) =>
              opp.id === id ? { ...opp, pipelineStageId: stageId } : opp
            ),
          };
        }
      );

      return { previousQueries };
    },
    onError: (_err, _vars, context) => {
      // Revert to the snapshot on failure
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
    },
  });
}
