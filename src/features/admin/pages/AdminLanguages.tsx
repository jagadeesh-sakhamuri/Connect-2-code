import React, { useState, useEffect, useCallback } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminBadge } from '../components/AdminBadge';
import { AdminModal } from '../components/AdminModal';
import { AdminTable, Column } from '../components/AdminTable';
import {
  adminLanguageService,
  AdminLanguageItem,
  LanguageDropdownItem,
} from '../../../services/admin/adminLanguageService';
import { referenceService, ReferenceItem } from '../../../services/referenceService';
import { toast } from 'react-hot-toast';

export const AdminLanguages: React.FC = () => {
  const [languages, setLanguages] = useState<AdminLanguageItem[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<LanguageDropdownItem[]>([]);
  const [refLanguages, setRefLanguages] = useState<ReferenceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingLanguage, setEditingLanguage] = useState<AdminLanguageItem | null>(null);
  const [formReferenceId, setFormReferenceId] = useState<number>(5);
  const [formJudge0Id, setFormJudge0Id] = useState<number>(62);
  const [formVersion, setFormVersion] = useState<string>('Java 17');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Deactivate confirmation
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);

  const fetchLanguagesData = useCallback(async () => {
    setLoading(true);
    try {
      const [langs, drop, refs] = await Promise.allSettled([
        adminLanguageService.getLanguages(),
        adminLanguageService.getLanguageDropdown(),
        referenceService.getByGroupCode('LANG'),
      ]);

      if (langs.status === 'fulfilled') {
        const list = Array.isArray(langs.value) ? langs.value : [];
        setLanguages(list);
      }
      if (drop.status === 'fulfilled') {
        const dropList = Array.isArray(drop.value) ? drop.value : [];
        setActiveDropdown(dropList);
      }
      if (refs.status === 'fulfilled') {
        const refList = refs.value?.data || (Array.isArray(refs.value) ? refs.value : []);
        if (Array.isArray(refList)) setRefLanguages(refList);
      }
    } catch {
      toast.error('Failed to load language data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLanguagesData();
  }, [fetchLanguagesData]);

  const handleOpenCreateModal = () => {
    setEditingLanguage(null);
    setFormReferenceId(5);
    setFormJudge0Id(62);
    setFormVersion('Java 17');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (lang: AdminLanguageItem) => {
    setEditingLanguage(lang);
    setFormReferenceId(lang.referenceId || 5);
    setFormJudge0Id(lang.judge0LanguageId || 62);
    setFormVersion(lang.version || '');
    setFormIsActive(lang.isActive !== false);
    setIsModalOpen(true);
  };

  const handleSaveLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formReferenceId || !formJudge0Id) {
      toast.error('Reference ID and Judge0 ID are required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingLanguage && editingLanguage.id) {
        // Update Language (POST /api/v1/language with id)
        await adminLanguageService.updateLanguage({
          id: editingLanguage.id,
          referenceId: Number(formReferenceId),
          judge0LanguageId: Number(formJudge0Id),
          version: formVersion.trim() || undefined,
          isActive: formIsActive,
        });
        toast.success(`Language #${editingLanguage.id} updated successfully!`);
      } else {
        // Create Language (POST /api/v1/language without id)
        await adminLanguageService.createLanguage({
          referenceId: Number(formReferenceId),
          judge0LanguageId: Number(formJudge0Id),
          version: formVersion.trim() || undefined,
          isActive: formIsActive,
        });
        toast.success('Language registered successfully!');
      }
      setIsModalOpen(false);
      fetchLanguagesData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save language.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id: number) => {
    setDeactivatingId(id);
    try {
      await adminLanguageService.deleteLanguage(id);
      toast.success(`Language #${id} deactivated successfully (soft delete)!`);
      fetchLanguagesData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to deactivate language.');
    } finally {
      setDeactivatingId(null);
    }
  };

  const getLanguageIcon = (name?: string) => {
    const n = (name || '').toLowerCase();
    if (n.includes('java') && !n.includes('script')) return 'fa-brands fa-java text-orange-400';
    if (n.includes('python')) return 'fa-brands fa-python text-amber-400';
    if (n.includes('c++') || n.includes('cpp')) return 'fa-solid fa-c text-blue-400';
    if (n.includes('javascript') || n.includes('js')) return 'fa-brands fa-js text-yellow-400';
    return 'fa-solid fa-code text-[#A3E635]';
  };

  const columns: Column<AdminLanguageItem>[] = [
    {
      header: 'Execution ID',
      accessorKey: 'id',
      cell: (row) => (
        <span className="font-mono font-bold text-white bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 text-xs">
          #{row.id}
        </span>
      ),
      className: 'w-24',
    },
    {
      header: 'Language Name',
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            <i className={`${getLanguageIcon(row.languageName)} text-base`}></i>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white font-heading text-sm">{row.languageName || 'Runtime'}</span>
            <span className="text-[11px] text-gray-400 font-mono">Ref ID: {row.referenceId}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Version',
      cell: (row) => (
        <span className="font-mono text-xs text-gray-300 bg-[#090A0C] px-2.5 py-1 rounded-lg border border-white/10">
          {row.version || 'Default'}
        </span>
      ),
      className: 'w-36',
    },
    {
      header: 'Judge0 ID',
      cell: (row) => (
        <AdminBadge variant="neutral">
          <span className="font-mono text-[11px]">Judge0 #{row.judge0LanguageId}</span>
        </AdminBadge>
      ),
      className: 'w-32',
    },
    {
      header: 'Status',
      cell: (row) => (
        <AdminBadge variant={row.isActive !== false ? 'accent' : 'neutral'}>
          {row.isActive !== false ? 'Active' : 'Inactive'}
        </AdminBadge>
      ),
      className: 'w-28',
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEditModal(row)}
            className="p-2 rounded-xl bg-white/5 hover:bg-[#A3E635]/20 text-gray-400 hover:text-[#A3E635] transition-colors cursor-pointer"
            title="Edit Language"
          >
            <i className="fa-solid fa-pen-to-square text-xs"></i>
          </button>
          {row.isActive !== false && row.id && (
            <button
              onClick={() => handleDeactivate(row.id!)}
              disabled={deactivatingId === row.id}
              className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition-colors cursor-pointer disabled:opacity-50"
              title="Deactivate Language (Soft delete: DELETE /api/v1/language/{id})"
            >
              <i className={`fa-solid ${deactivatingId === row.id ? 'fa-spinner animate-spin text-rose-400' : 'fa-power-off'} text-xs`}></i>
            </button>
          )}
        </div>
      ),
      className: 'w-24',
    },
  ];

  return (
    <div className="space-y-6 font-sans text-left pb-12">
      {/* Page Header */}
      <AdminPageHeader
        title="Languages"
        description="Configure runtime environments, Judge0 language IDs, and compilation settings"
        actions={
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-[#A3E635] hover:bg-[#84CC16] text-black font-extrabold text-sm rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-[#A3E635]/20 font-sans"
          >
            <i className="fa-solid fa-plus text-xs"></i>
            <span>Add New Language</span>
          </button>
        }
      />

      {/* Active Dropdown Status Banner */}
      <div className="p-4 bg-[#14202C]/80 border border-white/10 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#A3E635]/10 border border-[#A3E635]/20 flex items-center justify-center text-[#A3E635]">
            <i className="fa-solid fa-terminal text-sm"></i>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-heading">
              Active Execution Dropdown (/api/v1/language/dropdown)
            </h4>
            <p className="text-[11px] text-gray-400">
              Only active languages are returned for problem execution. Code submission uses the Table ID.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeDropdown.map((lang) => (
            <span
              key={lang.id}
              className="px-2.5 py-1 rounded-lg bg-[#090A0C] border border-white/10 text-xs font-mono font-semibold text-gray-200 flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-[#A3E635]"></span>
              <span>{lang.name}</span>
              <span className="text-gray-500 text-[10px]">ID: {lang.id}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Languages Table */}
      <AdminTable
        columns={columns}
        data={languages}
        loading={loading}
        keyExtractor={(row) => row.id || row.referenceId}
        emptyTitle="No languages registered yet"
        emptyDescription="Click 'Add New Language' above to register a language runtime."
      />

      {/* Add / Edit Language Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLanguage ? `Edit Language: #${editingLanguage.id} ${editingLanguage.languageName || ''}` : 'Register New Language'}
        subtitle="Configure runtime version and Judge0 execution mapping"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-[#181A20] hover:bg-[#22252D] text-gray-300 border border-white/10 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveLanguage}
              disabled={submitting}
              className="px-5 py-2 bg-[#A3E635] hover:bg-[#84CC16] text-black font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-[#A3E635]/20 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <i className="fa-solid fa-spinner animate-spin text-black"></i>
                  <span>Saving...</span>
                </>
              ) : (
                <span>{editingLanguage ? 'Update Language' : 'Create Language'}</span>
              )}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSaveLanguage} className="space-y-4 font-sans text-xs">
          {/* Reference Library ID */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-300">
              Reference Library ID <span className="text-rose-400">*</span>
            </label>
            {refLanguages.length > 0 ? (
              <select
                value={formReferenceId}
                onChange={(e) => setFormReferenceId(Number(e.target.value))}
                className="w-full bg-[#090A0C] text-gray-100 rounded-xl px-4 py-2.5 text-xs border border-white/10 focus:outline-none focus:border-[#A3E635] cursor-pointer"
              >
                {refLanguages.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.refName} (ID: {r.id})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                value={formReferenceId}
                onChange={(e) => setFormReferenceId(Number(e.target.value))}
                placeholder="e.g. 5 for Java, 6 for Python, 7 for C++, 8 for JavaScript"
                className="w-full bg-[#090A0C] text-gray-100 rounded-xl px-4 py-2.5 text-xs border border-white/10 focus:outline-none focus:border-[#A3E635]"
                required
              />
            )}
            <span className="text-[10px] text-gray-500">ID from referenceLibrary (Java: 5, Python: 6, C++: 7, JS: 8)</span>
          </div>

          {/* Judge0 Language ID */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-300">
              Judge0 Language ID <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              value={formJudge0Id}
              onChange={(e) => setFormJudge0Id(Number(e.target.value))}
              placeholder="e.g. 62 (Java 17), 71 (Python 3), 54 (C++ 17), 63 (Node.js)"
              className="w-full bg-[#090A0C] text-gray-100 rounded-xl px-4 py-2.5 text-xs border border-white/10 focus:outline-none focus:border-[#A3E635]"
              required
            />
            <span className="text-[10px] text-gray-500">Official Judge0 compiler runtime ID</span>
          </div>

          {/* Version */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-300">Runtime Version Label</label>
            <input
              type="text"
              value={formVersion}
              onChange={(e) => setFormVersion(e.target.value)}
              placeholder="e.g. Java 17, Java 21, Python 3, C++ 17"
              className="w-full bg-[#090A0C] text-gray-100 rounded-xl px-4 py-2.5 text-xs border border-white/10 focus:outline-none focus:border-[#A3E635]"
            />
          </div>

          {/* Active Status Toggle */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isActiveToggle"
              checked={formIsActive}
              onChange={(e) => setFormIsActive(e.target.checked)}
              className="w-4 h-4 rounded bg-[#090A0C] border-white/20 accent-[#A3E635] cursor-pointer"
            />
            <label htmlFor="isActiveToggle" className="text-xs font-semibold text-gray-300 cursor-pointer">
              Active for Problem Solving &amp; Code Execution
            </label>
          </div>
        </form>
      </AdminModal>
    </div>
  );
};

export default AdminLanguages;
