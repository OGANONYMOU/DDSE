// DDSE External System Integration Bridge
// Adapter stubs for future integration with HR, procurement, GIS,
// and military database systems. Each adapter follows a standard interface
// so implementations can be swapped in without changing callers.

// ─── Shared types ─────────────────────────────────────────────────────────────

export type IntegrationStatus = 'connected' | 'disconnected' | 'degraded' | 'unavailable';

export interface IntegrationHealth {
  system:    string;
  status:    IntegrationStatus;
  latencyMs: number | null;
  lastSync:  number | null;
  error?:    string;
}

export interface IntegrationRecord {
  externalId: string;
  source:     string;
  syncedAt:   number;
  data:       Record<string, unknown>;
}

// ─── Base adapter interface ───────────────────────────────────────────────────

export interface SystemAdapter<T = Record<string, unknown>> {
  name:         string;
  description:  string;
  enabled:      boolean;
  health:       () => Promise<IntegrationHealth>;
  fetchRecords: (query?: Record<string, unknown>) => Promise<T[]>;
  pushRecord?:  (record: T) => Promise<{ externalId: string }>;
}

// ─── HR System Adapter ────────────────────────────────────────────────────────
// Future integration: Army HR database for personnel sync

export interface HRPersonnelRecord {
  serviceNumber: string;
  fullName:      string;
  rank:          string;
  unit:          string;
  directorate:   string;
  active:        boolean;
}

export const hrSystemAdapter: SystemAdapter<HRPersonnelRecord> = {
  name:        'HR Management System',
  description: 'Army HR database — personnel records, rank changes, postings',
  enabled:     false,

  async health(): Promise<IntegrationHealth> {
    return {
      system:    'HR Management System',
      status:    'unavailable',
      latencyMs: null,
      lastSync:  null,
      error:     'Integration not yet configured. Requires HR system API credentials.',
    };
  },

  async fetchRecords(): Promise<HRPersonnelRecord[]> {
    // Will call: GET /api/hr/personnel?unit=...&active=true
    throw new Error('HR integration not configured');
  },
};

// ─── Procurement System Adapter ───────────────────────────────────────────────
// Future integration: PFMS / procurement management

export interface ProcurementRecord {
  contractRef:   string;
  contractorName: string;
  projectCode:   string;
  value:         number;
  currency:      'NGN' | 'USD';
  status:        'active' | 'completed' | 'disputed';
  startDate:     string;
  endDate:       string;
}

export const procurementAdapter: SystemAdapter<ProcurementRecord> = {
  name:        'Procurement Management System',
  description: 'Contract records, BOQ valuations, payment certificates',
  enabled:     false,

  async health(): Promise<IntegrationHealth> {
    return {
      system:    'Procurement Management System',
      status:    'unavailable',
      latencyMs: null,
      lastSync:  null,
      error:     'Procurement integration requires API gateway configuration.',
    };
  },

  async fetchRecords(): Promise<ProcurementRecord[]> {
    throw new Error('Procurement integration not configured');
  },
};

// ─── GIS / Mapping Adapter ────────────────────────────────────────────────────
// Future integration: Leaflet / Mapbox geolocation for project sites

export interface GeoLocation {
  projectId:   string;
  projectCode: string;
  latitude:    number;
  longitude:   number;
  accuracy:    number;
  capturedAt:  string;
  capturedBy:  string;
}

export const gisAdapter: SystemAdapter<GeoLocation> = {
  name:        'GIS / Geolocation System',
  description: 'Project site coordinates, inspection waypoints, hazard hotspots',
  enabled:     false,

  async health(): Promise<IntegrationHealth> {
    return {
      system:    'GIS System',
      status:    'unavailable',
      latencyMs: null,
      lastSync:  null,
      error:     'Requires Mapbox / Leaflet API key configuration in .env.local',
    };
  },

  async fetchRecords(): Promise<GeoLocation[]> {
    throw new Error('GIS integration not configured');
  },

  async pushRecord(record: GeoLocation): Promise<{ externalId: string }> {
    // Will POST to: /api/gis/locations
    void record;
    throw new Error('GIS integration not configured');
  },
};

// ─── Asset Management Adapter ─────────────────────────────────────────────────
// Future integration: Infrastructure asset register

export interface AssetRecord {
  assetId:       string;
  assetType:     'building' | 'vehicle' | 'equipment' | 'infrastructure';
  name:          string;
  location:      string;
  directorate:   string;
  condition:     'excellent' | 'good' | 'fair' | 'poor';
  lastInspected: string;
  value:         number;
}

export const assetAdapter: SystemAdapter<AssetRecord> = {
  name:        'Asset Management System',
  description: 'Infrastructure asset register, valuations, condition ratings',
  enabled:     false,

  async health(): Promise<IntegrationHealth> {
    return {
      system:    'Asset Management System',
      status:    'unavailable',
      latencyMs: null,
      lastSync:  null,
      error:     'Asset management integration pending — awaiting API specification.',
    };
  },

  async fetchRecords(): Promise<AssetRecord[]> {
    throw new Error('Asset management integration not configured');
  },
};

// ─── Integration registry ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const INTEGRATION_REGISTRY: SystemAdapter<any>[] = [
  hrSystemAdapter,
  procurementAdapter,
  gisAdapter,
  assetAdapter,
];

export async function getAllIntegrationHealth(): Promise<IntegrationHealth[]> {
  return Promise.all(INTEGRATION_REGISTRY.map((adapter) => adapter.health()));
}

export function getEnabledIntegrations(): SystemAdapter[] {
  return INTEGRATION_REGISTRY.filter((a) => a.enabled);
}
