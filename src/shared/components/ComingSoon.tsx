import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export interface ComingSoonHighlight {
  title: string;
  description: string;
  icon: string;
}

export interface ComingSoonFeatureConfig {
  title: string;
  category: string;
  icon: string;
  tagline: string;
  highlights: ComingSoonHighlight[];
}

export interface ComingSoonProps {
  featureName?: string;
  category?: string;
  tagline?: string;
  icon?: string;
  highlights?: ComingSoonHighlight[];
}

const FEATURE_CONFIGS: Record<string, ComingSoonFeatureConfig> = {
  'dsa-problems': {
    title: 'DSA Problems',
    category: 'Algorithms & Data Structures',
    icon: 'fa-solid fa-code',
    tagline: 'We are engineering an upgraded problem-solving suite featuring rich test suites, multi-language execution, and visual editorials.',
    highlights: [
      {
        title: 'Curated 150+ Pattern Sheet',
        description: 'Targeted problems covering Arrays, Two Pointers, Trees, Graphs, and Dynamic Programming with optimal time/space analysis.',
        icon: 'fa-solid fa-list-check',
      },
      {
        title: 'Multi-Language Runner',
        description: 'Clean in-browser code editor with instant testcase feedback supporting Java, C++, Python, and JavaScript.',
        icon: 'fa-solid fa-terminal',
      },
      {
        title: 'Visual Editorial Breakdowns',
        description: 'Step-by-step logic explanations, brute-to-optimal progressions, and company question tags from real campus drives.',
        icon: 'fa-solid fa-lightbulb',
      },
    ],
  },
  'aptitude': {
    title: 'Aptitude',
    category: 'Quantitative Aptitude',
    icon: 'fa-solid fa-calculator',
    tagline: 'Comprehensive quantitative math lessons, shortcut formulas, and timed drill tests designed specifically for placement exams.',
    highlights: [
      {
        title: 'Speed Math & Shortcuts',
        description: 'Formulas and mental math techniques for Percentages, Profit & Loss, Time-Speed-Distance, and Number Theory.',
        icon: 'fa-solid fa-bolt',
      },
      {
        title: 'Timed Assessment Simulator',
        description: 'Practice questions with countdown clocks mirroring actual section test limits of national placement drives.',
        icon: 'fa-solid fa-stopwatch',
      },
      {
        title: 'Company PYQ Drills',
        description: 'Past year assessment patterns and questions from TCS NQT, Infosys, Wipro, Accenture, and Cognizant.',
        icon: 'fa-solid fa-layer-group',
      },
    ],
  },
  'logical': {
    title: 'Logical Reasoning',
    category: 'Analytical & Critical Thinking',
    icon: 'fa-solid fa-brain',
    tagline: 'Puzzles, deductions, seating arrangements, and pattern series to sharpen critical analytical reasoning for screening tests.',
    highlights: [
      {
        title: 'Seating & Puzzle Frameworks',
        description: 'Step-by-step strategies to crack complex linear, circular, and matrix arrangement puzzles quickly.',
        icon: 'fa-solid fa-puzzle-piece',
      },
      {
        title: 'Syllogisms & Deductions',
        description: 'Venn diagram techniques, statement-conclusion validation, and blood relationship tree solving.',
        icon: 'fa-solid fa-diagram-project',
      },
      {
        title: 'Abstract & Visual Series',
        description: 'Pattern completion, coding-decoding drills, and data sufficiency questions commonly tested by recruiters.',
        icon: 'fa-solid fa-shapes',
      },
    ],
  },
  'verbal': {
    title: 'Verbal Ability',
    category: 'English & Communication',
    icon: 'fa-solid fa-comments',
    tagline: 'High-yield placement vocabulary, grammar rules, sentence corrections, and reading comprehension practice.',
    highlights: [
      {
        title: 'Placement Vocabulary Booster',
        description: '500+ most frequently tested recruitment vocabulary words, synonyms, antonyms, and context usage.',
        icon: 'fa-solid fa-spell-check',
      },
      {
        title: 'Sentence Correction & Grammar',
        description: 'Rule-based drills covering subject-verb agreement, modifiers, tenses, and spotting grammatical errors.',
        icon: 'fa-solid fa-pen-nib',
      },
      {
        title: 'Reading Comprehension Drills',
        description: 'Passages calibrated for speed-reading, main idea identification, and accurate critical inferences.',
        icon: 'fa-solid fa-book-open',
      },
    ],
  },
  'interviews': {
    title: 'Interview Questions',
    category: 'Core CS & Technical Rounds',
    icon: 'fa-solid fa-user-tie',
    tagline: 'Frequently asked technical questions covering DBMS, Operating Systems, Computer Networks, OOP, and System Design.',
    highlights: [
      {
        title: 'Core CS Concept Breakdown',
        description: 'In-depth answers for ACID properties, indexing, process vs threads, deadlocks, and TCP/UDP handshakes.',
        icon: 'fa-solid fa-database',
      },
      {
        title: 'System Design Fundamentals',
        description: 'Scalability, load balancing, caching strategies, and distributed database trade-offs explained simply.',
        icon: 'fa-solid fa-network-wired',
      },
      {
        title: 'HR & Behavioral Frameworks',
        description: 'Structured STAR-method responses for scenario questions, project discussions, and leadership queries.',
        icon: 'fa-solid fa-people-arrows',
      },
    ],
  },
  'company-patterns': {
    title: 'Company Exam Patterns',
    category: 'Hiring Workflows & Syllabus',
    icon: 'fa-solid fa-building-circle-check',
    tagline: 'Round-by-round hiring workflows, test syllabus breakdowns, marking schemes, and section cutoffs for top recruiters.',
    highlights: [
      {
        title: 'Latest 2026 Test Blueprints',
        description: 'Exact section counts, question distributions, and time limits for 50+ service and product companies.',
        icon: 'fa-solid fa-clipboard-list',
      },
      {
        title: 'Eligibility & Cutoff Insights',
        description: 'CGPA criteria, negative marking rules, package tier breakdowns, and interview shortlisting thresholds.',
        icon: 'fa-solid fa-chart-pie',
      },
      {
        title: 'Target Company Roadmaps',
        description: 'Direct prep routes linking recruitment patterns to recommended problem sets and assessment practice.',
        icon: 'fa-solid fa-arrow-trend-up',
      },
    ],
  },
  'roadmaps': {
    title: 'Roadmaps',
    category: 'Career Guides & Learning Paths',
    icon: 'fa-solid fa-map-location-dot',
    tagline: 'Interactive step-by-step career roadmaps guiding you from foundational skills to production software engineering.',
    highlights: [
      {
        title: 'Milestone-Based Phased Tracks',
        description: 'Comprehensive roadmaps for Java Backend, Frontend Development, Full-Stack Engineering, and System Design.',
        icon: 'fa-solid fa-route',
      },
      {
        title: 'Curated Resource Recommendations',
        description: 'Verified free documentations, hand-picked books, and top community video tutorials for every topic.',
        icon: 'fa-solid fa-bookmark',
      },
      {
        title: 'Interactive Skill Checklist',
        description: 'Track topics you master, monitor placement readiness, and identify critical knowledge gaps.',
        icon: 'fa-solid fa-circle-check',
      },
    ],
  },
};

export const ComingSoon: React.FC<ComingSoonProps> = ({
  featureName,
  category,
  tagline,
  icon,
  highlights,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [emailInput, setEmailInput] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Auto-detect config from pathname or featureName prop
  const resolveConfig = (): ComingSoonFeatureConfig => {
    if (featureName) {
      const lower = featureName.toLowerCase();
      if (lower.includes('dsa') || lower.includes('problem') || lower.includes('practice')) return FEATURE_CONFIGS['dsa-problems'];
      if (lower.includes('aptitude')) return FEATURE_CONFIGS['aptitude'];
      if (lower.includes('logical')) return FEATURE_CONFIGS['logical'];
      if (lower.includes('verbal')) return FEATURE_CONFIGS['verbal'];
      if (lower.includes('interview')) return FEATURE_CONFIGS['interviews'];
      if (lower.includes('pattern') || lower.includes('company exam')) return FEATURE_CONFIGS['company-patterns'];
      if (lower.includes('roadmap')) return FEATURE_CONFIGS['roadmaps'];
    }

    const path = location.pathname.toLowerCase();
    if (path.includes('practice') || path.includes('problems') || path.includes('dsa-sheet')) return FEATURE_CONFIGS['dsa-problems'];
    if (path.includes('aptitude')) return FEATURE_CONFIGS['aptitude'];
    if (path.includes('logical')) return FEATURE_CONFIGS['logical'];
    if (path.includes('verbal')) return FEATURE_CONFIGS['verbal'];
    if (path.includes('interviews')) return FEATURE_CONFIGS['interviews'];
    if (path.includes('company-patterns')) return FEATURE_CONFIGS['company-patterns'];
    if (path.includes('roadmaps')) return FEATURE_CONFIGS['roadmaps'];

    return {
      title: featureName || 'Feature',
      category: category || 'Upcoming Learning Module',
      icon: icon || 'fa-solid fa-rocket',
      tagline: tagline || 'This feature is currently in active development and will be launching shortly.',
      highlights: highlights || [
        {
          title: 'Curated Learning Curriculum',
          description: 'Placement-focused content structured for high-efficiency learning.',
          icon: 'fa-solid fa-graduation-cap',
        },
        {
          title: 'Interactive Assessments',
          description: 'Hands-on practice problems and instant feedback loops.',
          icon: 'fa-solid fa-code',
        },
        {
          title: 'Company Recruitment Alignment',
          description: 'Aligned directly with latest hiring standards and assessment benchmarks.',
          icon: 'fa-solid fa-building',
        },
      ],
    };
  };

  const config = resolveConfig();
  const activeTitle = featureName || config.title;
  const activeCategory = category || config.category;
  const activeIcon = icon || config.icon;
  const activeTagline = tagline || config.tagline;
  const activeHighlights = highlights || config.highlights;

  useEffect(() => {
    document.title = `${activeTitle} — Coming Soon | Connect 2 Code`;
  }, [activeTitle]);

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setIsSubscribed(true);
    toast.success(`You're on the list! We'll notify you when ${activeTitle} launches.`);
    setEmailInput('');
  };

  return (
    <div className="w-full flex flex-col items-center pb-20 font-sans selection:bg-[#A3E635]/30 selection:text-white">
      
      {/* 1. TOP HERO HEADER */}
      <section className="relative mx-auto mt-12 sm:mt-16 max-w-4xl px-4 text-center flex flex-col items-center">
        
        {/* Animated Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold bg-[#A3E635]/10 text-[#A3E635] border border-[#A3E635]/30 mb-5 shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A3E635] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A3E635]"></span>
          </span>
          <span>UNDER ACTIVE DEVELOPMENT</span>
        </div>

        {/* Dynamic Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight font-heading leading-tight mb-4">
          {activeTitle} <span className="text-[#A3E635]">— Coming Soon</span>
        </h1>

        {/* Tagline */}
        <p className="text-sm sm:text-base text-gray-400 font-sans max-w-2xl leading-relaxed mb-6">
          {activeTagline}
        </p>

        {/* Signature Connect 2 Code Gradient Line */}
        <div className="flex justify-center mb-10">
          <div className="shrink-0 h-0.5 rounded-full w-48 sm:w-64 bg-gradient-to-r from-[#A3E635] via-[#38BDF8] to-[#C084FC]"></div>
        </div>
      </section>

      {/* 2. MAIN PREVIEW CONTAINER */}
      <div className="w-full max-w-4xl px-4 flex flex-col gap-6">
        
        {/* Feature Overview Card */}
        <div className="bg-[#202225] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-[#A3E635]/5 rounded-full blur-3xl pointer-events-none"></div>

          {/* Feature Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#121113] border border-white/10 flex items-center justify-center text-[#A3E635] text-xl shrink-0 shadow-inner">
                <i className={activeIcon}></i>
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400 block mb-0.5">
                  {activeCategory}
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-white font-heading">
                  What we are building in {activeTitle}
                </h2>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">
              <i className="fa-solid fa-clock-rotate-left text-[#38BDF8]"></i>
              <span>Next Release</span>
            </span>
          </div>

          {/* 3 Planned Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {activeHighlights.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-[#121113] border border-white/5 hover:border-[#A3E635]/30 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="w-9 h-9 rounded-lg bg-[#202225] border border-white/10 flex items-center justify-center text-[#A3E635] text-sm mb-3.5 group-hover:scale-105 transition-transform">
                    <i className={item.icon}></i>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1.5 font-heading group-hover:text-[#A3E635] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-400 font-sans leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Development Progress Track */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-gray-400">Development Phase</span>
              <span className="text-[#A3E635] font-semibold">Testing & Integration</span>
            </div>
            <div className="w-full h-2 bg-[#121113] rounded-full overflow-hidden flex p-0.5">
              <div className="bg-gradient-to-r from-[#A3E635] to-[#38BDF8] h-full rounded-full w-3/4 animate-pulse"></div>
            </div>
            <div className="flex justify-between items-center text-[11px] text-gray-500 font-mono mt-2">
              <span className="text-gray-400">Concept & Specs ✓</span>
              <span className="text-gray-400">Curated Datasets ✓</span>
              <span className="text-[#A3E635] font-semibold">Final Integration</span>
              <span>Launch</span>
            </div>
          </div>
        </div>

        {/* 3. EARLY ACCESS / NOTIFY ME & ACTION ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Notification Signup Box */}
          <div className="bg-[#202225] border border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-md">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <i className="fa-regular fa-bell text-[#A3E635] text-sm"></i>
                <h3 className="text-base font-bold text-white font-heading">
                  Get notified when this launches
                </h3>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed mb-4 font-sans">
                Drop your email and we'll ping you the moment {activeTitle} is live on Connect 2 Code.
              </p>
            </div>

            {isSubscribed ? (
              <div className="p-3 bg-[#A3E635]/10 border border-[#A3E635]/30 rounded-xl flex items-center gap-2.5 text-xs text-[#A3E635] font-semibold">
                <i className="fa-solid fa-circle-check text-sm"></i>
                <span>You're on the early access list!</span>
              </div>
            ) : (
              <form onSubmit={handleNotifySubmit} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 bg-[#121113] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#A3E635]/60 transition-colors"
                />
                <button
                  type="submit"
                  className="bg-[#A3E635] hover:bg-[#8ece28] text-black font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
                >
                  Notify Me
                </button>
              </form>
            )}
          </div>

          {/* Quick Navigation to Available Features */}
          <div className="bg-[#202225] border border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-md">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <i className="fa-solid fa-compass text-[#38BDF8] text-sm"></i>
                <h3 className="text-base font-bold text-white font-heading">
                  Explore available features
                </h3>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed mb-4 font-sans">
                In the meantime, you can explore company-specific hiring guides, search recruiter profiles, or manage your personal workspace.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                to="/companies"
                className="inline-flex items-center gap-2 bg-[#A3E635] hover:bg-[#8ece28] text-black font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md"
              >
                <i className="fa-solid fa-building text-xs"></i>
                <span>Explore Companies</span>
              </Link>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 bg-[#121113] hover:bg-white/5 border border-white/10 text-gray-300 hover:text-white text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                <i className="fa-solid fa-arrow-left text-xs"></i>
                <span>Go Back</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default ComingSoon;
