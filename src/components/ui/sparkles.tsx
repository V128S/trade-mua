"use client";

import React, { useId } from "react";
import Particles, { ParticlesProvider, useParticlesProvider } from "@tsparticles/react";
import type { Container } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import { cn } from "@/lib/utils";

type SparklesProps = {
  id?: string;
  className?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleColor?: string;
  particleDensity?: number;
};

function SparklesInner({
  id,
  className,
  background = "transparent",
  minSize = 0.6,
  maxSize = 1.4,
  speed = 1,
  particleColor = "#ecc246",
  particleDensity = 70,
}: SparklesProps) {
  const { loaded } = useParticlesProvider();
  const generatedId = useId();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const particlesLoaded = async (_container?: Container) => {};

  return (
    <div className={cn("transition-opacity duration-1000", loaded ? "opacity-100" : "opacity-0", className)}>
      {loaded && (
        <Particles
          id={id ?? generatedId}
          className="h-full w-full"
          particlesLoaded={particlesLoaded}
          options={{
            background: { color: { value: background } },
            fullScreen: { enable: false },
            fpsLimit: 60,
            interactivity: {
              events: {
                onClick: { enable: false },
                onHover: { enable: false },
              },
            },
            particles: {
              color: { value: particleColor },
              move: {
                direction: "none",
                enable: true,
                outModes: { default: "out" },
                random: true,
                speed: { min: speed * 0.05, max: speed * 0.4 },
                straight: false,
              },
              number: {
                density: { enable: true, width: 900, height: 900 },
                value: particleDensity,
              },
              opacity: {
                value: { min: 0.05, max: 0.55 },
                animation: { enable: true, speed: speed * 0.5, sync: false },
              },
              shape: { type: "circle" },
              size: { value: { min: minSize, max: maxSize } },
            },
            detectRetina: true,
          }}
        />
      )}
    </div>
  );
}

export function SparklesCore(props: SparklesProps) {
  return (
    <ParticlesProvider init={loadSlim}>
      <SparklesInner {...props} />
    </ParticlesProvider>
  );
}
