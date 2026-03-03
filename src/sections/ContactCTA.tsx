import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Send, Download, Shield, Mail, User, Building, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

gsap.registerPlugin(ScrollTrigger);

export default function ContactCTA() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    email: '',
    message: '',
  });

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.cta-left',
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.7,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      gsap.fromTo('.cta-form',
        { opacity: 0, x: 30, scale: 0.99 },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.7,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 65%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }
    toast.success('Inquiry sent successfully! We will respond within 2 business days.');
    setFormData({ name: '', organization: '', email: '', message: '' });
  };

  return (
    <section id="contact" ref={sectionRef} className="py-24 bg-[#0B0F17]">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Content */}
          <div className="cta-left space-y-8">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-[#F2F5FA] mb-4">
                Ready to deploy?
              </h2>
              <p className="text-lg text-[#A9B3C2]">
                Tell us what you are building. We will respond within two business days.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#38b6ff]/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-[#38b6ff]" />
                </div>
                <div>
                  <p className="text-[#F2F5FA] font-medium">Security cleared team</p>
                  <p className="text-sm text-[#A9B3C2]">All personnel hold appropriate clearances</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#38b6ff]/10 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-[#38b6ff]" />
                </div>
                <div>
                  <p className="text-[#F2F5FA] font-medium">Secure communications</p>
                  <p className="text-sm text-[#A9B3C2]">Encrypted email and messaging</p>
                </div>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="border-[rgba(242,245,250,0.12)] text-[#F2F5FA] hover:bg-[rgba(242,245,250,0.05)]"
              onClick={() => toast.info('Download started...')}
            >
              <Download className="w-4 h-4 mr-2" />
              Download overview (PDF)
            </Button>
          </div>

          {/* Right Form */}
          <Card className="cta-form bg-[#111827] border-[rgba(242,245,250,0.08)]">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-sm text-[#A9B3C2] mb-2 block">Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9B3C2]" />
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="pl-10 bg-[#0B0F17] border-[rgba(242,245,250,0.12)] text-[#F2F5FA]"
                      placeholder="Your full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-[#A9B3C2] mb-2 block">Organization</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9B3C2]" />
                    <Input
                      value={formData.organization}
                      onChange={(e) => setFormData({...formData, organization: e.target.value})}
                      className="pl-10 bg-[#0B0F17] border-[rgba(242,245,250,0.12)] text-[#F2F5FA]"
                      placeholder="Your organization"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-[#A9B3C2] mb-2 block">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9B3C2]" />
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="pl-10 bg-[#0B0F17] border-[rgba(242,245,250,0.12)] text-[#F2F5FA]"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-[#A9B3C2] mb-2 block">Message *</label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-[#A9B3C2]" />
                    <Textarea
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="pl-10 bg-[#0B0F17] border-[rgba(242,245,250,0.12)] text-[#F2F5FA] min-h-[120px]"
                      placeholder="Tell us about your project..."
                    />
                  </div>
                </div>

                <Button 
                  type="submit"
                  className="w-full bg-[#38b6ff] text-[#0B0F17] hover:bg-[#38b6ff]/90 font-semibold py-6"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send inquiry
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-[rgba(242,245,250,0.08)]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-[#38b6ff]/40">
                <img src="/images/ddse_logo.jpeg" alt="DDSE Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-lg font-bold text-[#F2F5FA]">DDSE</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[#A9B3C2]">
              <a href="#" className="hover:text-[#F2F5FA] transition-colors">Privacy</a>
              <a href="#" className="hover:text-[#F2F5FA] transition-colors">Security</a>
              <a href="#" className="hover:text-[#F2F5FA] transition-colors">Support</a>
            </div>
            <p className="text-sm text-[#A9B3C2]">
              © 2024 DDSE. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
