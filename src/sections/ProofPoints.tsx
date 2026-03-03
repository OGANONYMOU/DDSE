import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Activity, Zap, ShieldCheck, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { icon: Activity, value: '99.99%', label: 'Uptime', sublabel: 'SLA-backed availability' },
  { icon: Zap, value: '<150ms', label: 'Latency', sublabel: 'Field-to-screen delivery' },
  { icon: ShieldCheck, value: 'SOC 2', label: 'Type II', sublabel: 'Audited controls' },
];

const testimonials = [
  {
    quote: "DDSE reduced our coordination overhead significantly—without adding complexity. The interface is intuitive and our teams adapted quickly.",
    author: 'Program Lead',
    role: 'Directorate of Operations',
  },
  {
    quote: "The clean UI means less training time and fewer mistakes under pressure. It's exactly what we needed for our command center.",
    author: 'Operations Officer',
    role: 'Strategic Command',
  },
];

export default function ProofPoints() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.pp-stat',
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      gsap.fromTo('.pp-testimonial',
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.15,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 60%',
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
        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mb-20">
          {stats.map((stat, index) => (
            <div key={index} className="pp-stat text-center">
              <div className="w-12 h-12 rounded-xl bg-[#38b6ff]/10 flex items-center justify-center mx-auto mb-4">
                <stat.icon className="w-6 h-6 text-[#38b6ff]" />
              </div>
              <p className="text-3xl md:text-4xl font-bold text-[#F2F5FA] mb-1">{stat.value}</p>
              <p className="text-sm text-[#A9B3C2]">{stat.label}</p>
              <p className="text-xs text-[#A9B3C2]/70">{stat.sublabel}</p>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="pp-testimonial bg-[#111827] border-[rgba(242,245,250,0.08)]">
              <CardContent className="p-8">
                <Quote className="w-8 h-8 text-[#38b6ff]/50 mb-4" />
                <p className="text-lg text-[#F2F5FA] mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#38b6ff]/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-[#38b6ff]">
                      {testimonial.author.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#F2F5FA]">{testimonial.author}</p>
                    <p className="text-xs text-[#A9B3C2]">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
