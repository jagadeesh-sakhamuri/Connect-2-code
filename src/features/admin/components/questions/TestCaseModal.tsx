import React, { useState, useEffect } from 'react';
import { AdminModal } from '../AdminModal';
import { QuestionTestCase } from '../../../../services/questionService';
import { referenceService, ReferenceItem } from '../../../../services/referenceService';
import { adminQuestionService } from '../../../../services/admin/adminQuestionService';
import { toast } from 'react-hot-toast';

interface TestCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionId: number | string | null;
  questionTitle?: string;
  onSuccess?: () => void;
}

export const TestCaseModal: React.FC<TestCaseModalProps> = ({
  isOpen,
  onClose,
  questionId,
  questionTitle,
  onSuccess,
}) => {
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

  const [testCaseTypes, setTestCaseTypes] = useState<ReferenceItem[]>([]);
  const [typesLoading, setTypesLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Fetch existing test cases & TESTCASETYPE Reference Library from backend on modal open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setTypesLoading(true);

    const initModal = async () => {
      try {
        // 1. Fetch Reference Library TESTCASETYPE items
        const refRes = await referenceService.getByGroupCode('TESTCASETYPE');
        const refList = refRes?.data || (Array.isArray(refRes) ? refRes : []);
        const validTypes = Array.isArray(refList) ? refList : [];
        if (isMounted) {
          setTestCaseTypes(validTypes);
        }

        // 2. Fetch existing test cases for the question if questionId is provided
        let existingCases: QuestionTestCase[] = [];
        if (questionId) {
          try {
            const qRes: any = await adminQuestionService.getQuestionById(questionId);
            const qData = qRes?.data || qRes;
            if (Array.isArray(qData?.testCases) && qData.testCases.length > 0) {
              existingCases = qData.testCases.map((tc: any, idx: number) => {
                const typeCode = tc.typeRefCode || (tc.isHidden ? 'NECESSARY' : 'SAMPLE');
                const matchedType = validTypes.find((t) => t.refCode === typeCode);
                return {
                  id: tc.id,
                  questionId: tc.questionId || questionId,
                  input: tc.input || '',
                  expectedOutput: tc.expectedOutput || '',
                  explanation: tc.explanation || '',
                  isHidden: tc.isHidden === true,
                  displayOrder: tc.displayOrder || idx + 1,
                  typeRefGroupCode: 'TESTCASETYPE',
                  typeRefCode: typeCode,
                  typeRefName: matchedType?.refName || tc.typeRefName || (tc.isHidden ? 'Mandatory Test Case' : 'Visible Sample Test Case'),
                };
              });
            }
          } catch (qErr) {
            console.warn('Could not load existing test cases for question:', qErr);
          }
        }

        if (isMounted) {
          if (existingCases.length > 0) {
            setTestCases(existingCases);
          } else {
            const defaultType = validTypes.length > 0 ? validTypes[0].refCode : 'SAMPLE';
            setTestCases([
              {
                input: '',
                expectedOutput: '',
                explanation: '',
                isHidden: false,
                displayOrder: 1,
                typeRefGroupCode: 'TESTCASETYPE',
                typeRefCode: defaultType,
                typeRefName: validTypes.find((t) => t.refCode === defaultType)?.refName || 'Visible Sample Test Case',
              },
            ]);
          }
        }
      } catch (err) {
        console.warn('Failed to load TESTCASETYPE reference library:', err);
      } finally {
        if (isMounted) setTypesLoading(false);
      }
    };

    initModal();
    return () => {
      isMounted = false;
    };
  }, [isOpen, questionId]);

  const handleAddRow = () => {
    const defaultType = testCaseTypes.length > 0 ? testCaseTypes[0].refCode : 'SAMPLE';
    const defaultName = testCaseTypes.find((t) => t.refCode === defaultType)?.refName || 'Visible Sample Test Case';
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
        typeRefName: defaultName,
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (testCases.length === 1) {
      toast.error('At least one test case is required');
      return;
    }
    setTestCases((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof QuestionTestCase, value: any) => {
    setTestCases((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };

      // Synchronize type metadata when typeRefCode changes
      if (field === 'typeRefCode') {
        const matched = testCaseTypes.find((t) => t.refCode === value);
        if (matched) {
          target.typeRefGroupCode = 'TESTCASETYPE';
          target.typeRefName = matched.refName;
        }
      }
      // When isHidden changes, auto-suggest type if still at initial default
      if (field === 'isHidden') {
        if (value === true && target.typeRefCode === 'SAMPLE') {
          target.typeRefCode = 'NECESSARY';
          target.typeRefName = testCaseTypes.find((t) => t.refCode === 'NECESSARY')?.refName || 'Mandatory Test Case';
        } else if (value === false && target.typeRefCode === 'NECESSARY') {
          target.typeRefCode = 'SAMPLE';
          target.typeRefName = testCaseTypes.find((t) => t.refCode === 'SAMPLE')?.refName || 'Visible Sample Test Case';
        }
      }

      updated[index] = target;
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionId) {
      toast.error('Question ID is missing');
      return;
    }

    // Validate inputs
    for (let i = 0; i < testCases.length; i++) {
      if (!testCases[i].input.trim()) {
        toast.error(`Input is required for Test Case #${i + 1}`);
        return;
      }
      if (!testCases[i].expectedOutput.trim()) {
        toast.error(`Expected Output is required for Test Case #${i + 1}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload: QuestionTestCase[] = testCases.map((tc, idx) => {
        const typeCode = tc.typeRefCode || (tc.isHidden ? 'NECESSARY' : 'SAMPLE');
        const matched = testCaseTypes.find((t) => t.refCode === typeCode);
        return {
          ...tc,
          displayOrder: idx + 1,
          typeRefGroupCode: 'TESTCASETYPE',
          typeRefCode: typeCode,
          typeRefName: matched?.refName || tc.typeRefName || (tc.isHidden ? 'Mandatory Test Case' : 'Visible Sample Test Case'),
        };
      });

      const res = await adminQuestionService.addTestCases(questionId, payload);
      if (res && (res.statusCode === 200 || res.statusCode === 201 || res.data)) {
        toast.success(`Test cases attached to Question #${questionId} successfully!`);
        if (onSuccess) onSuccess();
        onClose();
      } else {
        const detail = Array.isArray((res as any)?.errors) && (res as any).errors.length > 0 ? (res as any).errors.join('; ') : '';
        const msg = detail ? `${res?.message || 'Failed'}: ${detail}` : (res?.message || 'Failed to attach test cases');
        toast.error(msg);
      }
    } catch (err: any) {
      const detail = Array.isArray(err?.errors) && err.errors.length > 0 ? err.errors.join('; ') : '';
      const msg = detail ? `${err?.message || 'Error'}: ${detail}` : (err?.message || 'Error attaching test cases to backend');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Test Cases — ${questionTitle || `#${questionId}`}`}
      subtitle="Configure test cases to evaluate user code submissions"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-sans text-left text-xs">
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-xs">
            Configure test cases to evaluate user code submissions for Question #{questionId}.
          </p>
          <button
            type="button"
            onClick={handleAddRow}
            className="px-3 py-1.5 bg-[#A3E635]/10 hover:bg-[#A3E635]/20 text-[#A3E635] border border-[#A3E635]/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 font-sans"
          >
            <i className="fa-solid fa-plus text-[10px]"></i> Add Case
          </button>
        </div>

        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {testCases.map((tc, index) => (
            <div key={index} className="p-4 bg-[#121317] border border-white/10 rounded-2xl space-y-3 relative">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="font-bold text-[#A3E635] font-mono text-xs">
                  Test Case #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveRow(index)}
                  className="text-gray-500 hover:text-rose-400 text-xs p-1 transition-colors"
                  title="Remove Test Case"
                >
                  <i className="fa-solid fa-trash-can"></i>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Input */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-300">Input Raw String *</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. 5\n1 2 3 4 5"
                    value={tc.input}
                    onChange={(e) => handleChange(index, 'input', e.target.value)}
                    className="w-full bg-[#181A20] text-gray-100 placeholder-gray-500 rounded-xl p-2.5 text-xs border border-white/10 focus:outline-none focus:border-[#A3E635] font-mono"
                  />
                </div>

                {/* Expected Output */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-300">Expected Output *</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. 15"
                    value={tc.expectedOutput}
                    onChange={(e) => handleChange(index, 'expectedOutput', e.target.value)}
                    className="w-full bg-[#181A20] text-gray-100 placeholder-gray-500 rounded-xl p-2.5 text-xs border border-white/10 focus:outline-none focus:border-[#A3E635] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Test Case Type Dropdown */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-300">Case Type (TESTCASETYPE)</label>
                  <select
                    disabled={typesLoading || testCaseTypes.length === 0}
                    value={tc.typeRefCode}
                    onChange={(e) => handleChange(index, 'typeRefCode', e.target.value)}
                    className="w-full bg-[#181A20] text-gray-100 rounded-xl px-3 py-2 text-xs border border-white/10 focus:outline-none focus:border-[#A3E635] cursor-pointer disabled:opacity-50"
                  >
                    {typesLoading ? (
                      <option value="">Loading types...</option>
                    ) : testCaseTypes.length === 0 ? (
                      <option value="NECESSARY">Standard / Necessary</option>
                    ) : (
                      testCaseTypes.map((t) => (
                        <option key={t.id || t.refCode} value={t.refCode}>
                          {t.refName} ({t.refCode})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Explanation */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-300">Explanation</label>
                  <input
                    type="text"
                    placeholder="e.g. Corner case for single element array"
                    value={tc.explanation || ''}
                    onChange={(e) => handleChange(index, 'explanation', e.target.value)}
                    className="w-full bg-[#181A20] text-gray-100 placeholder-gray-500 rounded-xl px-3 py-2 text-xs border border-white/10 focus:outline-none focus:border-[#A3E635]"
                  />
                </div>
              </div>

              {/* Is Hidden Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id={`hidden-${index}`}
                  checked={tc.isHidden}
                  onChange={(e) => handleChange(index, 'isHidden', e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-[#181A20] border-white/10 text-[#A3E635] focus:ring-[#A3E635] cursor-pointer"
                />
                <label htmlFor={`hidden-${index}`} className="text-gray-400 text-xs cursor-pointer select-none">
                  Hidden Case (Used for evaluation only, invisible to users during practice)
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#181A20] hover:bg-[#22252D] text-gray-300 border border-white/10 rounded-xl text-xs font-semibold transition-all cursor-pointer font-sans"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-[#A3E635] hover:bg-[#b4f043] text-black font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-[#A3E635]/10 disabled:opacity-50 font-sans"
          >
            {submitting ? (
              <>
                <i className="fa-solid fa-spinner animate-spin text-xs"></i>
                <span>Saving Test Cases...</span>
              </>
            ) : (
              <span>Submit Test Cases</span>
            )}
          </button>
        </div>
      </form>
    </AdminModal>
  );
};
