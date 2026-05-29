// DDSE Plugin Registry — v3.0
// Defines the extension architecture for future third-party and internal modules.
// Plugins declare their capabilities, required permissions, and integration points.
// The registry validates compatibility and manages the plugin lifecycle.

import type { Permission, DeckId } from './rbac';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PluginCapability =
  | 'routes'           // Plugin adds navigable pages
  | 'sidebar'          // Plugin contributes sidebar entries
  | 'analytics'        // Plugin extends the analytics module
  | 'inspection_type'  // Plugin adds a new inspection template type
  | 'map_layer'        // Plugin adds a GIS/map overlay
  | 'ai_model'         // Plugin provides an AI analysis model
  | 'integration'      // Plugin connects an external system
  | 'report_template'  // Plugin adds report template types
  | 'notification_channel'; // Plugin adds a notification delivery channel

export type PluginStatus = 'active' | 'disabled' | 'error' | 'pending_install' | 'incompatible';

export interface PluginRoute {
  path:       string;
  pageTitle:  string;
  permission?: Permission;
  deck?:      DeckId;
}

export interface PluginManifest {
  id:               string;
  name:             string;
  version:          string;
  minPlatformVersion: string;  // minimum DDSE version required
  author:           string;
  description:      string;
  capabilities:     PluginCapability[];
  requiredPermissions: Permission[];
  routes?:          PluginRoute[];
  events?: {
    emits:   string[];
    listens: string[];
  };
  config?: Record<string, unknown>;
}

export interface RegisteredPlugin {
  manifest:    PluginManifest;
  status:      PluginStatus;
  installedAt: number;
  error?:      string;
}

// ─── Built-in plugin stubs ────────────────────────────────────────────────────
// These represent future modules that can plug into the platform.
// Each is documented with its operational purpose and integration contract.

export const BUILTIN_PLUGIN_MANIFESTS: PluginManifest[] = [

  {
    id: 'gis-mapping',
    name: 'GIS Site Mapping',
    version: '1.0.0',
    minPlatformVersion: '3.0.0',
    author: 'DDSE Core Team',
    description: 'Visualizes project sites, inspection locations, and hazard hotspots on an interactive map using Mapbox GL or Leaflet.',
    capabilities: ['routes', 'map_layer', 'sidebar'],
    requiredPermissions: ['data.view_nationwide'],
    routes: [{ path: '/map', pageTitle: 'Site Map', permission: 'data.view_nationwide' }],
    events: {
      emits:   ['map.location_pinned', 'map.route_traced'],
      listens: ['inspection.created', 'hazard.reported'],
    },
  },

  {
    id: 'drone-inspection',
    name: 'Drone Inspection Module',
    version: '1.0.0',
    minPlatformVersion: '3.0.0',
    author: 'DDSE Core Team',
    description: 'Enables drone-based aerial inspection workflows, including flight plans, image capture, and automated defect tagging via computer vision.',
    capabilities: ['inspection_type', 'routes', 'ai_model'],
    requiredPermissions: ['inspections.create', 'engineering.upload'],
    routes: [{ path: '/drone', pageTitle: 'Drone Inspections', permission: 'inspections.create' }],
    events: {
      emits:   ['drone.flight_completed', 'drone.defect_detected'],
      listens: ['inspection.created'],
    },
  },

  {
    id: 'biometric-auth',
    name: 'Biometric Authentication',
    version: '1.0.0',
    minPlatformVersion: '3.0.0',
    author: 'DDSE Core Team',
    description: 'Adds fingerprint and facial recognition step-up authentication for accessing classified reports and high-clearance modules.',
    capabilities: ['integration'],
    requiredPermissions: ['system.config'],
    events: {
      emits:   ['auth.biometric_verified', 'auth.biometric_failed'],
      listens: ['auth.login'],
    },
  },

  {
    id: 'ai-recommendation-engine',
    name: 'Advanced AI Recommendation Engine',
    version: '1.0.0',
    minPlatformVersion: '3.0.0',
    author: 'DDSE Core Team',
    description: 'Connects to a large language model (Claude API or local model) to generate context-aware inspection recommendations, compliance summaries, and risk narratives.',
    capabilities: ['ai_model', 'analytics'],
    requiredPermissions: ['data.view_nationwide', 'inspections.view_all'],
    events: {
      emits:   ['ai.recommendation_generated', 'ai.summary_ready'],
      listens: ['inspection.submitted', 'hazard.reported', 'report.submitted'],
    },
  },

  {
    id: 'mobile-companion',
    name: 'Mobile Field Companion',
    version: '1.0.0',
    minPlatformVersion: '3.0.0',
    author: 'DDSE Core Team',
    description: 'Progressive Web App companion for field inspectors on tablets/phones. Supports offline data capture, photo evidence upload, and GPS location tagging.',
    capabilities: ['integration', 'notification_channel'],
    requiredPermissions: ['inspections.conduct'],
    events: {
      emits:   ['mobile.evidence_uploaded', 'mobile.location_tagged'],
      listens: ['inspection.created'],
    },
  },

  {
    id: 'procurement-integration',
    name: 'Procurement System Integration',
    version: '1.0.0',
    minPlatformVersion: '3.0.0',
    author: 'DDSE Core Team',
    description: 'Syncs contract data, BOQ valuations, and payment certificates from PFMS or equivalent procurement management systems.',
    capabilities: ['integration', 'analytics'],
    requiredPermissions: ['data.view_nationwide', 'engineering.review_boq'],
    events: {
      emits:   ['procurement.contract_synced', 'procurement.payment_certified'],
      listens: ['project.created', 'report.approved'],
    },
  },
];

// ─── Registry implementation ──────────────────────────────────────────────────

class PluginRegistryClass {
  private readonly plugins: Map<string, RegisteredPlugin> = new Map();
  private platformVersion = '3.0.0';

  constructor() {
    // Register all built-in plugins (disabled — ready for activation)
    for (const manifest of BUILTIN_PLUGIN_MANIFESTS) {
      this.plugins.set(manifest.id, {
        manifest,
        status:      'pending_install',
        installedAt: Date.now(),
      });
    }
  }

  getAll(): RegisteredPlugin[] {
    return Array.from(this.plugins.values());
  }

  get(pluginId: string): RegisteredPlugin | null {
    return this.plugins.get(pluginId) ?? null;
  }

  getActive(): RegisteredPlugin[] {
    return Array.from(this.plugins.values()).filter((p) => p.status === 'active');
  }

  isCompatible(manifest: PluginManifest): boolean {
    // Simple semantic version check: minVersion must be <= platformVersion
    const [pMaj, pMin] = this.platformVersion.split('.').map(Number);
    const [mMaj, mMin] = manifest.minPlatformVersion.split('.').map(Number);
    return pMaj > mMaj || (pMaj === mMaj && pMin >= mMin);
  }

  register(manifest: PluginManifest): boolean {
    if (!this.isCompatible(manifest)) {
      this.plugins.set(manifest.id, {
        manifest,
        status:      'incompatible',
        installedAt: Date.now(),
        error:       `Requires platform v${manifest.minPlatformVersion}+`,
      });
      return false;
    }

    this.plugins.set(manifest.id, {
      manifest,
      status:      'disabled',
      installedAt: Date.now(),
    });
    return true;
  }

  activate(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin || plugin.status === 'incompatible') return false;
    plugin.status = 'active';
    return true;
  }

  deactivate(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;
    plugin.status = 'disabled';
    return true;
  }

  getStats() {
    const all      = this.getAll();
    const active   = all.filter((p) => p.status === 'active').length;
    const pending  = all.filter((p) => p.status === 'pending_install').length;
    const error    = all.filter((p) => p.status === 'error').length;
    return { total: all.length, active, pending, error, disabled: all.length - active - pending - error };
  }
}

export const pluginRegistry = new PluginRegistryClass();
