import { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { Shield, Lock, Server, Wifi, Database, Eye, Cpu } from 'lucide-react';

const C = { red: '#ff3131', dark: '#1800ad', light: '#38b6ff' };

interface LoadingScreenProps { onComplete: () => void; }

// Army green palette

const BOOT = [
  { prefix:'BIOS',   text:'POST COMPLETE — HARDWARE OK',       delay:0   },
  { prefix:'KERNEL', text:'DDSE CORE v2.4.1 LOADED',           delay:300 },
  { prefix:'CRYPTO', text:'AES-256-GCM ENCRYPTION ACTIVE',     delay:800 },
  { prefix:'NET',    text:'SECURE TUNNEL ESTABLISHED [TLS 1.3]',delay:1400},
  { prefix:'AUTH',   text:'CERTIFICATE CHAIN VERIFIED',        delay:2200},
  { prefix:'DB',     text:'ENCRYPTED DATABASE CONNECTED',      delay:2900},
  { prefix:'AUDIT',  text:'SESSION LOGGED — ENTRY RECORDED',   delay:3500},
  { prefix:'SYS',    text:'ALL SYSTEMS NOMINAL — READY',       delay:4100},
];

const STATUS = [
  { label:'Hardware check',   icon:Cpu,      at:10 },
  { label:'Encryption active',icon:Lock,     at:25 },
  { label:'Tunnel established',icon:Wifi,    at:42 },
  { label:'Server connected', icon:Server,   at:58 },
  { label:'Database loaded',  icon:Database, at:72 },
  { label:'Identity verified',icon:Shield,   at:88 },
  { label:'Session secured',  icon:Eye,      at:96 },
];

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [lines, setLines]       = useState<typeof BOOT>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef      = useRef<HTMLDivElement>(null);
  const ring1Ref     = useRef<HTMLDivElement>(null);
  const ring2Ref     = useRef<HTMLDivElement>(null);
  const ring3Ref     = useRef<HTMLDivElement>(null);
  const barRef       = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(id);
          gsap.to(containerRef.current, { opacity:0, scale:1.04, duration:0.7, delay:0.5, ease:'power2.in', onComplete });
          return 100;
        }
        const inc = p<20?1.6:p<45?1.2:p<70?0.9:p<88?0.55:p<96?0.3:0.15;
        return Math.min(p+inc, 100);
      });
    }, 48);
    return () => clearInterval(id);
  }, [onComplete]);

  useEffect(() => {
    BOOT.forEach(l => setTimeout(() => setLines(prev=>[...prev,l]), l.delay));
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(logoRef.current,
        { scale:0, rotation:-270, opacity:0, filter:'blur(20px)' },
        { scale:1, rotation:0, opacity:1, filter:'blur(0px)', duration:1.1, ease:'back.out(1.5)', delay:0.1 }
      );
      gsap.fromTo([ring1Ref.current,ring2Ref.current,ring3Ref.current],
        { scale:0, opacity:0 }, { scale:1, opacity:1, duration:0.7, stagger:0.18, ease:'back.out(2)', delay:0.4 }
      );
      gsap.to(ring1Ref.current, { rotation:360, duration:10, repeat:-1, ease:'none' });
      gsap.to(ring2Ref.current, { rotation:-360, duration:6, repeat:-1, ease:'none' });
      gsap.to(ring3Ref.current, { rotation:360, duration:3.5, repeat:-1, ease:'none' });
      gsap.to(logoRef.current, { scale:1.08, duration:2, repeat:-1, yoyo:true, ease:'sine.inOut', delay:1.2 });
      gsap.to('.gline', {
        opacity:()=>Math.random()*0.2+0.02, duration:()=>1+Math.random()*2,
        stagger:{ each:0.03, from:'random', repeat:-1, yoyo:true }, ease:'sine.inOut',
      });
      gsap.utils.toArray<Element>('.lp').forEach((el,i)=>{
        gsap.to(el, { x:(Math.random()-0.5)*60, y:-20-Math.random()*50,
          opacity:Math.random()*0.9+0.1, scale:0.5+Math.random(),
          duration:2+Math.random()*3, repeat:-1, yoyo:true, delay:i*0.18, ease:'sine.inOut' });
      });
      gsap.utils.toArray<Element>('.ds').forEach((el,i)=>{
        gsap.to(el, { y:'110vh', duration:2.5+i*0.4, repeat:-1, delay:i*0.35, ease:'none' });
      });
      gsap.fromTo('.tl',
        { y:80, opacity:0, rotateX:60 },
        { y:0, opacity:1, rotateX:0, duration:0.65, stagger:0.1, delay:0.9, ease:'power3.out' }
      );
      gsap.fromTo('.tsub',{ y:20, opacity:0 },{ y:0, opacity:1, duration:0.5, delay:1.4, ease:'power2.out' });
      gsap.fromTo('.si',{ scale:0, opacity:0 },{ scale:1, opacity:1, duration:0.4, stagger:0.07, delay:0.8, ease:'back.out(2)' });
      gsap.fromTo('.cb',{ scale:0, opacity:0 },{ scale:1, opacity:1, duration:0.5, stagger:0.12, delay:0.3, ease:'power2.out' });
      if (barRef.current)
        gsap.to(barRef.current, { boxShadow:`0 0 18px ${C.light}80`, duration:1.2, repeat:-1, yoyo:true, ease:'sine.inOut' });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const activeStep = STATUS.reduce((a,s)=>progress>=s.at?s:a, STATUS[0]);

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background:`linear-gradient(135deg,${'#03040f'} 0%,#0d150a 50%,#080f06 100%)` }}>

      {/* Animated grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({length:24}).map((_,i)=>(
          <div key={`h${i}`} className="gline absolute left-0 right-0 h-px"
            style={{ top:`${(i+1)*4.1}%`, opacity:0.05,
              background:`linear-gradient(90deg,transparent,${C.dark}90,${C.light}60,${C.dark}90,transparent)` }}/>
        ))}
        {Array.from({length:36}).map((_,i)=>(
          <div key={`v${i}`} className="gline absolute top-0 bottom-0 w-px"
            style={{ left:`${(i+1)*2.77}%`, opacity:0.04,
              background:`linear-gradient(180deg,transparent,${C.dark}80,${C.light}50,transparent)` }}/>
        ))}
      </div>

      {/* Data streams */}
      {Array.from({length:8}).map((_,i)=>(
        <div key={i} className="ds absolute top-0 w-px pointer-events-none"
          style={{ left:`${8+i*11.5}%`, height:`${50+Math.random()*60}px`,
            background:`linear-gradient(180deg,transparent,${i%2===0?C.light:C.dark}dd,transparent)`, opacity:0.6 }}/>
      ))}

      {/* Floating particles */}
      {Array.from({length:26}).map((_,i)=>(
        <div key={i} className="lp absolute rounded-full pointer-events-none"
          style={{ width:`${1.5+Math.random()*3}px`, height:`${1.5+Math.random()*3}px`,
            top:`${Math.random()*100}%`, left:`${Math.random()*100}%`, opacity:0.4,
            background: i%4===0?C.red:i%4===1?C.light:i%4===2?C.light:C.dark,
            boxShadow:`0 0 8px ${i%4===0?C.red:C.light}` }}/>
      ))}

      {/* Corner brackets */}
      {['top-6 left-6 border-l-2 border-t-2','top-6 right-6 border-r-2 border-t-2',
        'bottom-6 left-6 border-l-2 border-b-2','bottom-6 right-6 border-r-2 border-b-2'].map((cls,i)=>(
        <div key={i} className={`cb absolute w-12 h-12 ${cls}`} style={{ borderColor:`${C.light}60` }}/>
      ))}

      {/* Scan line */}
      <div className="absolute left-0 right-0 h-0.5 pointer-events-none z-20"
        style={{ background:`linear-gradient(90deg,transparent,${C.light}80,${C.light}50,${C.light}80,transparent)`,
          animation:'scan-line 2.5s linear infinite' }}/>

      {/* Central content */}
      <div className="relative z-10 flex flex-col items-center px-6 w-full max-w-lg">

        {/* Logo cluster */}
        <div className="relative flex items-center justify-center mb-8" style={{ width:200, height:200 }}>
          {[1,2,3].map(n=>(
            <div key={n} className="absolute rounded-full border animate-pulse-ring"
              style={{ width:160, height:160,
                borderColor: n===1?`${C.red}80`:n===2?`${C.dark}70`:`${C.light}50`,
                animationDelay:`${(n-1)*0.7}s`, animationDuration:'2.2s' }}/>
          ))}

          {/* Ring 1 – outer dashed */}
          <div ref={ring1Ref} className="absolute rounded-full"
            style={{ width:180, height:180, border:`1.5px dashed ${C.light}35` }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
              style={{ background:C.light, boxShadow:`0 0 10px ${C.light}` }}/>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full"
              style={{ background:C.light, boxShadow:`0 0 8px ${C.light}` }}/>
          </div>

          {/* Ring 2 – middle */}
          <div ref={ring2Ref} className="absolute rounded-full"
            style={{ width:148, height:148, border:`2px solid ${C.dark}60` }}>
            <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full"
              style={{ background:C.dark, boxShadow:`0 0 10px ${C.dark}` }}/>
          </div>

          {/* Ring 3 – fast inner */}
          <div ref={ring3Ref} className="absolute rounded-full"
            style={{ width:116, height:116, border:`1px dashed ${C.light}50` }}>
            <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
              style={{ background:C.light, boxShadow:`0 0 8px ${C.light}` }}/>
          </div>

          {/* Logo core */}
          <div ref={logoRef} className="relative z-10 rounded-full overflow-hidden border-2"
            style={{ width:88, height:88, borderColor:`${C.light}80`,
              boxShadow:`0 0 30px ${C.dark}cc,0 0 60px ${C.dark}55,0 0 100px ${C.dark}22` }}>
            <img src="/images/ddse_logo.jpeg" alt="DDSE" className="w-full h-full object-cover"/>
          </div>
        </div>

        {/* Title */}
        <div className="flex gap-3 mb-2 overflow-hidden" style={{ perspective:'800px' }}>
          {['D','D','S','E'].map((l,i)=>(
            <span key={i} className="tl text-6xl font-black inline-block"
              style={{ color:i<2?C.light:i===2?'#f1f5f9':C.light,
                textShadow:`0 0 30px ${i<2?C.light:C.light}99`, letterSpacing:'0.05em' }}>
              {l}
            </span>
          ))}
        </div>

        <p className="tsub text-[11px] font-bold uppercase tracking-[0.3em] mb-1"
          style={{ color:`${C.light}aa` }}>
          Defense Department of Standards and Evaluation
        </p>
        <p className="tsub text-[10px] font-mono mb-8" style={{ color:`${'#64748b'}60` }}>
          Classified — Restricted Access Only
        </p>

        {/* Active step */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border mb-4"
          style={{ borderColor:`${C.dark}40`, background:`${'#03040f'}80` }}>
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background:C.light, boxShadow:`0 0 8px ${C.light}` }}/>
          <activeStep.icon className="w-3.5 h-3.5" style={{ color:C.light }}/>
          <span className="text-xs font-mono" style={{ color:C.light }}>{activeStep.label}</span>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-sm mb-3">
          <div className="flex justify-between text-[10px] font-mono mb-1.5" style={{ color:`${'#64748b'}80` }}>
            <span style={{ color:`${C.light}80` }}>▶ SYSTEM BOOT</span>
            <span style={{ color:progress>=100?'#22c55e':`${C.light}99` }}>{Math.round(progress)}%</span>
          </div>
          <div ref={barRef} className="h-2.5 rounded-full overflow-hidden"
            style={{ background:'rgba(255,255,255,0.05)', border:`1px solid ${C.dark}60` }}>
            <div className="h-full rounded-full relative overflow-hidden transition-all duration-100"
              style={{ width:`${progress}%`, background:`linear-gradient(90deg,${C.dark},${C.light},${C.light})` }}>
              <div className="absolute inset-0 animate-shimmer"
                style={{ background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)', width:'50%' }}/>
            </div>
          </div>
          <div className="flex justify-between mt-1.5">
            {[0,25,50,75,100].map(t=>(
              <div key={t} className="flex flex-col items-center gap-0.5">
                <div className="w-px h-2" style={{ background:progress>=t?C.light:'rgba(255,255,255,0.1)' }}/>
                <span className="text-[8px] font-mono" style={{ color:progress>=t?`${C.light}bb`:'rgba(255,255,255,0.1)' }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status icons */}
        <div className="flex items-center gap-3 mb-6">
          {STATUS.slice(0,6).map(({ icon:Icon, label, at })=>{
            const done = progress>=at;
            const active = activeStep.label===label;
            return (
              <div key={label} className="si">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500"
                  style={{ background:done?`${C.dark}60`:'rgba(255,255,255,0.04)',
                    border:`1px solid ${done?`${C.light}60`:'rgba(255,255,255,0.08)'}`,
                    boxShadow:active?`0 0 16px ${C.light}66`:'none' }}>
                  <Icon className="w-3.5 h-3.5" style={{ color:done?C.light:'rgba(255,255,255,0.18)' }}/>
                </div>
              </div>
            );
          })}
        </div>

        {/* Terminal */}
        <div className="w-full max-w-sm rounded-xl overflow-hidden"
          style={{ background:'rgba(0,0,0,0.75)', border:`1px solid ${C.dark}50` }}>
          <div className="flex items-center gap-1.5 px-3 py-2" style={{ borderBottom:`1px solid ${C.dark}40` }}>
            {[C.red,'#38b6ff',C.light].map((c,i)=>(
              <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background:c }}/>
            ))}
            <span className="ml-2 text-[9px] font-mono" style={{ color:`${'#64748b'}60` }}>ddse_boot.log</span>
            <div className="ml-auto flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background:'#22c55e' }}/>
              <span className="text-[9px] font-mono text-emerald-500">LIVE</span>
            </div>
          </div>
          <div className="p-3 space-y-1 min-h-[80px]">
            {lines.slice(-6).map((line,i)=>(
              <div key={i} className="flex items-center gap-2 font-mono text-[10px]">
                <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[8px] font-bold"
                  style={{ background:`${C.dark}50`, color:C.light, minWidth:44, textAlign:'center' }}>
                  {line.prefix}
                </span>
                <span style={{ color:i===lines.slice(-6).length-1?`${'#f1f5f9'}ee`:`${'#64748b'}50` }}>
                  {line.text}
                </span>
                {i===lines.slice(-6).length-1&&(
                  <span className="animate-cursor inline-block w-1 h-3 ml-0.5 align-middle" style={{ background:C.light }}/>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-5 left-0 right-0 flex items-center justify-center gap-4">
        <div className="h-px flex-1 max-w-20" style={{ background:`linear-gradient(90deg,transparent,${C.light}40)` }}/>
        <p className="text-[9px] font-mono tracking-widest" style={{ color:`${'#64748b'}50` }}>DDSE v2.4.1 · CLASSIFIED</p>
        <div className="h-px flex-1 max-w-20" style={{ background:`linear-gradient(90deg,${C.light}40,transparent)` }}/>
      </div>
    </div>
  );
}
