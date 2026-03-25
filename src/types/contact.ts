export interface Contact {
  id: string;
  locationId: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  source?: string;
  tags?: string[];
  dateAdded?: string;
  dateUpdated?: string;
  dateOfBirth?: string;
  website?: string;
  customFields?: Array<{ id: string; value: string }>;
  attributionSource?: {
    url?: string;
    campaign?: string;
    utmSource?: string;
    utmMedium?: string;
    utmContent?: string;
    utmTerm?: string;
    utmCampaign?: string;
    referrer?: string;
    campaignId?: string;
    fbclid?: string;
    fbp?: string;
    gclid?: string;
    gaClientId?: string;
    gaSessionId?: string;
    medium?: string;
    mediumId?: string;
    sessionSource?: string;
    userAgent?: string;
    ip?: string;
  };
  lastAttributionSource?: {
    url?: string;
    campaign?: string;
    utmSource?: string;
    utmMedium?: string;
    utmContent?: string;
    utmTerm?: string;
    utmCampaign?: string;
    referrer?: string;
    campaignId?: string;
    fbclid?: string;
    fbp?: string;
    gclid?: string;
    gaClientId?: string;
    gaSessionId?: string;
    medium?: string;
    mediumId?: string;
    sessionSource?: string;
    userAgent?: string;
    ip?: string;
  };
  dnd?: boolean;
  dndSettings?: {
    all?: { status: string; message?: string; code?: string };
    email?: { status: string; message?: string; code?: string };
    sms?: { status: string; message?: string; code?: string };
    call?: { status: string; message?: string; code?: string };
    whatsApp?: { status: string; message?: string; code?: string };
    gmb?: { status: string; message?: string; code?: string };
    fb?: { status: string; message?: string; code?: string };
  };
  opportunities?: Array<{ id: string; name?: string; status?: string; monetaryValue?: number }>;
}

export interface ContactSearchResponse {
  contacts: Contact[];
  total: number;
  count: number;
  startAfter?: number;
  startAfterId?: string;
}

export interface ContactSearchFilters {
  query?: string;
  locationId: string;
  limit?: number;
  startAfter?: number;
  startAfterId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateContactInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  source?: string;
  tags?: string[];
  locationId: string;
}
