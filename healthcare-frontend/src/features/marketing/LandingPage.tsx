import React, { useEffect, useRef, useState, Suspense } from 'react';
import { useInView } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Reveal } from '../../lib/motion/Reveal';
import { MagneticButton } from '../../lib/motion/MagneticButton';
import { TiltCard } from '../../lib/motion/TiltCard';
import { Link } from 'react-router-dom';

const HeroCanvas = React.lazy(() => import('./HeroCanvas'));

gsap.registerPlugin(ScrollTrigger);

export const LandingPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const meshRef = useRef<HTMLDivElement>(null);
  const svgLineRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    // Parallax noise background
    if (meshRef.current) {
      gsap.to(meshRef.current, {
        yPercent: 30,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });
    }

    // SVG Drawing Animation
    if (svgLineRef.current) {
      const length = svgLineRef.current.getTotalLength();
      gsap.set(svgLineRef.current, { strokeDasharray: length, strokeDashoffset: length });
      
      gsap.to(svgLineRef.current, {
        strokeDashoffset: 0,
        scrollTrigger: {
          trigger: "#how-it-works",
          start: "top center",
          end: "bottom center",
          scrub: 1
        }
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden">
      {/* Background Mesh */}
      <div 
        ref={meshRef}
        className="absolute inset-0 z-[-1] opacity-5 pointer-events-none"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', height: '150%' }}
      />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-24 pb-12 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center w-full">
          <div className="z-10">
            <Reveal delay={0.2}>
              <div className="inline-block px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-medium text-sm mb-6">
                AI-assisted care coordination
              </div>
            </Reveal>
            <Reveal delay={0.3}>
              <h1 className="text-5xl md:text-7xl font-display font-medium leading-tight mb-6 text-primary tracking-tight" data-cursor="text">
                The future of <span className="font-bold text-accent">patient care</span> is here.
              </h1>
            </Reveal>
            <Reveal delay={0.4}>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Automated Follow-ups</h3>
              <p className="text-slate-600 mb-10 max-w-lg" data-cursor="text">
                WellPoint connects doctors and patients through smart scheduling, AI-powered visit summaries, and automated follow-ups.
              </p>
            </Reveal>
            <Reveal delay={0.5}>
              <div className="flex flex-wrap gap-4">
                <MagneticButton>
                  <Link to="/register" className="px-8 py-4 bg-primary text-white font-medium rounded-full hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 block" data-cursor="hover">
                    Book a demo
                  </Link>
                </MagneticButton>
                <MagneticButton>
                  <a href="#how-it-works" className="px-8 py-4 bg-transparent text-primary font-medium rounded-full hover:bg-slate-100 transition-colors block" data-cursor="hover">
                    See how it works →
                  </a>
                </MagneticButton>
              </div>
            </Reveal>
          </div>
          
          <div className="relative h-[400px] md:h-[600px] w-full flex items-center justify-center">
            <Suspense fallback={<div className="w-full h-full bg-gradient-to-tr from-accent to-blue-500 rounded-full blur-3xl opacity-30" />}>
              <HeroCanvas />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Marquee Section */}
      <section className="py-12 border-y border-slate-200 bg-white overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee hover:[animation-play-state:paused]">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="inline-flex items-center mx-12 opacity-50 grayscale hover:grayscale-0 transition-all cursor-default">
              <span className="font-display font-bold text-2xl text-slate-400">HOSPITAL {i % 5 + 1}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 md:px-12 max-w-7xl mx-auto space-y-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="flex-1 flex flex-col justify-center order-2 md:order-1">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-slate-900 mb-6">AI that works <span className="text-primary italic">for you</span></h2>
            <p className="text-slate-600 text-lg mb-8">Doctors save hours every week. WellPoint’s AI analyzes patient symptoms before they even walk through the door, creating structured clinical notes instantly.</p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-accent" /> AI symptom analysis</li>
              <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-accent" /> Recommended questions</li>
              <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-accent" /> Urgency triage</li>
            </ul>
          </div>
          <div className="order-1 md:order-2 h-[400px]">
            <TiltCard className="w-full h-full bg-slate-100 rounded-3xl border border-slate-200 overflow-hidden shadow-xl p-8 flex flex-col justify-end relative">
               <div className="absolute top-6 left-6 right-6 bottom-16 bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col gap-4">
                  <div className="h-6 w-1/3 bg-slate-100 rounded animate-pulse" />
                  <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
                  <div className="h-4 w-5/6 bg-slate-100 rounded animate-pulse" />
                  <div className="h-24 w-full bg-indigo-50 rounded mt-4 border border-indigo-100 p-4">
                    <div className="h-4 w-1/4 bg-indigo-200 rounded mb-2" />
                    <div className="h-3 w-full bg-indigo-100 rounded" />
                  </div>
               </div>
            </TiltCard>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="h-[400px]">
            <TiltCard className="w-full h-full bg-slate-100 rounded-3xl border border-slate-200 overflow-hidden shadow-xl p-8 flex flex-col justify-end relative">
               <div className="absolute top-6 left-6 right-6 bottom-16 bg-white rounded-xl shadow-sm border border-slate-100 p-6 grid grid-cols-3 gap-4">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className={`rounded-lg ${i%4===0 ? 'bg-red-100' : 'bg-green-100'} h-16 w-full`} />
                  ))}
               </div>
            </TiltCard>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-slate-900 mb-6">Never double-booked</h2>
            <p className="text-slate-600 text-lg mb-8">No more double bookings. WellPoint locks appointment slots the moment a patient starts booking, releasing them safely if they don't finish.</p>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <MagneticButton>
                <Link to="/register" className="inline-flex px-6 py-3 bg-primary text-white font-medium rounded-full hover:bg-primary/90 transition-colors shadow-lg">Try it out</Link>
              </MagneticButton>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-center text-primary mb-24">How it works</h2>
          </Reveal>
          
          <div className="relative">
            {/* SVG Path */}
            <svg className="absolute top-12 left-0 w-full h-[100px] pointer-events-none hidden md:block" preserveAspectRatio="none">
              <path 
                ref={svgLineRef}
                d="M 100,50 C 300,50 400,0 500,50 S 700,50 900,50" 
                fill="none" 
                stroke="#12B7A5" 
                strokeWidth="4" 
                strokeDasharray="1000" 
                className="opacity-50"
              />
            </svg>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              {[
                { step: "1", title: "Book", desc: "Patients easily book available slots online." },
                { step: "2", title: "Analyze", desc: "AI generates pre-visit summaries for doctors." },
                { step: "3", title: "Follow-up", desc: "Automated reminders ensure proper care." }
              ].map((item, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-white shadow-xl flex items-center justify-center text-3xl font-display font-bold text-accent mb-6 border-4 border-slate-50">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-bold text-primary mb-4">{item.title}</h3>
                  <p className="text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter */}
      <StatsCounter />

      {/* Final CTA */}
      <section className="py-32 bg-primary text-center px-6">
        <Reveal>
          <h2 className="text-5xl md:text-7xl font-display font-bold text-white mb-8">Ready to upgrade your clinic?</h2>
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">Join thousands of healthcare professionals providing better, faster, and smarter care.</p>
          <div className="flex justify-center">
            <MagneticButton>
              <Link to="/register" className="px-10 py-5 bg-accent text-white font-medium text-lg rounded-full hover:bg-accent/90 transition-colors shadow-2xl shadow-accent/20 block" data-cursor="hover">
                Get Started — it's free
              </Link>
            </MagneticButton>
          </div>
        </Reveal>
      </section>
    </div>
  );
};

const StatsCounter = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const end = 10;
    const duration = 2000;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      setCount(Math.floor(percentage * end));
      if (progress < duration) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [isInView]);

  return (
    <section ref={ref} className="py-24 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
        <div>
          <div className="text-6xl font-display font-bold text-primary mb-2 tabular-nums">
            {count} min
          </div>
          <div className="text-slate-500 font-medium">Avg. booking time</div>
        </div>
        <div>
          <div className="text-6xl font-display font-bold text-primary mb-2 tabular-nums">
            24/7
          </div>
          <div className="text-slate-500 font-medium">AI triage support</div>
        </div>
        <div>
          <div className="text-6xl font-display font-bold text-primary mb-2 tabular-nums">
            {count * 10}+
          </div>
          <div className="text-slate-500 font-medium">Clinics onboarded</div>
        </div>
      </div>
    </section>
  );
};

export default LandingPage;
