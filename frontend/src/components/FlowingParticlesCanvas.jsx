import { useEffect, useRef } from 'react';

export default function FlowingParticlesCanvas({ className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = 0;
    let height = 0;

    const updateDimensions = () => {
      if (!canvas || !canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      width = canvas.width = rect.width || window.innerWidth;
      height = canvas.height = rect.height || 600;
    };

    updateDimensions();

    // Center focal point of the 3D particle vortex
    const center = {
      x: width * 0.52,
      y: height * 0.5,
      targetX: width * 0.52,
      targetY: height * 0.5,
    };

    // 3D rotation angles
    const rot = {
      x: 0.15,
      y: -0.05,
      targetX: 0.15,
      targetY: -0.05,
    };

    // Mouse tracking
    const mouse = {
      x: width * 0.5,
      y: height * 0.5,
      active: false,
    };

    const particles = [];
    const NUM_RINGS = 24;
    const PARTICLES_PER_RING = 32;

    // Ambient floating star dust across full width & height
    const bgStars = [];
    const NUM_STARS = 110;
    for (let s = 0; s < NUM_STARS; s++) {
      bgStars.push({
        x: Math.random() * (width || 1200),
        y: Math.random() * (height || 700),
        size: Math.random() * 1.8 + 0.5,
        alpha: Math.random() * 0.45 + 0.12,
        speedX: (Math.random() - 0.5) * 0.25,
        speedY: (Math.random() - 0.5) * 0.2,
        color:
          s % 4 === 0
            ? '239, 162, 61' // marigold
            : s % 4 === 1
            ? '27, 108, 93' // pine
            : s % 4 === 2
            ? '217, 119, 6' // amber
            : '23, 20, 15', // ink
      });
    }

    // Generate concentric 3D spherical swirling rings covering entire background
    const maxRadius = Math.max(width || 1200, height || 700) * 0.85;
    for (let r = 0; r < NUM_RINGS; r++) {
      const ringFraction = r / NUM_RINGS;
      const ringRadius = 45 + Math.pow(ringFraction, 1.15) * maxRadius;
      const ringCount = Math.floor(PARTICLES_PER_RING * (0.6 + ringFraction * 1.4));

      for (let p = 0; p < ringCount; p++) {
        const phi = (Math.PI * 2 * (p + (r % 2) * 0.5)) / ringCount;
        const theta = (Math.random() - 0.5) * 0.55;
        const baseAlpha = 0.18 + Math.random() * 0.45;
        const isAccent = Math.random() > 0.65;
        const color = isAccent
          ? '239, 162, 61' // marigold
          : r % 3 === 0
          ? '27, 108, 93' // pine
          : r % 3 === 1
          ? '23, 20, 15' // dark ink
          : '217, 119, 6'; // gold

        particles.push({
          radius: ringRadius,
          theta,
          phi,
          length: 4.0 + Math.random() * 5.5,
          width: 2.0 + Math.random() * 1.2,
          speed: (0.0006 + (NUM_RINGS - r) * 0.00006) * (r % 2 === 0 ? 1 : -0.85),
          alpha: baseAlpha,
          baseAlpha,
          color,
        });
      }
    }

    const handleResize = () => {
      updateDimensions();
      center.targetX = width * 0.52;
      center.targetY = height * 0.5;
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      mouse.x = clientX;
      mouse.y = clientY;
      mouse.active = true;

      center.targetX = width * 0.52 + (clientX - width * 0.5) * 0.14;
      center.targetY = height * 0.5 + (clientY - height * 0.5) * 0.14;

      rot.targetY = ((clientX - width * 0.5) / width) * 0.75;
      rot.targetX = 0.15 + ((clientY - height * 0.5) / height) * 0.65;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      center.targetX = width * 0.52;
      center.targetY = height * 0.5;
      rot.targetY = -0.05;
      rot.targetX = 0.15;
    };

    const parent = canvas.parentElement;
    if (parent) {
      parent.addEventListener('mousemove', handleMouseMove, { passive: true });
      parent.addEventListener('mouseleave', handleMouseLeave);
    }

    let time = 0;

    const render = () => {
      time += 0.014;

      center.x += (center.targetX - center.x) * 0.05;
      center.y += (center.targetY - center.y) * 0.05;
      rot.x += (rot.targetX - rot.x) * 0.05;
      rot.y += (rot.targetY - rot.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Render floating ambient warm stars spanning full canvas
      for (let s = 0; s < bgStars.length; s++) {
        const star = bgStars[s];
        star.x += star.speedX;
        star.y += star.speedY;

        // Wrap around boundaries
        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        if (star.y > height) star.y = 0;

        const pulse = Math.sin(time * 2.2 + s) * 0.12;
        const clampedAlpha = Math.max(0.04, Math.min(0.65, star.alpha + pulse));

        ctx.fillStyle = `rgba(${star.color}, ${clampedAlpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3D rotation trigonometric pre-calculations
      const cosRotY = Math.cos(rot.y);
      const sinRotY = Math.sin(rot.y);
      const cosRotX = Math.cos(rot.x);
      const sinRotX = Math.sin(rot.x);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.phi += p.speed;

        const x3d = p.radius * Math.cos(p.phi) * Math.cos(p.theta);
        const y3d = p.radius * Math.sin(p.theta);
        const z3d = p.radius * Math.sin(p.phi) * Math.cos(p.theta);

        const xRot = x3d * cosRotY - z3d * sinRotY;
        const zTemp = x3d * sinRotY + z3d * cosRotY;
        const yRot = y3d * cosRotX - zTemp * sinRotX;
        const zRot = y3d * sinRotX + zTemp * cosRotX;

        const fov = 850;
        const scale = fov / (fov + zRot + 300);

        if (scale > 0) {
          const screenX = center.x + xRot * scale;
          const screenY = center.y + yRot * scale;

          const angle = Math.atan2(screenY - center.y, screenX - center.x) + Math.PI / 2;
          const dashLen = p.length * scale;
          const dashWidth = p.width * scale;

          let proximityBonus = 0;
          if (mouse.active) {
            const dx = screenX - mouse.x;
            const dy = screenY - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 180) {
              proximityBonus = (1 - dist / 180) * 0.4;
            }
          }

          const depthAlpha = Math.max(
            0.06,
            Math.min(0.85, (p.baseAlpha + proximityBonus) * scale * (1 + zRot / 350))
          );

          ctx.save();
          ctx.translate(screenX, screenY);
          ctx.rotate(angle);

          ctx.fillStyle = `rgba(${p.color}, ${depthAlpha})`;
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
        parent.removeEventListener('mousemove', handleMouseMove);
        parent.removeEventListener('mouseleave', handleMouseLeave);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none block ${className}`}
    />
  );
}
