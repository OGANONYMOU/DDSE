import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Map, Radio, ScanLine, Lock, ClipboardCheck, Network } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const capabilities = [
  { icon: Map, label: 'Real-time Maps', description: 'Live geospatial tracking and terrain analysis' },
  { icon: Radio, label: 'Secure Comms', description: 'Encrypted voice and data communications' },
  { icon: ScanLine, label: 'Sensor Fusion', description: 'Multi-source data integration' },
  { icon: Lock, label: 'Access Control', description: 'Role-based authentication and authorization' },
  { icon: ClipboardCheck, label: 'Audit & Compliance', description: 'Comprehensive logging and reporting' },
  { icon: Network, label: 'API Gateway', description: 'Secure integration with existing systems' },
];

export default function ModularCapabilities() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.mc-headline',
        { x: -80, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 60%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      gsap.fromTo('.mc-tile',
        { x: 60, opacity: 0, scale: 0.98 },
        {
          x: 0,
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.08,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 50%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-[#0B0F17]">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left Content */}
          <div className="lg:sticky lg:top-32">
            <h2 className="mc-headline text-4xl md:text-5xl font-bold text-[#F2F5FA] mb-6">
              Modular capabilities.
            </h2>
            <p className="text-lg text-[#A9B3C2] mb-8">
              Add what you need. Remove what you don't. All modules integrate with your existing identity and data environments.
            </p>
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#38b6ff]/10 flex items-center justify-center">
                <div className="w-3 h-3 bg-[#38b6ff] rounded-full" />
              </div>
              <div>
                <p className="text-[#F2F5FA] font-medium">Plug-and-play architecture</p>
                <p className="text-sm text-[#A9B3C2]">Deploy in hours, not months</p>
              </div>
            </div>
          </div>

          {/* Right Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {capabilities.map((cap, index) => (
              <div 
                key={index}
                className="mc-tile group p-6 bg-[rgba(242,245,250,0.03)] border border-[rgba(242,245,250,0.08)] rounded-xl hover:border-[#38b6ff]/30 hover:bg-[#38b6ff]/5 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#38b6ff]/10 flex items-center justify-center flex-shrink-0">
                    <cap.icon className="w-5 h-5 text-[#38b6ff]" />
                  </div>
                  <div>
                    <h3 className="text-[#F2F5FA] font-semibold mb-1">{cap.label}</h3>
                    <p className="text-sm text-[#A9B3C2]">{cap.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
