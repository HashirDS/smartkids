import React from 'react';

// Animated cartoon sky-and-hills scene that sits behind the landing hero.
const INK = '#2B2350';
const line = { stroke: INK, strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' };

const Cloud = ({ face = false }) => (
  <svg viewBox="0 0 170 95" className="h-full w-full">
    <path
      d="M38 84c-18 0-30-12-30-26s11-25 26-25c3-15 17-26 34-26 15 0 28 8 33 21 4-2 8-3 13-3 17 0 30 13 30 29 13 2 20 12 20 22 0 5-4 8-9 8Z"
      fill="#fff"
      {...line}
    />
    {face && (
      <g>
        <circle cx="78" cy="52" r="3" fill={INK} />
        <circle cx="98" cy="52" r="3" fill={INK} />
        <circle cx="70" cy="60" r="4" fill="#FF9FB2" />
        <circle cx="106" cy="60" r="4" fill="#FF9FB2" />
        <path d="M81 60q7 7 14 0" fill="none" {...line} />
      </g>
    )}
  </svg>
);

const Sun = () => {
  const rays = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI * 2) / 12;
    return [60 + Math.cos(a) * 42, 60 + Math.sin(a) * 42, 60 + Math.cos(a) * 56, 60 + Math.sin(a) * 56];
  });
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full">
      <g className="bd-spin">
        {rays.map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFB020" strokeWidth="5" strokeLinecap="round" />
        ))}
      </g>
      <circle cx="60" cy="60" r="34" fill="#FFC940" {...line} />
      <g className="bd-blink">
        <circle cx="49" cy="56" r="3.5" fill={INK} />
        <circle cx="71" cy="56" r="3.5" fill={INK} />
      </g>
      <circle cx="42" cy="66" r="5" fill="#FF9FB2" />
      <circle cx="78" cy="66" r="5" fill="#FF9FB2" />
      <path d="M51 66q9 9 18 0" fill="none" {...line} />
    </svg>
  );
};

const Bird = () => (
  <svg viewBox="0 0 44 22" className="bd-flap h-full w-full overflow-visible">
    <path d="M2 14Q11 2 22 14Q33 2 42 14" fill="none" {...line} />
  </svg>
);

const HotAirBalloon = () => (
  <svg viewBox="0 0 80 122" className="h-full w-full">
    <path d="M34 86 31 101M46 86l3 15" {...line} strokeWidth="2" />
    <path d="M40 4C62 4 76 20 76 40c0 22-22 36-28 46H32C26 76 4 62 4 40 4 20 18 4 40 4Z" fill="#FF6B6B" {...line} />
    <path d="M40 4C30 20 28 60 34 86h12c6-26 4-66-6-82Z" fill="#FFC940" {...line} />
    <rect x="29" y="100" width="22" height="16" rx="3" fill="#C98B4E" {...line} />
  </svg>
);

const Bunny = () => (
  <svg viewBox="0 0 96 104" className="h-full w-full overflow-visible">
    <ellipse cx="32" cy="26" rx="8" ry="23" fill="#fff" transform="rotate(-12 32 26)" {...line} />
    <ellipse cx="54" cy="24" rx="8" ry="23" fill="#fff" transform="rotate(10 54 24)" {...line} />
    <ellipse cx="32" cy="28" rx="3.5" ry="15" fill="#FFC2D1" transform="rotate(-12 32 28)" />
    <ellipse cx="54" cy="26" rx="3.5" ry="15" fill="#FFC2D1" transform="rotate(10 54 26)" />
    <circle cx="76" cy="80" r="7" fill="#fff" {...line} />
    <ellipse cx="52" cy="82" rx="26" ry="17" fill="#fff" {...line} />
    <circle cx="43" cy="54" r="23" fill="#fff" {...line} />
    <circle cx="35" cy="52" r="3" fill={INK} />
    <circle cx="51" cy="52" r="3" fill={INK} />
    <circle cx="29" cy="60" r="4" fill="#FFC2D1" />
    <circle cx="57" cy="60" r="4" fill="#FFC2D1" />
    <ellipse cx="43" cy="58" rx="3" ry="2.2" fill="#FF8FA8" />
    <path d="M39 63q4 4 8 0" fill="none" {...line} strokeWidth="2.2" />
    <ellipse cx="38" cy="98" rx="9" ry="5" fill="#fff" {...line} />
    <ellipse cx="62" cy="98" rx="9" ry="5" fill="#fff" {...line} />
  </svg>
);

const Butterfly = () => (
  <svg viewBox="0 0 50 40" className="h-full w-full overflow-visible">
    <g className="bd-wing">
      <ellipse cx="14" cy="14" rx="12" ry="10" fill="#B98CFF" {...line} strokeWidth="2" />
      <ellipse cx="36" cy="14" rx="12" ry="10" fill="#B98CFF" {...line} strokeWidth="2" />
      <ellipse cx="16" cy="29" rx="8" ry="7" fill="#FF9FB2" {...line} strokeWidth="2" />
      <ellipse cx="34" cy="29" rx="8" ry="7" fill="#FF9FB2" {...line} strokeWidth="2" />
    </g>
    <path d="M25 8v28" {...line} />
    <path d="M25 8q-3-6-7-7M25 8q3-6 7-7" fill="none" {...line} strokeWidth="1.8" />
  </svg>
);

const Tree = ({ x, y, s = 1, color = '#34C38F' }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x="-5" y="0" width="10" height="34" rx="3" fill="#B97A45" {...line} />
    <circle cx="0" cy="-8" r="26" fill={color} {...line} />
    <circle cx="-9" cy="-14" r="5" fill="#fff" opacity="0.35" />
  </g>
);

const Flower = ({ x, y, color }) => (
  <g transform={`translate(${x} ${y})`}>
    <g className="bd-sway">
      <path d="M0 0v-16" stroke="#1FA274" strokeWidth="3" strokeLinecap="round" />
      {[0, 72, 144, 216, 288].map((a) => (
        <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 5} cy={-20 + Math.sin((a * Math.PI) / 180) * 5} r="4.5" fill={color} />
      ))}
      <circle cx="0" cy="-20" r="3.5" fill="#FFC940" />
    </g>
  </g>
);

const Hills = () => (
  <svg viewBox="0 0 1440 200" preserveAspectRatio="xMidYMax slice" className="h-full w-full">
    <path d="M0 110c180-80 380-80 560-20s360 60 540 0 250-60 340-40v150H0Z" fill="#C7EFD0" />
    <Tree x={220} y={70} s={0.9} color="#5CCF9A" />
    <Tree x={1210} y={62} s={1} color="#5CCF9A" />
    <path d="M0 150c240-60 480-40 720 0s480 30 720-20v70H0Z" fill="#8FDBA5" />
    <Tree x={80} y={132} s={1.1} />
    <Tree x={1360} y={124} s={1.2} />
    <Flower x={330} y={170} color="#FF6B6B" />
    <Flower x={360} y={176} color="#B98CFF" />
    <Flower x={980} y={172} color="#4DB5FF" />
    <Flower x={1010} y={168} color="#FF9FB2" />
    <Flower x={1100} y={176} color="#FF6B6B" />
  </svg>
);

const AnimatedBackdrop = () => (
  <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
    <div className="absolute inset-0 bg-gradient-to-b from-[#4FC3FF] via-[#9EDCFF] to-[#DDF4FF]" />

    <div className="absolute right-[3%] top-3 h-16 w-16 sm:h-24 sm:w-24">
      <Sun />
    </div>

    {/* Clouds drifting across the sky */}
    <div className="bd-cloud absolute top-[14%] h-16 w-28 sm:h-20 sm:w-36" style={{ animationDuration: '70s', animationDelay: '-20s' }}><Cloud face /></div>
    <div className="bd-cloud absolute top-[34%] h-12 w-24 opacity-90" style={{ animationDuration: '95s', animationDelay: '-60s' }}><Cloud /></div>
    <div className="bd-cloud absolute top-[52%] h-16 w-32 opacity-80" style={{ animationDuration: '85s', animationDelay: '-5s' }}><Cloud /></div>
    <div className="bd-cloud absolute top-[22%] hidden h-14 w-28 opacity-90 md:block" style={{ animationDuration: '110s', animationDelay: '-80s' }}><Cloud face /></div>

    {/* Birds flying by */}
    <div className="bd-fly absolute top-[20%] flex gap-3" style={{ animationDuration: '30s' }}>
      <div className="h-4 w-8"><Bird /></div>
      <div className="mt-4 h-3 w-6"><Bird /></div>
    </div>
    <div className="bd-fly absolute top-[40%] hidden gap-3 md:flex" style={{ animationDuration: '42s', animationDelay: '-18s' }}>
      <div className="h-3 w-6"><Bird /></div>
      <div className="-mt-3 h-4 w-8"><Bird /></div>
      <div className="mt-2 h-3 w-6"><Bird /></div>
    </div>

    <div className="bd-bob absolute bottom-[34%] left-[1%] hidden h-28 w-20 2xl:block">
      <HotAirBalloon />
    </div>

    {/* Ground */}
    <div className="absolute inset-x-0 bottom-0 h-28 sm:h-40">
      <Hills />
    </div>

    <div className="bd-hop absolute bottom-8 left-[14%] h-14 w-14 sm:bottom-12 sm:h-20 sm:w-20">
      <Bunny />
    </div>

    <div className="bd-flutter absolute bottom-28 right-[18%] h-8 w-10 sm:bottom-40">
      <Butterfly />
    </div>
  </div>
);

export default AnimatedBackdrop;
