import React, { useState, useEffect, useCallback } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminTable, Column } from '../components/AdminTable';
import { AdminBadge } from '../components/AdminBadge';
import { AdminCard } from '../components/AdminCard';
import { AdminErrorState } from '../components/AdminErrorState';
import { QuestionFormModal, QuestionFormData } from '../components/questions/QuestionFormModal';
import { QuestionDetailsModal } from '../components/questions/QuestionDetailsModal';
import { TestCaseModal } from '../components/questions/TestCaseModal';
import { QuestionPayload, QuestionTestCase } from '../../../services/questionService';
import { adminQuestionService } from '../../../services/admin/adminQuestionService';
import { adminCompanyService } from '../../../services/admin/adminCompanyService';
import { referenceService, ReferenceItem } from '../../../services/referenceService';
import { toast } from 'react-hot-toast';

export const AdminQuestions: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionPayload[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [pageNumber, setPageNumber] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Filter States
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Reference Library & Companies Data for Filters
  const [difficulties, setDifficulties] = useState<ReferenceItem[]>([]);
  const [topics, setTopics] = useState<ReferenceItem[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);

  // Modals State
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [isTestCaseOpen, setIsTestCaseOpen] = useState<boolean>(false);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionPayload | null>(null);
  const [targetQuestionForTestCases, setTargetQuestionForTestCases] = useState<{ id: number | string; title?: string } | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // State to track if question was saved but test cases failed during retry flow
  const [createdQuestionIdForRetry, setCreatedQuestionIdForRetry] = useState<number | string | null>(null);

  // Load Filter References and Companies from Backend API
  useEffect(() => {
    const fetchFilterReferences = async () => {
      try {
        const [diffRes, topicRes, compRes] = await Promise.all([
          referenceService.getByGroupCode('DIFF'),
          referenceService.getByGroupCode('TOPIC'),
          adminCompanyService.getCompanies(),
        ]);
        const diffList = diffRes?.data || (Array.isArray(diffRes) ? diffRes : []);
        const topicList = topicRes?.data || (Array.isArray(topicRes) ? topicRes : []);
        const compList = compRes?.data || (Array.isArray(compRes) ? compRes : []);
        setDifficulties(Array.isArray(diffList) ? diffList : []);
        setTopics(Array.isArray(topicList) ? topicList : []);
        setCompanies(Array.isArray(compList) ? compList : []);
      } catch (err) {
        console.warn('Failed to load filter reference data:', err);
      }
    };
    fetchFilterReferences();
  }, []);

  /**
   * REAL API ONLY — POST /api/v1/questions
   * Fetches paginated questions from Java Spring Boot Backend.
   */
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const levelArr: number[] | null = selectedDifficulty && !isNaN(Number(selectedDifficulty)) ? [Number(selectedDifficulty)] : null;
      const topicArr: number[] | null = selectedTopic && !isNaN(Number(selectedTopic)) ? [Number(selectedTopic)] : null;
      const compArr: number[] | null = selectedCompany && !isNaN(Number(selectedCompany)) ? [Number(selectedCompany)] : null;

      const res = await adminQuestionService.getQuestions({
        level: levelArr,
        companies: compArr,
        topic: topicArr,
        searchText: searchTerm.trim() ? searchTerm.trim() : null,
        pageRequest: {
          pageNumber,
          pageSize,
          sortBy: 'id',
          sortDirection: 'ASC',
        },
      });

      const rawData = res?.data?.data || res?.data || res;
      const contentList = Array.isArray(rawData?.content)
        ? rawData.content
        : Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.data)
        ? rawData.data
        : [];

      const total = typeof rawData?.totalElements === 'number'
        ? rawData.totalElements
        : typeof rawData?.total === 'number'
        ? rawData.total
        : contentList.length;

      const computedPages = typeof rawData?.totalPages === 'number' && rawData.totalPages > 0
        ? rawData.totalPages
        : Math.ceil(total / pageSize) || 1;

      setQuestions(contentList);
      setTotalPages(computedPages);
      setTotalElements(total);
    } catch (err: any) {
      const msg = err?.message || (err?.errors && err?.errors[0]) || 'Failed to fetch questions list from backend API';
      setError(msg);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [pageNumber, pageSize, selectedDifficulty, selectedTopic, selectedCompany, searchTerm]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDifficulty(e.target.value);
    setPageNumber(0);
  };

  const handleTopicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTopic(e.target.value);
    setPageNumber(0);
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCompany(e.target.value);
    setPageNumber(0);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPageNumber(0);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPageNumber(0);
  };

  const handleInspect = async (id: string | number) => {
    setDetailsLoading(true);
    setIsDetailsOpen(true);
    try {
      const res = await adminQuestionService.getQuestionById(id);
      const questionData = res?.data || (res?.id ? res : null);
      if (questionData) {
        setSelectedQuestion(questionData);
      } else {
        setSelectedQuestion(null);
        toast.error('Question details not found on backend server');
      }
    } catch (err: any) {
      setSelectedQuestion(null);
      toast.error(err?.message || 'Failed to fetch question details from backend');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleEditClick = async (item: QuestionPayload) => {
    if (!item.id) return;
    try {
      const res = await adminQuestionService.getQuestionById(item.id);
      const questionData = res?.data || (res?.id ? res : null);
      if (questionData) {
        setSelectedQuestion(questionData);
        setCreatedQuestionIdForRetry(null);
        setIsFormOpen(true);
      } else {
        toast.error('Unable to retrieve full question data for editing');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error retrieving question for editing');
    }
  };

  const handleCreateClick = () => {
    setSelectedQuestion(null);
    setCreatedQuestionIdForRetry(null);
    setIsFormOpen(true);
  };

  const handleOpenTestCasesForQuestion = (item: QuestionPayload) => {
    if (!item.id) return;
    setTargetQuestionForTestCases({ id: item.id, title: item.title });
    setIsTestCaseOpen(true);
  };

  /**
   * SINGLE MODAL CREATION WORKFLOW:
   * 1. POST /api/v1/question
   * 2. Extract generatedQuestionId
   * 3. POST /api/v1/question/{generatedId}/testCases
   * 4. Close single popup modal only after both succeed!
   */
  const handleSaveQuestion = async (formData: QuestionFormData) => {
    setSubmitting(true);
    try {
      const isOwn = formData.isOwnProblem === true;
      const isNewQuestion = !formData.id;

      // STEP 1: Construct Question Payload
      const payload: QuestionPayload = {
        id: formData.id ?? null,
        title: formData.title,
        description: formData.description,
        constraints: formData.constraints || '',
        difficultyRefGroupCode: formData.difficultyRefGroupCode || 'DIFF',
        difficultyRefCode: formData.difficultyRefCode || 'EASY',
        difficultyRefName: formData.difficultyRefName || 'Easy',
        topicRefGroupCode: formData.topicRefGroupCode || 'TOPIC',
        topicRefCode: formData.topicRefCode || 'ARRAY',
        topicRefName: formData.topicRefName || 'Arrays',
        qpfRefGroupCode: formData.qpfRefGroupCode || 'QPF',
        qpfRefCode: formData.qpfRefCode || 'TCSION',
        qpfRefName: formData.qpfRefName || 'TCS iON Digital Exam Platform',
        questionHints: (formData as any).questionHints || [],
        companies: (formData as any).companies || selectedQuestion?.companies || [],
        hackerRankUrl: !isOwn ? (formData.hackerRankUrl || '') : '',
        leetCodeUrl: !isOwn ? (formData.leetCodeUrl || '') : '',
        gfgUrl: !isOwn ? (formData.gfgUrl || '') : '',
        isOwnProblem: isOwn,
        isActive: !formData.id ? (formData.isActive !== false) : (formData.isActive ?? true),
        askedDate: isOwn && formData.askedDate ? formData.askedDate.trim() : null,
      };

      let savedId: string | number | null = createdQuestionIdForRetry;
      let questionSavedSuccessfully = Boolean(createdQuestionIdForRetry);

      // Save question if not already created on previous attempt
      if (!questionSavedSuccessfully) {
        const res = await adminQuestionService.saveOrUpdateQuestion(payload);
        const createdObj = res?.data?.data || res?.data || res;
        savedId = createdObj?.id || (res?.data && res.data.id) || (res && res.id) || formData.id;

        if (res && (res.statusCode === 200 || res.statusCode === 201 || savedId)) {
          questionSavedSuccessfully = true;
        } else {
          toast.error(res?.message || 'Failed to save question to Java backend');
          return;
        }
      }

      // STEP 2: If own problem & new question, attach Test Cases immediately in the SAME single modal workflow
      if (isNewQuestion && isOwn && savedId && (formData as any).testCases && (formData as any).testCases.length > 0) {
        const rawCases: QuestionTestCase[] = (formData as any).testCases;
        const testCasePayload: QuestionTestCase[] = rawCases.map((tc, idx) => ({
          ...tc,
          displayOrder: idx + 1,
          typeRefGroupCode: 'TESTCASETYPE',
          typeRefCode: tc.typeRefCode || 'NECESSARY',
        }));

        try {
          const tcRes = await adminQuestionService.addTestCases(savedId, testCasePayload);
          if (tcRes && (tcRes.statusCode === 200 || tcRes.statusCode === 201 || tcRes.data)) {
            toast.success(`Question #${savedId} & Test Cases Created Successfully!`);
            setCreatedQuestionIdForRetry(null);
            setIsFormOpen(false);
            fetchQuestions();
          } else {
            // Keep question ID in state so retry submits test cases without creating duplicate question
            setCreatedQuestionIdForRetry(savedId);
            toast.error(`Question #${savedId} created, but test cases failed: ${tcRes?.message || 'Failed to attach test cases'}`);
          }
        } catch (tcErr: any) {
          setCreatedQuestionIdForRetry(savedId);
          toast.error(`Question #${savedId} created, but test cases failed: ${tcErr?.message || 'Failed to attach test cases'}`);
        }
      } else {
        // External problem or edit flow
        toast.success(
          isNewQuestion
            ? 'External Question Created Successfully!'
            : 'Question Updated Successfully in Java Database!'
        );
        setCreatedQuestionIdForRetry(null);
        setIsFormOpen(false);
        fetchQuestions();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save question to Java backend');
    } finally {
      setSubmitting(false);
    }
  };

  // Questions list returned by Java backend (backend handles searchText and filters)
  const displayQuestions = questions;

  // Smart page numbers array generator with ellipsis support
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const current = pageNumber + 1;
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | 'ellipsis')[] = [1];
    let start = Math.max(2, current - 1);
    let end = Math.min(totalPages - 1, current + 1);

    if (current <= 3) {
      start = 2;
      end = 4;
    } else if (current >= totalPages - 2) {
      start = totalPages - 3;
      end = totalPages - 1;
    }

    if (start > 2) {
      pages.push('ellipsis');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 1) {
      pages.push('ellipsis');
    }

    pages.push(totalPages);
    return pages;
  };

  const columns: Column<QuestionPayload>[] = [
    {
      header: 'ID',
      accessorKey: 'id',
      cell: (row) => <span className="font-mono text-gray-400">#{row.id}</span>,
      className: 'w-16',
    },
    {
      header: 'Question Title',
      cell: (row: any) => (
        <div className="flex flex-col gap-1">
          <span className="font-bold text-white hover:text-[#A3E635] transition-colors font-heading text-sm">{row.title}</span>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="font-mono text-[11px] text-gray-500">
              QPF: {row.qpfRefName || row.qpfRefCode || row.qpfName || 'Platform'}
            </span>
            {row.isOwnProblem && (
              <span className="text-[11px] text-[#A3E635] font-semibold">
                &bull; Original Problem
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Difficulty',
      cell: (row: any) => {
        const diff = (row.difficultyRefName || row.difficultyRefCode || row.difficultyName || row.difficulty || '').toLowerCase();
        let variant: 'easy' | 'medium' | 'hard' | 'neutral' = 'neutral';
        if (diff.includes('easy')) variant = 'easy';
        else if (diff.includes('medium')) variant = 'medium';
        else if (diff.includes('hard')) variant = 'hard';

        const label = row.difficultyRefName || row.difficultyName || row.difficultyRefCode || row.difficulty || 'Easy';
        return <AdminBadge variant={variant}>{label}</AdminBadge>;
      },
      className: 'w-28',
    },
    {
      header: 'Topic',
      cell: (row: any) => {
        const label = row.topicRefName || row.topicName || row.topicRefCode || row.topic || 'General';
        return <AdminBadge variant="primary">{label}</AdminBadge>;
      },
      className: 'w-36',
    },
    {
      header: 'Status',
      cell: (row) => (
        <AdminBadge variant={row.isActive !== false ? 'accent' : 'neutral'}>
          {row.isActive !== false ? 'Active' : 'Inactive'}
        </AdminBadge>
      ),
      className: 'w-24',
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          {row.isOwnProblem && (
            <button
              onClick={() => handleOpenTestCasesForQuestion(row)}
              className="p-2 rounded-xl bg-white/5 hover:bg-[#A3E635]/20 text-gray-400 hover:text-[#A3E635] transition-colors cursor-pointer"
              title="Manage Test Cases"
            >
              <i className="fa-solid fa-vial text-xs"></i>
            </button>
          )}
          <button
            onClick={() => handleInspect(row.id!)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Inspect Full Question Details"
          >
            <i className="fa-solid fa-eye text-xs"></i>
          </button>
          <button
            onClick={() => handleEditClick(row)}
            className="p-2 rounded-xl bg-white/5 hover:bg-[#A3E635]/20 text-gray-400 hover:text-[#A3E635] transition-colors cursor-pointer"
            title="Edit Question"
          >
            <i className="fa-solid fa-pen-to-square text-xs"></i>
          </button>
        </div>
      ),
      className: 'w-32 text-right',
    },
  ];

  return (
    <div className="space-y-6 font-sans text-left pb-12">
      <AdminPageHeader
        title="Questions"
        description="Create and manage DSA practice questions"
        actions={
          <button
            onClick={handleCreateClick}
            className="px-4 py-2.5 bg-[#A3E635] hover:bg-[#84CC16] text-black font-extrabold text-sm rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-[#A3E635]/20 font-sans"
          >
            <i className="fa-solid fa-plus text-xs"></i>
            <span>Add New Question</span>
          </button>
        }
      />

      {/* Filter Bar Controls with Glassmorphism */}
      <AdminCard className="p-4 bg-[#14202C]/75 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-sans text-xs">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-300">Filter Difficulty</label>
            <select
              value={selectedDifficulty}
              onChange={handleDifficultyChange}
              className="w-full bg-[#090A0C]/80 text-gray-100 rounded-xl px-4 py-2.5 text-xs border border-white/10 transition-all focus:outline-none focus:border-[#A3E635] cursor-pointer"
            >
              <option value="">All Difficulties</option>
              {difficulties.map((d) => (
                <option key={d.id || d.refCode} value={String(d.id)}>
                  {d.refName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-300">Filter Topic</label>
            <select
              value={selectedTopic}
              onChange={handleTopicChange}
              className="w-full bg-[#090A0C]/80 text-gray-100 rounded-xl px-4 py-2.5 text-xs border border-white/10 transition-all focus:outline-none focus:border-[#A3E635] cursor-pointer"
            >
              <option value="">All Topics</option>
              {topics.map((t) => (
                <option key={t.id || t.refCode} value={String(t.id)}>
                  {t.refName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-300">Filter Company</label>
            <select
              value={selectedCompany}
              onChange={handleCompanyChange}
              className="w-full bg-[#090A0C]/80 text-gray-100 rounded-xl px-4 py-2.5 text-xs border border-white/10 transition-all focus:outline-none focus:border-[#A3E635] cursor-pointer"
            >
              <option value="">All Companies</option>
              {companies.map((c) => (
                <option key={c.id || c.name} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-300">Search Title / Category</label>
            <div className="relative flex items-center">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 text-gray-500 text-xs"></i>
              <input
                type="text"
                placeholder="Search practice problems..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full bg-[#090A0C]/80 text-gray-100 placeholder-gray-500 rounded-xl pl-9 pr-4 py-2.5 text-xs border border-white/10 transition-all focus:outline-none focus:border-[#A3E635]"
              />
            </div>
          </div>
        </div>
      </AdminCard>

      {/* Error State Handler */}
      {error ? (
        <AdminErrorState
          title="Backend Question API Error"
          message={error}
          onRetry={fetchQuestions}
        />
      ) : (
        <div className="space-y-4">
          <AdminTable
            columns={columns}
            data={displayQuestions}
            loading={loading}
            emptyTitle="No Questions Found"
            emptyDescription="No practice problems match your filter parameters in the database."
            keyExtractor={(item) => item.id || item.title}
          />

          {/* Full-Featured Admin Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-[#14202C]/75 backdrop-blur-xl border border-white/10 rounded-2xl text-xs font-sans text-gray-300 shadow-2xl">
            <div className="flex items-center gap-3 flex-wrap">
              <span>
                Showing{' '}
                <strong className="text-white">
                  {totalElements === 0 ? 0 : pageNumber * pageSize + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-white">
                  {Math.min((pageNumber + 1) * pageSize, totalElements)}
                </strong>{' '}
                of <strong className="text-white">{totalElements}</strong> questions
              </span>
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-gray-400">Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="bg-[#090A0C]/80 text-gray-100 rounded-lg px-2.5 py-1 border border-white/10 text-xs focus:outline-none focus:border-[#A3E635] cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* First Page */}
              <button
                disabled={pageNumber === 0 || loading}
                onClick={() => setPageNumber(0)}
                className="p-1.5 px-2 rounded-xl bg-[#090A0C]/80 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white font-semibold transition-all cursor-pointer"
                title="First Page"
              >
                <i className="fa-solid fa-angles-left text-[10px]"></i>
              </button>

              {/* Previous Page */}
              <button
                disabled={pageNumber === 0 || loading}
                onClick={() => setPageNumber((p) => Math.max(0, p - 1))}
                className="px-3 py-1.5 rounded-xl bg-[#090A0C]/80 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white font-semibold transition-all flex items-center gap-1 cursor-pointer"
              >
                <i className="fa-solid fa-angle-left text-[10px]"></i>
                <span className="hidden sm:inline">Prev</span>
              </button>

              {/* Page Number Buttons */}
              <div className="flex items-center gap-1">
                {getPageNumbers().map((p, idx) => {
                  if (p === 'ellipsis') {
                    return (
                      <span key={`ell-${idx}`} className="px-1 text-gray-500 font-bold select-none">
                        •••
                      </span>
                    );
                  }
                  const isActive = p === pageNumber + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => setPageNumber(p - 1)}
                      disabled={loading}
                      className={`min-w-8 h-8 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                        isActive
                          ? 'bg-[#A3E635] text-black shadow-md shadow-[#A3E635]/20 font-extrabold'
                          : 'border border-white/10 bg-[#090A0C]/80 text-gray-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              {/* Next Page */}
              <button
                disabled={pageNumber >= totalPages - 1 || loading}
                onClick={() => setPageNumber((p) => p + 1)}
                className="px-3 py-1.5 rounded-xl bg-[#090A0C]/80 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white font-semibold transition-all flex items-center gap-1 cursor-pointer"
              >
                <span className="hidden sm:inline">Next</span>
                <i className="fa-solid fa-angle-right text-[10px]"></i>
              </button>

              {/* Last Page */}
              <button
                disabled={pageNumber >= totalPages - 1 || loading}
                onClick={() => setPageNumber(Math.max(0, totalPages - 1))}
                className="p-1.5 px-2 rounded-xl bg-[#090A0C]/80 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white font-semibold transition-all cursor-pointer"
                title="Last Page"
              >
                <i className="fa-solid fa-angles-right text-[10px]"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Popup Question + Test Case Form Modal */}
      <QuestionFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setCreatedQuestionIdForRetry(null);
        }}
        onSubmit={handleSaveQuestion}
        initialData={selectedQuestion}
        submitting={submitting}
      />

      {/* Details View Modal */}
      <QuestionDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        question={selectedQuestion}
        loading={detailsLoading}
      />

      {/* Test Case Modal for Existing Questions */}
      <TestCaseModal
        isOpen={isTestCaseOpen}
        onClose={() => setIsTestCaseOpen(false)}
        questionId={targetQuestionForTestCases?.id ?? null}
        questionTitle={targetQuestionForTestCases?.title}
      />
    </div>
  );
};
