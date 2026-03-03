import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Server, Cloud, Network, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

gsap.registerPlugin(ScrollTrigger);

const deploymentOptions = [
  {
    icon: Server,
    title: 'On-Premises',
    description: 'Run inside your secure facility with full offline control. Complete data sovereignty with air-gapped deployment options.',
    features: ['Air-gapped capable', 'Full data control', 'Custom hardware', 'Offline operation'],
  },
  {
    icon: Cloud,
    title: 'Private Cloud',
    description: 'Managed infrastructure with dedicated tenancy. Scalable resources with maintained security boundaries.',
    features: ['Dedicated tenancy', 'Auto-scaling', '99.99% SLA', 'Global CDN'],
  },
  {
    icon: Network,
    title: 'Hybrid Connect',
    description: 'Link on-prem systems to cloud modules securely. Best of both worlds with seamless integration.',
    features: ['Secure VPN', 'Data sync', 'Edge computing', 'Failover ready'],
  },
];

export default function DeploymentOptions() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.do-heading',
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      gsap.fromTo('.do-card',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
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
    <section id="deployment" ref={sectionRef} className="py-24 bg-[#111827]">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <div className="text-center mb-16">
          <h2 className="do-heading text-4xl md:text-5xl font-bold text-[#F2F5FA] mb-4">
            Deployment that fits your environment.
          </h2>
          <div className="w-24 h-1 bg-[#38b6ff] mx-auto rounded-full" />
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {deploymentOptions.map((option, index) => (
            <Card key={index} className="do-card bg-[#0B0F17] border-[rgba(242,245,250,0.08)] hover:border-[#38b6ff]/30 transition-all duration-300 group">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-xl bg-[#38b6ff]/10 flex items-center justify-center mb-6 group-hover:bg-[#38b6ff]/20 transition-colors">
                  <option.icon className="w-7 h-7 text-[#38b6ff]" />
                </div>
                
                <h3 className="text-xl font-bold text-[#F2F5FA] mb-3">{option.title}</h3>
                <p className="text-[#A9B3C2] mb-6">{option.description}</p>
                
                <ul className="space-y-3">
                  {option.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center gap-3 text-sm text-[#F2F5FA]">
                      <Check className="w-4 h-4 text-[#38b6ff]" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
