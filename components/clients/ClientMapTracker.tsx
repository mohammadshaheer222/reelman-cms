'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Compass,
  Phone,
  MessageCircle,
  ExternalLink,
  Search,
  Filter,
  RotateCcw,
  Sparkles,
  ChevronRight,
  IndianRupee,
  Calendar,
  Layers,
  ArrowRight,
  Trash2,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Map as MapIcon,
  Grid3X3,
  Crosshair,
  Clock,
  CheckCircle2,
  AlertCircle,
  Camera,
} from 'lucide-react';
import { Client, Status } from '@/types';
import {
  KERALA_DISTRICTS,
  INDIA_STATES,
  DistrictGeo,
  StateGeo,
  getKeralaDistrictStats,
  getIndiaStateStats,
  matchClientToDistrict,
  matchClientToState,
  getClientCoordinates,
} from '@/lib/geoTracking';
import { StatusBadge } from './StatusBadge';
import { WhatsAppModal } from './WhatsAppModal';
import { DeleteClientModal } from './DeleteClientModal';
import { useTheme } from '@/components/theme/ThemeProvider';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ClientMapTrackerProps {
  clients: Client[];
  statuses?: Status[];
  onClientUpdated?: (updated: Client) => void;
  onAddClient?: () => void;
}

type MapScope = 'kerala' | 'india';
type DisplayMode = 'map' | 'grid';

export function ClientMapTracker({
  clients: initialClients,
  statuses = [],
  onClientUpdated,
  onAddClient,
}: ClientMapTrackerProps) {
  // Map scope defaults to Kerala
  const [mapScope, setMapScope] = useState<MapScope>('kerala');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('map');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Deleted client tracking for optimistic UI updates
  const [localDeletedIds, setLocalDeletedIds] = useState<string[]>([]);

  // Modals state
  const [deleteTargetClient, setDeleteTargetClient] = useState<Client | null>(null);
  const [whatsAppClient, setWhatsAppClient] = useState<Client | null>(null);

  // Filters within map tracker
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const { resolvedTheme } = useTheme();

  // Filter out archived or locally deleted clients
  const activeClients = useMemo(() => {
    return initialClients.filter(
      (c) => !c.isArchived && !localDeletedIds.includes(c._id)
    );
  }, [initialClients, localDeletedIds]);

  // Statistics calculation
  const keralaStats = useMemo(() => getKeralaDistrictStats(activeClients), [activeClients]);
  const indiaStats = useMemo(() => getIndiaStateStats(activeClients), [activeClients]);

  // Leaflet map container & instance refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tileLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientMarkersRef = useRef<Record<string, any>>({});
  const [mapReady, setMapReady] = useState(false);

  // Initialize Leaflet Cartography Map
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load Leaflet CSS
    if (!document.getElementById('reelman-leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'reelman-leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const initLeaflet = (L: any) => {
      if (!mapContainerRef.current) return;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Kerala center: [10.45, 76.25], default zoom 7.8
      const map = L.map(mapContainerRef.current, {
        center: [10.45, 76.25],
        zoom: 8,
        minZoom: 5,
        maxZoom: 18,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Cartography tiles (Dark Matter in dark mode, Voyager in light mode)
      const tileUrl =
        resolvedTheme === 'dark'
          ? 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      const tileLayer = L.tileLayer(tileUrl, {
        attribution: '© OpenStreetMap contributors © CARTO',
        maxZoom: 19,
      }).addTo(map);

      tileLayerRef.current = tileLayer;

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;

      // Handle popup button actions (Delete & WhatsApp)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.on('popupopen', (e: any) => {
        const popupEl = e.popup?.getElement();
        if (!popupEl) return;

        const delBtn = popupEl.querySelector('.reelman-map-delete-btn');
        if (delBtn) {
          delBtn.onclick = (evt: MouseEvent) => {
            evt.preventDefault();
            evt.stopPropagation();
            const clientId = delBtn.getAttribute('data-client-id');
            const target = activeClients.find((c) => c._id === clientId);
            if (target) {
              setDeleteTargetClient(target);
            }
          };
        }

        const waBtn = popupEl.querySelector('.reelman-map-wa-btn');
        if (waBtn) {
          waBtn.onclick = (evt: MouseEvent) => {
            evt.preventDefault();
            evt.stopPropagation();
            const clientId = waBtn.getAttribute('data-client-id');
            const target = activeClients.find((c) => c._id === clientId);
            if (target) {
              setWhatsAppClient(target);
            }
          };
        }
      });

      // Force recalculation of container size after mounting to prevent grey tiles
      setTimeout(() => {
        map.invalidateSize();
      }, 300);

      setMapReady(true);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).L) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initLeaflet((window as any).L);
    } else {
      const script = document.createElement('script');
      script.id = 'reelman-leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).L) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initLeaflet((window as any).L);
        }
      };
      document.body.appendChild(script);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Dynamically update Leaflet tile layer when user switches between Light & Dark mode
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L = (window as any).L;
    if (!L || !mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const tileUrl =
      resolvedTheme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      attribution: '© OpenStreetMap contributors © CARTO',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = tileLayer;
  }, [resolvedTheme]);

  // Filtered clients based on current scope, selection, status, and search
  const filteredClients = useMemo(() => {
    let list: Client[] = [];

    if (mapScope === 'kerala') {
      if (selectedDistrictId) {
        if (selectedDistrictId === 'unassigned') {
          list = keralaStats.unassignedClients;
        } else {
          list = keralaStats.districtStats[selectedDistrictId]?.clients || [];
        }
      } else {
        // In Kerala mode with no specific district selected, show ALL active clients
        // (prioritizing clients matched to Kerala districts, plus unassigned clients)
        list = activeClients;
      }
    } else {
      // All India view
      if (selectedStateId) {
        if (selectedStateId === 'other') {
          list = indiaStats.otherClients;
        } else {
          list = indiaStats.stateStats[selectedStateId]?.clients || [];
        }
      } else {
        list = activeClients;
      }
    }

    // Apply Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) => {
        return (
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q)) ||
          (c.district && c.district.toLowerCase().includes(q)) ||
          (c.location && c.location.toLowerCase().includes(q)) ||
          (c.clientId && c.clientId.toLowerCase().includes(q)) ||
          (c.packageDetails && c.packageDetails.toLowerCase().includes(q))
        );
      });
    }

    // Apply Status Filter
    if (selectedStatusFilter !== 'all') {
      list = list.filter((c) => {
        const sName =
          typeof c.status === 'object' && c.status !== null ? c.status.name : String(c.status || '');
        return sName.toLowerCase() === selectedStatusFilter.toLowerCase();
      });
    }

    return list;
  }, [
    mapScope,
    selectedDistrictId,
    selectedStateId,
    keralaStats,
    indiaStats,
    activeClients,
    searchQuery,
    selectedStatusFilter,
  ]);

  // Render Markers on Map: BOTH District hubs AND Individual Client Pins!
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L = (window as any).L;
    if (!L || !mapInstanceRef.current || !markersLayerRef.current) return;

    const markersGroup = markersLayerRef.current;
    markersGroup.clearLayers();
    clientMarkersRef.current = {};

    if (mapScope === 'kerala') {
      // 1. Plot District Hub Badges
      KERALA_DISTRICTS.forEach((district) => {
        const stat = keralaStats.districtStats[district.id];
        const count = stat?.count || 0;
        const isSelected = selectedDistrictId === district.id;

        // Render district center hub marker
        const hubHtml = `
          <div style="
            background: ${isSelected ? '#dc2626' : count > 0 ? '#141414' : '#64748b'};
            color: #ffffff;
            font-size: 10px;
            font-weight: 800;
            padding: 3px 8px;
            border-radius: 9999px;
            border: 2px solid #ffffff;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            white-space: nowrap;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 4px;
            transition: transform 0.2s;
          " class="hover:scale-110">
            <span>${district.name}</span>
            <span style="
              background: ${isSelected ? '#ffffff' : count > 0 ? '#dc2626' : '#94a3b8'};
              color: ${isSelected ? '#dc2626' : '#ffffff'};
              padding: 1px 5px;
              border-radius: 9999px;
              font-size: 9px;
            ">${count}</span>
          </div>
        `;

        const hubIcon = L.divIcon({
          className: 'reelman-hub-marker',
          html: hubHtml,
          iconSize: [80, 24],
          iconAnchor: [40, 12],
        });

        const hubMarker = L.marker(district.coordinates, { icon: hubIcon }).addTo(markersGroup);

        hubMarker.on('click', () => {
          setSelectedDistrictId(isSelected ? null : district.id);
          mapInstanceRef.current.flyTo(district.coordinates, 10, { duration: 0.8 });
        });

        hubMarker.bindTooltip(
          `<strong>${district.name} District</strong><br/><span style="color:#dc2626;font-weight:bold">${count} Bookings</span> • ₹${(stat?.totalRevenue || 0).toLocaleString('en-IN')}`,
          { direction: 'top', offset: [0, -12] }
        );
      });

      // 2. Plot EVERY Individual Client Pin on the Kerala Map!
      filteredClients.forEach((client, idx) => {
        const coords = getClientCoordinates(client, idx);
        const district = matchClientToDistrict(client);

        const statusObj =
          typeof client.status === 'object' && client.status !== null ? client.status : null;
        const statusName = statusObj ? statusObj.name : String(client.status || 'New');
        const statusColor =
          statusObj?.color ||
          (statusName.toLowerCase().includes('confirm')
            ? '#06b6d4'
            : statusName.toLowerCase().includes('complet')
            ? '#8b5cf6'
            : statusName.toLowerCase().includes('active')
            ? '#22c55e'
            : statusName.toLowerCase().includes('pending')
            ? '#f59e0b'
            : '#dc2626');

        const isClientSelected = selectedClientId === client._id;
        const pinSize = isClientSelected ? 38 : 32;

        const clientPinHtml = `
          <div style="
            position: relative;
            cursor: pointer;
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          " class="reelman-client-marker hover:scale-125 hover:z-[9999]">
            <div style="
              width: ${pinSize}px;
              height: ${pinSize}px;
              border-radius: 9999px 9999px 9999px 0;
              transform: rotate(-45deg);
              background: ${statusColor};
              border: 2px solid #ffffff;
              box-shadow: 0 4px 12px rgba(0,0,0,0.35);
              display: flex;
              align-items: center;
              justify-content: center;
              outline: ${isClientSelected ? '3px solid #dc2626' : 'none'};
            ">
              <div style="
                transform: rotate(45deg);
                color: #ffffff;
                font-weight: 800;
                font-size: 11px;
                text-align: center;
                line-height: 1;
              ">
                ${(client.name || 'C').charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        `;

        const clientIcon = L.divIcon({
          className: 'reelman-client-pin',
          html: clientPinHtml,
          iconSize: [pinSize, pinSize],
          iconAnchor: [pinSize / 2, pinSize],
          popupAnchor: [0, -pinSize],
        });

        const clientMarker = L.marker(coords, { icon: clientIcon }).addTo(markersGroup);
        clientMarkersRef.current[client._id] = clientMarker;

        // Rich Interactive Popup with all details & actions
        const hasPrice = typeof client.workPrice === 'number' && client.workPrice > 0;
        const hasAdvance = typeof client.advancePaid === 'number' && client.advancePaid > 0;
        const balance = (client.workPrice || 0) - (client.advancePaid || 0);

        const isDark = resolvedTheme === 'dark';
        const popupBg = isDark ? '#14171d' : '#ffffff';
        const popupText = isDark ? '#f8fafc' : '#0f172a';
        const popupSubtext = isDark ? '#94a3b8' : '#475569';
        const chipBg = isDark ? '#1f242e' : '#f1f5f9';
        const pkgBg = isDark ? '#1f242e' : '#f8fafc';
        const borderCol = isDark ? '#262c37' : '#e2e8f0';

        const popupHtml = `
          <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 250px; padding: 2px; background: ${popupBg}; color: ${popupText};">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
              <span style="font-size: 10px; font-family: monospace; font-weight: bold; background: ${chipBg}; color: ${popupSubtext}; padding: 2px 6px; border-radius: 6px;">
                ${client.clientId}
              </span>
              <span style="font-size: 10px; font-weight: bold; padding: 2px 8px; border-radius: 9999px; background: ${statusColor}18; color: ${statusColor}; border: 1px solid ${statusColor}40;">
                ${statusName}
              </span>
            </div>

            <h4 style="font-size: 15px; font-weight: 800; color: ${popupText}; margin: 0 0 4px 0; line-height: 1.2;">
              ${client.name || 'Unnamed Client'}
            </h4>

            <div style="font-size: 12px; color: ${popupSubtext}; display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px;">
              ${
                client.date
                  ? `<div style="display: flex; align-items: center; gap: 5px;">📅 <strong>${formatDate(
                      client.date
                    )}</strong></div>`
                  : ''
              }
              <div style="display: flex; align-items: center; gap: 5px;">
                📍 <strong>${client.district || district?.name || 'Kerala'}</strong>
                ${client.location ? `<span>(${client.location})</span>` : ''}
              </div>
              ${
                hasPrice
                  ? `<div style="display: flex; align-items: center; gap: 5px;">
                      💰 <strong style="color: ${popupText};">₹${client.workPrice?.toLocaleString('en-IN')}</strong>
                      ${
                        hasAdvance
                          ? `<span style="font-size: 11px; color: #10b981;">(Adv: ₹${client.advancePaid?.toLocaleString(
                              'en-IN'
                            )})</span>`
                          : ''
                      }
                      ${
                        balance > 0
                          ? `<span style="font-size: 11px; color: #ef4444;">(Bal: ₹${balance.toLocaleString(
                              'en-IN'
                            )})</span>`
                          : ''
                      }
                    </div>`
                  : ''
              }
              ${
                client.packageDetails
                  ? `<div style="font-size: 11px; color: ${popupSubtext}; background: ${pkgBg}; padding: 3px 6px; border-radius: 6px;">
                      📦 ${client.packageDetails}
                    </div>`
                  : ''
              }
            </div>

            <div style="display: flex; items-center; gap: 6px; padding-top: 8px; border-top: 1px solid ${borderCol};">
              ${
                client.phone
                  ? `
                <a href="tel:${client.phone}" style="flex: 1; text-align: center; font-size: 11px; font-weight: bold; padding: 6px 8px; background: ${isDark ? '#1e293b' : '#eff6ff'}; color: ${isDark ? '#60a5fa' : '#1d4ed8'}; border-radius: 8px; text-decoration: none; border: 1px solid ${isDark ? '#334155' : '#bfdbfe'};">
                  📞 Call
                </a>
                <button type="button" data-client-id="${client._id}" class="reelman-map-wa-btn" style="flex: 1; text-align: center; font-size: 11px; font-weight: bold; padding: 6px 8px; background: ${isDark ? '#064e3b' : '#ecfdf5'}; color: ${isDark ? '#6ee7b7' : '#047857'}; border-radius: 8px; border: 1px solid ${isDark ? '#047857' : '#a7f3d0'}; cursor: pointer;">
                  💬 WhatsApp
                </button>
              `
                  : ''
              }
              <a href="/clients/${client._id}" style="padding: 6px 10px; font-size: 11px; font-weight: bold; background: ${isDark ? '#dc2626' : '#0f172a'}; color: #ffffff; border-radius: 8px; text-decoration: none;">
                Open ↗
              </a>
              <button type="button" data-client-id="${client._id}" class="reelman-map-delete-btn" style="padding: 6px 8px; font-size: 11px; font-weight: bold; background: ${isDark ? '#450a0a' : '#fef2f2'}; color: ${isDark ? '#f87171' : '#dc2626'}; border-radius: 8px; border: 1px solid ${isDark ? '#7f1d1d' : '#fecaca'}; cursor: pointer;" title="Delete Client">
                🗑️
              </button>
            </div>
          </div>
        `;

        clientMarker.bindPopup(popupHtml, { maxWidth: 280, className: 'reelman-popup' });

        clientMarker.bindTooltip(
          `<strong>${client.name || 'Client'}</strong><br/>${client.district || 'Kerala'} • ${statusName}`,
          { direction: 'top', offset: [0, -pinSize] }
        );

        clientMarker.on('click', () => {
          setSelectedClientId(client._id);
        });
      });
    } else {
      // All India State Pins
      INDIA_STATES.forEach((state) => {
        const stat = indiaStats.stateStats[state.id];
        const count = stat?.count || 0;
        const isSelected = selectedStateId === state.id;

        const pinColor = isSelected ? '#dc2626' : count > 0 ? '#1e40af' : '#94a3b8';
        const pinSize = count > 0 ? 34 : 26;

        const iconHtml = `
          <div style="
            width: ${pinSize}px;
            height: ${pinSize}px;
            border-radius: 9999px;
            background-color: ${pinColor};
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            box-shadow: 0 4px 10px rgba(0,0,0,0.25);
            border: 2px solid #ffffff;
            cursor: pointer;
          ">
            ${count > 0 ? count : '•'}
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'reelman-state-marker',
          html: iconHtml,
          iconSize: [pinSize, pinSize],
          iconAnchor: [pinSize / 2, pinSize / 2],
        });

        const marker = L.marker(state.coordinates, { icon: customIcon }).addTo(markersGroup);

        marker.on('click', () => {
          if (state.id === 'kerala') {
            setMapScope('kerala');
            setSelectedDistrictId(null);
            mapInstanceRef.current.flyTo([10.45, 76.25], 8, { duration: 1 });
          } else {
            setSelectedStateId(isSelected ? null : state.id);
            mapInstanceRef.current.flyTo(state.coordinates, 8, { duration: 0.8 });
          }
        });

        marker.bindTooltip(
          `<strong>${state.name}</strong><br/><span style="color:#1e40af;font-weight:bold">${count} Clients</span>`,
          { direction: 'top', offset: [0, -12] }
        );
      });
    }
  }, [
    mapReady,
    mapScope,
    selectedDistrictId,
    selectedStateId,
    selectedClientId,
    keralaStats,
    indiaStats,
    filteredClients,
  ]);

  // Click on a client in the list to fly map to their venue
  const handleLocateClientOnMap = (client: Client) => {
    setSelectedClientId(client._id);
    const coords = getClientCoordinates(client);
    if (mapInstanceRef.current) {
      setDisplayMode('map');
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
        mapInstanceRef.current?.flyTo(coords, 13, { duration: 0.8 });
        const marker = clientMarkersRef.current[client._id];
        if (marker) {
          setTimeout(() => {
            marker.openPopup();
          }, 850);
        }
      }, 50);
    }
  };

  const handleResetFilter = () => {
    setSelectedDistrictId(null);
    setSelectedStateId(null);
    setSelectedClientId(null);
    setSearchQuery('');
    setSelectedStatusFilter('all');
    if (mapInstanceRef.current) {
      if (mapScope === 'kerala') {
        mapInstanceRef.current.flyTo([10.45, 76.25], 8, { duration: 0.8 });
      } else {
        mapInstanceRef.current.flyTo([21.5, 78.9], 5, { duration: 0.8 });
      }
    }
  };

  const flyToDistrict = (district: DistrictGeo) => {
    const isAlreadySelected = selectedDistrictId === district.id;
    setSelectedDistrictId(isAlreadySelected ? null : district.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(district.coordinates, isAlreadySelected ? 8 : 10, {
        duration: 0.8,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Scope Selector & Top Metrics Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-[#dc2626] rounded-2xl border border-red-100 shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>Kerala & India Client Geo Tracker</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Pins
                </span>
              </h3>
              <p className="text-xs text-gray-500">
                Track client shoot venues, 14 Kerala districts, and booking concentration with real GPS coordinates.
              </p>
            </div>
          </div>

          {/* Controls: Kerala / India Switcher + Map / Grid Switcher */}
          <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto">
            {/* View Mode: Map Canvas vs District Grid */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/60">
              <button
                type="button"
                onClick={() => {
                  setDisplayMode('map');
                  setTimeout(() => {
                    mapInstanceRef.current?.invalidateSize();
                  }, 100);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  displayMode === 'map'
                    ? 'bg-white text-gray-900 shadow-xs border border-gray-200/50'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Interactive Street/Satellite Map"
              >
                <MapIcon className="w-3.5 h-3.5 text-[#dc2626]" />
                <span>Map Canvas</span>
              </button>

              <button
                type="button"
                onClick={() => setDisplayMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  displayMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-xs border border-gray-200/50'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                title="District Cards Grid"
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                <span>Districts</span>
              </button>
            </div>

            {/* Scope: Kerala (Default) vs All India */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/60">
              <button
                type="button"
                onClick={() => {
                  setMapScope('kerala');
                  setSelectedStateId(null);
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo([10.45, 76.25], 8, { duration: 1 });
                  }
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mapScope === 'kerala'
                    ? 'bg-white text-gray-900 shadow-xs border border-gray-200/50'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>🌴 Kerala</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-red-50 text-[#dc2626]">
                  Default
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMapScope('india');
                  setSelectedDistrictId(null);
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo([21.5, 78.9], 5, { duration: 1 });
                  }
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mapScope === 'india'
                    ? 'bg-white text-gray-900 shadow-xs border border-gray-200/50'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>🇮🇳 All India</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Summary Metric Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
          <div className="bg-gray-50/70 p-2.5 rounded-xl border border-gray-100">
            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Total Clients</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{activeClients.length}</p>
          </div>

          <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100/60">
            <p className="text-[11px] font-medium text-emerald-800 uppercase tracking-wide">Kerala Shoots</p>
            <p className="text-xl font-bold text-emerald-900 mt-0.5">{keralaStats.totalKeralaClients}</p>
          </div>

          <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-100/60">
            <p className="text-[11px] font-medium text-blue-800 uppercase tracking-wide">Other States</p>
            <p className="text-xl font-bold text-blue-900 mt-0.5">
              {Math.max(0, activeClients.length - keralaStats.totalKeralaClients)}
            </p>
          </div>

          <div className="bg-red-50/60 p-2.5 rounded-xl border border-red-100/60">
            <p className="text-[11px] font-medium text-red-800 uppercase tracking-wide">Top District</p>
            <p className="text-sm font-bold text-red-900 mt-1 truncate">
              {keralaStats.topDistricts[0]
                ? `${keralaStats.topDistricts[0].district.name} (${keralaStats.topDistricts[0].count})`
                : 'None yet'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Kerala Map Canvas on Left (6 cols), Client Roster on Right (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Real Leaflet Map or District Grid */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {displayMode === 'map' ? 'Real Street & Cartography Map' : 'Kerala District Grid'}
              </span>
              <p className="text-sm font-bold text-gray-900">
                {mapScope === 'kerala'
                  ? selectedDistrictId
                    ? `Focused: ${
                        keralaStats.districtStats[selectedDistrictId]?.district.name || selectedDistrictId
                      } District`
                    : 'Showing Kerala Map with All Client Venues'
                  : selectedStateId
                  ? `Focused: ${indiaStats.stateStats[selectedStateId]?.state.name || selectedStateId}`
                  : 'Click a state pin to filter'}
              </p>
            </div>

            {(selectedDistrictId || selectedStateId || selectedClientId) && (
              <button
                type="button"
                onClick={handleResetFilter}
                className="text-xs font-semibold text-[#dc2626] hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset View</span>
              </button>
            )}
          </div>

          {/* Map View Mode: Leaflet Real Map Canvas */}
          {displayMode === 'map' ? (
            <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-neutral-800 shadow-inner bg-slate-100 dark:bg-neutral-900">
              <div
                ref={mapContainerRef}
                className="w-full h-[540px] z-0"
                style={{ background: resolvedTheme === 'dark' ? '#0c0d0e' : '#f8fafc' }}
              />

              {/* Floating Quick Info Pill on Map */}
              <div className="absolute top-3 left-3 z-[1000] flex items-center gap-1.5 bg-white/95 dark:bg-[#14171d]/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
                <span className="w-2 h-2 rounded-full bg-[#dc2626] animate-ping" />
                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  {mapScope === 'kerala' ? 'Kerala Live Venues' : 'India Live Map'}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-neutral-400 font-mono font-bold">
                  ({filteredClients.length} pins)
                </span>
              </div>

              {/* Map Recenter Shortcut Button */}
              <button
                type="button"
                onClick={handleResetFilter}
                className="absolute bottom-3 left-3 z-[1000] bg-white/95 dark:bg-[#14171d]/95 hover:bg-white dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-200 p-2 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md transition-all flex items-center gap-1.5 text-xs font-semibold"
                title="Recenter to Kerala Center"
              >
                <Crosshair className="w-3.5 h-3.5 text-[#dc2626]" />
                <span>Center Kerala</span>
              </button>
            </div>
          ) : (
            /* District Cards Grid View */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[540px] overflow-y-auto modal-scroll pr-1">
              {KERALA_DISTRICTS.map((district) => {
                const stat = keralaStats.districtStats[district.id];
                const count = stat?.count || 0;
                const isSelected = selectedDistrictId === district.id;

                return (
                  <button
                    key={district.id}
                    type="button"
                    onClick={() => flyToDistrict(district)}
                    className={`text-left p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#dc2626] bg-red-50/60 ring-2 ring-red-400/40 shadow-sm'
                        : count > 0
                        ? 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-xs'
                        : 'border-gray-100 bg-gray-50/60 text-gray-400 hover:bg-gray-100/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-xs text-gray-900 truncate">
                          {district.name}
                        </span>
                        {count > 0 && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                              isSelected
                                ? 'bg-[#dc2626] text-white'
                                : 'bg-red-50 text-[#dc2626] border border-red-100'
                            }`}
                          >
                            {count}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 truncate">{district.headquarters}</p>
                    </div>

                    {stat && stat.totalRevenue > 0 && (
                      <p className="text-[11px] font-bold text-gray-900 mt-2 font-mono flex items-center">
                        <IndianRupee className="w-2.5 h-2.5" />
                        <span>{stat.totalRevenue.toLocaleString('en-IN')}</span>
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* District Quick Hotspots Strip for all 14 Kerala districts */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center justify-between">
              <span>{mapScope === 'kerala' ? 'Kerala 14 Districts' : 'State Shortcuts'}</span>
              <span className="text-[10px] text-gray-400">Click to filter & zoom</span>
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto modal-scroll p-0.5">
              <button
                type="button"
                onClick={handleResetFilter}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  selectedDistrictId === null && selectedStateId === null
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Districts ({activeClients.length})
              </button>

              {mapScope === 'kerala'
                ? KERALA_DISTRICTS.map((d) => {
                    const count = keralaStats.districtStats[d.id]?.count || 0;
                    const isSelected = selectedDistrictId === d.id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => flyToDistrict(d)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#dc2626] text-white shadow-xs'
                            : count > 0
                            ? 'bg-red-50 text-red-900 border border-red-200/60 hover:bg-red-100'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        <span>{d.name}</span>
                        {count > 0 && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                              isSelected
                                ? 'bg-white text-[#dc2626]'
                                : 'bg-red-200/70 text-red-900 font-bold'
                            }`}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })
                : INDIA_STATES.map((s) => {
                    const count = indiaStats.stateStats[s.id]?.count || 0;
                    const isSelected = selectedStateId === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          if (s.id === 'kerala') {
                            setMapScope('kerala');
                            setSelectedDistrictId(null);
                          } else {
                            setSelectedStateId(isSelected ? null : s.id);
                          }
                        }}
                        className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#dc2626] text-white'
                            : count > 0
                            ? 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        <span>{s.name}</span>
                        {count > 0 && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-200/70 text-blue-900 font-bold">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
            </div>
          </div>
        </div>

        {/* Right Column: Tracked Clients Roster with Complete Information & Delete Modal (6 cols) */}
        <div className="lg:col-span-6 space-y-3">
          {/* Header & Filter Controls */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div>
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#dc2626]" />
                  <span>
                    {mapScope === 'kerala'
                      ? selectedDistrictId
                        ? `${keralaStats.districtStats[selectedDistrictId]?.district.name} District Clients`
                        : 'Kerala Tracked Clients'
                      : selectedStateId
                      ? `${indiaStats.stateStats[selectedStateId]?.state.name} Clients`
                      : 'All Tracked Clients'}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 border border-gray-200">
                    {filteredClients.length}
                  </span>
                </h4>
              </div>

              {(selectedDistrictId ||
                selectedStateId ||
                selectedClientId ||
                searchQuery ||
                selectedStatusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="text-xs font-semibold text-[#dc2626] hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* In-Map Search & Status Tabs */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by client name, district, venue, or phone..."
                  className="w-full text-xs bg-gray-50 pl-8 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-hidden focus:bg-white focus:border-[#dc2626] transition-all"
                />
              </div>

              {/* Status filter pills */}
              <div className="flex items-center gap-1 overflow-x-auto max-w-full modal-scroll self-stretch sm:self-auto py-0.5">
                <button
                  type="button"
                  onClick={() => setSelectedStatusFilter('all')}
                  className={`text-[11px] px-2.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                    selectedStatusFilter === 'all'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {statuses.slice(0, 5).map((s) => (
                  <button
                    key={s._id}
                    type="button"
                    onClick={() =>
                      setSelectedStatusFilter(
                        selectedStatusFilter === s.name ? 'all' : s.name
                      )
                    }
                    className={`text-[11px] px-2.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                      selectedStatusFilter === s.name
                        ? 'bg-[#dc2626] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Client Cards List: Complete Info & Outside Delete Button */}
          {filteredClients.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-10 text-center shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto text-gray-400 mb-3">
                <MapPin className="w-6 h-6" />
              </div>
              <h5 className="text-sm font-bold text-gray-900">No clients in this location filter</h5>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                {selectedDistrictId
                  ? 'No clients found matching this district. Set district on a client card or add a new shoot!'
                  : 'Try adjusting your search query or reset your district filter.'}
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  onClick={handleResetFilter}
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-semibold"
                >
                  Reset Filter
                </Button>
                {onAddClient && (
                  <Button
                    onClick={onAddClient}
                    size="sm"
                    className="bg-[#141414] hover:bg-black text-white rounded-xl text-xs font-semibold"
                  >
                    + Add New Client
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-h-[660px] overflow-y-auto modal-scroll pr-0.5">
              {filteredClients.map((client) => {
                const district = matchClientToDistrict(client);
                const hasPhone = Boolean(client.phone);
                const hasPrice = typeof client.workPrice === 'number' && client.workPrice > 0;
                const hasAdvance = typeof client.advancePaid === 'number' && client.advancePaid > 0;
                const balance = (client.workPrice || 0) - (client.advancePaid || 0);
                const isSelected = selectedClientId === client._id;

                return (
                  <div
                    key={client._id}
                    className={`bg-white rounded-2xl border p-4 transition-all ${
                      isSelected
                        ? 'border-[#dc2626] ring-2 ring-red-400/40 shadow-md bg-red-50/20'
                        : 'border-gray-200/80 hover:shadow-md hover:border-gray-300/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {/* Header: Name, ID, Status */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/clients/${client._id}`}
                            className="font-bold text-sm text-gray-900 hover:text-[#dc2626] transition-colors truncate"
                          >
                            {client.name || 'Unnamed Client'}
                          </Link>
                          <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md font-semibold">
                            {client.clientId}
                          </span>
                          <StatusBadge status={client.status} size="sm" />
                        </div>

                        {/* District Badge & Manual Venue Location */}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap text-xs text-gray-600">
                          {client.district ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{client.district}</span>
                            </span>
                          ) : district ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-gray-500 shrink-0" />
                              <span>{district.name}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                              Kerala (No District)
                            </span>
                          )}

                          {client.location && (
                            <span className="font-semibold text-gray-800 truncate max-w-[220px]">
                              📍 {client.location}
                            </span>
                          )}

                          {client.date && (
                            <span className="flex items-center gap-1 text-gray-600 text-xs font-medium">
                              <Calendar className="w-3 h-3 text-blue-600" />
                              <span>{formatDate(client.date)}</span>
                            </span>
                          )}
                        </div>

                        {/* Package Details */}
                        {client.packageDetails && (
                          <p className="text-xs text-gray-600 mt-1.5 truncate">
                            <span className="font-semibold text-gray-800">Package:</span>{' '}
                            {client.packageDetails}
                          </p>
                        )}

                        {/* Requirements Pills */}
                        {client.requirements && client.requirements.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap mt-2">
                            {client.requirements.slice(0, 3).map((req, rIdx) => (
                              <span
                                key={rIdx}
                                className="text-[10px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md border border-gray-200"
                              >
                                {req}
                              </span>
                            ))}
                            {client.requirements.length > 3 && (
                              <span className="text-[10px] font-semibold text-gray-400">
                                +{client.requirements.length - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Financials: Total, Advance, Balance */}
                        {(hasPrice || hasAdvance) && (
                          <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-gray-100 text-xs flex-wrap">
                            {hasPrice && (
                              <span className="flex items-center font-bold text-gray-900">
                                <IndianRupee className="w-3 h-3 text-emerald-600" />
                                <span>{client.workPrice?.toLocaleString('en-IN')}</span>
                              </span>
                            )}
                            {hasAdvance && (
                              <span className="text-gray-500 text-[11px]">
                                Advance:{' '}
                                <span className="font-semibold text-emerald-700">
                                  ₹{client.advancePaid?.toLocaleString('en-IN')}
                                </span>
                              </span>
                            )}
                            {balance > 0 ? (
                              <span className="text-gray-500 text-[11px]">
                                Balance:{' '}
                                <span className="font-semibold text-red-600">
                                  ₹{balance.toLocaleString('en-IN')}
                                </span>
                              </span>
                            ) : (
                              <span className="text-emerald-700 text-[11px] font-semibold flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Paid in full</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons: Locate on Map, WhatsApp, Call, DELETE (Modal), View Details */}
                      <div className="flex items-center gap-1 shrink-0 self-start">
                        {/* Locate on Map Button */}
                        <button
                          type="button"
                          onClick={() => handleLocateClientOnMap(client)}
                          className="p-1.5 rounded-xl bg-gray-100 hover:bg-[#141414] text-gray-700 hover:text-white transition-all border border-gray-200"
                          title="Locate Pin on Map"
                        >
                          <Crosshair className="w-3.5 h-3.5" />
                        </button>

                        {hasPhone && (
                          <>
                            <button
                              type="button"
                              onClick={() => setWhatsAppClient(client)}
                              className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all border border-emerald-200/80"
                              title="Send WhatsApp Message"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>

                            <a
                              href={`tel:${client.phone}`}
                              className="p-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-all border border-blue-200/80"
                              title="Call Client"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          </>
                        )}

                        {/* DIRECT DELETE BUTTON ON CARD (OPENS CUSTOM MODAL) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeleteTargetClient(client);
                          }}
                          className="p-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all border border-red-200/80"
                          title="Delete Client"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <Link
                          href={`/clients/${client._id}`}
                          className="p-1.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-900 hover:text-white transition-all border border-gray-200/80 flex items-center justify-center"
                          title="View Client Details"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Client Confirmation Modal (No browser alert) */}
      <DeleteClientModal
        open={deleteTargetClient !== null}
        onOpenChange={(open) => !open && setDeleteTargetClient(null)}
        client={deleteTargetClient}
        onDeleted={(deletedId) => {
          setLocalDeletedIds((prev) => [...prev, deletedId]);
          onClientUpdated?.({ _id: deletedId, isArchived: true } as Client);
          window.dispatchEvent(new CustomEvent('client-updated'));
        }}
      />

      {/* WhatsApp Modal */}
      {whatsAppClient && (
        <WhatsAppModal
          open={Boolean(whatsAppClient)}
          onOpenChange={(open) => !open && setWhatsAppClient(null)}
          client={whatsAppClient}
        />
      )}
    </div>
  );
}
