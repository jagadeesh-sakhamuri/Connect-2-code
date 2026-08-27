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

  // Fetch TESTCASETYPE Reference Library from real backend API on modal open
  useEffect(() => {
    if (!isOpen) return;

    // Reset test cases state when modal opens for a new question
    setTestCases([
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

    let isMounted = true;
    const fetchTestCaseTypes = async () => {
      setTypesLoading(true);
      try {
        const res = await referenceService.getByGroupCode('TESTCASETYPE');
        const list = res?.data || (Array.isArray(res) ? res : []);
        if (isMounted && Array.isArray(list)) {
          setTestCaseTypes(list);
          if (list.length > 0) {
            setTestCases((prev) =>
              prev.map((tc) => ({
                ...tc,
                typeRefCode: tc.typeRefCode || list[0].refCode,
              }))
            );
          }
        }
      } catch (err) {
        console.warn('Failed to load TESTCASETYPE reference library:', err);
      } finally {
        if (isMounted) setTypesLoading(false);
      }
    };

    fetchTestCaseTypes();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const handleAddRow = () => {
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
      updated[index] = { ...updated[index], [field]: value };
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
      const payload: QuestionTestCase[] = testCases.map((tc, idx) => ({
        ...tc,
        displayOrder: idx + 1,
        typeRefGroupCode: 'TESTCASETYPE',
        typeRefCode: tc.typeRefCode || (testCaseTypes.length > 0 ? testCaseTypes[0].refCode : 'NECESSARY'),
      }));

      const res = await adminQuestionService.addTestCases(questionId, payload);
      if (res && (res.statusCode === 200 || res.statusCode === 201 || res.data)) {
        toast.success(`Test cases attached to Question #${questionId} successfully!`);
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(res?.message || 'Failed to attach test cases');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error attaching test cases to backend');
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
