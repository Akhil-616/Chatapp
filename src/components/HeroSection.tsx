import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Vortex } from "@/src/components/ui/vortex";

interface HeroSectionProps {
  onOpenLogin: (mode?: "login" | "signup") => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenLogin }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Rapid transformations right as the user begins scrolling
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.94]);
  const borderRadius = useTransform(scrollYProgress, [0, 0.18], ["0px", "28px"]);
  const borderWidth = useTransform(scrollYProgress, [0, 0.15], ["0px", "1px"]);
  const cardOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0.96]);
  const y = useTransform(scrollYProgress, [0, 0.2], [0, 16]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full min-h-screen bg-[#070709] flex flex-col items-center justify-start p-0"
    >
      <motion.div
        style={{
          scale,
          borderRadius,
          borderWidth,
          opacity: cardOpacity,
          y,
        }}
        className="w-full h-screen overflow-hidden bg-[#000000] border-zinc-800 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative transition-shadow duration-300"
      >
        <Vortex
          backgroundColor="#000000"
          rangeY={600}
          particleCount={360}
          baseSpeed={0.03}
          rangeSpeed={0.5}
          baseRadius={1}
          rangeRadius={2.2}
          isMonochrome={true}
          containerClassName="w-full h-full"
          className="flex items-center justify-center flex-col px-4 w-full h-full text-center selection:bg-white selection:text-black"
        >
          {/* Animated Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-white text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-sans py-2 md:py-4 relative z-20 font-extrabold tracking-[-0.04em] leading-[0.92] drop-shadow-2xl"
          >
            Sajilo<br />Patra
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-zinc-300 text-center font-normal leading-relaxed relative z-20 px-4 mt-3 sm:mt-5 drop-shadow"
          >
            Match your vibes. Share your frequency. Connect and talk with other college students who share your niche.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 sm:mt-10 flex items-center justify-center gap-4 relative z-20"
          >
            <button
              onClick={() => onOpenLogin("login")}
              className="px-8 sm:px-10 py-3.5 sm:py-4 rounded-full bg-white text-black font-semibold text-sm sm:text-base hover:bg-zinc-200 hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.25)] cursor-pointer"
            >
              Log in
            </button>

            <button
              onClick={() => onOpenLogin("signup")}
              className="px-8 sm:px-10 py-3.5 sm:py-4 rounded-full bg-zinc-900/80 text-white border border-zinc-700 font-medium text-sm sm:text-base hover:bg-zinc-800 hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer backdrop-blur-md"
            >
              Sign up
            </button>
          </motion.div>

          {/* Subtle Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ duration: 1.2, delay: 0.7 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none"
          >
            <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
              Scroll to explore
            </span>
            <div className="w-1 h-3.5 rounded-full bg-zinc-500 animate-pulse" />
          </motion.div>
        </Vortex>
      </motion.div>
    </div>
  );
};
