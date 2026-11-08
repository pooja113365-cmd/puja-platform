import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const FIREWORK_COLORS = [
  '#00D8FF', // Cyan blaster
  '#65FF00', // Neon green blaster
  '#FACC15', // Golden yellow blaster
  '#FF5E1A', // Festive orange blaster
  '#FF2E93', // Magenta pink blaster
  '#A855F7', // Royal purple blaster
];

export default function DiwaliSplashOverlay() {
  const [visible, setVisible] = useState(true);
  const canvasRef = useRef(null);

  // Auto-hide after 5 seconds (between 4-6 seconds as requested)
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 5200);
    return () => clearTimeout(timer);
  }, []);

  // Full-screen HTML5 Canvas Fireworks & Rocket Blasters
  useEffect(() => {
    if (!visible) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const rockets = [];
    const particles = [];

    const createExplosion = (x, y, color) => {
      const rays = 28;
      for (let i = 0; i < rays; i += 1) {
        const angle = (Math.PI * 2 * i) / rays;
        // Create dotted streamer trails along each ray like the reference screenshot
        for (let step = 1; step <= 7; step += 1) {
          const speed = step * 0.95 + Math.random() * 0.4;
          particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color,
            alpha: 1,
            decay: 0.011 + Math.random() * 0.007,
            radius: 2 + (step / 7) * 2.2,
          });
        }
      }
    };

    const spawnRocket = (customX, customTargetY) => {
      const x = customX ?? canvas.width * (0.12 + Math.random() * 0.76);
      const targetY = customTargetY ?? canvas.height * (0.14 + Math.random() * 0.42);
      const color = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];
      rockets.push({
        x,
        y: canvas.height,
        targetY,
        vy: -(8.5 + Math.random() * 3.5),
        color,
        trail: [],
      });
    };

    // Launch immediate celebratory blasters on open (Left Cyan, Right Green, Center-Top Gold/Orange)
    createExplosion(canvas.width * 0.2, canvas.height * 0.36, '#00D8FF');
    createExplosion(canvas.width * 0.84, canvas.height * 0.26, '#65FF00');
    createExplosion(canvas.width * 0.65, canvas.height * 0.24, '#FACC15');
    spawnRocket(canvas.width * 0.18, canvas.height * 0.32);
    spawnRocket(canvas.width * 0.82, canvas.height * 0.28);
    spawnRocket(canvas.width * 0.5, canvas.height * 0.22);

    const launchInterval = setInterval(() => {
      spawnRocket();
      if (Math.random() > 0.45) spawnRocket();
    }, 520);

    const render = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update & draw rising rockets with dotted trails
      for (let i = rockets.length - 1; i >= 0; i -= 1) {
        const r = rockets[i];
        r.trail.push({ x: r.x, y: r.y });
        if (r.trail.length > 18) r.trail.shift();

        r.y += r.vy;

        // Draw dotted rocket trail
        for (let t = 0; t < r.trail.length; t += 1) {
          const pt = r.trail[t];
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 235, 180, ${(t + 1) / r.trail.length})`;
          ctx.fill();
        }

        // Draw rocket head
        ctx.beginPath();
        ctx.arc(r.x, r.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        if (r.y <= r.targetY) {
          createExplosion(r.x, r.y, r.color);
          rockets.splice(i, 1);
        }
      }

      // Update & draw firework blaster particles
      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.035; // gentle gravity
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(p.alpha, 0);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(launchInterval);
      window.removeEventListener('resize', resize);
    };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.55 } }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 overflow-hidden select-none"
        >
          {/* Full-screen Firework Blasters Canvas */}
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 h-full w-full"
          />

          {/* Centered Diwali Wishes Content */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex flex-col items-center px-4 text-center"
          >
            {/* Brand Logo + Name */}
            <div className="mb-5 flex items-center gap-3">
              <img
                src="/images/ibn-logo.jpg"
                alt="IBN — GetPuja Logo"
                className="h-12 w-12 rounded-full object-cover ring-2 ring-[#F7B928] shadow-[0_0_20px_rgba(247,185,40,0.6)] sm:h-14 sm:w-14"
              />
              <span className="h-9 w-[1.5px] bg-[#F7B928]/70" />
              <div className="text-left">
                <div className="font-serif text-3xl font-extrabold leading-none tracking-tight text-white drop-shadow-[0_0_16px_rgba(247,185,40,0.45)] sm:text-4xl">
                  Get<span className="text-[#F7B928]">Puja</span>
                </div>
                <span className="mt-1 inline-block rounded-full border border-[#F7B928]/70 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#F7B928]">
                  Festival of Lights
                </span>
              </div>
            </div>

            {/* Top Row of 5 Glowing Diyas */}
            <div className="mb-3 flex items-center justify-center gap-3 text-3xl sm:gap-4 sm:text-4xl">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.span
                  key={`top-diya-${i}`}
                  animate={{ y: [0, -5, 0], scale: [1, 1.08, 1] }}
                  transition={{ duration: 1.6, delay: i * 0.12, repeat: Infinity, ease: 'easeInOut' }}
                  className="drop-shadow-[0_0_12px_rgba(250,204,21,0.85)]"
                >
                  🪔
                </motion.span>
              ))}
            </div>

            {/* Big Gradient "Happy Diwali!" Heading */}
            <h1 className="font-serif text-5xl font-extrabold tracking-tight sm:text-7xl">
              <span className="bg-gradient-to-r from-[#FACC15] via-[#F97316] to-[#EC4899] bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(249,115,22,0.45)]">
                Happy Diwali!
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-3 text-lg font-semibold tracking-wide text-[#FACC15] drop-shadow-[0_0_10px_rgba(250,204,21,0.5)] sm:text-2xl">
              From the GetPuja Team ✨
            </p>

            {/* Bottom Row of 5 Glowing Diyas */}
            <div className="mt-4 flex items-center justify-center gap-3 text-3xl sm:gap-4 sm:text-4xl">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.span
                  key={`bot-diya-${i}`}
                  animate={{ y: [0, -5, 0], scale: [1, 1.08, 1] }}
                  transition={{ duration: 1.6, delay: i * 0.12 + 0.3, repeat: Infinity, ease: 'easeInOut' }}
                  className="drop-shadow-[0_0_12px_rgba(250,204,21,0.85)]"
                >
                  🪔
                </motion.span>
              ))}
            </div>

            {/* Celebrate Button */}
            <button
              type="button"
              onClick={() => setVisible(false)}
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#F97316] via-[#FB923C] to-[#FACC15] px-8 py-3 text-base font-extrabold text-[#1E0520] shadow-[0_0_28px_rgba(249,115,22,0.75)] transition hover:scale-105 active:scale-95"
            >
              <span>🎆</span>
              <span>Celebrate!</span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

