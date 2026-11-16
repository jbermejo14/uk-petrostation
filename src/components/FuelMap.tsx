'use client';

import React, { useEffect, useRef } from 'react';
import { FuelStation, FuelType } from '@/types/fuel';
import { useTheme } from './ThemeProvider';
import { calculateTankCost } from '@/lib/data';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

interface FuelMapProps {
  stations: FuelStation[];
  selectedFuel: FuelType;
  cheapestId: string | null;
  selectedStation: FuelStation | null;
  onSelectStation?: (station: FuelStation) => void;
  center?: [number, number];
  zoom?: number;
}

export default function FuelMap({
  stations,
  selectedFuel,
  cheapestId,
  selectedStation,
  onSelectStation,
  center = [54.5, -2.5], // Center of UK
  zoom = 6,
}: FuelMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const clusterGroupRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersMapRef = useRef<Map<string, any>>(new Map());

  const { theme } = useTheme();

  // Initialize Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import('leaflet')).default;
      await import('leaflet.markercluster');

      if (!isMounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: false,
        attributionControl: false,
      });

      // Add Zoom control to bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Attribution
      L.control
        .attribution({
          position: 'bottomleft',
          prefix: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        })
        .addTo(map);

      const isDark = theme === 'dark';
      const tileUrl = isDark
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png';

      const tileLayer = L.tileLayer(tileUrl, {
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      tileLayerRef.current = tileLayer;

      // Create Custom Cluster Group
      const clusterGroup = (L as any).markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 45,
        spiderfyOnMaxZoom: true,
        iconCreateFunction: (cluster: any) => {
          const count = cluster.getChildCount();
          return L.divIcon({
            html: `<div class="fuel-cluster-icon" style="width: 36px; height: 36px;">${count}</div>`,
            className: 'fuel-cluster-wrapper',
            iconSize: L.point(36, 36),
          });
        },
      });

      map.addLayer(clusterGroup);
      clusterGroupRef.current = clusterGroup;
      mapInstanceRef.current = map;
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Switch Tile Layer when Theme changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    import('leaflet').then((L) => {
      const isDark = theme === 'dark';
      const tileUrl = isDark
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png';

      mapInstanceRef.current.removeLayer(tileLayerRef.current);
      const newTile = L.default
        .tileLayer(tileUrl, {
          subdomains: 'abcd',
          maxZoom: 19,
        })
        .addTo(mapInstanceRef.current);

      tileLayerRef.current = newTile;
    });
  }, [theme]);

  // Update Markers when stations or selectedFuel changes
  useEffect(() => {
    if (!mapInstanceRef.current || !clusterGroupRef.current) return;

    import('leaflet').then((L) => {
      const clusterGroup = clusterGroupRef.current;
      clusterGroup.clearLayers();
      markersMapRef.current.clear();

      const validStations = stations.filter(
        (s) =>
          s.location?.latitude &&
          s.location?.longitude &&
          s.prices[selectedFuel] !== null &&
          s.prices[selectedFuel]! > 0
      );

      validStations.forEach((station) => {
        const isCheapest = station.site_id === cheapestId;
        const price = station.prices[selectedFuel];
        const tankCost = price ? calculateTankCost(price, 50).toFixed(2) : '--';

        const customIcon = L.default.divIcon({
          className: 'fuel-custom-marker',
          html: `<div class="fuel-marker-pill ${isCheapest ? 'cheapest' : ''}">
                   <span>${station.brand}</span>
                   <strong>${price}p</strong>
                 </div>`,
          iconSize: [85, 26],
          iconAnchor: [42, 13],
        });

        const marker = L.default.marker(
          [station.location.latitude, station.location.longitude],
          { icon: customIcon }
        );

        const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.location.latitude},${station.location.longitude}`;

        const popupContent = `
          <div style="padding: 14px; min-width: 240px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #ff6b00; letter-spacing: 0.5px;">${station.brand}</span>
              ${isCheapest ? '<span style="background: #ff6b00; color: #fff; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">Cheapest</span>' : ''}
            </div>
            <h4 style="font-size: 14px; font-weight: 700; margin: 0 0 4px 0; line-height: 1.2;">${station.name}</h4>
            <p style="font-size: 11px; opacity: 0.75; margin: 0 0 10px 0;">${station.address} (${station.postcode})</p>
            
            <div style="background: rgba(255,107,0,0.1); border: 1px solid rgba(255,107,0,0.3); border-radius: 8px; padding: 8px 10px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: baseline;">
              <div>
                <span style="font-size: 10px; opacity: 0.8; display: block;">${selectedFuel} Price</span>
                <strong style="font-size: 18px; color: #ff6b00;">${price}p</strong> <span style="font-size: 10px;">/L</span>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 10px; opacity: 0.8; display: block;">50L Fill Cost</span>
                <strong style="font-size: 14px;">£${tankCost}</strong>
              </div>
            </div>

            <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" style="display: block; width: 100%; text-align: center; background: #ff6b00; color: #ffffff; text-decoration: none; padding: 7px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; box-sizing: border-box;">
              Get Directions ↗
            </a>
          </div>
        `;

        marker.bindPopup(popupContent);

        marker.on('click', () => {
          onSelectStation?.(station);
        });

        clusterGroup.addLayer(marker);
        markersMapRef.current.set(station.site_id, marker);
      });

      // If stations exist and no single station is actively selected, fit bounds to the results
      if (validStations.length > 0 && !selectedStation) {
        try {
          const bounds = L.default.latLngBounds(
            validStations.map((s) => [s.location.latitude, s.location.longitude])
          );
          mapInstanceRef.current.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 14,
          });
        } catch (e) {
          // ignore
        }
      }
    });
  }, [stations, selectedFuel, cheapestId]);

  // Center on selected station if user clicks a station card
  useEffect(() => {
    if (!selectedStation || !mapInstanceRef.current) return;

    const lat = selectedStation.location.latitude;
    const lng = selectedStation.location.longitude;

    mapInstanceRef.current.setView([lat, lng], 14, {
      animate: true,
      duration: 0.6,
    });

    const marker = markersMapRef.current.get(selectedStation.site_id);
    if (marker && clusterGroupRef.current) {
      // Zoom into the cluster if it's clustered
      clusterGroupRef.current.zoomToShowLayer(marker, () => {
        marker.openPopup();
      });
    }
  }, [selectedStation]);

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB] shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Floating Info Pill on Map */}
      <div className="absolute top-4 left-4 z-[1000] bg-[#161616]/90 dark:bg-[#161616]/90 light:bg-[#FFFFFF]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB] text-xs font-semibold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#111111] shadow-lg flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B00] animate-pulse" />
        <span>{stations.length} Stations Mapped</span>
      </div>
    </div>
  );
}
