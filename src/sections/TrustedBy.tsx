import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Shield, Target, Radio, Satellite, Plane, Ship } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const partners = [
  { name: 'Defense Command', icon: Shield },
  { name: 'Strategic Ops', icon: Target },
  { name: 'Communications', icon: Radio },
  { name: 'Intelligence', icon: Satellite },
  { name: 'Air Force', icon: Plane },
  { name: 'Naval Command', icon: Ship },
];

export default function TrustedBy() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.trusted-label',
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            end: 'top 60%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      gsap.fromTo('.partner-logo',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            end: 'top 50%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 bg-[#0B0F17]">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <p className="trusted-label text-center text-sm font-mono text-[#A9B3C2] uppercase tracking-wider mb-12">
          Trusted by Defense & Security Teams
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
          {partners.map((partner, index) => (
            <div 
              key={index} 
              className="partner-logo flex flex-col items-center gap-3 group cursor-pointer"
            >
              <div className="w-16 h-16 rounded-xl bg-[rgba(242,245,250,0.03)] border border-[rgba(242,245,250,0.08)] flex items-center justify-center group-hover:border-[#38b6ff]/30 group-hover:bg-[#38b6ff]/5 transition-all duration-300">
                <partner.icon className="w-8 h-8 text-[#A9B3C2] group-hover:text-[#38b6ff] transition-colors" />
              </div>
              <span className="text-xs text-[#A9B3C2] text-center">{partner.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
