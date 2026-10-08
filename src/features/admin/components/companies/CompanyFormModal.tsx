import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AdminModal } from '../AdminModal';
import { CompanyItem } from '../../../../services/admin/adminCompanyService';

const companySchema = z.object({
  id: z.number().nullable().optional(),
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  websiteUrl: z.string().optional(),
  logoUrl: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type CompanyFormData = z.infer<typeof companySchema>;

interface CompanyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CompanyFormData) => Promise<void>;
  initialData?: CompanyItem | null;
  availableCompanies?: CompanyItem[];
  submitting?: boolean;
}

export const CompanyFormModal: React.FC<CompanyFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  availableCompanies = [],
  submitting = false,
}) => {
  const isEditing = Boolean(initialData?.id);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      id: null,
      name: '',
      websiteUrl: '',
      logoUrl: '',
      description: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        id: initialData.id ?? null,
        name: initialData.name || '',
        websiteUrl: initialData.websiteUrl || '',
        logoUrl: initialData.logoUrl || '',
        description: initialData.description || '',
        isActive: initialData.isActive ?? true,
      });
    } else {
      reset({
        id: null,
        name: '',
        websiteUrl: '',
        logoUrl: '',
        description: '',
        isActive: true,
      });
    }
  }, [initialData, reset]);

  const handleSelectPreset = (company: CompanyItem) => {
    setValue('name', company.name, { shouldValidate: true });
    setValue('logoUrl', company.logoUrl || '', { shouldValidate: true });
    setValue('websiteUrl', company.websiteUrl || '', { shouldValidate: true });
  };

  const handleFormSubmit = (data: CompanyFormData) => {
    onSubmit({
      ...data,
      isActive: data.isActive !== false,
    });
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Company #${initialData?.id}` : 'Add Target Hiring Company'}
      subtitle="Configure target company details for DSA tag questions"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 font-sans text-left">
        {/* Select Existing Company */}
        {!isEditing && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Quick Preset Selection
            </label>
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-2 rounded-xl bg-[#121317] border border-white/5">
              {availableCompanies.map((company) => (
                <button
                  key={company.id || company.name}
                  type="button"
                  onClick={() => handleSelectPreset(company)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#181A20] hover:bg-white/10 text-xs font-medium text-gray-300 hover:text-white flex items-center gap-2 border border-white/10 transition-all cursor-pointer"
                >
                  <img src={company.logoUrl || '/logo-mark-transparent.png'} alt={company.name} className="w-3.5 h-3.5 object-contain" />
                  <span>{company.name}</span>
                </button>
              ))}
            </div>
            {availableCompanies.length === 0 && (
              <p className="text-[11px] text-gray-500">No companies are currently available from the backend.</p>
            )}
          </div>
        )}

        {/* Company Name */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-gray-300">Company Name *</label>
          <input
            type="text"
            placeholder="e.g. Google, Accenture, TCS"
            className="w-full bg-[#181A20] text-gray-100 placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm border border-white/10 transition-all focus:outline-none focus:border-[#A3E635] focus:ring-1 focus:ring-[#A3E635]"
            {...register('name')}
          />
          {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>}
        </div>

        {/* Logo URL & Website Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-300">Logo Image URL</label>
            <input
              type="text"
              placeholder="https://example.com/logo.png"
              className="w-full bg-[#181A20] text-gray-100 placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm border border-white/10 transition-all focus:outline-none focus:border-[#A3E635] focus:ring-1 focus:ring-[#A3E635]"
              {...register('logoUrl')}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-300">Official Website URL</label>
            <input
              type="text"
              placeholder="https://company.com"
              className="w-full bg-[#181A20] text-gray-100 placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm border border-white/10 transition-all focus:outline-none focus:border-[#A3E635] focus:ring-1 focus:ring-[#A3E635]"
              {...register('websiteUrl')}
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-gray-300">Company Overview / Placement Context</label>
          <textarea
            rows={3}
            placeholder="Enter brief description of company hiring context..."
            className="w-full bg-[#181A20] text-gray-100 placeholder-gray-500 rounded-xl p-3 text-sm border border-white/10 transition-all focus:outline-none focus:border-[#A3E635] focus:ring-1 focus:ring-[#A3E635] leading-relaxed"
            {...register('description')}
          />
        </div>

        {/* Active Toggle */}
        <div className="flex items-center gap-3 pt-1">
          <input
            type="checkbox"
            id="companyIsActiveToggle"
            className="w-4 h-4 rounded bg-[#121317] border-white/10 text-[#A3E635] focus:ring-[#A3E635] cursor-pointer"
            checked={watch('isActive') !== false}
            onChange={(e) => setValue('isActive', e.target.checked, { shouldValidate: true, shouldDirty: true })}
          />
          <label htmlFor="companyIsActiveToggle" className="text-xs font-semibold text-gray-300 cursor-pointer select-none">
            Active for Problem Tagging (Published to users)
          </label>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#181A20] hover:bg-[#22252D] text-gray-300 border border-white/10 rounded-xl text-sm font-semibold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-[#A3E635] hover:bg-[#b4f043] text-black font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-[#A3E635]/10 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <i className="fa-solid fa-spinner animate-spin text-xs"></i>
                <span>Saving...</span>
              </>
            ) : (
              <span>{isEditing ? 'Save Changes' : 'Create Company'}</span>
            )}
          </button>
        </div>
      </form>
    </AdminModal>
  );
};
