import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function OperationalAwareness() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 60%',
          end: 'bottom 40%',
          toggleActions: 'play none none reverse'
        }
      });

      tl.fromTo('.oa-headline-1',
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out' }
      )
      .fromTo('.oa-headline-2',
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out' },
        '-=0.5'
      )
      .fromTo('.oa-body',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
        '-=0.4'
      )
      .fromTo('.oa-image',
        { y: 80, opacity: 0, scale: 1.04 },
        { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' },
        '-=0.5'
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-[#0B0F17]">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <div className="text-center mb-16">
          <h2 className="oa-headline-1 text-5xl md:text-6xl lg:text-7xl font-bold text-[#F2F5FA] mb-4">
            See the full picture.
          </h2>
          <h2 className="oa-headline-2 text-5xl md:text-6xl lg:text-7xl font-bold text-[#38b6ff]">
            Act in seconds.
          </h2>
        </div>

        <p className="oa-body text-lg md:text-xl text-[#A9B3C2] text-center max-w-3xl mx-auto mb-16">
          Real-time data fusion, geospatial tracking, and secure comms—unified under one interface designed for high-stakes operations.
        </p>

        <div className="oa-image relative rounded-2xl overflow-hidden">
          <img 
            src="/images/ops_awareness_floor.jpg" 
            alt="Operations Floor"
            className="w-full h-[400px] md:h-[500px] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F17] via-transparent to-transparent" />
          
          {/* Floating Stats */}
          <div className="absolute bottom-8 left-8 right-8 grid grid-cols-3 gap-4">
            {[
              { label: 'Data Sources', value: '50+' },
              { label: 'Update Latency', value: '<150ms' },
              { label: 'Uptime', value: '99.99%' },
            ].map((stat, index) => (
              <div key={index} className="bg-[rgba(11,15,23,0.8)] backdrop-blur-sm border border-[rgba(242,245,250,0.12)] rounded-xl p-4">
                <p className="text-2xl md:text-3xl font-bold text-[#38b6ff]">{stat.value}</p>
                <p className="text-xs text-[#A9B3C2]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
