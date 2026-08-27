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
import { referenceService, ReferenceItem } from '../../../services/referenceService';
import { toast } from 'react-hot-toast';

export const AdminQuestions: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionPayload[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [pageNumber, setPageNumber] = useState<number>(0);
  const [pageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Filter States
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Reference Library Data for Filters
  const [difficulties, setDifficulties] = useState<ReferenceItem[]>([]);
  const [topics, setTopics] = useState<ReferenceItem[]>([]);

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

  // Load Filter References from Backend API
  useEffect(() => {
    const fetchFilterReferences = async () => {
      try {
        const [diffRes, topicRes] = await Promise.all([
          referenceService.getByGroupCode('DIFF'),
          referenceService.getByGroupCode('TOPIC'),
        ]);
        const diffList = diffRes?.data || (Array.isArray(diffRes) ? diffRes : []);
        const topicList = topicRes?.data || (Array.isArray(topicRes) ? topicRes : []);
        setDifficulties(Array.isArray(diffList) ? diffList : []);
        setTopics(Array.isArray(topicList) ? topicList : []);
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
      const res = await adminQuestionService.getQuestions({
        level: selectedDifficulty || null,
        companies: null,
        topic: selectedTopic || null,
        searchText: searchTerm.trim() ? searchTerm.trim() : null,
        pageRequest: {
          pageNumber,
          pageSize,
          sortBy: 'id',
          sortDirection: 'ASC',
        },
      });

      const data = res?.data || res;
      if (data && Array.isArray(data.content)) {
        setQuestions(data.content);
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalElements || data.content.length);
      } else if (Array.isArray(data)) {
        setQuestions(data);
        setTotalPages(1);
        setTotalElements(data.length);
      } else {
        setQuestions([]);
        setTotalPages(1);
        setTotalElements(0);
      }
    } catch (err: any) {
      const msg = err?.message || (err?.errors && err?.errors[0]) || 'Failed to fetch questions list from backend API';
      setError(msg);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [pageNumber, pageSize, selectedDifficulty, selectedTopic, searchTerm]);

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

  // Client-side search filtering on current page
  const filteredQuestions = questions.filter((q) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      q.title.toLowerCase().includes(term) ||
      (q.topicRefName && q.topicRefName.toLowerCase().includes(term)) ||
      (q.difficultyRefName && q.difficultyRefName.toLowerCase().includes(term))
    );
  });

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
          <span className="font-bold text-white hover:text-[#14B8A6] transition-colors font-heading text-sm">{row.title}</span>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="font-mono text-[11px] text-gray-500">
              QPF: {row.qpfRefName || row.qpfRefCode || row.qpfName || 'Platform'}
            </span>
            {row.isOwnProblem && (
              <span className="text-[11px] text-[#14B8A6] font-semibold">
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
              className="p-2 rounded-xl bg-white/5 hover:bg-[#14B8A6]/20 text-gray-400 hover:text-[#14B8A6] transition-colors cursor-pointer"
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
            className="p-2 rounded-xl bg-white/5 hover:bg-[#14B8A6]/20 text-gray-400 hover:text-[#14B8A6] transition-colors cursor-pointer"
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
            className="px-4 py-2.5 bg-[#14B8A6] hover:bg-[#0D9488] text-black font-extrabold text-sm rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-[#14B8A6]/20 font-sans"
          >
            <i className="fa-solid fa-plus text-xs"></i>
            <span>Add New Question</span>
          </button>
        }
      />

      {/* Filter Bar Controls with Glassmorphism */}
      <AdminCard className="p-4 bg-[#14202C]/75 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans text-xs">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-300">Filter Difficulty</label>
            <select
              value={selectedDifficulty}
              onChange={handleDifficultyChange}
              className="w-full bg-[#090A0C]/80 text-gray-100 rounded-xl px-4 py-2.5 text-xs border border-white/10 transition-all focus:outline-none focus:border-[#14B8A6] cursor-pointer"
            >
              <option value="">All Difficulties</option>
              {difficulties.map((d) => (
                <option key={d.id || d.refCode} value={d.refCode}>
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
              className="w-full bg-[#090A0C]/80 text-gray-100 rounded-xl px-4 py-2.5 text-xs border border-white/10 transition-all focus:outline-none focus:border-[#14B8A6] cursor-pointer"
            >
              <option value="">All Topics</option>
              {topics.map((t) => (
                <option key={t.id || t.refCode} value={t.refCode}>
                  {t.refName}
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
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#090A0C]/80 text-gray-100 placeholder-gray-500 rounded-xl pl-9 pr-4 py-2.5 text-xs border border-white/10 transition-all focus:outline-none focus:border-[#14B8A6]"
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
            data={filteredQuestions}
            loading={loading}
            emptyTitle="No Questions Found"
            emptyDescription="No practice problems match your filter parameters in the database."
            keyExtractor={(item) => item.id || item.title}
          />

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 bg-[#14202C]/75 backdrop-blur-xl border border-white/10 rounded-2xl text-xs font-sans text-gray-300 shadow-2xl">
              <span>
                Showing page <strong className="text-white">{pageNumber + 1}</strong> of{' '}
                <strong className="text-white">{totalPages}</strong> ({totalElements} total items)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={pageNumber === 0 || loading}
                  onClick={() => setPageNumber((p) => Math.max(0, p - 1))}
                  className="px-4 py-2 bg-[#090A0C]/80 hover:bg-white/10 disabled:opacity-40 border border-white/10 rounded-xl text-white font-semibold transition-all cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={pageNumber >= totalPages - 1 || loading}
                  onClick={() => setPageNumber((p) => p + 1)}
                  className="px-4 py-2 bg-[#090A0C]/80 hover:bg-white/10 disabled:opacity-40 border border-white/10 rounded-xl text-white font-semibold transition-all cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
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
