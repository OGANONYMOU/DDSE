import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Play, RefreshCw, Download, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

gsap.registerPlugin(ScrollTrigger);

export default function TacticalInterface() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.ti-headline',
        { x: -60, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.7,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 60%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      gsap.fromTo('.ti-button',
        { x: -40, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 55%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      gsap.fromTo('.ti-preview',
        { x: 80, opacity: 0, scale: 0.98 },
        {
          x: 0,
          opacity: 1,
          scale: 1,
          duration: 0.9,
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
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Controls */}
          <div className="space-y-8">
            <div>
              <h2 className="ti-headline text-4xl md:text-5xl font-bold text-[#F2F5FA] mb-4">
                Tactical interface.
              </h2>
              <p className="text-lg text-[#A9B3C2]">
                Fast inputs, clear hierarchy, and keyboard-friendly navigation—built for operators, not accountants.
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="ti-button w-full justify-between border-[rgba(242,245,250,0.12)] text-[#F2F5FA] hover:bg-[#38b6ff]/10 hover:border-[#38b6ff]/30 py-6"
              >
                <span className="flex items-center gap-3">
                  <Play className="w-5 h-5 text-[#38b6ff]" />
                  Initialize Link
                </span>
                <ChevronRight className="w-5 h-5" />
              </Button>
              
              <Button 
                variant="outline" 
                className="ti-button w-full justify-between border-[rgba(242,245,250,0.12)] text-[#F2F5FA] hover:bg-[#38b6ff]/10 hover:border-[#38b6ff]/30 py-6"
              >
                <span className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-[#38b6ff]" />
                  Sync Telemetry
                </span>
                <ChevronRight className="w-5 h-5" />
              </Button>
              
              <Button 
                variant="outline" 
                className="ti-button w-full justify-between border-[rgba(242,245,250,0.12)] text-[#F2F5FA] hover:bg-[#38b6ff]/10 hover:border-[#38b6ff]/30 py-6"
              >
                <span className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-[#38b6ff]" />
                  Export Report
                </span>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex items-center gap-4 text-sm text-[#A9B3C2]">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#38b6ff] rounded-full" />
                Keyboard shortcuts enabled
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#38b6ff] rounded-full" />
                Dark mode optimized
              </span>
            </div>
          </div>

          {/* Right Preview */}
          <div className="ti-preview relative">
            <div className="relative rounded-2xl overflow-hidden border border-[rgba(242,245,250,0.12)] shadow-2xl">
              <img 
                src="/images/tactical_preview.jpg" 
                alt="Tactical Interface Preview"
                className="w-full h-auto"
              />
              
              {/* Overlay UI Elements */}
              <div className="absolute top-4 left-4 right-4 flex justify-between">
                <div className="px-3 py-1 bg-[rgba(11,15,23,0.8)] backdrop-blur-sm rounded text-xs text-[#38b6ff] font-mono">
                  OPERATION FALCON EYE
                </div>
                <div className="px-3 py-1 bg-[rgba(11,15,23,0.8)] backdrop-blur-sm rounded text-xs text-[#F2F5FA] font-mono">
                  14:37:21 GMT
                </div>
              </div>
            </div>
            
            {/* Thumbnail */}
            <div className="absolute -bottom-6 -left-6 w-48 h-28 rounded-xl overflow-hidden border-2 border-[#0B0F17] shadow-xl">
              <img 
                src="/images/tactical_thumbnail.jpg" 
                alt="Thumbnail"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
