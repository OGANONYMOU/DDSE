import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Lock, ShieldCheck, Key, KeyRound } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function SecureByDesign() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.sbd-left',
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

      gsap.fromTo('.sbd-right',
        { x: 80, opacity: 0 },
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

      gsap.fromTo('.sbd-image',
        { scale: 0.7, opacity: 0, rotate: -8 },
        {
          scale: 1,
          opacity: 1,
          rotate: 0,
          duration: 1,
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
        <div className="grid lg:grid-cols-3 gap-12 items-center">
          {/* Left Content */}
          <div className="sbd-left space-y-6">
            <div className="w-14 h-14 rounded-xl bg-[#38b6ff]/10 flex items-center justify-center">
              <Lock className="w-7 h-7 text-[#38b6ff]" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-[#F2F5FA]">
              End-to-end encryption.
            </h3>
            <p className="text-[#A9B3C2]">
              Data is protected in transit and at rest with modern ciphers and strict key management. AES-256 encryption ensures your sensitive information remains secure.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-[#38b6ff]">
                <Key className="w-4 h-4" />
                <span>AES-256</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#38b6ff]">
                <ShieldCheck className="w-4 h-4" />
                <span>TLS 1.3</span>
              </div>
            </div>
          </div>

          {/* Center Image */}
          <div className="sbd-image relative flex justify-center">
            <div className="relative w-64 h-64 md:w-80 md:h-80">
              <div className="absolute inset-0 rounded-full border border-[rgba(242,245,250,0.12)]" />
              <div className="absolute inset-4 rounded-full border border-[rgba(242,245,250,0.08)]" />
              <img 
                src="/images/circular_aerial_scene.jpg" 
                alt="Tactical Operations"
                className="w-full h-full rounded-full object-cover"
              />
              <div className="absolute inset-0 rounded-full border-2 border-[#38b6ff]/30" />
            </div>
          </div>

          {/* Right Content */}
          <div className="sbd-right space-y-6">
            <div className="w-14 h-14 rounded-xl bg-[#38b6ff]/10 flex items-center justify-center">
              <KeyRound className="w-7 h-7 text-[#38b6ff]" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-[#F2F5FA]">
              Zero-trust architecture.
            </h3>
            <p className="text-[#A9B3C2]">
              Every request is verified. Least-privilege access enforced across all modules and environments. Multi-factor authentication protects against unauthorized access.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-[#38b6ff]">
                <KeyRound className="w-4 h-4" />
                <span>MFA Required</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#38b6ff]">
                <ShieldCheck className="w-4 h-4" />
                <span>RBAC</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
