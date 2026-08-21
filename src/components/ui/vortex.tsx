import React, { useEffect, useRef } from "react";
import { createNoise3D } from "simplex-noise";
import { motion } from "motion/react";
import { cn } from "@/src/lib/utils";

interface VortexProps {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  particleCount?: number;
  rangeY?: number;
  baseHue?: number;
  baseSpeed?: number;
  rangeSpeed?: number;
  baseRadius?: number;
  rangeRadius?: number;
  backgroundColor?: string;
  isMonochrome?: boolean;
}

export const Vortex: React.FC<VortexProps> = ({
  children,
  className,
  containerClassName,
  particleCount = 360,
  rangeY = 400,
  baseSpeed = 0.03,
  rangeSpeed = 0.5,
  baseRadius = 1,
  rangeRadius = 2.2,
  backgroundColor = "#000000",
  isMonochrome = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isRunning = true;
    let animationFrameId: number | null = null;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const noise3D = createNoise3D();
    const particlePropCount = 9;
    const particlePropsLength = particleCount * particlePropCount;
    let particleProps = new Float32Array(particlePropsLength);
    let center: [number, number] = [0, 0];
    let tick = 0;

    const baseTTL = 50;
    const rangeTTL = 150;
    const noiseSteps = 3;
    const xOff = 0.00125;
    const yOff = 0.00125;
    const zOff = 0.0003;
    const TAU = 2 * Math.PI;

    const rand = (n: number): number => n * Math.random();
    const randRange = (n: number): number => n - rand(2 * n);
    const fadeInOut = (t: number, m: number): number => {
      const hm = 0.5 * m;
      return hm > 0 ? Math.abs(((t + hm) % m) - hm) / hm : 1;
    };
    const lerp = (n1: number, n2: number, speed: number): number =>
      (1 - speed) * n1 + speed * n2;

    const resize = () => {
      if (!canvas || !isRunning) return;
      const rect = canvas.parentElement?.getBoundingClientRect();
      const width = rect?.width || window.innerWidth || 800;
      const height = rect?.height || window.innerHeight || 600;

      canvas.width = Math.max(width, 100);
      canvas.height = Math.max(height, 100);
      center = [0.5 * canvas.width, 0.5 * canvas.height];
    };

    const initParticle = (i: number) => {
      if (!canvas) return;
      const x = rand(canvas.width || 800);
      const y = center[1] + randRange(rangeY);
      const vx = 0;
      const vy = 0;
      const life = 0;
      const ttl = baseTTL + rand(rangeTTL);
      const speed = baseSpeed + rand(rangeSpeed);
      const radius = baseRadius + rand(rangeRadius);
      const hue = 0;

      particleProps.set([x, y, vx, vy, life, ttl, speed, radius, hue], i);
    };

    const drawParticle = (
      x: number,
      y: number,
      x2: number,
      y2: number,
      life: number,
      ttl: number,
      radius: number,
      context: CanvasRenderingContext2D
    ) => {
      context.save();
      context.lineCap = "round";
      context.lineWidth = Math.max(0.5, radius);
      if (isMonochrome) {
        const rawAlpha = fadeInOut(life, ttl);
        const alpha = Math.min(Math.max(rawAlpha * 0.75, 0), 1);
        context.strokeStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
      } else {
        context.strokeStyle = `rgba(255, 255, 255, 0.5)`;
      }
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x2, y2);
      context.stroke();
      context.closePath();
      context.restore();
    };

    const updateParticle = (i: number, context: CanvasRenderingContext2D) => {
      if (!canvas) return;

      const i2 = 1 + i,
        i3 = 2 + i,
        i4 = 3 + i,
        i5 = 4 + i,
        i6 = 5 + i,
        i7 = 6 + i,
        i8 = 7 + i;

      const x = particleProps[i];
      const y = particleProps[i2];
      const n = noise3D(x * xOff, y * yOff, tick * zOff) * noiseSteps * TAU;
      const vx = lerp(particleProps[i3], Math.cos(n), 0.5);
      const vy = lerp(particleProps[i4], Math.sin(n), 0.5);
      let life = particleProps[i5];
      const ttl = particleProps[i6];
      const speed = particleProps[i7];
      const x2 = x + vx * speed;
      const y2 = y + vy * speed;
      const radius = particleProps[i8];

      drawParticle(x, y, x2, y2, life, ttl, radius, context);

      life++;

      particleProps[i] = x2;
      particleProps[i2] = y2;
      particleProps[i3] = vx;
      particleProps[i4] = vy;
      particleProps[i5] = life;

      if (x > canvas.width || x < 0 || y > canvas.height || y < 0 || life > ttl) {
        initParticle(i);
      }
    };

    const draw = () => {
      if (!isRunning || !canvas || !ctx) return;

      try {
        tick++;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < particlePropsLength; i += particlePropCount) {
          updateParticle(i, ctx);
        }
      } catch (err) {
        // Suppress benign canvas render errors
      }

      if (isRunning) {
        animationFrameId = window.requestAnimationFrame(draw);
      }
    };

    resize();
    particleProps = new Float32Array(particlePropsLength);
    for (let i = 0; i < particlePropsLength; i += particlePropCount) {
      initParticle(i);
    }
    draw();

    const handleResize = () => {
      resize();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      isRunning = false;
      window.removeEventListener("resize", handleResize);
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [particleCount, rangeY, baseSpeed, rangeSpeed, baseRadius, rangeRadius, backgroundColor, isMonochrome]);

  return (
    <div className={cn("relative h-full w-full overflow-hidden", containerClassName)}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        ref={containerRef}
        className="absolute h-full w-full inset-0 z-0 bg-transparent flex items-center justify-center pointer-events-none"
      >
        <canvas ref={canvasRef} className="w-full h-full block"></canvas>
      </motion.div>

      <div className={cn("relative z-10", className)}>
        {children}
      </div>
    </div>
  );
};
