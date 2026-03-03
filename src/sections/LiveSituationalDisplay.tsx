import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronRight, MapPin, AlertTriangle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

gsap.registerPlugin(ScrollTrigger);

export default function LiveSituationalDisplay() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.lsd-mockup',
        { x: -100, opacity: 0, scale: 0.98 },
        {
          x: 0,
          opacity: 1,
          scale: 1,
          duration: 0.9,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 60%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      gsap.fromTo('.lsd-content',
        { x: 80, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 55%',
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
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Mockup */}
          <div className="lsd-mockup relative">
            <div className="relative rounded-2xl overflow-hidden border border-[rgba(242,245,250,0.12)] shadow-2xl">
              <img 
                src="/images/dashboard_mockup.jpg" 
                alt="Dashboard Interface"
                className="w-full h-auto"
              />
            </div>
            
            {/* Floating Badge */}
            <div className="absolute -bottom-4 -right-4 bg-[#111827] border border-[rgba(242,245,250,0.12)] rounded-xl p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#38b6ff]/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-[#38b6ff]" />
                </div>
                <div>
                  <p className="text-sm text-[#F2F5FA] font-medium">Live Tracking</p>
                  <p className="text-xs text-[#A9B3C2]">47 units active</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="lsd-content space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-[#F2F5FA]">
              Live situational display.
            </h2>
            <p className="text-lg text-[#A9B3C2]">
              A single pane for maps, telemetry, alerts, and team coordination—optimized for low-light rooms and rapid decision-making.
            </p>

            <div className="space-y-4 pt-4">
              {[
                { icon: MapPin, label: 'Real-time geospatial tracking', color: 'text-[#38b6ff]' },
                { icon: AlertTriangle, label: 'Intelligent alert management', color: 'text-yellow-400' },
                { icon: Users, label: 'Team coordination tools', color: 'text-blue-400' },
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <feature.icon className={`w-5 h-5 ${feature.color}`} />
                  <span className="text-[#F2F5FA]">{feature.label}</span>
                </div>
              ))}
            </div>

            <Button className="bg-[#38b6ff] text-[#0B0F17] hover:bg-[#38b6ff]/90 mt-4">
              Explore the interface
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
