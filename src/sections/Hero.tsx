import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Shield, ChevronRight, Activity, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroProps {
  onCtaClick: () => void;
}

export default function Hero({ onCtaClick }: HeroProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const statusCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Background animation
      gsap.fromTo('.hero-bg', 
        { opacity: 0, scale: 1.06 },
        { opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out' }
      );

      // Content animation
      gsap.fromTo('.hero-headline',
        { y: 40, opacity: 0, rotateX: 15 },
        { y: 0, opacity: 1, rotateX: 0, duration: 0.8, delay: 0.3, ease: 'power2.out' }
      );

      gsap.fromTo('.hero-subheadline',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, delay: 0.5, ease: 'power2.out' }
      );

      gsap.fromTo('.hero-cta',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, delay: 0.7, ease: 'power2.out' }
      );

      // Status card animation
      gsap.fromTo(statusCardRef.current,
        { x: 100, opacity: 0, scale: 0.95 },
        { x: 0, opacity: 1, scale: 1, duration: 0.8, delay: 0.6, ease: 'power2.out' }
      );

      // Status bars animation
      gsap.fromTo('.status-bar',
        { width: '0%' },
        { width: '100%', duration: 1, delay: 1, stagger: 0.15, ease: 'power2.out' }
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="hero-bg absolute inset-0 z-0">
        <img 
          src="/images/hero_control_room.jpg" 
          alt="Military Command Center"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F17] via-[#0B0F17]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F17] via-transparent to-[#0B0F17]/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-6 lg:px-16 py-32">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div ref={contentRef} className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#38b6ff]/10 border border-[#38b6ff]/30 rounded-full">
                <Shield className="w-4 h-4 text-[#38b6ff]" />
                <span className="text-sm text-[#38b6ff] font-medium">Military-Grade Security</span>
              </div>

              <h1 className="hero-headline text-4xl md:text-5xl lg:text-6xl font-bold text-[#F2F5FA] leading-tight">
                Modern defense infrastructure.
                <span className="text-[#38b6ff]"> Built for scale.</span>
              </h1>

              <p className="hero-subheadline text-lg md:text-xl text-[#A9B3C2] max-w-xl">
                DDSE integrates data, maps, and communications into one secure operating picture—so teams can decide faster.
              </p>

              <div className="hero-cta flex flex-wrap gap-4">
                <Button 
                  size="lg"
                  onClick={onCtaClick}
                  className="bg-[#38b6ff] text-[#0B0F17] hover:bg-[#38b6ff]/90 font-semibold px-8"
                >
                  Request a demo
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-[rgba(242,245,250,0.2)] text-[#F2F5FA] hover:bg-[rgba(242,245,250,0.05)] px-8"
                >
                  View capabilities
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-8 pt-4">
                <div className="flex items-center gap-2 text-[#A9B3C2]">
                  <Lock className="w-5 h-5 text-[#38b6ff]" />
                  <span className="text-sm">End-to-end encrypted</span>
                </div>
                <div className="flex items-center gap-2 text-[#A9B3C2]">
                  <Activity className="w-5 h-5 text-[#38b6ff]" />
                  <span className="text-sm">99.99% uptime</span>
                </div>
              </div>
            </div>

            {/* Right Status Card */}
            <div ref={statusCardRef} className="hidden lg:block">
              <div className="bg-[rgba(11,15,23,0.85)] backdrop-blur-md border border-[rgba(242,245,250,0.12)] rounded-2xl p-6 max-w-md ml-auto">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-mono text-[#A9B3C2] uppercase tracking-wider">System Status</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#38b6ff] rounded-full animate-pulse" />
                    <span className="text-xs text-[#38b6ff]">ONLINE</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[#F2F5FA]">Uplink</span>
                      <span className="text-sm text-[#38b6ff]">Secure</span>
                    </div>
                    <div className="h-2 bg-[rgba(242,245,250,0.08)] rounded-full overflow-hidden">
                      <div className="status-bar h-full bg-[#38b6ff] rounded-full" style={{ width: '98%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[#F2F5FA]">Telemetry</span>
                      <span className="text-sm text-[#38b6ff]">Live</span>
                    </div>
                    <div className="h-2 bg-[rgba(242,245,250,0.08)] rounded-full overflow-hidden">
                      <div className="status-bar h-full bg-[#38b6ff] rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[#F2F5FA]">Alerts</span>
                      <span className="text-sm text-[#38b6ff]">0 active</span>
                    </div>
                    <div className="h-2 bg-[rgba(242,245,250,0.08)] rounded-full overflow-hidden">
                      <div className="status-bar h-full bg-[#38b6ff] rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[rgba(242,245,250,0.08)]">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-[#38b6ff]" />
                    <div>
                      <p className="text-sm text-[#F2F5FA]">All systems operational</p>
                      <p className="text-xs text-[#A9B3C2]">Last updated: 2 seconds ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
