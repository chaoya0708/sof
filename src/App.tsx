/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, Trophy, Clock } from 'lucide-react';

type MoleStatus = 'HIDDEN' | 'UP' | 'HIT' | 'ESCAPING';

const GRID_SIZE = 9;
const GAME_DURATION = 30;
const BASE_STAY_TIME = 1500;
const MIN_STAY_TIME = 600;
const MOLE_ESCAPING_TIME = 600;
const MOLE_HIT_TIME = 600;

const Star = ({ cx, cy, reverse }: { cx: number, cy: number, reverse?: boolean }) => (
  <g transform={`translate(${cx}, ${cy}) scale(0.6)`}>
    <g className={reverse ? "animate-[spin_2s_linear_infinite_reverse]" : "animate-[spin_2s_linear_infinite]"}>
      <path d="M0 -15 L3 -5 L14 -5 L5 2 L8 12 L0 6 L-8 12 L-5 2 L-14 -5 L-3 -5 Z" fill="#FFD700" stroke="#B8860B" strokeWidth="1" />
    </g>
  </g>
);

const MoleSvg = ({ state }: { state: MoleStatus }) => {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md overflow-visible">
      {/* Body */}
      <path d="M20 100 C 20 20, 80 20, 80 100" fill="#8B4513" />
      {/* Belly */}
      <path d="M35 100 C 35 50, 65 50, 65 100" fill="#D2B48C" />
      {/* Snout */}
      <ellipse cx="50" cy="65" rx="18" ry="12" fill="#FFE4C4" />
      {/* Nose */}
      <ellipse cx="50" cy="60" rx="8" ry="5" fill="#FF69B4" />

      {state === 'UP' && (
        <>
          {/* Eyes */}
          <circle cx="38" cy="45" r="5" fill="#000" />
          <circle cx="62" cy="45" r="5" fill="#000" />
          {/* Eye highlights */}
          <circle cx="36" cy="43" r="1.5" fill="#fff" />
          <circle cx="60" cy="43" r="1.5" fill="#fff" />
          {/* Smile */}
          <path d="M45 70 Q 50 75 55 70" stroke="#8B4513" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )}

      {state === 'HIT' && (
        <>
          {/* Dizzy Stars */}
          <Star cx={38} cy={45} />
          <Star cx={62} cy={45} reverse />
          {/* Band-aid */}
          <g transform="rotate(15 50 25)">
            <rect x="40" y="20" width="20" height="8" rx="4" fill="#F5DEB3" />
            <rect x="46" y="20" width="8" height="8" fill="#DEB887" />
          </g>
          {/* Shocked Mouth */}
          <ellipse cx="50" cy="72" rx="6" ry="8" fill="#4A0E4E" />
        </>
      )}

      {state === 'ESCAPING' && (
        <>
          {/* Squinting Eyes */}
          <path d="M32 45 Q 38 40 44 45" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M56 45 Q 62 40 68 45" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Teasing Mouth */}
          <path d="M42 70 Q 50 75 58 70" stroke="#8B4513" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Tongue */}
          <path d="M46 72 L 46 85 Q 50 90 54 85 L 54 72 Z" fill="#FF4500" />
          <line x1="50" y1="72" x2="50" y2="82" stroke="#8B0000" strokeWidth="1" />
        </>
      )}
    </svg>
  );
};

const PowEffect = () => (
  <motion.div
    initial={{ scale: 0, opacity: 1, rotate: -20 }}
    animate={{ scale: 1.5, opacity: 0, rotate: 20 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
  >
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg overflow-visible">
      <path d="M50 10 L60 35 L90 30 L70 50 L85 75 L55 65 L40 90 L35 65 L10 70 L30 50 L15 25 L40 35 Z" fill="#FF9800" stroke="#E65100" strokeWidth="2" />
      <text x="50" y="55" fontSize="20" fontWeight="900" fill="#FFF" textAnchor="middle" alignmentBaseline="middle" transform="rotate(-10 50 50)">BAM!</text>
    </svg>
  </motion.div>
);

const Hole = ({ state, onHit }: { state: MoleStatus, onHit: () => void }) => {
  const [showScore, setShowScore] = useState(false);

  useEffect(() => {
    if (state === 'HIT') {
      setShowScore(true);
      const t = setTimeout(() => setShowScore(false), 600);
      return () => clearTimeout(t);
    }
  }, [state]);

  const handleHit = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    onHit();
  };

  return (
    <div 
      className="relative w-24 h-32 sm:w-32 sm:h-40 flex items-end justify-center cursor-none group" 
      onMouseDown={handleHit} 
      onTouchStart={handleHit}
    >
      {/* Back of hole */}
      <svg className="absolute bottom-4 w-[80%] h-12 pointer-events-none" viewBox="0 0 100 40">
        <ellipse cx="50" cy="20" rx="45" ry="15" fill="#3E2723" />
      </svg>

      {/* Mole */}
      <motion.div
        className="absolute bottom-8 w-[70%] h-[70%] origin-bottom pointer-events-none"
        initial={false}
        animate={{
          y: state === 'HIDDEN' ? '100%' : '0%',
          scaleY: state === 'HIDDEN' ? 0.5 : 1,
          opacity: state === 'HIDDEN' ? 0 : 1
        }}
        transition={{
          type: 'spring',
          stiffness: state === 'HIDDEN' ? 200 : 400,
          damping: state === 'HIDDEN' ? 25 : 15,
          mass: 0.8
        }}
      >
        <MoleSvg state={state} />
      </motion.div>

      {/* Front dirt mound */}
      <svg className="absolute bottom-0 w-[110%] h-16 z-10 pointer-events-none" viewBox="0 0 100 50">
        <path d="M 5 40 Q 50 10 95 40 Q 50 50 5 40 Z" fill="#5D4037" />
        <path d="M 15 40 Q 50 20 85 40 Q 50 45 15 40 Z" fill="#795548" />
        <path d="M 20 30 Q 15 20 10 25" stroke="#4CAF50" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M 80 30 Q 85 20 90 25" stroke="#4CAF50" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>

      {/* Hit Area (invisible overlay to make clicking easier) */}
      <div className="absolute inset-0 z-20 rounded-full" />

      {/* Effects */}
      <AnimatePresence>
        {showScore && (
          <>
            <PowEffect />
            <motion.div
              initial={{ opacity: 1, y: -20, scale: 0.5 }}
              animate={{ opacity: 0, y: -80, scale: 1.5 }}
              exit={{ opacity: 0 }}
              className="absolute top-0 z-30 pointer-events-none font-black text-3xl text-amber-300 drop-shadow-[0_3px_3px_rgba(0,0,0,0.8)]"
            >
              +10
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const Carrot = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className}>
    <path d="M50 30 Q 30 0 10 10 Q 30 20 45 30 Z" fill="#4CAF50" />
    <path d="M50 30 Q 50 0 50 5 Q 55 15 55 30 Z" fill="#388E3C" />
    <path d="M50 30 Q 70 0 90 10 Q 70 20 55 30 Z" fill="#4CAF50" />
    <path d="M35 30 Q 50 100 65 30 Z" fill="#FF9800" />
    <path d="M40 45 Q 50 50 60 45" stroke="#F57C00" strokeWidth="2" fill="none" />
    <path d="M42 60 Q 50 65 58 60" stroke="#F57C00" strokeWidth="2" fill="none" />
    <path d="M45 75 Q 50 80 55 75" stroke="#F57C00" strokeWidth="2" fill="none" />
  </svg>
);

const Cabbage = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className}>
    <circle cx="50" cy="50" r="40" fill="#81C784" />
    <path d="M20 50 Q 50 20 80 50 Q 50 80 20 50 Z" fill="#A5D6A7" />
    <path d="M30 50 Q 50 30 70 50 Q 50 70 30 50 Z" fill="#C8E6C9" />
    <path d="M50 20 Q 40 50 50 80" stroke="#4CAF50" strokeWidth="2" fill="none" />
    <path d="M20 50 Q 50 60 80 50" stroke="#4CAF50" strokeWidth="2" fill="none" />
  </svg>
);

const GardenBackground = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden bg-sky-200">
    {/* Clouds */}
    <div className="absolute top-10 left-10 w-32 h-12 bg-white rounded-full opacity-80 blur-sm" />
    <div className="absolute top-20 right-20 w-40 h-16 bg-white rounded-full opacity-70 blur-sm" />

    {/* Ground */}
    <div className="absolute bottom-0 w-full h-[65%] bg-[#689F38] border-t-8 border-[#558B2F]">
       <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#33691E 2px, transparent 2px)', backgroundSize: '20px 20px' }} />
    </div>

    {/* Fence */}
    <div className="absolute top-[35%] -mt-24 left-0 w-full h-24 flex justify-around px-4 opacity-90">
      {[...Array(15)].map((_, i) => (
        <div key={i} className="w-8 sm:w-12 h-full bg-amber-600 rounded-t-full border-x-4 border-t-4 border-amber-800 shadow-md" />
      ))}
      <div className="absolute top-4 left-0 w-full h-4 bg-amber-700 border-y-2 border-amber-900" />
      <div className="absolute top-14 left-0 w-full h-4 bg-amber-700 border-y-2 border-amber-900" />
    </div>

    {/* Veggies */}
    <Carrot className="absolute bottom-[10%] left-[10%] w-20 h-20 -rotate-12 drop-shadow-lg" />
    <Carrot className="absolute bottom-[20%] right-[15%] w-16 h-16 rotate-45 drop-shadow-lg" />
    <Cabbage className="absolute bottom-[5%] right-[5%] w-24 h-24 drop-shadow-lg" />
    <Cabbage className="absolute bottom-[25%] left-[20%] w-16 h-16 -rotate-12 drop-shadow-lg" />
  </div>
);

const HammerCursor = () => {
  const hammerRef = useRef<HTMLDivElement>(null);
  const [isHitting, setIsHitting] = useState(false);

  useEffect(() => {
    const move = (e: MouseEvent | TouchEvent) => {
      if (hammerRef.current) {
        let clientX, clientY;
        if ('touches' in e) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else {
          clientX = e.clientX;
          clientY = e.clientY;
        }
        hammerRef.current.style.transform = `translate(${clientX}px, ${clientY}px)`;
      }
    };
    const down = () => setIsHitting(true);
    const up = () => setIsHitting(false);

    window.addEventListener('mousemove', move);
    window.addEventListener('mousedown', down);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('touchstart', down, { passive: true });
    window.addEventListener('touchend', up);

    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mousedown', down);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchstart', down);
      window.removeEventListener('touchend', up);
    };
  }, []);

  return (
    <div
      ref={hammerRef}
      className="fixed top-0 left-0 pointer-events-none z-50 -translate-x-1/4 -translate-y-3/4"
      style={{ willChange: 'transform' }}
    >
      <motion.div
        animate={{ rotate: isHitting ? -60 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
        className="origin-bottom-right"
      >
        <svg width="100" height="100" viewBox="0 0 100 100" className="drop-shadow-xl overflow-visible">
          {/* Handle */}
          <rect x="45" y="40" width="12" height="55" rx="6" fill="#FFB300" />
          <rect x="47" y="40" width="4" height="55" fill="#FFA000" />
          {/* Head */}
          <rect x="15" y="15" width="70" height="35" rx="12" fill="#E53935" />
          <rect x="15" y="20" width="70" height="5" fill="#C62828" />
          {/* Mallet ends */}
          <rect x="10" y="20" width="10" height="25" rx="4" fill="#FFEB3B" />
          <rect x="80" y="20" width="10" height="25" rx="4" fill="#FFEB3B" />
          {/* Shine */}
          <path d="M 25 22 L 45 22" stroke="#FFCDD2" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isPlaying, setIsPlaying] = useState(false);
  const [moles, setMoles] = useState<MoleStatus[]>(Array(GRID_SIZE).fill('HIDDEN'));

  const timeLeftRef = useRef(GAME_DURATION);
  const moleTimeouts = useRef<NodeJS.Timeout[][]>(Array(GRID_SIZE).fill([]));
  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearMoleTimeouts = useCallback((index: number) => {
    moleTimeouts.current[index].forEach(clearTimeout);
    moleTimeouts.current[index] = [];
  }, []);

  const clearAllTimeouts = useCallback(() => {
    for (let i = 0; i < GRID_SIZE; i++) {
      clearMoleTimeouts(i);
    }
    if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  }, [clearMoleTimeouts]);

  const addMoleTimeout = useCallback((index: number, timeout: NodeJS.Timeout) => {
    moleTimeouts.current[index].push(timeout);
  }, []);

  const spawnMole = useCallback(() => {
    setMoles(prev => {
      const hiddenIndices = prev.map((state, i) => state === 'HIDDEN' ? i : -1).filter(i => i !== -1);
      if (hiddenIndices.length === 0) return prev;

      const randomIndex = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
      const newMoles = [...prev];
      newMoles[randomIndex] = 'UP';

      const progress = 1 - (timeLeftRef.current / GAME_DURATION);
      const currentStayTime = BASE_STAY_TIME - (BASE_STAY_TIME - MIN_STAY_TIME) * progress;

      const escapeTimer = setTimeout(() => {
        setMoles(current => {
          if (current[randomIndex] === 'UP') {
            const escapingMoles = [...current];
            escapingMoles[randomIndex] = 'ESCAPING';

            const hideTimer = setTimeout(() => {
              setMoles(final => {
                const hiddenMoles = [...final];
                if (hiddenMoles[randomIndex] === 'ESCAPING') {
                    hiddenMoles[randomIndex] = 'HIDDEN';
                }
                return hiddenMoles;
              });
            }, MOLE_ESCAPING_TIME);
            addMoleTimeout(randomIndex, hideTimer);

            return escapingMoles;
          }
          return current;
        });
      }, currentStayTime);

      addMoleTimeout(randomIndex, escapeTimer);

      return newMoles;
    });
  }, [addMoleTimeout]);

  const startGame = () => {
    clearAllTimeouts();
    setScore(0);
    setTimeLeft(GAME_DURATION);
    timeLeftRef.current = GAME_DURATION;
    setMoles(Array(GRID_SIZE).fill('HIDDEN'));
    setIsPlaying(true);

    spawnMole();

    spawnIntervalRef.current = setInterval(() => {
      spawnMole();
      const progress = 1 - (timeLeftRef.current / GAME_DURATION);
      if (Math.random() < progress * 0.8) {
        setTimeout(spawnMole, 200);
      }
    }, 800);

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        const newTime = t - 1;
        timeLeftRef.current = newTime;
        if (newTime <= 0) {
          setIsPlaying(false);
          clearAllTimeouts();
          setMoles(Array(GRID_SIZE).fill('HIDDEN'));
          return 0;
        }
        return newTime;
      });
    }, 1000);
  };

  const hitMole = (index: number) => {
    if (!isPlaying) return;

    setMoles(prev => {
      if (prev[index] !== 'UP' && prev[index] !== 'ESCAPING') return prev;

      clearMoleTimeouts(index);
      setScore(s => s + 10);

      const newMoles = [...prev];
      newMoles[index] = 'HIT';

      const hideTimer = setTimeout(() => {
        setMoles(current => {
          const hiddenMoles = [...current];
          if (hiddenMoles[index] === 'HIT') {
              hiddenMoles[index] = 'HIDDEN';
          }
          return hiddenMoles;
        });
      }, MOLE_HIT_TIME);
      addMoleTimeout(index, hideTimer);

      return newMoles;
    });
  };

  useEffect(() => {
    return () => clearAllTimeouts();
  }, [clearAllTimeouts]);

  return (
    <div className="min-h-screen bg-sky-200 overflow-hidden relative cursor-none select-none font-sans">
      <HammerCursor />
      <GardenBackground />

      {/* UI Overlay */}
      <div className="relative z-20 max-w-4xl mx-auto pt-8 px-4 flex justify-between items-center">
         <div className="bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-lg border-4 border-amber-700 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-500" />
            <span className="text-3xl font-black text-amber-900">{score}</span>
         </div>

         <div className="bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-lg border-4 border-amber-700 flex items-center gap-3">
            <Clock className="w-6 h-6 text-amber-700" />
            <span className={`text-3xl font-black ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-amber-900'}`}>
              {timeLeft}s
            </span>
         </div>
      </div>

      {/* Game Grid */}
      <div className="relative z-10 max-w-3xl mx-auto mt-12 p-4">
        <div className="grid grid-cols-3 gap-4 sm:gap-8 justify-items-center">
          {moles.map((state, i) => (
            <Hole key={i} state={state} onHit={() => hitMole(i)} />
          ))}
        </div>
      </div>

      {/* Start / Game Over Screen */}
      <AnimatePresence>
        {!isPlaying && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <div className="bg-white p-8 rounded-3xl shadow-2xl border-8 border-amber-500 max-w-md w-full text-center cursor-auto">
              <h1 className="text-4xl font-black text-amber-700 mb-4">
                {timeLeft === 0 ? 'Time\'s Up!' : 'Veggie Whack!'}
              </h1>
              {timeLeft === 0 && (
                <div className="mb-8">
                  <p className="text-xl text-amber-600 font-bold mb-2">Final Score</p>
                  <p className="text-6xl font-black text-amber-500">{score}</p>
                </div>
              )}
              <p className="text-amber-800 mb-8 font-medium">
                Whack the moles to protect your veggie garden! Don't let them mock you!
              </p>
              <button
                onClick={startGame}
                className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-black text-2xl shadow-[0_6px_0_#b45309] hover:shadow-[0_4px_0_#b45309] hover:translate-y-[2px] transition-all flex items-center justify-center gap-3 active:shadow-none active:translate-y-[6px]"
              >
                {timeLeft === 0 ? <RotateCcw className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                {timeLeft === 0 ? 'Play Again' : 'Start Game'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
