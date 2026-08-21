import React from "react";
import { motion } from "motion/react";
import { cn } from "@/src/lib/utils";

export const BackgroundLines = ({
  children,
  className,
  svgOptions,
}: {
  children: React.ReactNode;
  className?: string;
  svgOptions?: {
    duration?: number;
  };
}) => {
  return (
    <div
      className={cn(
        "h-screen w-full bg-[#040407] relative overflow-hidden flex flex-col items-center justify-center",
        className
      )}
    >
      <SVGComponent duration={svgOptions?.duration} />
      {children}
    </div>
  );
};

const SVGComponent = ({ duration = 10 }: { duration?: number }) => {
  return (
    <motion.svg
      viewBox="0 0 1440 900"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    >
      <path
        d="M -100 0 C 300 200 400 600 720 900"
        stroke="url(#line-gradient-1)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M 1540 0 C 1140 200 1040 600 720 900"
        stroke="url(#line-gradient-1)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      <path
        d="M 0 100 C 400 250 500 650 720 900"
        stroke="url(#line-gradient-2)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M 1440 100 C 1040 250 940 650 720 900"
        stroke="url(#line-gradient-2)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      <path
        d="M 100 0 C 450 300 550 700 720 900"
        stroke="url(#line-gradient-1)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M 1340 0 C 990 300 890 700 720 900"
        stroke="url(#line-gradient-1)"
        strokeWidth="1"
        strokeLinecap="round"
      />

      <path
        d="M 250 0 C 500 350 600 750 720 900"
        stroke="url(#line-gradient-3)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M 1190 0 C 940 350 840 750 720 900"
        stroke="url(#line-gradient-3)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      <path
        d="M 400 0 C 580 400 650 800 720 900"
        stroke="url(#line-gradient-2)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M 1040 0 C 860 400 790 800 720 900"
        stroke="url(#line-gradient-2)"
        strokeWidth="1"
        strokeLinecap="round"
      />

      <path
        d="M 550 0 C 640 450 680 850 720 900"
        stroke="url(#line-gradient-1)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M 890 0 C 800 450 760 850 720 900"
        stroke="url(#line-gradient-1)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Animated paths with traveling dashes */}
      <motion.path
        d="M -100 0 C 300 200 400 600 720 900"
        stroke="url(#line-gradient-active)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="40 180"
        animate={{
          strokeDashoffset: [0, -440],
        }}
        transition={{
          duration: duration,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <motion.path
        d="M 1540 0 C 1140 200 1040 600 720 900"
        stroke="url(#line-gradient-active)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="40 180"
        animate={{
          strokeDashoffset: [0, 440],
        }}
        transition={{
          duration: duration * 1.1,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      <motion.path
        d="M 100 0 C 450 300 550 700 720 900"
        stroke="url(#line-gradient-active)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="50 200"
        animate={{
          strokeDashoffset: [0, -500],
        }}
        transition={{
          duration: duration * 0.9,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <motion.path
        d="M 1340 0 C 990 300 890 700 720 900"
        stroke="url(#line-gradient-active)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="50 200"
        animate={{
          strokeDashoffset: [0, 500],
        }}
        transition={{
          duration: duration * 1.05,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      <motion.path
        d="M 250 0 C 500 350 600 750 720 900"
        stroke="url(#line-gradient-active)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="60 220"
        animate={{
          strokeDashoffset: [0, -560],
        }}
        transition={{
          duration: duration * 1.15,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <motion.path
        d="M 1190 0 C 940 350 840 750 720 900"
        stroke="url(#line-gradient-active)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="60 220"
        animate={{
          strokeDashoffset: [0, 560],
        }}
        transition={{
          duration: duration * 1.2,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      <motion.path
        d="M 550 0 C 640 450 680 850 720 900"
        stroke="url(#line-gradient-active)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="40 180"
        animate={{
          strokeDashoffset: [0, -440],
        }}
        transition={{
          duration: duration * 0.85,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <motion.path
        d="M 890 0 C 800 450 760 850 720 900"
        stroke="url(#line-gradient-active)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="40 180"
        animate={{
          strokeDashoffset: [0, 440],
        }}
        transition={{
          duration: duration * 0.95,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      <defs>
        <linearGradient id="line-gradient-1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.02" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
        </linearGradient>

        <linearGradient id="line-gradient-2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.01" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.01" />
        </linearGradient>

        <linearGradient id="line-gradient-3" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.03" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.03" />
        </linearGradient>

        <linearGradient id="line-gradient-active" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
};
