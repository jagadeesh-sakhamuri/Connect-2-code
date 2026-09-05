import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AdminModal } from '../AdminModal';
import { QuestionPayload, QuestionHint, QuestionTestCase } from '../../../../services/questionService';
import { referenceService, ReferenceItem } from '../../../../services/referenceService';
import { adminCompanyService, CompanyItem } from '../../../../services/admin/adminCompanyService';
import { toast } from 'react-hot-toast';

// Validation Schema strictly mapped to working backend QuestionPayload schema
const questionSchema = z.object({
  id: z.number().nullable().optional(),
  title: z.string().min(3, 'Title must be at least 3 characters long'),
  description: z.string().min(10, 'Description must be at least 10 characters long'),
  constraints: z.string().optional(),
  difficultyRefGroupCode: z.string().default('DIFF'),
  difficultyRefCode: z.string().min(1, 'Difficulty code is required'),
  difficultyRefName: z.string().min(1, 'Difficulty name is required'),
  topicRefGroupCode: z.string().default('TOPIC'),
  topicRefCode: z.string().min(1, 'Topic code is required'),
  topicRefName: z.string().min(1, 'Category / Topic is required'),
  qpfRefGroupCode: z.string().default('QPF'),
  qpfRefCode: z.string().min(1, 'Platform code is required'),
  qpfRefName: z.string().min(1, 'Platform name is required'),
  leetCodeUrl: z.string().optional(),
  gfgUrl: z.string().optional(),
  hackerRankUrl: z.string().optional(),
  isOwnProblem: z.boolean().default(true),
  isActive: z.boolean().default(true),
  askedDate: z.string().nullable().optional(),
});

export type QuestionFormData = z.infer<typeof questionSchema> & {
  questionHints?: QuestionHint[];
  testCases?: QuestionTestCase[];
  companies?: CompanyItem[];
};

interface QuestionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: QuestionFormData) => Promise<void>;
  initialData?: QuestionPayload | null;
  submitting?: boolean;
}

export const QuestionFormModal: React.FC<QuestionFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  submitting = false,
}) => {
  const isEditing = Boolean(initialData?.id);
  const [activeTab, setActiveTab] = useState<'METADATA' | 'TESTCASES'>('METADATA');

  // Dynamic Reference Libraries fetched from REAL Backend API
  const [difficulties, setDifficulties] = useState<ReferenceItem[]>([]);
  const [topics, setTopics] = useState<ReferenceItem[]>([]);
  const [qpfs, setQpfs] = useState<ReferenceItem[]>([]);
  const [testCaseTypes, setTestCaseTypes] = useState<ReferenceItem[]>([]);
  const [allCompanies, setAllCompanies] = useState<CompanyItem[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<CompanyItem[]>([]);
  const [companyInput, setCompanyInput] = useState<string>('');

  const [refLoading, setRefLoading] = useState<boolean>(false);
  const [refError, setRefError] = useState<string | null>(null);

  // Question Hints State
  const [hints, setHints] = useState<QuestionHint[]>([]);

  // Inline Test Cases State for Own Problems
  const [testCases, setTestCases] = useState<QuestionTestCase[]>([
    {
      input: '',
      expectedOutput: '',
      explanation: '',
      isHidden: false,
      displayOrder: 1,
      typeRefGroupCode: 'TESTCASETYPE',
      typeRefCode: 'NECESSARY',
    },
  ]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      id: null,
      difficultyRefGroupCode: 'DIFF',
      difficultyRefCode: 'EASY',
      difficultyRefName: 'Easy',
      topicRefGroupCode: 'TOPIC',
      topicRefCode: 'ARRAY',
      topicRefName: 'Arrays',
      qpfRefGroupCode: 'QPF',
      qpfRefCode: 'TCSION',
      qpfRefName: 'TCS iON Digital Exam Platform',
      isOwnProblem: true,
      isActive: true,
      askedDate: '',
    },
  });

  // Fetch Reference Libraries and Companies from REAL backend API when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadReferenceData = async () => {
      setRefLoading(true);
      setRefError(null);
      try {
        const [diffRes, topicRes, qpfRes, tcTypeRes, compRes] = await Promise.all([
          referenceService.getByGroupCode('DIFF'),
          referenceService.getByGroupCode('TOPIC'),
          referenceService.getByGroupCode('QPF'),
          referenceService.getByGroupCode('TESTCASETYPE'),
          adminCompanyService.getCompanies(),
        ]);

        if (!isMounted) return;

        const diffList = diffRes?.data || (Array.isArray(diffRes) ? diffRes : []);
        const topicList = topicRes?.data || (Array.isArray(topicRes) ? topicRes : []);
        const qpfList = qpfRes?.data || (Array.isArray(qpfRes) ? qpfRes : []);
        const tcTypeList = tcTypeRes?.data || (Array.isArray(tcTypeRes) ? tcTypeRes : []);
        const compList = compRes?.data || (Array.isArray(compRes) ? compRes : []);

        const validDiffs = Array.isArray(diffList) ? diffList : [];
        const validTopics = Array.isArray(topicList) ? topicList : [];
        const validQpfs = Array.isArray(qpfList) ? qpfList : [];
        const validTcTypes = Array.isArray(tcTypeList) ? tcTypeList : [];
        const validCompanies = Array.isArray(compList) ? compList : [];

        setDifficulties(validDiffs);
        setTopics(validTopics);
        setQpfs(validQpfs);
        setTestCaseTypes(validTcTypes);
        setAllCompanies(validCompanies);

        if (validTcTypes.length > 0) {
          setTestCases((prev) =>
            prev.map((tc) => ({
              ...tc,
              typeRefCode: tc.typeRefCode || validTcTypes[0].refCode,
            }))
          );
        }

        // If creating a new question, populate defaults from API list
        if (!initialData) {
          if (validDiffs.length > 0 && !watch('difficultyRefCode')) {
            setValue('difficultyRefGroupCode', validDiffs[0].refGroupCode || 'DIFF');
            setValue('difficultyRefCode', validDiffs[0].refCode);
            setValue('difficultyRefName', validDiffs[0].refName);
          }
          if (validTopics.length > 0 && !watch('topicRefCode')) {
            setValue('topicRefGroupCode', validTopics[0].refGroupCode || 'TOPIC');
            setValue('topicRefCode', validTopics[0].refCode);
            setValue('topicRefName', validTopics[0].refName);
          }
          if (validQpfs.length > 0 && !watch('qpfRefCode')) {
            setValue('qpfRefGroupCode', validQpfs[0].refGroupCode || 'QPF');
            setValue('qpfRefCode', validQpfs[0].refCode);
            setValue('qpfRefName', validQpfs[0].refName);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setRefError(err?.message || 'Failed to load reference options from server');
        }
      } finally {
        if (isMounted) {
          setRefLoading(false);
        }
      }
    };

    loadReferenceData();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    setActiveTab('METADATA');
    if (initialData) {
      const formattedAskedDate = initialData.askedDate
        ? initialData.askedDate.split('T')[0]
        : '';
      reset({
        id: initialData.id ?? null,
        title: initialData.title || '',
        description: initialData.description || '',
        difficultyRefGroupCode: initialData.difficultyRefGroupCode || 'DIFF',
        difficultyRefCode: initialData.difficultyRefCode || 'EASY',
        difficultyRefName: initialData.difficultyRefName || 'Easy',
        topicRefGroupCode: initialData.topicRefGroupCode || 'TOPIC',
        topicRefCode: initialData.topicRefCode || 'ARRAY',
        topicRefName: initialData.topicRefName || 'Arrays',
        qpfRefGroupCode: initialData.qpfRefGroupCode || 'QPF',
        qpfRefCode: initialData.qpfRefCode || 'TCSION',
        qpfRefName: initialData.qpfRefName || 'TCS iON Digital Exam Platform',
        leetCodeUrl: initialData.leetCodeUrl || '',
        gfgUrl: initialData.gfgUrl || '',
        hackerRankUrl: initialData.hackerRankUrl || '',
        isOwnProblem: initialData.isOwnProblem ?? true,
        isActive: initialData.isActive ?? true,
        askedDate: formattedAskedDate,
      });
      setHints(
        Array.isArray(initialData.questionHints)
          ? initialData.questionHints.map((h) => ({ id: h.id ?? null, hintText: h.hintText }))
          : []
      );
      setSelectedCompanies(Array.isArray(initialData.companies) ? initialData.companies : []);
      if (Array.isArray(initialData.testCases) && initialData.testCases.length > 0) {
        setTestCases(initialData.testCases);
      }
    } else {
      reset({
        id: null,
        title: '',
        description: '',
        difficultyRefGroupCode: 'DIFF',
        difficultyRefCode: 'EASY',
        difficultyRefName: 'Easy',
        topicRefGroupCode: 'TOPIC',
        topicRefCode: 'ARRAY',
        topicRefName: 'Arrays',
        qpfRefGroupCode: 'QPF',
        qpfRefCode: 'TCSION',
        qpfRefName: 'TCS iON Digital Exam Platform',
        leetCodeUrl: '',
        gfgUrl: '',
        hackerRankUrl: '',
        isOwnProblem: true,
        isActive: true,
        askedDate: '',
      });
      setHints([]);
      setSelectedCompanies([]);
      setTestCases([
        {
          input: '',
          expectedOutput: '',
          explanation: '',
          isHidden: false,
          displayOrder: 1,
          typeRefGroupCode: 'TESTCASETYPE',
          typeRefCode: testCaseTypes.length > 0 ? testCaseTypes[0].refCode : 'NECESSARY',
        },
      ]);
    }
  }, [initialData, reset]);

  const handleDifficultySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = e.target.value;
    const match = difficulties.find((d) => d.refCode === selectedCode);
    if (match) {
      setValue('difficultyRefGroupCode', match.refGroupCode || 'DIFF');
      setValue('difficultyRefCode', match.refCode);
      setValue('difficultyRefName', match.refName);
    }
  };

  const handleTopicSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = e.target.value;
    const match = topics.find((t) => t.refCode === selectedCode);
    if (match) {
      setValue('topicRefGroupCode', match.refGroupCode || 'TOPIC');
      setValue('topicRefCode', match.refCode);
      setValue('topicRefName', match.refName);
    }
  };

  const handleQpfSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = e.target.value;
    const match = qpfs.find((q) => q.refCode === selectedCode);
    if (match) {
      setValue('qpfRefGroupCode', match.refGroupCode || 'QPF');
      setValue('qpfRefCode', match.refCode);
      setValue('qpfRefName', match.refName);
    }
  };

  const handleAddHint = () => {
    setHints((prev) => [...prev, { id: null, hintText: '' }]);
  };

  const handleRemoveHint = (index: number) => {
    setHints((prev) => prev.filter((_, i) => i !== index));
  };

  const handleHintChange = (index: number, text: string) => {
    setHints((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], hintText: text };
      return updated;
    });
  };

  // Target Companies Dropdown & Multiselect Handlers
  const handleSelectCompanyFromDropdown = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    const match = allCompanies.find((c) => String(c.id) === val || c.name.toLowerCase() === val.toLowerCase());
    if (match && !selectedCompanies.some((c) => (c.id && c.id === match.id) || c.name.toLowerCase() === match.name.toLowerCase())) {
      setSelectedCompanies((prev) => [...prev, match]);
    }
  };

  const handleClearAllCompanies = () => {
    setSelectedCompanies([]);
  };

  const handleAddCompanyTag = () => {
    if (!companyInput.trim()) return;
    const nameToMatch = companyInput.trim();
    const existingMatch = allCompanies.find(
      (c) => c.name.toLowerCase() === nameToMatch.toLowerCase()
    );
    const companyToAdd: CompanyItem = existingMatch || {
      id: null,
      name: nameToMatch,
    };
    if (!selectedCompanies.some((c) => c.name.toLowerCase() === nameToMatch.toLowerCase())) {
      setSelectedCompanies([...selectedCompanies, companyToAdd]);
    }
    setCompanyInput('');
  };

  const handleRemoveCompany = (companyName: string) => {
    setSelectedCompanies(selectedCompanies.filter((c) => c.name !== companyName));
  };

  // Test Case Management Handlers
  const handleAddTestCase = () => {
    const defaultType = testCaseTypes.length > 0 ? testCaseTypes[0].refCode : 'NECESSARY';
    setTestCases((prev) => [
      ...prev,
      {
        input: '',
        expectedOutput: '',
        explanation: '',
        isHidden: false,
        displayOrder: prev.length + 1,
        typeRefGroupCode: 'TESTCASETYPE',
        typeRefCode: defaultType,
      },
    ]);
  };

  const handleRemoveTestCase = (index: number) => {
    if (testCases.length === 1) {
      toast.error('At least one test case is required for your own problem');
      return;
    }
    setTestCases((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTestCaseChange = (index: number, field: keyof QuestionTestCase, value: any) => {
    setTestCases((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleFormSubmit = (data: QuestionFormData) => {
    const isNew = !data.id;
    const finalIsActive = isNew ? (data.isActive !== false) : (data.isActive ?? true);
    const isOwn = data.isOwnProblem === true;

    // Validate inline test cases for own problems
    if (isOwn) {
      if (testCases.length === 0) {
        toast.error('At least one Test Case is required for your own problem');
        return;
      }
      for (let i = 0; i < testCases.length; i++) {
        if (!testCases[i].input.trim()) {
          toast.error(`Input raw string is required for Test Case #${i + 1}`);
          return;
        }
        if (!testCases[i].expectedOutput.trim()) {
          toast.error(`Expected Output raw string is required for Test Case #${i + 1}`);
          return;
        }
      }
    }

    onSubmit({
      ...data,
      isOwnProblem: isOwn,
      isActive: finalIsActive,
      askedDate: isOwn && data.askedDate && data.askedDate.trim() !== '' ? data.askedDate.trim() : null,
      leetCodeUrl: !isOwn && data.leetCodeUrl ? data.leetCodeUrl.trim() : '',
      gfgUrl: !isOwn && data.gfgUrl ? data.gfgUrl.trim() : '',
      hackerRankUrl: !isOwn && data.hackerRankUrl ? data.hackerRankUrl.trim() : '',
      questionHints: hints.filter((h) => h.hintText.trim() !== ''),
      testCases: isOwn ? testCases : [],
      companies: selectedCompanies,
    });
  };

  const isOwnProblem = watch('isOwnProblem') === true;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit DSA Problem #${initialData?.id}` : 'Create New DSA Problem'}
      subtitle="Author problem metadata, companies, hints, and testcase assertions"
      maxWidth="4xl"
    >
      <div className="space-y-6 font-sans text-left">
        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('METADATA')}
            className={`pb-3 text-xs font-bold transition-all cursor-pointer border-b-2 flex items-center gap-2 ${
              activeTab === 'METADATA'
                ? 'border-[#A3E635] text-[#A3E635]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-file-pen" />
            <span>Problem Details &amp; Metadata</span>
          </button>

          {isOwnProblem && (
            <button
              type="button"
              onClick={() => setActiveTab('TESTCASES')}
              className={`pb-3 text-xs font-bold transition-all cursor-pointer border-b-2 flex items-center gap-2 ${
                activeTab === 'TESTCASES'
                  ? 'border-[#A3E635] text-[#A3E635]'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-vials" />
              <span>Test Cases &amp; Assertions ({testCases.length})</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
          {refError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
              <i className="fa-solid fa-triangle-exclamation mr-2"></i>
              {refError}
            </div>
          )}

          {/* TAB 1: METADATA & PROBLEM STATEMENT */}
          {activeTab === 'METADATA' ? (
            <div className="space-y-4">
              {/* Question Title */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-300">Problem Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Two Sum, Binary Search"
                  className="w-full bg-[#090A0C]/80 text-gray-100 placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm border border-white/10 transition-all focus:outline-none focus:border-[#A3E635] focus:ring-1 focus:ring-[#A3E635]"
                  {...register('title')}
                />
                {errors.title && <p className="text-xs text-rose-400 mt-1">{errors.title.message}</p>}
              </div>

              {/* Problem Ownership Selection (Radio Buttons) */}
              <div className="p-4 bg-[#090A0C]/80 backdrop-blur-md border border-white/10 rounded-2xl space-y-2">
                <label className="block text-xs font-semibold text-gray-300">Is this your own problem? *</label>
                <div className="flex items-center gap-6 pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-white">
                    <input
                      type="radio"
                      name="isOwnProblemRadio"
                      className="w-4 h-4 text-[#A3E635] focus:ring-[#A3E635] bg-[#090A0C] border-white/20 cursor-pointer"
                      checked={isOwnProblem}
                      onChange={() => setValue('isOwnProblem', true, { shouldValidate: true, shouldDirty: true })}
                    />
                    <span>( ) Yes — My Own Problem</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-white">
                    <input
                      type="radio"
                      name="isOwnProblemRadio"
                      className="w-4 h-4 text-[#A3E635] focus:ring-[#A3E635] bg-[#090A0C] border-white/20 cursor-pointer"
                      checked={!isOwnProblem}
                      onChange={() => setValue('isOwnProblem', false, { shouldValidate: true, shouldDirty: true })}
                    />
                    <span>( ) No — External Problem</span>
                  </label>
                </div>
              </div>

              {/* Dynamic Reference Library Dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Difficulty Dropdown */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-300">Difficulty Level *</label>
                  <select
                    disabled={refLoading || difficulties.length === 0}
                    className="w-full bg-[#090A0C]/80 text-gray-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold border border-white/10 transition-all focus:outline-none focus:border-[#A3E635] cursor-pointer disabled:opacity-50"
                    value={watch('difficultyRefCode') || ''}
                    onChange={handleDifficultySelect}
                  >
                    {refLoading ? (
                      <option value="">Loading difficulties...</option>
                    ) : difficulties.length === 0 ? (
                      <option value="">No options available</option>
                    ) : (
                      difficulties.map((item) => (
                        <option key={item.id || item.refCode} value={item.refCode}>
                          {item.refName} ({item.refCode})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Topic Dropdown */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-300">DSA Topic / Category *</label>
                  <select
                    disabled={refLoading || topics.length === 0}
                    className="w-full bg-[#090A0C]/80 text-gray-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold border border-white/10 transition-all focus:outline-none focus:border-[#A3E635] cursor-pointer disabled:opacity-50"
                    value={watch('topicRefCode') || ''}
                    onChange={handleTopicSelect}
                  >
                    {refLoading ? (
                      <option value="">Loading topics...</option>
                    ) : topics.length === 0 ? (
                      <option value="">No options available</option>
                    ) : (
                      topics.map((item) => (
                        <option key={item.id || item.refCode} value={item.refCode}>
                          {item.refName} ({item.refCode})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Question Exam Platform / QPF Dropdown */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-300">Exam Platform (QPF) *</label>
                  <select
                    disabled={refLoading || qpfs.length === 0}
                    className="w-full bg-[#090A0C]/80 text-gray-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold border border-white/10 transition-all focus:outline-none focus:border-[#A3E635] cursor-pointer disabled:opacity-50"
                    value={watch('qpfRefCode') || ''}
                    onChange={handleQpfSelect}
                  >
                    {refLoading ? (
                      <option value="">Loading platforms...</option>
                    ) : qpfs.length === 0 ? (
                      <option value="">No options available</option>
                    ) : (
                      qpfs.map((item) => (
                        <option key={item.id || item.refCode} value={item.refCode}>
                          {item.refName} ({item.refCode})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Problem Description */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-300">Problem Description *</label>
                <textarea
                  rows={4}
                  placeholder="Describe the problem statement, inputs, constraints, and expected output format..."
                  className="w-full bg-[#090A0C]/80 text-gray-100 placeholder-gray-500 rounded-xl p-3.5 text-xs border border-white/10 transition-all focus:outline-none focus:border-[#A3E635] leading-relaxed"
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-xs text-rose-400 mt-1">{errors.description.message}</p>
                )}
              </div>

              {/* Active Status & Conditional Asked Date Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
                {/* Active Status Toggle */}
                <div className="flex items-center gap-3 p-3.5 bg-[#090A0C]/80 backdrop-blur-md border border-white/10 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    id="isActiveToggle"
                    className="w-4 h-4 rounded bg-[#090A0C] border-white/10 text-[#A3E635] focus:ring-[#A3E635] cursor-pointer"
                    checked={watch('isActive') !== false}
                    onChange={(e) => setValue('isActive', e.target.checked, { shouldValidate: true, shouldDirty: true })}
                  />
                  <label htmlFor="isActiveToggle" className="text-xs font-semibold text-gray-300 cursor-pointer select-none">
                    Active Problem (Published to users)
                  </label>
                </div>

                {/* Conditional Field: Originally Asked Date (ONLY when isOwnProblem === true) */}
                {isOwnProblem && (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-300">
                      Originally Asked Date
                    </label>
                    <input
                      type="date"
                      onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                      className="w-full bg-[#090A0C]/80 text-white rounded-xl px-4 py-2.5 text-xs border border-white/10 transition-all focus:outline-none focus:border-[#A3E635] font-sans cursor-pointer"
                      style={{ colorScheme: 'dark' }}
                      {...register('askedDate')}
                    />
                  </div>
                )}
              </div>

              {/* Conditional Field: External Platform URLs (ONLY when isOwnProblem === false) */}
              {!isOwnProblem && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-white/10">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-400">LeetCode URL</label>
                    <input
                      type="text"
                      placeholder="https://leetcode.com/..."
                      className="w-full bg-[#090A0C]/80 text-gray-100 placeholder-gray-500 rounded-xl px-3 py-2 text-xs border border-white/10 transition-all focus:outline-none focus:border-[#A3E635]"
                      {...register('leetCodeUrl')}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-400">GeeksforGeeks URL</label>
                    <input
                      type="text"
                      placeholder="https://geeksforgeeks.org/..."
                      className="w-full bg-[#090A0C]/80 text-gray-100 placeholder-gray-500 rounded-xl px-3 py-2 text-xs border border-white/10 transition-all focus:outline-none focus:border-[#A3E635]"
                      {...register('gfgUrl')}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-400">HackerRank URL</label>
                    <input
                      type="text"
                      placeholder="https://hackerrank.com/..."
                      className="w-full bg-[#090A0C]/80 text-gray-100 placeholder-gray-500 rounded-xl px-3 py-2 text-xs border border-white/10 transition-all focus:outline-none focus:border-[#A3E635]"
                      {...register('hackerRankUrl')}
                    />
                  </div>
                </div>
              )}

              {/* Tagged Hiring Companies Multiselect Dropdown */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-gray-300">
                    Tagged Hiring Companies <span className="text-gray-500 font-normal">(Select multiple)</span>
                  </label>
                  {selectedCompanies.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllCompanies}
                      className="text-[11px] text-gray-400 hover:text-rose-400 cursor-pointer transition-colors"
                    >
                      Clear All ({selectedCompanies.length})
                    </button>
                  )}
                </div>

                {/* Dropdown Selector containing all added companies */}
                <select
                  value=""
                  onChange={handleSelectCompanyFromDropdown}
                  className="w-full bg-[#090A0C]/80 text-gray-100 rounded-xl px-4 py-2.5 text-xs border border-white/10 transition-all focus:outline-none focus:border-[#A3E635] cursor-pointer"
                >
                  <option value="" disabled>-- Select a hiring company from list --</option>
                  {allCompanies.map((c) => {
                    const isSelected = selectedCompanies.some(
                      (sc) => (sc.id && sc.id === c.id) || sc.name.toLowerCase() === c.name.toLowerCase()
                    );
                    return (
                      <option key={c.id || c.name} value={String(c.id || c.name)} disabled={isSelected} className="bg-[#121316] text-white">
                        {isSelected ? `✓ ${c.name} (Tagged)` : c.name}
                      </option>
                    );
                  })}
                </select>

                {/* Tagged Companies Chips List */}
                {selectedCompanies.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1.5">
                    {selectedCompanies.map((c) => (
                      <span
                        key={c.id || c.name}
                        className="px-3 py-1.5 rounded-xl bg-[#121316] border border-white/15 text-xs text-white flex items-center gap-2 font-medium shadow-xs"
                      >
                        <i className="fa-solid fa-building text-[10px] text-[#A3E635]"></i>
                        <span>{c.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCompany(c.name)}
                          className="text-gray-400 hover:text-rose-400 cursor-pointer ml-1 text-xs font-bold"
                          title="Remove company tag"
                        >
                          <i className="fa-solid fa-xmark text-xs"></i>
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-500 italic">No companies tagged yet. Select one or more from the dropdown above.</p>
                )}
              </div>

              {/* Problem Hints Section */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-gray-300">Problem Hints</label>
                  <button
                    type="button"
                    onClick={handleAddHint}
                    className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 font-sans"
                  >
                    + Add Hint
                  </button>
                </div>
                {hints.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No hints added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {hints.map((hint, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder={`Hint #${idx + 1}...`}
                          value={hint.hintText}
                          onChange={(e) => handleHintChange(idx, e.target.value)}
                          className="flex-1 bg-[#090A0C]/80 text-gray-100 placeholder-gray-500 rounded-xl px-3 py-2 text-xs border border-white/10 focus:outline-none focus:border-[#A3E635]"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveHint(idx)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs transition-colors cursor-pointer"
                        >
                          <i className="fa-solid fa-trash text-xs" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* TAB 2: TEST CASES & ASSERTIONS */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white font-heading">Test Cases &amp; Assertions</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Configure sample test cases and hidden evaluation cases for your problem.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddTestCase}
                  className="px-3.5 py-2 bg-[#090A0C]/80 hover:bg-white/10 text-gray-200 border border-white/10 rounded-xl text-xs font-bold transition-all cursor-pointer font-sans"
                >
                  + Add Test Case
                </button>
              </div>

              <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                {testCases.map((tc, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#090A0C]/80 backdrop-blur-md border border-white/10 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-extrabold text-[#A3E635] font-mono">Case #{idx + 1}</span>
                        <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={!tc.isHidden}
                            onChange={(e) => handleTestCaseChange(idx, 'isHidden', !e.target.checked)}
                            className="rounded bg-[#090A0C] border-white/10 text-[#A3E635] focus:ring-[#A3E635] cursor-pointer"
                          />
                          <span>Public Example</span>
                        </label>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Reference Library Type Selector */}
                        <select
                          value={tc.typeRefCode || 'NECESSARY'}
                          onChange={(e) => handleTestCaseChange(idx, 'typeRefCode', e.target.value)}
                          className="bg-[#090A0C] text-gray-200 text-xs rounded-lg px-3 py-1.5 border border-white/10 focus:outline-none cursor-pointer"
                        >
                          {testCaseTypes.length > 0 ? (
                            testCaseTypes.map((t) => (
                              <option key={t.refCode} value={t.refCode}>
                                {t.refName || t.refCode}
                              </option>
                            ))
                          ) : (
                            <>
                              <option value="NECESSARY">Mandatory Case (NECESSARY)</option>
                              <option value="CORNER">Edge Case (CORNER)</option>
                              <option value="TLE">Time Limit (TLE)</option>
                            </>
                          )}
                        </select>

                        <button
                          type="button"
                          onClick={() => handleRemoveTestCase(idx)}
                          className="text-gray-500 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                        >
                          <i className="fa-solid fa-trash-can text-xs" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-gray-400">
                          Standard Input Raw String *
                        </label>
                        <textarea
                          rows={3}
                          value={tc.input}
                          onChange={(e) => handleTestCaseChange(idx, 'input', e.target.value)}
                          placeholder="Raw stdin input..."
                          className="w-full bg-[#090A0C] font-mono text-emerald-400 text-xs p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#A3E635]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-gray-400">
                          Expected Output Raw String *
                        </label>
                        <textarea
                          rows={3}
                          value={tc.expectedOutput}
                          onChange={(e) => handleTestCaseChange(idx, 'expectedOutput', e.target.value)}
                          placeholder="Expected stdout output..."
                          className="w-full bg-[#090A0C] font-mono text-[#A3E635] text-xs p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#A3E635]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-gray-400">
                        Explanation (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Why this case is expected..."
                        value={tc.explanation || ''}
                        onChange={(e) => handleTestCaseChange(idx, 'explanation', e.target.value)}
                        className="w-full bg-[#090A0C] text-gray-100 placeholder-gray-500 rounded-xl px-3 py-2 text-xs border border-white/10 focus:outline-none focus:border-[#A3E635]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal Action Buttons Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#090A0C]/80 hover:bg-white/10 text-gray-300 border border-white/10 rounded-xl text-sm font-semibold transition-all cursor-pointer font-sans"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || refLoading}
              className="px-5 py-2 bg-[#A3E635] hover:bg-[#84CC16] text-black font-extrabold text-sm rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-[#A3E635]/20 disabled:opacity-50 font-sans"
            >
              {submitting ? (
                <>
                  <i className="fa-solid fa-spinner animate-spin text-xs"></i>
                  <span>Saving...</span>
                </>
              ) : (
                <span>{initialData ? 'Save Question Changes' : 'Create Problem'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminModal>
  );
};
