import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { closeAuthModal, openAuthModal, logoutUser } from '../../auth/redux/authSlice';
import { Login } from '../../auth/pages/Login';
import { NeetCodeNavbar } from '../../../shared/components/ui/NeetCodeNavbar';
import { Footer } from '../../../shared/components/ui/Footer';
import { toast } from 'react-hot-toast';

export const Landing: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthModalOpen, user } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Logged out successfully');
  };

  // 1. Hero Word Flipping State ('Clear', 'Crack', 'Master', 'Ace')
  const heroWords = ['Clear', 'Crack', 'Master', 'Ace'];
  const [heroWordIndex, setHeroWordIndex] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroWordIndex((prev) => (prev + 1) % heroWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const placementPaths = [
    {
      id: 'aptitude',
      title: 'Aptitude & Verbal Mastery',
      subtitle: 'Build speed and accuracy',
      duration: '4–6 weeks',
      iconClass: 'fa-solid fa-chart-simple text-[#A3E635]',
      badgeBg: 'bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30',
      checkColor: 'text-[#A3E635]',
      btnHover: 'hover:border-[#A3E635] hover:text-[#A3E635]',
      description: 'Master quantitative math, logical reasoning, data interpretation, and verbal comprehension with bite-sized lessons and shortcut tricks.',
      features: [
        'Speed math shortcuts & formulas',
        'Logical reasoning puzzle patterns',
        'Reading comprehension & grammar',
      ],
      link: '/aptitude',
    },
    {
      id: 'coding',
      title: 'DSA & Coding Practice',
      subtitle: 'From basics to interview level',
      duration: '6–8 weeks',
      iconClass: 'fa-solid fa-code text-[#38BDF8]',
      badgeBg: 'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30',
      checkColor: 'text-[#38BDF8]',
      btnHover: 'hover:border-[#38BDF8] hover:text-[#38BDF8]',
      description: 'Solve curated Data Structures & Algorithms problems with visual solution breakdowns, time complexity analysis, and multi-language support.',
      features: [
        'Curated Striver DSA Sheet',
        'Real-time browser code compiler',
        'Topic-wise problem categorization',
      ],
      link: '/dsa-sheet',
    },
    {
      id: 'company',
      title: 'Company Pattern Mocks',
      subtitle: 'Real exam environment',
      duration: '2–3 weeks',
      iconClass: 'fa-solid fa-bookmark text-[#EC4899]',
      badgeBg: 'bg-[#EC4899]/15 text-[#EC4899] border border-[#EC4899]/30',
      checkColor: 'text-[#EC4899]',
      btnHover: 'hover:border-[#EC4899] hover:text-[#EC4899]',
      description: 'Practise full-length mock tests designed to match the exact section timing, question types, and cutoffs of TCS NQT, Infosys, Accenture, Wipro, and Cognizant.',
      features: [
        'Exact section timing & structure',
        'Automated scoring & sectional cutoffs',
        'Detailed weak-area analysis report',
      ],
      link: '/company-patterns',
    },
    {
      id: 'roadmaps',
      title: 'Structured Tech Roadmaps',
      subtitle: 'Clear step-by-step guidance',
      duration: 'Ongoing',
      iconClass: 'fa-solid fa-book-open text-[#EAB308]',
      badgeBg: 'bg-[#EAB308]/15 text-[#EAB308] border border-[#EAB308]/30',
      checkColor: 'text-[#EAB308]',
      btnHover: 'hover:border-[#EAB308] hover:text-[#EAB308]',
      description: 'Follow structured career roadmaps for Software Engineering, Full Stack Development, Data Science, and DevOps with recommended resources.',
      features: [
        'Curated learning milestones',
        'Core CS fundamentals coverage',
        'Project ideas & interview prep tips',
      ],
      link: '/roadmaps',
    },
  ];

  const companyLogos = [
    { name: 'Accenture', src: 'https://files.prepinsta.com/wp-content/uploads/2024/06/accnture.webp' },
    { name: 'Infosys', src: 'https://files.prepinsta.com/wp-content/uploads/2024/06/infosys.webp' },
    { name: 'Google', src: 'https://files.prepinsta.com/wp-content/uploads/2024/06/google.webp' },
    { name: 'Zoho', src: 'https://files.prepinsta.com/wp-content/uploads/2024/06/zoho.webp' },
    { name: 'Bosch', src: 'https://files.prepinsta.com/wp-content/uploads/2024/06/bosch.webp' },
    { name: 'KPMG', src: 'https://files.prepinsta.com/wp-content/uploads/2024/06/kpmg.webp' },
    { name: 'Mindtree', src: 'https://files.prepinsta.com/wp-content/uploads/2024/06/mindtree.webp' },
    { name: 'Persistent', src: 'https://files.prepinsta.com/wp-content/uploads/2024/06/persistent.webp' },
    { name: 'Simplilearn', src: 'https://files.prepinsta.com/wp-content/uploads/2024/06/simlilearn.webp' },
    { name: 'Texas Instruments', src: 'https://files.prepinsta.com/wp-content/uploads/2024/06/texas.webp' },
    { name: 'UpGrad', src: 'https://files.prepinsta.com/wp-content/uploads/2024/06/upgrad.webp' },
    { name: 'Whatfix', src: 'https://files.prepinsta.com/wp-content/uploads/2024/06/whatfix.webp' },
    { name: 'GaragePlug', src: 'https://files.prepinsta.com/wp-content/uploads/2024/06/garageplug.webp' },
  ];

  return (
    <div className="w-full flex flex-col items-center bg-[#090A0C] text-[#f4f4f4] font-sans selection:bg-[#A3E635]/30 selection:text-white overflow-x-hidden min-h-screen">
      {/* 1. Header Navbar */}
      <NeetCodeNavbar user={user} onLogout={handleLogout} />
      
      {/* 2. HERO FOLD WRAPPER - Restored Previous Centered Design */}
      <div className="w-full flex flex-col justify-between min-h-[calc(100vh-90px)] pb-6 pt-2">
        
        {/* CENTERED HERO CONTENT */}
        <section id="companiesshero" className="w-full relative my-auto py-4 sm:py-6">
          <div className="mx-auto max-w-3xl px-5 text-center flex flex-col items-center">
            
            <h1 className="hero-font mx-auto max-w-[15ch] text-[34px] font-extrabold leading-[1.02] tracking-[-.02em] text-white sm:text-[58px] sm:leading-[1] lg:text-[68px] font-heading">
              <span className="block min-h-[1.12em] text-[#A3E635] font-black overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={heroWords[heroWordIndex]}
                    initial={{ y: 32, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -32, opacity: 0 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    className="inline-block min-w-[5ch]"
                  >
                    {heroWords[heroWordIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
              <span className="block hero-campus-placement-text text-white">your campus <span className="hero-placement-word">placement.</span></span>
            </h1>

            <p className="hero-font mx-auto mt-4 max-w-[48ch] text-[14px] font-normal leading-[1.55] text-gray-400 sm:text-[18px] sm:leading-[1.7] font-sans">
              Prepare for campus drives and walk-in drives with topic-wise lessons, coding practice, company-pattern mocks, and a clear weak-area fix plan.
            </p>

            {/* CTA Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:mt-7 w-full sm:w-auto">
              <Link
                to="/company-patterns"
                className="inline-flex min-h-[56px] w-full sm:w-auto items-center justify-center gap-2 rounded-[14px] bg-[#A3E635] hover:bg-[#84CC16] px-8 text-[16px] font-black text-black shadow-[0_7px_0_#65A30D] active:translate-y-1 transition-all cursor-pointer font-sans"
              >
                <span>Explore company patterns</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right" aria-hidden="true">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </Link>

              <button
                type="button"
                onClick={() => dispatch(openAuthModal({ mode: 'signup' }))}
                className="inline-flex min-h-[56px] w-full sm:w-auto items-center justify-center gap-2 rounded-[14px] bg-[#121316] border border-white/15 hover:border-white/30 px-8 text-[16px] font-black text-white shadow-[0_7px_0_#000] active:translate-y-1 transition-all cursor-pointer font-sans"
              >
                <span>Sign up</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right" aria-hidden="true">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </button>
            </div>

          </div>
        </section>

        {/* Continuous Company Logo Marquee Scroller */}
        <div className="w-full max-w-5xl px-4 pt-2 pb-2 mx-auto flex items-center justify-center">
          <div className="relative w-full max-w-full overflow-hidden rounded-xl border border-white/10 bg-[#121316] py-3.5 shadow-md [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
            <div className="myjo-company-chip-marquee flex w-max items-center justify-center gap-5 px-4">
              {/* Set 1 */}
              {companyLogos.map((logo, idx) => (
                <div
                  key={`logo-set1-${idx}`}
                  className="inline-flex h-12 min-w-[120px] items-center justify-center rounded-xl bg-white border border-white/20 px-4 py-2 hover:border-[#A3E635] hover:shadow-[0_0_14px_rgba(163,230,53,0.4)] transition-all shrink-0 shadow-sm"
                >
                  <img
                    src={logo.src}
                    alt={logo.name}
                    className="h-6 sm:h-7 w-auto max-w-[95px] object-contain transition-transform hover:scale-105"
                  />
                </div>
              ))}

              {/* Set 2 Duplicate for continuous infinite marquee */}
              {companyLogos.map((logo, idx) => (
                <div
                  key={`logo-set2-${idx}`}
                  className="inline-flex h-12 min-w-[120px] items-center justify-center rounded-xl bg-white border border-white/20 px-4 py-2 hover:border-[#A3E635] hover:shadow-[0_0_14px_rgba(163,230,53,0.4)] transition-all shrink-0 shadow-sm"
                >
                  <img
                    src={logo.src}
                    alt={logo.name}
                    className="h-6 sm:h-7 w-auto max-w-[95px] object-contain transition-transform hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* 3. SECTION 2: "Pick your placement path." (id="paths") */}
      <section id="paths" className="scroll-mt-24 bg-[#090A0C] w-full pt-20 sm:pt-32 pb-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight font-heading">
              Pick your <span className="text-[#A3E635]">placement path</span>.
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-400 font-sans">
              Start wherever you feel weakest — we'll guide the rest.
            </p>
          </div>

          {/* Mobile Snap Carousel */}
          <div className="-mx-4 lg:hidden">
            <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-3">
              {placementPaths.map((path) => (
                <div key={path.id} className="w-[min(84vw,320px)] shrink-0 snap-center">
                  <div className="flex flex-col overflow-hidden rounded-xl border border-white/10 hover:border-white/30 bg-[#121316] shadow-md p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-[#090A0C] border border-white/10 flex items-center justify-center shrink-0">
                        <i className={`${path.iconClass} text-base`}></i>
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${path.badgeBg}`}>
                          {path.duration}
                        </span>
                        <h3 className="mt-0.5 text-base font-bold text-white font-sans truncate">{path.title}</h3>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 font-sans leading-relaxed min-h-[48px]">
                      {path.description}
                    </p>

                    <ul className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-3 text-xs text-gray-300 font-sans">
                      {path.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <i className={`fa-solid fa-circle-check ${path.checkColor} text-[11px]`}></i>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      to={path.link}
                      className={`mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 ${path.btnHover} text-xs font-bold text-white transition-all cursor-pointer`}
                    >
                      <span>Start path</span>
                      <i className="fa-solid fa-arrow-right text-[10px]"></i>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Grid Layout */}
          <div className="hidden gap-4 lg:grid lg:grid-cols-4">
            {placementPaths.map((path) => (
              <div key={path.id} className="flex flex-col justify-between rounded-xl border border-white/10 hover:border-white/30 bg-[#121316] hover:bg-[#1a1c21] p-5 shadow-md transition-all group">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[#090A0C] border border-white/10 flex items-center justify-center shrink-0">
                      <i className={`${path.iconClass} text-base group-hover:scale-110 transition-transform`}></i>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9.5px] font-bold ${path.badgeBg}`}>
                        {path.duration}
                      </span>
                      <h3 className="mt-0.5 text-base font-bold text-white font-sans leading-tight">{path.title}</h3>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 font-sans leading-relaxed mt-2 min-h-[48px]">
                    {path.description}
                  </p>

                  <ul className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-3 text-xs text-gray-300 font-sans">
                    {path.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <i className={`fa-solid fa-circle-check ${path.checkColor} text-[11px]`}></i>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  to={path.link}
                  className={`mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 ${path.btnHover} text-xs font-bold text-white transition-all cursor-pointer`}
                >
                  <span>Start path</span>
                  <i className="fa-solid fa-arrow-right text-[10px]"></i>
                </Link>
              </div>
            ))}
          </div>

          {/* Bottom 4 Feature Value Props Grid */}
          <div className="mt-8 grid gap-3.5 rounded-xl border border-white/10 bg-[#121316] p-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 p-2">
              <div className="w-10 h-10 rounded-lg bg-[#090A0C] border border-white/10 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-compass text-[#A3E635] text-sm"></i>
              </div>
              <div>
                <p className="text-sm font-bold text-white font-sans">Choose your target</p>
                <p className="text-xs text-gray-400 font-sans">Service &amp; product roles.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2">
              <div className="w-10 h-10 rounded-lg bg-[#090A0C] border border-white/10 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-bullseye text-[#38BDF8] text-sm"></i>
              </div>
              <div>
                <p className="text-sm font-bold text-white font-sans">Know your gaps</p>
                <p className="text-xs text-gray-400 font-sans">See what to fix first.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2">
              <div className="w-10 h-10 rounded-lg bg-[#090A0C] border border-white/10 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-users text-[#A855F7] text-sm"></i>
              </div>
              <div>
                <p className="text-sm font-bold text-white font-sans">Real guidance</p>
                <p className="text-xs text-gray-400 font-sans">Expert placement mentors.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2">
              <div className="w-10 h-10 rounded-lg bg-[#090A0C] border border-white/10 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-award text-[#EAB308] text-sm"></i>
              </div>
              <div>
                <p className="text-sm font-bold text-white font-sans">Stay motivated</p>
                <p className="text-xs text-gray-400 font-sans">Daily progress tracking.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION 3: "WHY Connect 2 Code IS DIFFERENT?" BENTO GRID SECTION (Exact Requested Alignment & Spacing) */}
      <section className="bg-[#090A0C] w-full pt-10 pb-16 border-t border-white/10">
        <div className="relative max-w-7xl px-6 pt-5 pb-10 mx-auto md:px-12 lg:px-24">
          <div className="flex flex-col w-full items-center justify-center text-center">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#A3E635] mb-2 font-mono">
              Real Skills, Real Outcomes
            </h2>
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight font-heading mb-3 text-center">
                Why <span className="text-[#A3E635]">Connect 2 Code</span> <span className="block sm:inline">is different?</span>
              </h2>
              <p className="mt-2 text-gray-400 text-base sm:text-lg font-medium font-sans max-w-2xl mx-auto">
                From topic-wise practice to company-pattern mocks — we teach what actually gets you hired in campus drives.
              </p>
            </div>
          </div>

          <div className="grid h-full w-full rounded-lg mt-12 grid-cols-1 md:grid-cols-3 grid-rows-none md:grid-rows-4 gap-4">
            {/* Card 1 - Action-Oriented Placement Prep (Spans 2 cols, 2 rows) */}
            <div className="md:col-span-2 md:row-span-2 rounded-3xl bg-[#121316] border border-white/10 hover:border-white/30 p-6 sm:p-8 flex flex-col justify-between shadow-md transition-all group">
              <div className="flex items-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check-big text-[#A3E635] w-10 mr-2 shrink-0 group-hover:scale-110 transition-transform">
                  <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
                  <path d="m9 11 3 3L22 4"></path>
                </svg>
                <h3 className="text-xl font-bold text-white font-sans">Action-Oriented Placement Prep</h3>
              </div>
              <p className="text-gray-400 font-sans leading-relaxed text-sm sm:text-base">
                We emphasize doing, not just knowing. Practice full-length company mock tests matching exact section timings and question patterns for TCS NQT, Infosys, Accenture, Wipro, and Cognizant.
              </p>
            </div>

            {/* Card 2 - Curated DSA & Company Sheets (Spans 1 col, 2 rows) */}
            <div className="md:row-span-2 rounded-3xl bg-[#121316] border border-white/10 hover:border-white/30 p-6 sm:p-8 flex flex-col justify-between shadow-md transition-all group">
              <div className="flex items-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text text-[#38BDF8] w-10 mr-2 shrink-0 group-hover:scale-110 transition-transform">
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                  <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                  <path d="M10 9H8"></path>
                  <path d="M16 13H8"></path>
                  <path d="M16 17H8"></path>
                </svg>
                <h3 className="text-xl font-bold text-white font-sans">Curated DSA &amp; Company Sheets</h3>
              </div>
              <p className="text-gray-400 font-sans leading-relaxed text-sm">
                Access topic-wise problem sets, speed math shortcuts, and company-wise previous year question archives curated for engineering campus drives.
              </p>
            </div>

            {/* Card 3 - Weak-Area Fix & Analytics (Spans 1 col, 2 rows) */}
            <div className="md:row-span-2 rounded-3xl bg-[#121316] border border-white/10 hover:border-white/30 p-6 sm:p-8 flex flex-col justify-between shadow-md transition-all group">
              <div className="flex items-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-compass text-[#A855F7] w-10 mr-2 shrink-0 group-hover:scale-110 transition-transform">
                  <path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"></path>
                  <circle cx="12" cy="12" r="10"></circle>
                </svg>
                <h3 className="text-xl font-bold text-white font-sans">Weak-Area Fix &amp; Analytics</h3>
              </div>
              <p className="text-gray-400 font-sans leading-relaxed text-sm">
                Our performance analytics identifies your weak section immediately — whether Aptitude, Logical, Verbal, or Coding — and gives you a clear repair plan.
              </p>
            </div>

            {/* Card 4 - Real-Time Code Execution & Analytics (Spans 1 col, 2 rows) */}
            <div className="md:row-span-2 rounded-3xl bg-[#121316] border border-white/10 hover:border-white/30 p-6 sm:p-8 flex flex-col justify-between shadow-md transition-all group">
              <div className="flex items-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up text-[#EAB308] w-10 mr-2 shrink-0 group-hover:scale-110 transition-transform">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                  <polyline points="16 7 22 7 22 13"></polyline>
                </svg>
                <h3 className="text-xl font-bold text-white font-sans">Real-Time Code Compiler</h3>
              </div>
              <p className="text-gray-400 font-sans leading-relaxed text-sm">
                Run code directly in your browser with instant test-case feedback, solution breakdowns, and score tracking across all campus modules.
              </p>
            </div>

            {/* Card 5 - Structured Roadmaps & Strategies (Spans 1 col, 2 rows) */}
            <div className="md:row-span-2 rounded-3xl bg-[#121316] border border-white/10 hover:border-white/30 p-6 sm:p-8 flex flex-col justify-between shadow-md transition-all group">
              <div className="flex items-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users text-[#3B82F6] w-10 mr-2 shrink-0 group-hover:scale-110 transition-transform">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <h3 className="text-xl font-bold text-white font-sans">Structured Roadmaps &amp; Strategies</h3>
              </div>
              <p className="text-gray-400 font-sans leading-relaxed text-sm">
                Learn step-by-step from beginner to placement ready. Our structured guidance ensures you focus on what actually gets asked on drive day.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECTION 4: "Students understand what to fix next." TESTIMONIALS (id="stories") */}
      <section className="scroll-mt-24 bg-[#090A0C] w-full py-12 md:py-16 border-t border-white/10" id="stories">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight font-heading mb-2">
            Students understand <span className="text-[#A3E635]">what to fix next.</span>
          </h2>
          <p className="mx-auto mt-2 max-w-[38ch] text-sm text-gray-400 font-sans mb-10">
            No big claims. Just clearer prep after every attempt.
          </p>

          {/* Continuous Infinite Testimonials Marquee */}
          <div className="relative overflow-hidden rounded-2xl py-2 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
            <div className="myjo-testimonial-marquee flex w-max items-stretch gap-4 px-1">
              <div className="w-[268px] shrink-0 rounded-xl border border-white/10 bg-[#121316] p-4 text-left shadow-md">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className="relative grid shrink-0 place-items-center overflow-hidden rounded-full font-bold text-black" style={{ width: '48px', height: '48px', backgroundColor: '#A3E635' }}>
                      <span className="text-base">R</span>
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white font-sans">Riya S.</p>
                    <p className="truncate text-xs text-gray-400 font-sans">TCS NQT</p>
                  </div>
                </div>
                <p className="mt-3 text-xs font-medium italic leading-relaxed text-gray-300 font-sans">“Finding out my aptitude section score gap early helped me focus on what actually mattered for TCS NQT.”</p>
              </div>

              <div className="w-[268px] shrink-0 rounded-xl border border-white/10 bg-[#121316] p-4 text-left shadow-md">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className="relative grid shrink-0 place-items-center overflow-hidden rounded-full font-bold text-black" style={{ width: '48px', height: '48px', backgroundColor: '#38BDF8' }}>
                      <span className="text-base">A</span>
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white font-sans">Ananya S.</p>
                    <p className="truncate text-xs text-gray-400 font-sans">Infosys</p>
                  </div>
                </div>
                <p className="mt-3 text-xs font-medium italic leading-relaxed text-gray-300 font-sans">“The Infosys technical &amp; coding pattern questions were spot on. The step-by-step solution breakdowns helped immensely.”</p>
              </div>

              <div className="w-[268px] shrink-0 rounded-xl border border-white/10 bg-[#121316] p-4 text-left shadow-md">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className="relative grid shrink-0 place-items-center overflow-hidden rounded-full font-bold text-white" style={{ width: '48px', height: '48px', backgroundColor: '#EC4899' }}>
                      <span className="text-base">R</span>
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white font-sans">Rahul V.</p>
                    <p className="truncate text-xs text-gray-400 font-sans">Accenture &amp; Cognizant</p>
                  </div>
                </div>
                <p className="mt-3 text-xs font-medium italic leading-relaxed text-gray-300 font-sans">“Practiced Aptitude shortcuts and DSA Sheet daily. Cracked Accenture ASE and Cognizant GenC back to back.”</p>
              </div>

              <div className="w-[268px] shrink-0 rounded-xl border border-white/10 bg-[#121316] p-4 text-left shadow-md">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className="relative grid shrink-0 place-items-center overflow-hidden rounded-full font-bold text-black" style={{ width: '48px', height: '48px', backgroundColor: '#EAB308' }}>
                      <span className="text-base">K</span>
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white font-sans">Karan P.</p>
                    <p className="truncate text-xs text-gray-400 font-sans">Wipro</p>
                  </div>
                </div>
                <p className="mt-3 text-xs font-medium italic leading-relaxed text-gray-300 font-sans">“Short lessons plus practice felt easier than watching long videos.”</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <Footer />

      {/* Floating Auth Modal Overlay */}
      {isAuthModalOpen && (
        <Login onCloseModal={() => dispatch(closeAuthModal())} />
      )}
    </div>
  );
};
