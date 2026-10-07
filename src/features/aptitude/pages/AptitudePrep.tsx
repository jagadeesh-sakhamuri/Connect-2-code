import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { toggleBookmarkItem, fetchBookmarks } from '../../bookmarks/redux/bookmarkSlice';
import { toast } from 'react-hot-toast';

export interface AptitudeQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  companies: string[];
}

export interface AptitudeTopic {
  id: string;
  title: string;
  totalQuestions: number;
  solvedCount: number;
  icon: string;
  description: string;
  questions: AptitudeQuestion[];
}

export interface AptitudeCategory {
  id: 'quants' | 'logical' | 'verbal';
  name: string;
  icon: string;
  description: string;
  topics: AptitudeTopic[];
}

const aptitudeCategoriesData: AptitudeCategory[] = [
  {
    id: 'quants',
    name: 'Quantitative Aptitude',
    icon: 'fa-solid fa-calculator',
    description: 'Number System, Percentages, Time & Work, Speed, Distance & Profit/Loss.',
    topics: [
      {
        id: 'num-sys',
        title: 'Number System & HCF/LCM',
        totalQuestions: 15,
        solvedCount: 3,
        icon: 'fa-solid fa-arrow-down-1-9',
        description: 'Divisibility rules, remainders, trailing zeroes, and HCF/LCM properties.',
        questions: [
          {
            id: 'q-num-1',
            question: 'What is the unit digit of (7^95 - 3^58)?',
            options: ['0', '4', '6', '7'],
            correctAnswer: '4',
            explanation: '7^95 = (7^4)^23 * 7^3 = (1)^23 * 343 -> Unit digit 3. 3^58 = (3^4)^14 * 3^2 = (1)^14 * 9 -> Unit digit 9. Unit digit of (13 - 9) = 4.',
            difficulty: 'Medium',
            companies: ['TCS', 'Infosys', 'Wipro'],
          },
          {
            id: 'q-num-2',
            question: 'Find the greatest number which divides 62, 132 and 237 leaving the same remainder in each case.',
            options: ['35', '31', '25', '15'],
            correctAnswer: '35',
            explanation: 'Required number = HCF of (132-62), (237-132), (237-62) = HCF of (70, 105, 175) = 35.',
            difficulty: 'Easy',
            companies: ['Accenture', 'Cognizant'],
          },
          {
            id: 'q-num-3',
            question: 'How many trailing zeroes are present in the product 100! (100 factorial)?',
            options: ['20', '24', '25', '28'],
            correctAnswer: '24',
            explanation: 'Number of zeroes = [100/5] + [100/25] = 20 + 4 = 24.',
            difficulty: 'Hard',
            companies: ['Amazon', 'Google', 'TCS Prime'],
          },
        ],
      },
      {
        id: 'percent-pl',
        title: 'Percentages & Profit/Loss',
        totalQuestions: 20,
        solvedCount: 5,
        icon: 'fa-solid fa-percent',
        description: 'Successive percentage changes, cost price, selling price, and discount calculations.',
        questions: [
          {
            id: 'q-pl-1',
            question: 'A shopkeeper marks an item 20% above CP and offers 10% discount. Find profit percentage.',
            options: ['8%', '10%', '12%', '15%'],
            correctAnswer: '8%',
            explanation: 'Let CP = 100. MP = 120. SP = 120 - (10% of 120) = 108. Profit = SP - CP = 8%.',
            difficulty: 'Easy',
            companies: ['Capgemini', 'TCS', 'Amazon'],
          },
          {
            id: 'q-pl-2',
            question: 'If population increases by 10% in 1st year and decreases by 10% in 2nd year, net percentage change is:',
            options: ['0%', '1% increase', '1% decrease', '2% decrease'],
            correctAnswer: '1% decrease',
            explanation: 'Net change = a + b + (ab/100) = 10 - 10 - (100/100) = -1% (1% decrease).',
            difficulty: 'Easy',
            companies: ['Wipro', 'Infosys'],
          },
        ],
      },
      {
        id: 'time-work',
        title: 'Time & Work',
        totalQuestions: 18,
        solvedCount: 4,
        icon: 'fa-solid fa-clock',
        description: 'Man-hours equivalence, efficiency ratios, alternate day work, and pipe cisterns.',
        questions: [
          {
            id: 'q-tw-1',
            question: 'A can complete a work in 10 days and B in 15 days. Working together, they finish in:',
            options: ['5 days', '6 days', '7.5 days', '8 days'],
            correctAnswer: '6 days',
            explanation: 'Combined rate = (1/10) + (1/15) = (3+2)/30 = 5/30 = 1/6. Total time = 6 days.',
            difficulty: 'Easy',
            companies: ['TCS', 'Cognizant', 'Capgemini'],
          },
        ],
      },
      {
        id: 'speed-dist',
        title: 'Speed, Distance & Trains',
        totalQuestions: 16,
        solvedCount: 2,
        icon: 'fa-solid fa-train',
        description: 'Relative speed, train crossing platforms, boats & streams, and average speed.',
        questions: [
          {
            id: 'q-sd-1',
            question: 'A train 150m long passes a pole in 15 seconds. Speed of the train in km/h is:',
            options: ['30 km/h', '36 km/h', '45 km/h', '50 km/h'],
            correctAnswer: '36 km/h',
            explanation: 'Speed = 150 / 15 = 10 m/s. Converting to km/h = 10 * (18 / 5) = 36 km/h.',
            difficulty: 'Easy',
            companies: ['Infosys', 'Wipro', 'HCL'],
          },
        ],
      },
      {
        id: 'perm-prob',
        title: 'Permutations & Probability',
        totalQuestions: 14,
        solvedCount: 1,
        icon: 'fa-solid fa-dice-five',
        description: 'Combinations, arrangements with repetitions, conditional probability, and dice rolls.',
        questions: [
          {
            id: 'q-pb-1',
            question: 'In how many different ways can the letters of the word LEADER be arranged?',
            options: ['360', '720', '180', '120'],
            correctAnswer: '360',
            explanation: 'LEADER has 6 letters with "E" repeating twice. Total arrangements = 6! / 2! = 720 / 2 = 360.',
            difficulty: 'Medium',
            companies: ['Amazon', 'Adobe', 'TCS'],
          },
        ],
      },
    ],
  },
  {
    id: 'logical',
    name: 'Logical Reasoning',
    icon: 'fa-solid fa-brain',
    description: 'Blood Relations, Syllogisms, Coding-Decoding, Seating Arrangements, & Series.',
    topics: [
      {
        id: 'blood-rel',
        title: 'Blood Relations',
        totalQuestions: 12,
        solvedCount: 4,
        icon: 'fa-solid fa-people-group',
        description: 'Family tree diagrams, coded relationships, and pointing-to-photograph puzzles.',
        questions: [
          {
            id: 'q-br-1',
            question: 'Pointing to a photograph, Ramesh said "She is the daughter of my grandfather\'s only son." How is the girl related to Ramesh?',
            options: ['Sister', 'Mother', 'Cousin', 'Aunt'],
            correctAnswer: 'Sister',
            explanation: 'Ramesh\'s grandfather\'s only son = Ramesh\'s father. Daughter of Ramesh\'s father = Ramesh\'s sister.',
            difficulty: 'Easy',
            companies: ['TCS', 'Infosys', 'Capgemini'],
          },
        ],
      },
      {
        id: 'coding-dec',
        title: 'Coding-Decoding',
        totalQuestions: 15,
        solvedCount: 6,
        icon: 'fa-solid fa-code',
        description: 'Letter shift codes, number coding, matrix coding, and sentence deciphering.',
        questions: [
          {
            id: 'q-cd-1',
            question: 'If MONKEY is coded as XDJMNL, how is TIGER coded in that language?',
            options: ['QDFHS', 'SDFHS', 'SHFDQ', 'UJHFS'],
            correctAnswer: 'QDFHS',
            explanation: 'Pattern: Each letter is reversed and shifted back by 1 (Y - 1 = X, E - 1 = D...). TIGER reversed = REGIT -> Shift back by 1 = QDFHS.',
            difficulty: 'Medium',
            companies: ['Accenture', 'Cognizant'],
          },
        ],
      },
      {
        id: 'seating-arr',
        title: 'Seating Arrangement',
        totalQuestions: 18,
        solvedCount: 2,
        icon: 'fa-solid fa-chair',
        description: 'Linear arrangements, circular facing inside/outside, and rectangular table puzzles.',
        questions: [
          {
            id: 'q-sa-1',
            question: 'Five friends A, B, C, D, E are sitting in a row facing North. C is sitting next to A and D. B is next to E. Who is in the middle?',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 'C',
            explanation: 'Arrangement from left to right: E - B - D - C - A. C is in the exact middle position.',
            difficulty: 'Medium',
            companies: ['Amazon', 'TCS Prime'],
          },
        ],
      },
      {
        id: 'syllogism',
        title: 'Syllogisms & Venn Diagrams',
        totalQuestions: 14,
        solvedCount: 3,
        icon: 'fa-solid fa-diagram-next',
        description: 'All, Some, No statement conclusions, possibilities, and Venn overlapping sets.',
        questions: [
          {
            id: 'q-syl-1',
            question: 'Statements: All cats are dogs. All dogs are birds. Conclusion I: All cats are birds.',
            options: ['Conclusion I follows', 'Only II follows', 'Neither follows', 'Both follow'],
            correctAnswer: 'Conclusion I follows',
            explanation: 'Cats subset of Dogs, Dogs subset of Birds => Cats is entirely contained inside Birds. Conclusion I holds true.',
            difficulty: 'Easy',
            companies: ['Wipro', 'Capgemini'],
          },
        ],
      },
    ],
  },
  {
    id: 'verbal',
    name: 'Verbal Ability',
    icon: 'fa-solid fa-book-open',
    description: 'Reading Comprehension, Grammar, Synonyms, Para Jumbles, & Sentence Correction.',
    topics: [
      {
        id: 'grammar-corr',
        title: 'Sentence Correction & Grammar',
        totalQuestions: 16,
        solvedCount: 5,
        icon: 'fa-solid fa-pen-nib',
        description: 'Subject-verb agreement, modifiers, tense consistency, and preposition errors.',
        questions: [
          {
            id: 'q-gc-1',
            question: 'Find the error: "Neither of the two candidates (A) / have paid (B) / their subscription fee. (C) / No error (D)"',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 'B',
            explanation: '"Neither of" takes a singular verb. "have paid" should be replaced with "has paid".',
            difficulty: 'Easy',
            companies: ['TCS', 'Infosys', 'Accenture'],
          },
        ],
      },
      {
        id: 'reading-comp',
        title: 'Reading Comprehension',
        totalQuestions: 10,
        solvedCount: 2,
        icon: 'fa-solid fa-file-contract',
        description: 'Passage central idea, tone detection, inference questions, and vocabulary in context.',
        questions: [
          {
            id: 'q-rc-1',
            question: 'What is the primary tone of an author criticizing corporate environmental policies with data?',
            options: ['Analytical & Critical', 'Humorous', 'Optimistic', 'Nostalgic'],
            correctAnswer: 'Analytical & Critical',
            explanation: 'Using empirical data to evaluate and point out shortcomings reflects an analytical and critical tone.',
            difficulty: 'Medium',
            companies: ['Cognizant', 'Capgemini'],
          },
        ],
      },
      {
        id: 'syn-ant',
        title: 'Synonyms & Antonyms',
        totalQuestions: 22,
        solvedCount: 8,
        icon: 'fa-solid fa-spell-check',
        description: 'High-frequency GRE/Campus placement vocabulary words and context usage.',
        questions: [
          {
            id: 'q-syn-1',
            question: 'Select the synonym for the word: METICULOUS',
            options: ['Careful & Detailed', 'Careless', 'Hasty', 'Lazy'],
            correctAnswer: 'Careful & Detailed',
            explanation: 'Meticulous means showing great attention to detail; extremely careful and precise.',
            difficulty: 'Easy',
            companies: ['TCS', 'Wipro', 'HCL'],
          },
        ],
      },
    ],
  },
];

interface AptitudePrepProps {
  defaultCategory?: 'quants' | 'logical' | 'verbal';
}

export const AptitudePrep: React.FC<AptitudePrepProps> = ({ defaultCategory = 'quants' }) => {
  const dispatch = useAppDispatch();
  const { bookmarks } = useAppSelector((state) => state.bookmarks);

  const [selectedCatId, setSelectedCatId] = useState<'quants' | 'logical' | 'verbal'>(defaultCategory);
  
  const activeCategory = aptitudeCategoriesData.find((c) => c.id === selectedCatId) || aptitudeCategoriesData[0];
  const [selectedTopicId, setSelectedTopicId] = useState<string>(activeCategory.topics[0]?.id || 'num-sys');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const questionsPerPage = 5;

  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showSolution, setShowSolution] = useState<Record<string, boolean>>({});

  useEffect(() => {
    dispatch(fetchBookmarks());
  }, [dispatch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCatId, selectedTopicId, difficultyFilter, searchQuery]);

  const activeTopic = activeCategory.topics.find((t) => t.id === selectedTopicId) || activeCategory.topics[0];

  const handleCategoryChange = (catId: 'quants' | 'logical' | 'verbal') => {
    setSelectedCatId(catId);
    const cat = aptitudeCategoriesData.find((c) => c.id === catId);
    if (cat && cat.topics.length > 0) {
      setSelectedTopicId(cat.topics[0].id);
    }
  };

  const handleSelectOption = (questionId: string, option: string) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleBookmarkToggle = (q: AptitudeQuestion, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(
      toggleBookmarkItem({
        itemId: q.id,
        type: 'APTITUDE',
        title: q.question,
        difficulty: q.difficulty,
        category: activeCategory.name,
      })
    );
    toast.success('Bookmark updated');
  };

  const toggleSolution = (questionId: string) => {
    setShowSolution((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const filteredQuestions = activeTopic.questions.filter((q) => {
    const matchesSearch =
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.companies.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDiff = difficultyFilter === 'All' || q.difficulty === difficultyFilter;
    return matchesSearch && matchesDiff;
  });

  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage) || 1;
  const paginatedQuestions = filteredQuestions.slice(
    (currentPage - 1) * questionsPerPage,
    currentPage * questionsPerPage
  );

  return (
    <div className="w-full flex flex-col items-center pb-24 font-sans text-gray-200">
      {/* BeyondBasics Hero Header Section - Exactly Matching Companies Page */}
      <section className="relative mx-auto mt-16 max-w-7xl px-6 text-center md:px-8 flex flex-col items-center">
        <h1 className="animate-fade-in -translate-y-4 text-balance whitespace-nowrap bg-gradient-to-br from-white from-30% to-white/40 bg-clip-text py-6 text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-medium leading-none tracking-tighter text-transparent opacity-100 font-heading">
          Campus Aptitude Prep
        </h1>
        <p className="animate-fade-in mb-6 -translate-y-4 text-balance text-lg tracking-tight text-gray-400 opacity-100 md:text-xl font-sans">
          Master Quants, Logical Reasoning, and Verbal Ability for placement tests
        </p>
        <div className="flex justify-center mb-8">
          <div className="shrink-0 bg-white/10 h-0.5 rounded-lg w-60 bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#C084FC]"></div>
        </div>

        {/* Global Category Switcher Tabs - Company Card Hover Design */}
        <div className="flex items-center justify-center gap-3 bg-[#202225] p-2 rounded-lg border border-white/10 shadow-md">
          {aptitudeCategoriesData.map((cat) => {
            const isCatSelected = selectedCatId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-lg font-bold text-xs sm:text-sm font-sans tracking-tight transition-all cursor-pointer ${
                  isCatSelected
                    ? 'bg-[#A3E635] text-black shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <i className={`${cat.icon} text-sm`}></i>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Core Skills Layout: Left Sidebar + Right Main Workspace */}
      <div className="w-full max-w-7xl mt-10 px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT SIDEBAR NAVIGATION: Topic Modules Menu */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-[#202225] border border-white/10 rounded-lg p-5 shadow-md flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                {activeCategory.name} Modules
              </span>
              <span className="text-[11px] font-mono text-gray-300 bg-[#121113] px-2.5 py-0.5 rounded border border-white/5 font-semibold">
                {activeCategory.topics.length} Topics
              </span>
            </div>

            {/* List of Topic Links - Company Card Hover Design */}
            <div className="flex flex-col gap-2 mt-1">
              {activeCategory.topics.map((t) => {
                const isSelected = selectedTopicId === t.id;

                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTopicId(t.id)}
                    className={`group flex items-center justify-between p-3.5 rounded-lg border text-left transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-[#2f3136] border-white/30 text-white shadow-md border-l-4 border-l-white'
                        : 'bg-[#202225] hover:bg-[#2f3136] border-white/10 hover:border-white/30 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${isSelected ? 'bg-white/10 border-white/30 text-white' : 'bg-[#121113] border-white/10 text-gray-400'}`}>
                        <i className={`${t.icon} text-xs`}></i>
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-white font-sans tracking-tight truncate">
                        {t.title}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-gray-400 shrink-0 bg-[#121113] px-2 py-0.5 rounded border border-white/5">
                      {t.questions.length} Qs
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT MAIN WORKSPACE: Active Topic Questions & Filters */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          
          {/* Header Card for Selected Topic */}
          <div className="bg-[#202225] border border-white/10 rounded-lg p-6 shadow-md flex flex-col gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white font-heading tracking-tight">
                {activeTopic.title}
              </h2>
              <p className="text-xs text-gray-400 font-sans tracking-tight mt-1">
                {activeTopic.description}
              </p>
            </div>

            {/* Filter & Search Bar Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10">
              
              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-500"></i>
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#121113] border border-white/10 focus:border-white/30 text-xs text-white placeholder-gray-500 pl-9 pr-4 py-2 rounded-lg outline-none transition-all font-sans"
                />
              </div>

              {/* Difficulty Filter Buttons */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                {(['All', 'Easy', 'Medium', 'Hard'] as const).map((diff) => {
                  const isDiffActive = difficultyFilter === diff;
                  return (
                    <button
                      key={diff}
                      onClick={() => setDifficultyFilter(diff)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border cursor-pointer ${
                        isDiffActive
                          ? 'bg-white/15 text-white border-white/30 shadow-sm'
                          : 'bg-[#121113] text-gray-400 border-white/10 hover:text-white'
                      }`}
                    >
                      {diff}
                    </button>
                  );
                })}
              </div>

            </div>
          </div>

          {/* Question Practice Items Table / Cards Grid */}
          <div className="flex flex-col gap-3.5">
            {filteredQuestions.length === 0 ? (
              <div className="p-12 text-center bg-[#202225] border border-white/10 rounded-lg text-gray-400 font-sans text-sm">
                No questions found matching your search or difficulty filter.
              </div>
            ) : (
              paginatedQuestions.map((q, idx) => {
                const globalQNum = (currentPage - 1) * questionsPerPage + idx + 1;
                const userOpt = userAnswers[q.id];
                const isSolutionRevealed = showSolution[q.id];
                const isCorrect = userOpt === q.correctAnswer;
                const isBookmarked = bookmarks.some((b) => b.itemId === q.id);

                return (
                  <div
                    key={q.id}
                    className="p-5 bg-[#202225] hover:bg-[#2f3136] border border-white/10 hover:border-white/30 rounded-lg flex flex-col gap-4 shadow-md transition-all"
                  >
                    {/* Header Row: Q Index, Statement, Bookmark & Difficulty */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Bookmark Star Button */}
                        <button
                          onClick={(e) => handleBookmarkToggle(q, e)}
                          className={`p-1.5 rounded-md border transition-all text-xs shrink-0 cursor-pointer ${
                            isBookmarked
                              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                              : 'bg-[#121113] border-white/10 text-gray-500 hover:text-amber-400 hover:border-amber-400/40'
                          }`}
                          title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Question'}
                        >
                          <i className={`fa-${isBookmarked ? 'solid' : 'regular'} fa-star`}></i>
                        </button>

                        <div className="flex items-start gap-2 min-w-0">
                          <span className="text-base font-bold text-white shrink-0 font-mono">
                            Q{globalQNum}.
                          </span>
                          <h3 className="text-base font-semibold text-white font-sans tracking-tight leading-relaxed">
                            {q.question}
                          </h3>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-md shrink-0 ${
                          q.difficulty === 'Easy'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : q.difficulty === 'Medium'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {q.difficulty}
                      </span>
                    </div>

                    {/* Multiple Choice Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-1">
                      {q.options.map((opt) => {
                        const isSelected = userOpt === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => handleSelectOption(q.id, opt)}
                            className={`p-3 text-xs sm:text-sm text-left rounded-lg border transition-all flex items-center justify-between font-sans cursor-pointer ${
                              isSelected
                                ? isCorrect
                                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-semibold'
                                  : 'bg-rose-500/15 border-rose-500/50 text-rose-300 font-semibold'
                                : 'bg-[#121113] border-white/10 text-gray-300 hover:border-white/30 hover:text-white'
                            }`}
                          >
                            <span>{opt}</span>
                            {isSelected && (
                              isCorrect ? (
                                <i className="fa-solid fa-circle-check text-emerald-400 text-sm"></i>
                              ) : (
                                <i className="fa-solid fa-circle-xmark text-rose-400 text-sm"></i>
                              )
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Footer Row: Company Badges + Solution Reveal Toggle */}
                    <div className="pt-3 border-t border-white/10 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        {q.companies.map((comp) => (
                          <span key={comp} className="text-[10px] font-mono text-gray-400 bg-[#121113] px-2 py-0.5 rounded border border-white/5">
                            {comp}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => toggleSolution(q.id)}
                        className="inline-flex items-center gap-2 text-xs text-gray-200 hover:text-white hover:underline font-mono font-semibold cursor-pointer"
                      >
                        <i className="fa-solid fa-lightbulb"></i>
                        <span>{isSolutionRevealed ? 'Hide Explanation' : 'View Step-by-Step Solution'}</span>
                        <i className={`fa-solid ${isSolutionRevealed ? 'fa-chevron-up' : 'fa-chevron-down'} text-[9px]`}></i>
                      </button>
                    </div>

                    {/* Step-by-Step Explanation Drawer */}
                    {isSolutionRevealed && (
                      <div className="p-4 bg-[#121113] border border-white/20 rounded-lg text-xs sm:text-sm font-sans text-gray-300 leading-relaxed animate-fade-in">
                        <span className="text-white font-bold font-mono block mb-1">
                          Correct Answer: {q.correctAnswer}
                        </span>
                        <p>{q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Pagination Controls */}
            {filteredQuestions.length > questionsPerPage && (
              <div className="mt-4 flex items-center justify-between px-4 py-3 bg-[#202225] border border-white/10 rounded-lg text-xs text-gray-300 shadow-md">
                <div>
                  Showing Page <span className="font-bold text-[#A3E635]">{currentPage}</span> of{' '}
                  <span className="font-bold text-white">{totalPages}</span> ({filteredQuestions.length} Total Questions)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-white/10 bg-[#121113] hover:bg-white/10 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer font-sans"
                  >
                    <i className="fa-solid fa-chevron-left text-[10px]"></i>
                    <span>Previous</span>
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-white/10 bg-[#121113] hover:bg-white/10 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer font-sans"
                  >
                    <span>Next</span>
                    <i className="fa-solid fa-chevron-right text-[10px]"></i>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
