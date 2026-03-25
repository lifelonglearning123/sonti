export interface Pipeline {
  id: string;
  name: string;
  locationId: string;
  stages: PipelineStage[];
}

export interface PipelineStage {
  id: string;
  name: string;
  position: number;
  showInFunnel?: boolean;
}

export interface Opportunity {
  id: string;
  name: string;
  monetaryValue?: number;
  pipelineId: string;
  pipelineStageId: string;
  assignedTo?: string;
  status: 'open' | 'won' | 'lost' | 'abandoned';
  source?: string;
  contactId: string;
  contact?: {
    id: string;
    name: string;
    companyName?: string;
    email?: string;
    phone?: string;
    tags?: string[];
  };
  locationId: string;
  dateAdded?: string;
  createdAt?: string;
  dateUpdated?: string;
  updatedAt?: string;
  lastStatusChangeAt?: string;
  lastStageChangeAt?: string;
  notes?: string[];
  customFields?: Array<{ id: string; value: string }>;
}

export interface OpportunitySearchResponse {
  opportunities: Opportunity[];
  meta: {
    total: number;
    currentPage: number;
    nextPage?: number;
    prevPage?: number;
  };
}

export interface CreateOpportunityInput {
  pipelineId: string;
  locationId: string;
  name: string;
  pipelineStageId: string;
  status: string;
  contactId: string;
  monetaryValue?: number;
  assignedTo?: string;
  source?: string;
}
