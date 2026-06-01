"use client";

import { useEffect, useRef, useState } from "react";
import type { Feature, FeatureCollection } from "geojson";

interface RotatingEarthProps {
  width?: number;
  height?: number;
  className?: string;
  /** Auto-rotate the globe. When false the globe is fully static (no rAF loop). */
  autoRotate?: boolean;
  /** Higher = fewer halftone dots = cheaper one-time generation. */
  dotSpacing?: number;
}

// Wireframe dotted globe on <canvas> with d3-geo. Gold-tinted to the Trade M
// theme. PERFORMANCE: d3 is imported dynamically and the whole init (import +
// dot generation + first paint) is deferred to requestIdleCallback so it stays
// out of the load/TBT window. When `autoRotate` is false there is NO rAF render
// loop at all — the globe paints once. Drag still re-renders on demand.
export default function RotatingEarth({
  width = 800,
  height = 600,
  className = "",
  autoRotate: autoRotateProp = true,
  dotSpacing = 16,
}: RotatingEarthProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    let cleanup = () => {};
    let cancelled = false;

    const init = async () => {
      const d3geo = await import("d3-geo");
      if (cancelled) return;
      const { geoOrthographic, geoPath, geoGraticule, geoBounds } = d3geo;

      const containerWidth = Math.min(width, window.innerWidth - 40);
      const containerHeight = Math.min(height, window.innerHeight - 100);
      const radius = Math.min(containerWidth, containerHeight) / 2.5;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = containerWidth * dpr;
      canvas.height = containerHeight * dpr;
      canvas.style.width = `${containerWidth}px`;
      canvas.style.height = `${containerHeight}px`;
      context.scale(dpr, dpr);

      const projection = geoOrthographic()
        .scale(radius)
        .translate([containerWidth / 2, containerHeight / 2])
        .clipAngle(90);
      const path = geoPath(projection, context);

      const pointInPolygon = (point: [number, number], polygon: number[][]): boolean => {
        const [x, y] = point;
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
          const [xi, yi] = polygon[i];
          const [xj, yj] = polygon[j];
          if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
        }
        return inside;
      };
      const pointInFeature = (point: [number, number], feature: Feature): boolean => {
        const geometry = feature.geometry;
        if (geometry.type === "Polygon") {
          const c = geometry.coordinates;
          if (!pointInPolygon(point, c[0])) return false;
          for (let i = 1; i < c.length; i++) if (pointInPolygon(point, c[i])) return false;
          return true;
        } else if (geometry.type === "MultiPolygon") {
          for (const polygon of geometry.coordinates) {
            if (pointInPolygon(point, polygon[0])) {
              let inHole = false;
              for (let i = 1; i < polygon.length; i++) if (pointInPolygon(point, polygon[i])) { inHole = true; break; }
              if (!inHole) return true;
            }
          }
          return false;
        }
        return false;
      };
      const generateDotsInPolygon = (feature: Feature, spacing: number) => {
        const dots: [number, number][] = [];
        const [[minLng, minLat], [maxLng, maxLat]] = geoBounds(feature);
        const stepSize = spacing * 0.08;
        for (let lng = minLng; lng <= maxLng; lng += stepSize) {
          for (let lat = minLat; lat <= maxLat; lat += stepSize) {
            const point: [number, number] = [lng, lat];
            if (pointInFeature(point, feature)) dots.push(point);
          }
        }
        return dots;
      };

      const allDots: { lng: number; lat: number }[] = [];
      let landFeatures: FeatureCollection | undefined;

      const render = () => {
        context.clearRect(0, 0, containerWidth, containerHeight);
        const currentScale = projection.scale();
        const scaleFactor = currentScale / radius;

        context.beginPath();
        context.arc(containerWidth / 2, containerHeight / 2, currentScale, 0, 2 * Math.PI);
        context.fillStyle = "rgba(11, 11, 8, 0.55)";
        context.fill();
        context.strokeStyle = "rgba(236, 194, 70, 0.55)";
        context.lineWidth = 1.5 * scaleFactor;
        context.stroke();

        if (landFeatures) {
          const graticule = geoGraticule();
          context.beginPath();
          path(graticule());
          context.strokeStyle = "rgba(236, 194, 70, 0.5)";
          context.lineWidth = 1 * scaleFactor;
          context.globalAlpha = 0.18;
          context.stroke();
          context.globalAlpha = 1;

          context.beginPath();
          landFeatures.features.forEach((feature) => path(feature));
          context.strokeStyle = "rgba(236, 194, 70, 0.6)";
          context.lineWidth = 1 * scaleFactor;
          context.stroke();

          context.fillStyle = "rgba(245, 225, 171, 0.72)";
          allDots.forEach((dot) => {
            const p = projection([dot.lng, dot.lat]);
            if (p && p[0] >= 0 && p[0] <= containerWidth && p[1] >= 0 && p[1] <= containerHeight) {
              context.beginPath();
              context.arc(p[0], p[1], 1.2 * scaleFactor, 0, 2 * Math.PI);
              context.fill();
            }
          });
        }
      };

      const rotation: [number, number] = [0, 0];

      // Drag-to-rotate (on-demand re-render only — no continuous loop)
      const handleMouseDown = (event: MouseEvent) => {
        const startX = event.clientX, startY = event.clientY;
        const start: [number, number] = [rotation[0], rotation[1]];
        const move = (e: MouseEvent) => {
          rotation[0] = start[0] + (e.clientX - startX) * 0.5;
          rotation[1] = Math.max(-90, Math.min(90, start[1] - (e.clientY - startY) * 0.5));
          projection.rotate(rotation);
          render();
        };
        const up = () => {
          document.removeEventListener("mousemove", move);
          document.removeEventListener("mouseup", up);
        };
        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", up);
      };
      const handleWheel = (event: WheelEvent) => {
        event.preventDefault();
        const f = event.deltaY > 0 ? 0.9 : 1.1;
        projection.scale(Math.max(radius * 0.5, Math.min(radius * 3, projection.scale() * f)));
        render();
      };
      canvas.addEventListener("mousedown", handleMouseDown);
      canvas.addEventListener("wheel", handleWheel, { passive: false });

      // Optional auto-rotation (only when explicitly enabled)
      let stopTimer = () => {};
      if (autoRotateProp) {
        const { timer } = await import("d3-timer");
        if (cancelled) return;
        const t = timer(() => {
          rotation[0] += 0.3;
          projection.rotate(rotation);
          render();
        });
        stopTimer = () => t.stop();
      }

      try {
        const response = await fetch("/geo/ne_110m_land.json");
        if (!response.ok) throw new Error("geo fetch failed");
        landFeatures = (await response.json()) as FeatureCollection;
        if (cancelled) return;
        landFeatures.features.forEach((feature) => {
          generateDotsInPolygon(feature, dotSpacing).forEach(([lng, lat]) => allDots.push({ lng, lat }));
        });
        render();
      } catch {
        if (!cancelled) setError("Не вдалося завантажити карту світу");
      }

      cleanup = () => {
        stopTimer();
        canvas.removeEventListener("mousedown", handleMouseDown);
        canvas.removeEventListener("wheel", handleWheel);
      };
    };

    // Defer the heavy init off the load/TBT critical path.
    const ric = window.requestIdleCallback;
    let idleId = 0;
    let timeoutId = 0;
    if (typeof ric === "function") {
      idleId = ric(() => { void init(); }, { timeout: 2000 });
    } else {
      timeoutId = window.setTimeout(() => { void init(); }, 300);
    }

    return () => {
      cancelled = true;
      if (idleId && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId);
      if (timeoutId) window.clearTimeout(timeoutId);
      cleanup();
    };
  }, [width, height, autoRotateProp, dotSpacing]);

  if (error) {
    return (
      <div className={`flex items-center justify-center glass !rounded-2xl p-8 ${className}`}>
        <p className="text-on-surface-variant text-sm text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <canvas ref={canvasRef} className="w-full h-auto" style={{ maxWidth: "100%", height: "auto" }} />
    </div>
  );
}
