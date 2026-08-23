export default function MarqueeWordmark({
  items = [
    'CONNECTJUTTI',
    'CAMPUS CIRCLES',
    'STUDY THREADS',
    'PEER CHAT',
    'HIGH THROUGHPUT WSS',
    'CAMPUS AFFINITY',
    'ZERO PACKET LOSS',
  ],
  speed = 28,
  reverse = false,
  className = '',
}) {
  const content = [...items, ...items, ...items];

  return (
    <div className={`w-full overflow-hidden select-none py-6 border-y border-[rgba(23,20,15,0.12)] bg-[#FFFCF5] relative ${className}`}>
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-[#F2ECDE] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-[#F2ECDE] to-transparent z-10 pointer-events-none" />

      <div
        className="flex whitespace-nowrap will-change-transform"
        style={{
          animation: `cjMarquee ${speed}s linear infinite ${reverse ? 'reverse' : 'normal'}`,
        }}
      >
        {content.map((text, idx) => (
          <div key={idx} className="flex items-center">
            <span className="font-['Space_Grotesk'] text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-[#17140F] uppercase px-6 hover:text-[#1B6C5D] transition-colors cursor-default">
              {text}
            </span>
            <span className="w-2 h-2 rounded-full bg-[#EFA23D] shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
