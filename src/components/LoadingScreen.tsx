import { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { Shield, Lock, Server, Wifi, Database, Eye, Cpu, Radio } from 'lucide-react';

interface LoadingScreenProps { onComplete: () => void; }

const C = { red: '#ff3131', dark: '#1800ad', light: '#38b6ff' };

const BOOT_LINES = [
  { prefix: 'BIOS',    text: 'POST COMPLETE — HARDWARE OK',            delay: 0 },
  { prefix: 'KERNEL',  text: 'LOADING DDSE CORE v2.4.1',               delay: 300 },
  { prefix: 'CRYPTO',  text: 'AES-256-GCM ENCRYPTION ACTIVE',          delay: 800 },
  { prefix: 'NET',     text: 'VPN TUNNEL ESTABLISHED [TLS 1.3]',       delay: 1400 },
  { prefix: 'AUTH',    text: 'CERTIFICATE VERIFIED — VALID',           delay: 2200 },
  { prefix: 'DB',      text: 'SECURE DATABASE CONNECTED',              delay: 2900 },
  { prefix: 'AUDIT',   text: 'SESSION LOGGED — ENTRY RECORDED',        delay: 3500 },
  { prefix: 'SYS',     text: 'ALL SYSTEMS NOMINAL — READY',            delay: 4100 },
];

const STATUS_STEPS = [
  { label: 'Hardware check',       icon: Cpu,      at: 10  },
  { label: 'Encryption active',    icon: Lock,     at: 25  },
  { label: 'Tunnel established',   icon: Wifi,     at: 42  },
  { label: 'Server connected',     icon: Server,   at: 58  },
  { label: 'Database loaded',      icon: Database, at: 72  },
  { label: 'Identity verified',    icon: Shield,   at: 88  },
  { label: 'Session secured',      icon: Eye,      at: 96  },
];

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress]   = useState(0);
  const [visibleLines, setLines]  = useState<typeof BOOT_LINES>([]);
  const containerRef  = useRef<HTMLDivElement>(null);
  const logoRef       = useRef<HTMLDivElement>(null);
  const ring1Ref      = useRef<HTMLDivElement>(null);
  const ring2Ref      = useRef<HTMLDivElement>(null);
  const ring3Ref      = useRef<HTMLDivElement>(null);
  const progressRef   = useRef<HTMLDivElement>(null);

  // ── progress ticker
  useEffect(() => {
    const id = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(id);
          gsap.to(containerRef.current, {
            opacity: 0, scale: 1.04, duration: 0.7, delay: 0.5,
            ease: 'power2.in', onComplete,
          });
          return 100;
        }
        const inc = p < 20 ? 1.6 : p < 45 ? 1.2 : p < 70 ? 0.9 : p < 88 ? 0.55 : p < 96 ? 0.3 : 0.15;
        return Math.min(p + inc, 100);
      });
    }, 48);
    return () => clearInterval(id);
  }, [onComplete]);

  // ── boot log drip
  useEffect(() => {
    BOOT_LINES.forEach(line => {
      setTimeout(() => setLines(prev => [...prev, line]), line.delay);
    });
  }, []);

  // ── GSAP scene
  useEffect(() => {
    const ctx = gsap.context(() => {

      // Logo burst entrance
      gsap.fromTo(logoRef.current,
        { scale: 0, rotation: -270, opacity: 0, filter: 'blur(20px)' },
        { scale: 1, rotation: 0, opacity: 1, filter: 'blur(0px)', duration: 1.1, ease: 'back.out(1.5)', delay: 0.1 }
      );

      // Rings entrance cascade
      gsap.fromTo([ring1Ref.current, ring2Ref.current, ring3Ref.current],
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.7, stagger: 0.18, ease: 'back.out(2)', delay: 0.4 }
      );

      // Ring 1 – slow clockwise
      gsap.to(ring1Ref.current, { rotation: 360, duration: 10, repeat: -1, ease: 'none' });
      // Ring 2 – faster counter-clockwise
      gsap.to(ring2Ref.current, { rotation: -360, duration: 6, repeat: -1, ease: 'none' });
      // Ring 3 – ultra fast clockwise
      gsap.to(ring3Ref.current, { rotation: 360, duration: 3.5, repeat: -1, ease: 'none' });

      // Logo breathe
      gsap.to(logoRef.current, {
        scale: 1.08, duration: 2, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1.2,
      });

      // Grid lines flicker
      gsap.to('.gline', {
        opacity: () => Math.random() * 0.25 + 0.03,
        duration: () => 1 + Math.random() * 2,
        stagger: { each: 0.03, from: 'random', repeat: -1, yoyo: true },
        ease: 'sine.inOut',
      });

      // Particles orbit + float
      gsap.utils.toArray<Element>('.lp').forEach((el, i) => {
        gsap.set(el, { x: 0, y: 0 });
        gsap.to(el, {
          x: (Math.random() - 0.5) * 60,
          y: -20 - Math.random() * 50,
          opacity: Math.random() * 0.9 + 0.1,
          scale: 0.5 + Math.random(),
          duration: 2 + Math.random() * 3,
          repeat: -1, yoyo: true,
          delay: i * 0.18,
          ease: 'sine.inOut',
        });
      });

      // Data stream columns
      gsap.utils.toArray<Element>('.ds').forEach((el, i) => {
        gsap.to(el, {
          y: '110vh',
          duration: 2.5 + i * 0.4,
          repeat: -1,
          delay: i * 0.35,
          ease: 'none',
        });
      });

      // Title letters drop
      gsap.fromTo('.tl',
        { y: 80, opacity: 0, rotateX: 60 },
        { y: 0, opacity: 1, rotateX: 0, duration: 0.65, stagger: 0.1, delay: 0.9, ease: 'power3.out' }
      );

      // Subtitle slide
      gsap.fromTo('.tsub',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, delay: 1.4, ease: 'power2.out' }
      );

      // Status icons stagger
      gsap.fromTo('.si',
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, stagger: 0.07, delay: 0.8, ease: 'back.out(2)' }
      );

      // Progress bar track glow pulse
      if (progressRef.current) {
        gsap.to(progressRef.current, {
          boxShadow: `0 0 18px ${C.light}80`,
          duration: 1.2, repeat: -1, yoyo: true, ease: 'sine.inOut',
        });
      }

      // Corner brackets animate in
      gsap.fromTo('.cb',
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, stagger: 0.12, delay: 0.3, ease: 'power2.out' }
      );

      // Scan line
      gsap.fromTo('.scan',
        { top: '-2px', opacity: 0 },
        { top: '100%', opacity: 1, duration: 2.2, repeat: -1, ease: 'none', delay: 0.5 }
      );

    }, containerRef);
    return () => ctx.revert();
  }, []);

  const activeStep = STATUS_STEPS.reduce((a, s) => progress >= s.at ? s : a, STATUS_STEPS[0]);

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #000008 0%, #04031a 50%, #000c18 100%)' }}>

      {/* ── Animated grid ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={`h${i}`} className="gline absolute left-0 right-0 h-px"
            style={{ top: `${(i + 1) * 4.1}%`, opacity: 0.05,
              background: `linear-gradient(90deg,transparent,${C.dark}90,${C.light}60,${C.dark}90,transparent)` }} />
        ))}
        {Array.from({ length: 36 }).map((_, i) => (
          <div key={`v${i}`} className="gline absolute top-0 bottom-0 w-px"
            style={{ left: `${(i + 1) * 2.77}%`, opacity: 0.04,
              background: `linear-gradient(180deg,transparent,${C.dark}80,${C.light}50,transparent)` }} />
        ))}
      </div>

      {/* ── Data streams ── */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="ds absolute top-0 w-px pointer-events-none"
          style={{
            left: `${8 + i * 11.5}%`, height: `${50 + Math.random() * 60}px`,
            background: `linear-gradient(180deg,transparent,${i % 2 === 0 ? C.light : C.dark}dd,transparent)`,
            opacity: 0.7,
          }} />
      ))}

      {/* ── Floating particles ── */}
      {Array.from({ length: 26 }).map((_, i) => (
        <div key={i} className="lp absolute rounded-full pointer-events-none"
          style={{
            width: `${1.5 + Math.random() * 3.5}px`,
            height: `${1.5 + Math.random() * 3.5}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            opacity: 0.4,
            background: i % 3 === 0 ? C.red : i % 3 === 1 ? C.light : C.dark,
            boxShadow: `0 0 8px ${i % 3 === 0 ? C.red : C.light}`,
          }} />
      ))}

      {/* ── Corner brackets ── */}
      {[
        'top-6 left-6 border-l-2 border-t-2',
        'top-6 right-6 border-r-2 border-t-2',
        'bottom-6 left-6 border-l-2 border-b-2',
        'bottom-6 right-6 border-r-2 border-b-2',
      ].map((cls, i) => (
        <div key={i} className={`cb absolute w-12 h-12 ${cls}`}
          style={{ borderColor: `${C.light}50` }} />
      ))}

      {/* ── Scan line ── */}
      <div className="scan absolute left-0 right-0 h-0.5 pointer-events-none z-20"
        style={{ background: `linear-gradient(90deg,transparent,${C.light}80,${C.red}50,${C.light}80,transparent)` }} />

      {/* ── Central content ── */}
      <div className="relative z-10 flex flex-col items-center px-6 w-full max-w-lg">

        {/* Logo cluster */}
        <div className="relative flex items-center justify-center mb-8" style={{ width: 200, height: 200 }}>

          {/* Pulse rings */}
          {[1, 2, 3].map(n => (
            <div key={n} className="absolute rounded-full border animate-pulse-ring"
              style={{
                width: 160, height: 160,
                borderColor: n === 1 ? `${C.red}80` : n === 2 ? `${C.dark}70` : `${C.light}50`,
                animationDelay: `${(n - 1) * 0.7}s`,
                animationDuration: '2.2s',
              }} />
          ))}

          {/* Ring 1 - outer dashed */}
          <div ref={ring1Ref} className="absolute rounded-full"
            style={{ width: 180, height: 180, border: `1.5px dashed ${C.light}35` }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
              style={{ background: C.light, boxShadow: `0 0 10px ${C.light}` }} />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full"
              style={{ background: C.red, boxShadow: `0 0 8px ${C.red}` }} />
          </div>

          {/* Ring 2 - middle solid */}
          <div ref={ring2Ref} className="absolute rounded-full"
            style={{ width: 148, height: 148, border: `2px solid ${C.dark}60` }}>
            <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full"
              style={{ background: C.dark, boxShadow: `0 0 10px ${C.dark}` }} />
          </div>

          {/* Ring 3 - inner fast */}
          <div ref={ring3Ref} className="absolute rounded-full"
            style={{ width: 116, height: 116, border: `1px dashed ${C.red}50` }}>
            <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
              style={{ background: C.red, boxShadow: `0 0 8px ${C.red}` }} />
          </div>

          {/* Logo core */}
          <div ref={logoRef} className="relative z-10 rounded-full overflow-hidden border-2"
            style={{
              width: 88, height: 88,
              borderColor: `${C.light}80`,
              boxShadow: `0 0 30px ${C.dark}cc, 0 0 60px ${C.dark}55, 0 0 100px ${C.dark}22`,
            }}>
            <img src="/images/ddse_logo.jpeg" alt="DDSE" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Title */}
        <div className="flex gap-3 mb-2 overflow-hidden" style={{ perspective: '800px' }}>
          {['D', 'D', 'S', 'E'].map((l, i) => (
            <span key={i} className="tl text-6xl font-black inline-block"
              style={{
                color: i === 0 ? C.light : i === 1 ? C.light : i === 2 ? '#ffffff' : C.red,
                textShadow: `0 0 30px ${i < 2 ? C.light : C.red}99`,
                letterSpacing: '0.05em',
              }}>
              {l}
            </span>
          ))}
        </div>

        <p className="tsub text-[11px] font-bold uppercase tracking-[0.3em] mb-1"
          style={{ color: `${C.light}aa` }}>
          Defense Department of Standards and Evaluation
        </p>
        <p className="tsub text-[10px] font-mono mb-8" style={{ color: '#ffffff35' }}>
          Classified — Restricted Access Only
        </p>

        {/* Active status pill */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border mb-4"
          style={{ borderColor: `${C.light}30`, background: `${C.dark}25` }}>
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: C.light, boxShadow: `0 0 8px ${C.light}` }} />
          <activeStep.icon className="w-3.5 h-3.5" style={{ color: C.light }} />
          <span className="text-xs font-mono" style={{ color: C.light }}>{activeStep.label}</span>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-sm mb-3">
          <div className="flex justify-between text-[10px] font-mono mb-1.5" style={{ color: '#ffffff35' }}>
            <span style={{ color: `${C.light}80` }}>▶ SYSTEM BOOT</span>
            <span style={{ color: progress >= 100 ? '#22c55e' : `${C.light}99` }}>{Math.round(progress)}%</span>
          </div>
          <div ref={progressRef} className="h-2.5 rounded-full overflow-hidden"
            style={{ background: '#ffffff08', border: `1px solid ${C.dark}60` }}>
            <div className="h-full rounded-full relative overflow-hidden transition-all duration-100 ease-linear"
              style={{ width: `${progress}%`, background: `linear-gradient(90deg,${C.dark},${C.light},${C.red})` }}>
              <div className="absolute inset-0 animate-shimmer"
                style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)', width: '50%' }} />
            </div>
          </div>
          {/* Tick marks */}
          <div className="flex justify-between mt-1.5">
            {[0, 25, 50, 75, 100].map(t => (
              <div key={t} className="flex flex-col items-center gap-0.5">
                <div className="w-px h-2" style={{ background: progress >= t ? C.light : '#ffffff18' }} />
                <span className="text-[8px] font-mono" style={{ color: progress >= t ? `${C.light}bb` : '#ffffff15' }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status icon row */}
        <div className="flex items-center gap-3 mb-6">
          {STATUS_STEPS.slice(0, 6).map(({ icon: Icon, label, at }) => {
            const done = progress >= at;
            const active = activeStep.label === label;
            return (
              <div key={label} className="si flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500"
                  style={{
                    background: done ? `${C.dark}60` : '#ffffff06',
                    border: `1px solid ${done ? `${C.light}60` : '#ffffff12'}`,
                    boxShadow: active ? `0 0 16px ${C.light}66` : 'none',
                  }}>
                  <Icon className="w-3.5 h-3.5 transition-all duration-500"
                    style={{ color: done ? C.light : '#ffffff25' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Terminal log */}
        <div className="w-full max-w-sm rounded-xl overflow-hidden"
          style={{ background: '#000000bb', border: `1px solid ${C.dark}50` }}>
          {/* Terminal header */}
          <div className="flex items-center gap-1.5 px-3 py-2" style={{ borderBottom: `1px solid ${C.dark}40` }}>
            {[C.red, '#f59e0b', C.light].map((c, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
            ))}
            <span className="ml-2 text-[9px] font-mono" style={{ color: '#ffffff25' }}>ddse_boot.log</span>
            <div className="ml-auto flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
              <span className="text-[9px] font-mono" style={{ color: '#22c55e' }}>LIVE</span>
            </div>
          </div>
          {/* Log lines */}
          <div className="p-3 space-y-1 min-h-[80px]">
            {visibleLines.slice(-6).map((line, i) => (
              <div key={i} className="flex items-center gap-2 font-mono text-[10px]">
                <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[8px] font-bold"
                  style={{ background: `${C.dark}50`, color: C.light, minWidth: 44, textAlign: 'center' }}>
                  {line.prefix}
                </span>
                <span style={{ color: i === visibleLines.length - 1 ? C.light + 'ee' : '#ffffff35' }}>
                  {line.text}
                </span>
                {i === visibleLines.slice(-6).length - 1 && (
                  <span className="animate-cursor inline-block w-1 h-3 ml-0.5 align-middle"
                    style={{ background: C.light }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-5 left-0 right-0 flex items-center justify-center gap-4">
        <div className="h-px flex-1 max-w-20" style={{ background: `linear-gradient(90deg,transparent,${C.light}40)` }} />
        <p className="text-[9px] font-mono tracking-widest" style={{ color: '#ffffff20' }}>
          DDSE v2.4.1 · CLASSIFIED
        </p>
        <div className="h-px flex-1 max-w-20" style={{ background: `linear-gradient(90deg,${C.light}40,transparent)` }} />
      </div>
    </div>
  );
}
