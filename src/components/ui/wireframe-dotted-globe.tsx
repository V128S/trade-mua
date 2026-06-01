"use client";

import { useEffect, useRef, useState } from "react";
import type { Feature, FeatureCollection } from "geojson";

interface RotatingEarthProps {
  width?: number;
  height?: number;
  className?: string;
  /** Auto-rotate the globe (disabled for prefers-reduced-motion). */
  autoRotate?: boolean;
}

// Wireframe dotted globe rendered on <canvas> with d3-geo.
// Gold-tinted to match the Trade M dark/gold theme; d3 is imported dynamically
// so it stays out of the initial JS bundle. Land geometry is self-hosted at
// /geo/ne_110m_land.json. Drag to rotate, scroll to zoom.
export default function RotatingEarth({
  width = 800,
  height = 600,
  className = "",
  autoRotate: autoRotateProp = true,
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

    (async () => {
      const [{ geoOrthographic, geoPath, geoGraticule, geoBounds }, { timer }] = await Promise.all([
        import("d3-geo"),
        import("d3-timer"),
      ]);
      if (cancelled) return;

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
          if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
            inside = !inside;
          }
        }
        return inside;
      };

      const pointInFeature = (point: [number, number], feature: Feature): boolean => {
        const geometry = feature.geometry;
        if (geometry.type === "Polygon") {
          const coordinates = geometry.coordinates;
          if (!pointInPolygon(point, coordinates[0])) return false;
          for (let i = 1; i < coordinates.length; i++) {
            if (pointInPolygon(point, coordinates[i])) return false;
          }
          return true;
        } else if (geometry.type === "MultiPolygon") {
          for (const polygon of geometry.coordinates) {
            if (pointInPolygon(point, polygon[0])) {
              let inHole = false;
              for (let i = 1; i < polygon.length; i++) {
                if (pointInPolygon(point, polygon[i])) { inHole = true; break; }
              }
              if (!inHole) return true;
            }
          }
          return false;
        }
        return false;
      };

      const generateDotsInPolygon = (feature: Feature, dotSpacing = 16) => {
        const dots: [number, number][] = [];
        const [[minLng, minLat], [maxLng, maxLat]] = geoBounds(feature);
        const stepSize = dotSpacing * 0.08;
        for (let lng = minLng; lng <= maxLng; lng += stepSize) {
          for (let lat = minLat; lat <= maxLat; lat += stepSize) {
            const point: [number, number] = [lng, lat];
            if (pointInFeature(point, feature)) dots.push(point);
          }
        }
        return dots;
      };

      interface DotData { lng: number; lat: number; }
      const allDots: DotData[] = [];
      let landFeatures: FeatureCollection | undefined;

      const render = () => {
        context.clearRect(0, 0, containerWidth, containerHeight);
        const currentScale = projection.scale();
        const scaleFactor = currentScale / radius;

        // Globe body (subtle dark fill) + gold rim
        context.beginPath();
        context.arc(containerWidth / 2, containerHeight / 2, currentScale, 0, 2 * Math.PI);
        context.fillStyle = "rgba(11, 11, 8, 0.55)";
        context.fill();
        context.strokeStyle = "rgba(236, 194, 70, 0.55)";
        context.lineWidth = 1.5 * scaleFactor;
        context.stroke();

        if (landFeatures) {
          // Graticule
          const graticule = geoGraticule();
          context.beginPath();
          path(graticule());
          context.strokeStyle = "rgba(236, 194, 70, 0.5)";
          context.lineWidth = 1 * scaleFactor;
          context.globalAlpha = 0.18;
          context.stroke();
          context.globalAlpha = 1;

          // Land outlines
          context.beginPath();
          landFeatures.features.forEach((feature) => path(feature));
          context.strokeStyle = "rgba(236, 194, 70, 0.6)";
          context.lineWidth = 1 * scaleFactor;
          context.stroke();

          // Halftone dots
          context.fillStyle = "rgba(245, 225, 171, 0.72)";
          allDots.forEach((dot) => {
            const projected = projection([dot.lng, dot.lat]);
            if (
              projected &&
              projected[0] >= 0 && projected[0] <= containerWidth &&
              projected[1] >= 0 && projected[1] <= containerHeight
            ) {
              context.beginPath();
              context.arc(projected[0], projected[1], 1.2 * scaleFactor, 0, 2 * Math.PI);
              context.fill();
            }
          });
        }
      };

      // Interaction state
      const rotation: [number, number] = [0, 0];
      let autoRotate = autoRotateProp;
      const rotationSpeed = 0.3;

      const rotationTimer = timer(() => {
        if (autoRotate) {
          rotation[0] += rotationSpeed;
          projection.rotate(rotation);
          render();
        }
      });

      const handleMouseDown = (event: MouseEvent) => {
        autoRotate = false;
        const startX = event.clientX;
        const startY = event.clientY;
        const startRotation: [number, number] = [rotation[0], rotation[1]];

        const handleMouseMove = (moveEvent: MouseEvent) => {
          const sensitivity = 0.5;
          rotation[0] = startRotation[0] + (moveEvent.clientX - startX) * sensitivity;
          rotation[1] = Math.max(-90, Math.min(90, startRotation[1] - (moveEvent.clientY - startY) * sensitivity));
          projection.rotate(rotation);
          render();
        };
        const handleMouseUp = () => {
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
          if (autoRotateProp) setTimeout(() => { autoRotate = true; }, 10);
        };
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
      };

      const handleWheel = (event: WheelEvent) => {
        event.preventDefault();
        const f = event.deltaY > 0 ? 0.9 : 1.1;
        projection.scale(Math.max(radius * 0.5, Math.min(radius * 3, projection.scale() * f)));
        render();
      };

      canvas.addEventListener("mousedown", handleMouseDown);
      canvas.addEventListener("wheel", handleWheel, { passive: false });

      // Load land geometry (self-hosted)
      try {
        const response = await fetch("/geo/ne_110m_land.json");
        if (!response.ok) throw new Error("geo fetch failed");
        landFeatures = (await response.json()) as FeatureCollection;
        if (cancelled) return;
        landFeatures.features.forEach((feature) => {
          generateDotsInPolygon(feature, 16).forEach(([lng, lat]) => allDots.push({ lng, lat }));
        });
        render();
      } catch {
        if (!cancelled) setError("Не вдалося завантажити карту світу");
      }

      cleanup = () => {
        rotationTimer.stop();
        canvas.removeEventListener("mousedown", handleMouseDown);
        canvas.removeEventListener("wheel", handleWheel);
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [width, height, autoRotateProp]);

  if (error) {
    return (
      <div className={`flex items-center justify-center glass !rounded-2xl p-8 ${className}`}>
        <p className="text-on-surface-variant text-sm text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-auto"
        style={{ maxWidth: "100%", height: "auto" }}
      />
    </div>
  );
}
