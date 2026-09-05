import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { toggleBookmarkItem, fetchBookmarks } from '../../bookmarks/redux/bookmarkSlice';
import { openAuthModal } from '../../auth/redux/authSlice';
import { toast } from 'react-hot-toast';

interface SheetProblem {
  id: string;
  title: string;
  slug: string;
  difficulty: 'Basic' | 'Easy' | 'Medium' | 'Hard';
  companies: string[];
}

interface DsaModule {
  num: string;
  title: string;
  topic: string;
  questions: SheetProblem[];
}

// 1. Service-Based Companies Track (TCS, Infosys, Wipro, Accenture, Cognizant, Capgemini)
const serviceBasedModules: DsaModule[] = [
  {
    num: '01',
    title: 'Basics & Number Theory',
    topic: 'Number Theory',
    questions: [
      { id: 'sb-1', title: 'Reverse a Number', slug: 'reverse-integer', difficulty: 'Basic', companies: ['TCS', 'Infosys'] },
      { id: 'sb-2', title: 'Check if a Number is Prime', slug: 'check-prime', difficulty: 'Basic', companies: ['Wipro', 'Accenture'] },
      { id: 'sb-3', title: 'Greatest Common Divisor (GCD/HCF)', slug: 'find-gcd', difficulty: 'Basic', companies: ['Cognizant', 'TCS'] },
      { id: 'sb-4', title: 'Fibonacci Number Series', slug: 'fibonacci-number', difficulty: 'Easy', companies: ['Infosys', 'Capgemini'] },
      { id: 'sb-5', title: 'Armstrong Number Check', slug: 'armstrong-number', difficulty: 'Basic', companies: ['Accenture', 'Wipro'] },
    ],
  },
  {
    num: '02',
    title: 'Array Fundamentals',
    topic: 'Arrays',
    questions: [
      { id: 'sb-6', title: 'Find Second Largest Element in an Array', slug: 'second-largest', difficulty: 'Easy', companies: ['TCS', 'Accenture'] },
      { id: 'sb-7', title: 'Check if Array is Sorted', slug: 'check-if-array-is-sorted', difficulty: 'Basic', companies: ['Infosys', 'Wipro'] },
      { id: 'sb-8', title: 'Remove Duplicates from Sorted Array', slug: 'remove-duplicates-from-sorted-array', difficulty: 'Easy', companies: ['TCS', 'Cognizant'] },
      { id: 'sb-9', title: 'Left Rotate Array by One Position', slug: 'rotate-array-by-one', difficulty: 'Basic', companies: ['Capgemini', 'Accenture'] },
      { id: 'sb-10', title: 'Move Zeroes to End of Array', slug: 'move-zeroes', difficulty: 'Easy', companies: ['Infosys', 'TCS'] },
    ],
  },
  {
    num: '03',
    title: 'String Manipulation & Parsing',
    topic: 'Strings',
    questions: [
      { id: 'sb-11', title: 'Check Palindrome String', slug: 'valid-palindrome', difficulty: 'Basic', companies: ['TCS', 'Wipro'] },
      { id: 'sb-12', title: 'Reverse a String', slug: 'reverse-string', difficulty: 'Basic', companies: ['Infosys', 'Accenture'] },
      { id: 'sb-13', title: 'Valid Anagram Check', slug: 'valid-anagram', difficulty: 'Easy', companies: ['Cognizant', 'TCS'] },
      { id: 'sb-14', title: 'Count Vowels and Consonants', slug: 'count-vowels-consonants', difficulty: 'Basic', companies: ['Capgemini', 'Wipro'] },
      { id: 'sb-15', title: 'Longest Common Prefix', slug: 'longest-common-prefix', difficulty: 'Easy', companies: ['Accenture', 'Infosys'] },
    ],
  },
  {
    num: '04',
    title: 'Searching & Sorting Algorithms',
    topic: 'Sorting',
    questions: [
      { id: 'sb-16', title: 'Binary Search Implementation', slug: 'binary-search', difficulty: 'Easy', companies: ['TCS', 'Infosys'] },
      { id: 'sb-17', title: 'Bubble Sort & Selection Sort', slug: 'bubble-selection-sort', difficulty: 'Basic', companies: ['Wipro', 'Capgemini'] },
      { id: 'sb-18', title: 'Insertion Sort', slug: 'insertion-sort', difficulty: 'Easy', companies: ['Accenture', 'TCS'] },
      { id: 'sb-19', title: 'Find First and Last Position in Sorted Array', slug: 'find-first-and-last-position', difficulty: 'Medium', companies: ['Cognizant', 'Infosys'] },
    ],
  },
  {
    num: '05',
    title: 'Two Pointers & Hashing Basics',
    topic: 'Hashing',
    questions: [
      { id: 'sb-20', title: 'Two Sum - Pair with Target Sum', slug: 'two-sum', difficulty: 'Easy', companies: ['TCS', 'Accenture', 'Infosys'] },
      { id: 'sb-21', title: 'Find Missing Number in Array', slug: 'missing-number', difficulty: 'Easy', companies: ['Wipro', 'Cognizant'] },
      { id: 'sb-22', title: 'Single Number in Array', slug: 'single-number', difficulty: 'Easy', companies: ['Infosys', 'Capgemini'] },
      { id: 'sb-23', title: 'Intersection of Two Arrays', slug: 'intersection-of-two-arrays', difficulty: 'Easy', companies: ['TCS', 'Accenture'] },
    ],
  },
  {
    num: '06',
    title: 'Linked List Fundamentals',
    topic: 'Linked List',
    questions: [
      { id: 'sb-24', title: 'Reverse a Linked List', slug: 'reverse-linked-list', difficulty: 'Easy', companies: ['TCS', 'Infosys'] },
      { id: 'sb-25', title: 'Middle of the Linked List', slug: 'middle-of-the-linked-list', difficulty: 'Easy', companies: ['Accenture', 'Cognizant'] },
      { id: 'sb-26', title: 'Detect Loop / Cycle in Linked List', slug: 'linked-list-cycle', difficulty: 'Easy', companies: ['Wipro', 'TCS'] },
      { id: 'sb-27', title: 'Merge Two Sorted Linked Lists', slug: 'merge-two-sorted-lists', difficulty: 'Easy', companies: ['Infosys', 'Capgemini'] },
    ],
  },
  {
    num: '07',
    title: 'Stack & Queue Basics',
    topic: 'Stack',
    questions: [
      { id: 'sb-28', title: 'Valid Parentheses String', slug: 'valid-parentheses', difficulty: 'Easy', companies: ['TCS', 'Infosys', 'Accenture'] },
      { id: 'sb-29', title: 'Implement Queue using Stacks', slug: 'implement-queue-using-stacks', difficulty: 'Easy', companies: ['Cognizant', 'Wipro'] },
      { id: 'sb-30', title: 'Next Greater Element I', slug: 'next-greater-element-i', difficulty: 'Medium', companies: ['Accenture', 'Infosys'] },
    ],
  },
  {
    num: '08',
    title: 'Binary Tree Essentials',
    topic: 'Trees',
    questions: [
      { id: 'sb-31', title: 'Binary Tree Inorder, Preorder, Postorder Traversals', slug: 'binary-tree-traversals', difficulty: 'Easy', companies: ['TCS', 'Infosys'] },
      { id: 'sb-32', title: 'Maximum Depth of Binary Tree', slug: 'maximum-depth-of-binary-tree', difficulty: 'Easy', companies: ['Accenture', 'Capgemini'] },
      { id: 'sb-33', title: 'Check if Two Binary Trees are Identical', slug: 'same-tree', difficulty: 'Easy', companies: ['Wipro', 'Cognizant'] },
    ],
  },
];

// 2. Product-Based Companies Track (Amazon, Google, Microsoft, Meta, Uber, Adobe)
const productBasedModules: DsaModule[] = [
  {
    num: '01',
    title: 'Arrays & Advanced Hashing',
    topic: 'Arrays',
    questions: [
      { id: 'pb-1', title: 'Group Anagrams', slug: 'group-anagrams', difficulty: 'Medium', companies: ['Amazon', 'Microsoft'] },
      { id: 'pb-2', title: 'Top K Frequent Elements', slug: 'top-k-frequent-elements', difficulty: 'Medium', companies: ['Google', 'Amazon'] },
      { id: 'pb-3', title: 'Product of Array Except Self', slug: 'product-of-array-except-self', difficulty: 'Medium', companies: ['Amazon', 'Meta'] },
      { id: 'pb-4', title: 'Longest Consecutive Sequence', slug: 'longest-consecutive-sequence', difficulty: 'Medium', companies: ['Google', 'Microsoft'] },
    ],
  },
  {
    num: '02',
    title: 'Two Pointers Technique',
    topic: 'Two Pointers',
    questions: [
      { id: 'pb-5', title: '3Sum - Triplets Sum to Zero', slug: '3sum', difficulty: 'Medium', companies: ['Amazon', 'Google', 'Meta'] },
      { id: 'pb-6', title: 'Container With Most Water', slug: 'container-with-most-water', difficulty: 'Medium', companies: ['Amazon', 'Google'] },
      { id: 'pb-7', title: 'Trapping Rain Water', slug: 'trapping-rain-water', difficulty: 'Hard', companies: ['Google', 'Amazon', 'Microsoft'] },
    ],
  },
  {
    num: '03',
    title: 'Sliding Window Patterns',
    topic: 'Sliding Window',
    questions: [
      { id: 'pb-8', title: 'Best Time to Buy and Sell Stock', slug: 'best-time-to-buy-and-sell-stock', difficulty: 'Easy', companies: ['Amazon', 'Microsoft'] },
      { id: 'pb-9', title: 'Longest Substring Without Repeating Characters', slug: 'longest-substring-without-repeating-characters', difficulty: 'Medium', companies: ['Amazon', 'Google'] },
      { id: 'pb-10', title: 'Minimum Window Substring', slug: 'minimum-window-substring', difficulty: 'Hard', companies: ['Meta', 'Uber', 'Google'] },
    ],
  },
  {
    num: '04',
    title: 'Binary Search & Answers Range',
    topic: 'Binary Search',
    questions: [
      { id: 'pb-11', title: 'Search in Rotated Sorted Array', slug: 'search-in-rotated-sorted-array', difficulty: 'Medium', companies: ['Google', 'Microsoft'] },
      { id: 'pb-12', title: 'Find Minimum in Rotated Sorted Array', slug: 'find-minimum-in-rotated-sorted-array', difficulty: 'Medium', companies: ['Amazon', 'Microsoft'] },
      { id: 'pb-13', title: 'Koko Eating Bananas', slug: 'koko-eating-bananas', difficulty: 'Medium', companies: ['Google', 'Amazon'] },
      { id: 'pb-14', title: 'Median of Two Sorted Arrays', slug: 'median-of-two-sorted-arrays', difficulty: 'Hard', companies: ['Google', 'Amazon', 'Microsoft'] },
    ],
  },
  {
    num: '05',
    title: 'Fast-Slow Pointers & Linked Lists',
    topic: 'Linked List',
    questions: [
      { id: 'pb-15', title: 'Reorder List', slug: 'reorder-list', difficulty: 'Medium', companies: ['Amazon', 'Meta'] },
      { id: 'pb-16', title: 'Remove Nth Node From End of List', slug: 'remove-nth-node-from-end-of-list', difficulty: 'Medium', companies: ['Microsoft', 'Amazon'] },
      { id: 'pb-17', title: 'Merge K Sorted Lists', slug: 'merge-k-sorted-lists', difficulty: 'Hard', companies: ['Amazon', 'Google', 'Meta'] },
      { id: 'pb-18', title: 'LRU Cache Design', slug: 'lru-cache', difficulty: 'Medium', companies: ['Amazon', 'Google', 'Microsoft'] },
    ],
  },
  {
    num: '06',
    title: 'Trees & Binary Search Trees',
    topic: 'Trees',
    questions: [
      { id: 'pb-19', title: 'Lowest Common Ancestor of a Binary Search Tree', slug: 'lowest-common-ancestor-of-a-binary-search-tree', difficulty: 'Medium', companies: ['Amazon', 'Microsoft'] },
      { id: 'pb-20', title: 'Binary Tree Level Order Traversal', slug: 'binary-tree-level-order-traversal', difficulty: 'Medium', companies: ['Amazon', 'Meta'] },
      { id: 'pb-21', title: 'Validate Binary Search Tree', slug: 'validate-binary-search-tree', difficulty: 'Medium', companies: ['Amazon', 'Google'] },
      { id: 'pb-22', title: 'Binary Tree Maximum Path Sum', slug: 'binary-tree-maximum-path-sum', difficulty: 'Hard', companies: ['Google', 'Meta', 'Microsoft'] },
    ],
  },
  {
    num: '07',
    title: 'Heaps & Priority Queues',
    topic: 'Heap',
    questions: [
      { id: 'pb-23', title: 'Kth Largest Element in an Array', slug: 'kth-largest-element-in-an-array', difficulty: 'Medium', companies: ['Amazon', 'Meta'] },
      { id: 'pb-24', title: 'Task Scheduler', slug: 'task-scheduler', difficulty: 'Medium', companies: ['Google', 'Microsoft'] },
      { id: 'pb-25', title: 'Find Median from Data Stream', slug: 'find-median-from-data-stream', difficulty: 'Hard', companies: ['Amazon', 'Google'] },
    ],
  },
  {
    num: '08',
    title: 'Graphs (BFS, DFS & Topological Sort)',
    topic: 'Graphs',
    questions: [
      { id: 'pb-26', title: 'Number of Islands', slug: 'number-of-islands', difficulty: 'Medium', companies: ['Amazon', 'Google', 'Microsoft'] },
      { id: 'pb-27', title: 'Clone Graph', slug: 'clone-graph', difficulty: 'Medium', companies: ['Meta', 'Amazon'] },
      { id: 'pb-28', title: 'Course Schedule (Cycle Detection in DAG)', slug: 'course-schedule', difficulty: 'Medium', companies: ['Amazon', 'Google'] },
      { id: 'pb-29', title: 'Word Ladder', slug: 'word-ladder', difficulty: 'Hard', companies: ['Amazon', 'Google'] },
    ],
  },
  {
    num: '09',
    title: 'Dynamic Programming (1D & 2D)',
    topic: 'Dynamic Programming',
    questions: [
      { id: 'pb-30', title: 'Climbing Stairs', slug: 'climbing-stairs', difficulty: 'Easy', companies: ['Amazon', 'Google'] },
      { id: 'pb-31', title: 'Coin Change Problem', slug: 'coin-change', difficulty: 'Medium', companies: ['Amazon', 'Microsoft'] },
      { id: 'pb-32', title: 'Longest Increasing Subsequence', slug: 'longest-increasing-subsequence', difficulty: 'Medium', companies: ['Google', 'Microsoft'] },
      { id: 'pb-33', title: 'Edit Distance', slug: 'edit-distance', difficulty: 'Hard', companies: ['Google', 'Amazon'] },
    ],
  },
];

export const ProblemList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { bookmarks } = useAppSelector((state) => state.bookmarks);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Active track state: 'service' or 'product'
  const [sheetType, setSheetType] = useState<'service' | 'product'>('service');
  const [expandedModuleNum, setExpandedModuleNum] = useState<string | null>('01');

  // Solved state stored in localStorage (no questions API)
  const [solvedMap, setSolvedMap] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('c2c_dsa_sheet_solved');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchBookmarks());
    }
  }, [dispatch, isAuthenticated]);

  const handleSolveToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSolvedMap((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('c2c_dsa_sheet_solved', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    toast.success('Problem solved status updated');
  };

  const handleBookmarkToggle = (q: SheetProblem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please log in to bookmark questions');
      dispatch(openAuthModal({ mode: 'login' }));
      return;
    }
    dispatch(
      toggleBookmarkItem({
        itemId: q.id,
        type: 'PROBLEM',
        title: q.title,
        difficulty: q.difficulty,
        category: 'DSA',
      })
    );
    toast.success('Bookmark updated');
  };

  const currentModules = sheetType === 'service' ? serviceBasedModules : productBasedModules;

  // Global counts for active sheet
  const totalQuestionsCount = currentModules.reduce((acc, m) => acc + m.questions.length, 0);
  const solvedQuestionsCount = currentModules.reduce(
    (acc, m) => acc + m.questions.filter((q) => !!solvedMap[q.id]).length,
    0
  );
  const overallProgressPercent = Math.round((solvedQuestionsCount / (totalQuestionsCount || 1)) * 100);

  return (
    <div className="w-full flex flex-col items-center pb-20 font-sans">
      {/* Hero Header Section */}
      <section id="dsaHero" className="relative mx-auto mt-16 max-w-7xl px-6 text-center md:px-8 flex flex-col items-center">
        <h1 className="animate-fade-in -translate-y-4 text-balance whitespace-nowrap bg-gradient-to-br from-white from-30% to-white/40 bg-clip-text py-6 text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-medium leading-none tracking-tighter text-transparent opacity-100 font-heading">
          Ultimate DSA Sheet
        </h1>
        <p className="animate-fade-in mb-6 -translate-y-4 text-balance text-lg tracking-tight text-gray-400 opacity-100 md:text-xl font-sans">
          Curated coding interview preparation tracks for placement success
        </p>
        <div className="flex justify-center mb-6">
          <div className="shrink-0 bg-white/10 h-0.5 rounded-lg w-60 bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#C084FC]"></div>
        </div>

        {/* Track Selection Tabs: Service Based and Product Based */}
        <div className="flex items-center justify-center gap-2 bg-[#202225] p-1.5 rounded-xl border border-white/10 shadow-md mt-2">
          <button
            onClick={() => {
              setSheetType('service');
              setExpandedModuleNum('01');
            }}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              sheetType === 'service'
                ? 'bg-[#A3E635] text-black shadow-sm font-extrabold'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <i className="fa-solid fa-building-user text-xs"></i>
            <span>Service Based</span>
          </button>
          <button
            onClick={() => {
              setSheetType('product');
              setExpandedModuleNum('01');
            }}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              sheetType === 'product'
                ? 'bg-[#A3E635] text-black shadow-sm font-extrabold'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <i className="fa-solid fa-gem text-xs"></i>
            <span>Product Based</span>
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center gap-3 mt-6 text-xs text-gray-300 font-sans">
          <span className="bg-[#202225] px-3.5 py-1.5 rounded-lg border border-white/10">
            Track Progress:{' '}
            <strong className="text-[#A3E635] font-bold">
              {solvedQuestionsCount} / {totalQuestionsCount} Solved
            </strong>{' '}
            ({overallProgressPercent}%)
          </span>
        </div>
      </section>

      {/* Module Accordion List */}
      <div className="flex flex-col gap-3.5 max-w-5xl w-full mt-10 px-4">
        {currentModules.map((module) => {
          const isExpanded = expandedModuleNum === module.num;
          const solvedInModule = module.questions.filter((q) => !!solvedMap[q.id]).length;
          const progressPercent = Math.round((solvedInModule / (module.questions.length || 1)) * 100);

          return (
            <div
              key={module.num}
              className={`w-full rounded-lg transition-all duration-200 shadow-md border overflow-hidden ${
                isExpanded
                  ? 'bg-[#2f3136] border-white/40 ring-1 ring-white/20'
                  : 'bg-[#202225] hover:bg-[#2f3136] border-white/10 hover:border-white/30'
              }`}
            >
              {/* Module Header */}
              <div
                onClick={() => setExpandedModuleNum(isExpanded ? null : module.num)}
                className="group flex items-center justify-between p-5 cursor-pointer select-none"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-lg bg-[#121113] border border-white/10 flex items-center justify-center shrink-0">
                    <span className="text-base font-mono font-bold text-white">
                      {module.num}
                    </span>
                  </div>

                  <div className="flex flex-col min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-white font-heading tracking-tight group-hover:text-white transition-colors truncate">
                      {module.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="w-32 h-1.5 bg-[#121113] rounded-full overflow-hidden border border-white/5">
                        <div
                          className="h-full bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#C084FC] rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent || (isExpanded ? 100 : 0)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-mono text-gray-400 font-sans">
                        {solvedInModule} / {module.questions.length} Solved ({progressPercent}%)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-400 hidden sm:inline-block bg-[#121113] px-3 py-1 rounded-lg border border-white/5">
                    {module.questions.length} Questions
                  </span>
                  <i
                    className={`fa-solid fa-chevron-down text-xs text-gray-400 group-hover:text-white transition-transform duration-300 ${
                      isExpanded ? 'rotate-180 text-white' : ''
                    }`}
                  ></i>
                </div>
              </div>

              {/* Module Questions List */}
              {isExpanded && (
                <div className="border-t border-white/10 bg-[#17191c] p-5 flex flex-col gap-3 animate-fade-in">
                  <div className="flex items-center justify-between pb-2 text-xs font-mono font-semibold text-gray-400 uppercase tracking-wider">
                    <span>{module.title} Questions ({module.questions.length})</span>
                    <span>Status &amp; Action</span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {module.questions.map((q) => {
                      const isSolved = !!solvedMap[q.id];
                      const isBookmarked = bookmarks.some((b) => b.itemId === q.id);

                      return (
                        <div
                          key={q.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-[#202225] hover:bg-[#2f3136] border border-white/10 hover:border-white/30 rounded-lg transition-all gap-3 shadow-sm"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Tick / Untick Circle Button */}
                            <button
                              onClick={(e) => handleSolveToggle(q.id, e)}
                              className={`text-lg transition-colors shrink-0 cursor-pointer ${
                                isSolved ? 'text-[#A3E635]' : 'text-gray-600 hover:text-gray-400'
                              }`}
                              title={isSolved ? 'Mark as Not Answered' : 'Mark as Answered'}
                            >
                              <i className={`fa-solid ${isSolved ? 'fa-circle-check' : 'fa-circle'}`}></i>
                            </button>

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

                            <div className="flex flex-col truncate">
                              <Link
                                to={`/problems/${q.slug}`}
                                className="text-sm sm:text-base font-semibold text-white hover:text-gray-200 transition-colors truncate font-sans tracking-tight"
                              >
                                {q.title}
                              </Link>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span
                                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                                    q.difficulty === 'Basic' || q.difficulty === 'Easy'
                                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                      : q.difficulty === 'Hard'
                                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                  }`}
                                >
                                  {q.difficulty}
                                </span>

                                {q.companies && q.companies.length > 0 && (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {q.companies.map((comp: string, idx: number) => (
                                      <span
                                        key={`${comp}-${idx}`}
                                        className="text-[10px] font-sans font-medium text-gray-300 bg-[#121113] px-2 py-0.5 rounded-md border border-white/10 flex items-center gap-1 shadow-xs"
                                      >
                                        <i className="fa-solid fa-building text-[9px] text-[#A3E635]"></i>
                                        <span>{comp}</span>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <Link
                            to={`/problems/${q.slug}`}
                            className="shrink-0 px-4 py-2 text-xs font-semibold bg-[#A3E635] hover:bg-[#84CC16] text-black font-extrabold rounded-lg transition-all border border-[#A3E635]/50 flex items-center justify-center gap-1.5 font-sans shadow-md"
                          >
                            <span>Solve Problem</span>
                            <i className="fa-solid fa-arrow-right text-[10px]"></i>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
