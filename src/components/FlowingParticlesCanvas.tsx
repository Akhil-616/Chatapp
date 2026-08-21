import React, { useEffect, useRef } from "react";

interface FlowingParticlesCanvasProps {
  className?: string;
}

interface Particle {
  radius: number;
  baseRadius: number;
  theta: number; // elevation angle
  phi: number;   // azimuthal angle around sphere
  length: number;
  width: number;
  speed: number;
  alpha: number;
  baseAlpha: number;
  brightness: number;
}

export const FlowingParticlesCanvas: React.FC<FlowingParticlesCanvasProps> = ({ className = "" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    // Center focal point on the right (like Google Antigravity)
    const center = {
      x: width * 0.70,
      y: height * 0.50,
      targetX: width * 0.70,
      targetY: height * 0.50,
    };

    // 3D rotation angles
    const rot = {
      x: 0.15,
      y: -0.1,
      targetX: 0.15,
      targetY: -0.1,
    };

    // Mouse coordinates on canvas for interactive proximity glow & flow
    const mouse = {
      x: width * 0.70,
      y: height * 0.50,
      active: false,
    };

    const particles: Particle[] = [];
    const NUM_RINGS = 26;
    const PARTICLES_PER_RING = 34;

    // Background faint stars - pure monochrome
    const bgStars: { x: number; y: number; size: number; alpha: number; speed: number }[] = [];
    for (let s = 0; s < 120; s++) {
      bgStars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.1 + 0.3,
        alpha: Math.random() * 0.28 + 0.05,
        speed: Math.random() * 0.015 + 0.005,
      });
    }

    // Generate concentric spherical rings of dashed monochrome particles
    for (let r = 0; r < NUM_RINGS; r++) {
      const ringFraction = r / NUM_RINGS;
      const ringRadius = 45 + Math.pow(ringFraction, 1.2) * (Math.min(width, height) * 0.75);
      const ringCount = Math.floor(PARTICLES_PER_RING * (0.4 + ringFraction * 1.3));

      for (let p = 0; p < ringCount; p++) {
        const phi = ((Math.PI * 2) * (p + (r % 2) * 0.5)) / ringCount;
        const theta = (Math.random() - 0.5) * 0.45;
        const baseAlpha = 0.25 + Math.random() * 0.65;
        const brightness = Math.random() > 0.85 ? 255 : Math.floor(200 + Math.random() * 45);

        particles.push({
          radius: ringRadius,
          baseRadius: ringRadius,
          theta,
          phi,
          length: 3.5 + Math.random() * 4,
          width: 1.6 + Math.random() * 1.0,
          speed: (0.0005 + (NUM_RINGS - r) * 0.00006) * (r % 2 === 0 ? 1 : -0.85),
          alpha: baseAlpha,
          baseAlpha,
          brightness,
        });
      }
    }

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement.clientHeight || window.innerHeight;
      center.targetX = width * 0.70;
      center.targetY = height * 0.50;
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      mouse.x = clientX;
      mouse.y = clientY;
      mouse.active = true;

      // Mouse tracking shifts rotation and center position smoothly
      center.targetX = width * 0.70 + (clientX - width * 0.5) * 0.14;
      center.targetY = height * 0.50 + (clientY - height * 0.5) * 0.14;

      rot.targetY = ((clientX - width * 0.5) / width) * 0.8;
      rot.targetX = 0.15 + ((clientY - height * 0.5) / height) * 0.6;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      center.targetX = width * 0.70;
      center.targetY = height * 0.50;
      rot.targetY = -0.1;
      rot.targetX = 0.15;
    };

    const parent = canvas.parentElement;
    if (parent) {
      parent.addEventListener("mousemove", handleMouseMove, { passive: true });
      parent.addEventListener("mouseleave", handleMouseLeave);
    }

    let time = 0;

    const render = () => {
      time += 0.015;

      // Smooth camera and center lerp
      center.x += (center.targetX - center.x) * 0.06;
      center.y += (center.targetY - center.y) * 0.06;
      rot.x += (rot.targetX - rot.x) * 0.06;
      rot.y += (rot.targetY - rot.y) * 0.06;

      ctx.clearRect(0, 0, width, height);

      // Clean Solid Dark Canvas — Pure black #040407
      ctx.fillStyle = "#040407";
      ctx.fillRect(0, 0, width, height);

      // Render faint twinkling background stars - Pure white/silver
      for (let s = 0; s < bgStars.length; s++) {
        const star = bgStars[s];
        star.alpha += Math.sin(time + s) * 0.002;
        const clampedAlpha = Math.max(0.04, Math.min(0.35, star.alpha));
        ctx.fillStyle = `rgba(240, 240, 245, ${clampedAlpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Render radial geodesic dashed particles in 3D perspective
      const cosRotY = Math.cos(rot.y);
      const sinRotY = Math.sin(rot.y);
      const cosRotX = Math.cos(rot.x);
      const sinRotX = Math.sin(rot.x);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.phi += p.speed;

        // Spherical 3D coordinate math
        const x3d = p.radius * Math.cos(p.phi) * Math.cos(p.theta);
        const y3d = p.radius * Math.sin(p.theta);
        const z3d = p.radius * Math.sin(p.phi) * Math.cos(p.theta);

        // 3D rotation transform
        const xRot = x3d * cosRotY - z3d * sinRotY;
        const zTemp = x3d * sinRotY + z3d * cosRotY;
        const yRot = y3d * cosRotX - zTemp * sinRotX;
        const zRot = y3d * sinRotX + zTemp * cosRotX;

        // Perspective field of view projection
        const fov = 800;
        const scale = fov / (fov + zRot + 280);

        if (scale > 0) {
          const screenX = center.x + xRot * scale;
          const screenY = center.y + yRot * scale;

          // Tangential angle along concentric orbit
          const angle = Math.atan2(screenY - center.y, screenX - center.x) + Math.PI / 2;

          const dashLen = p.length * scale;
          const dashWidth = p.width * scale;

          // Proximity boost when mouse is near particle in 2D space
          let proximityBonus = 0;
          if (mouse.active) {
            const dx = screenX - mouse.x;
            const dy = screenY - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 180) {
              proximityBonus = (1 - dist / 180) * 0.45;
            }
          }

          const depthAlpha = Math.max(0.1, Math.min(1.0, (p.baseAlpha + proximityBonus) * scale * (1 + zRot / 420)));
          const b = p.brightness;

          ctx.save();
          ctx.translate(screenX, screenY);
          ctx.rotate(angle);

          // Draw dashed particle capsule in pure monochrome (white/silver/gray)
          ctx.fillStyle = `rgba(${b}, ${b}, ${b}, ${depthAlpha})`;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(-dashWidth / 2, -dashLen / 2, dashWidth, dashLen, dashWidth);
          } else {
            ctx.rect(-dashWidth / 2, -dashLen / 2, dashWidth, dashLen);
          }
          ctx.fill();

          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      resizeObserver.disconnect();
      if (parent) {
        parent.removeEventListener("mousemove", handleMouseMove);
        parent.removeEventListener("mouseleave", handleMouseLeave);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
    />
  );
};
