import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchUserProfile, updateUserProfile } from '../redux/profileSlice';
import { Input } from '../../../shared/components/ui/Input';
import { Button } from '../../../shared/components/ui/Button';
import { toast } from 'react-hot-toast';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Valid phone required'),
  college: z.string().min(2, 'College required'),
  targetRole: z.string().min(2, 'Target role required'),
  githubUrl: z.string().url('Invalid GitHub URL').or(z.literal('')),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export const ProfileSettings: React.FC = () => {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.profile.profile);
  const profileLoading = useAppSelector((state) => state.profile.loading);
  const authUser = useAppSelector((state) => state.auth.user);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile?.fullName || authUser?.fullName || '',
      email: profile?.email || authUser?.email || '',
      phone: profile?.phone || '',
      college: profile?.collegeName || '',
      targetRole: '',
      githubUrl: profile?.githubUrl || '',
      linkedinUrl: profile?.linkedinUrl || '',
    },
  });

  useEffect(() => {
    void dispatch(fetchUserProfile());
  }, [dispatch]);

  useEffect(() => {
    if (!profile && !authUser) return;
    reset({
      fullName: profile?.fullName || authUser?.fullName || '',
      email: profile?.email || authUser?.email || '',
      phone: profile?.phone || '',
      college: profile?.collegeName || '',
      targetRole: '',
      githubUrl: profile?.githubUrl || '',
      linkedinUrl: profile?.linkedinUrl || '',
    });
  }, [profile, authUser, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const updated = await dispatch(updateUserProfile(data)).unwrap();
      reset({
        fullName: updated?.fullName || data.fullName,
        email: updated?.email || data.email,
        phone: updated?.phone || data.phone,
        college: updated?.collegeName || data.college,
        targetRole: data.targetRole,
        githubUrl: updated?.githubUrl || data.githubUrl,
        linkedinUrl: updated?.linkedinUrl || data.linkedinUrl,
      });
      toast.success('Profile details updated successfully!');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update profile');
    }
  };

  return (
    <div className="w-full flex flex-col items-center pb-16">
      {/* BeyondBasics Hero Header - Exactly Matching Companies Page */}
      <section className="relative mx-auto mt-16 max-w-7xl px-6 text-center md:px-8 flex flex-col items-center">
        <h1 className="animate-fade-in -translate-y-4 text-balance whitespace-nowrap bg-gradient-to-br from-white from-30% to-white/40 bg-clip-text py-6 text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-medium leading-none tracking-tighter text-transparent opacity-100 font-heading">
          User Profile
        </h1>
        <p className="animate-fade-in mb-6 -translate-y-4 text-balance text-lg tracking-tight text-gray-400 opacity-100 md:text-xl font-sans">
          Manage your personal information, target company preferences, and portfolio links
        </p>
        <div className="flex justify-center mb-8">
          <div className="shrink-0 bg-white/10 h-0.5 rounded-lg w-60 bg-gradient-to-r from-purple-600 via-violet-500 to-pink-600"></div>
        </div>
      </section>

      {/* Profile Form Container - Matching Companies Page Div Hover Design */}
      <div className="w-full max-w-3xl px-4 mt-6">
        {profileLoading && !profile ? (
          <div className="p-6 bg-[#202225] border border-white/10 rounded-lg text-sm text-gray-400">
            Loading profile…
          </div>
        ) : null}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-6 bg-[#202225] hover:bg-[#202225] border border-white/10 rounded-lg flex flex-col gap-5 shadow-md transition-all"
        >
          <div className="flex items-center gap-4 pb-4 border-b border-white/10">
            <img
              src={profile?.avatarUrl || ''}
              alt={profile?.fullName || authUser?.fullName || 'User'}
              className="w-16 h-16 rounded-full border-2 border-[#A3E635]/60 object-cover shadow-sm"
            />
            <div>
              <h3 className="text-xl font-bold text-white font-heading tracking-tight">{profile?.fullName || authUser?.fullName || 'Your Profile'}</h3>
              <p className="text-xs font-mono text-gray-400 mt-0.5">{profile?.email || authUser?.email || ''}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              leftIcon={<i className="fa-solid fa-user text-xs"></i>}
              error={errors.fullName?.message}
              {...register('fullName')}
            />

            <Input
              label="Email Address"
              type="email"
              leftIcon={<i className="fa-solid fa-envelope text-xs"></i>}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Phone Number"
              leftIcon={<i className="fa-solid fa-phone text-xs"></i>}
              error={errors.phone?.message}
              {...register('phone')}
            />

            <Input
              label="College / Institute"
              leftIcon={<i className="fa-solid fa-graduation-cap text-xs"></i>}
              error={errors.college?.message}
              {...register('college')}
            />

            <Input
              label="GitHub Profile URL"
              leftIcon={<i className="fa-brands fa-github text-xs"></i>}
              error={errors.githubUrl?.message}
              {...register('githubUrl')}
            />

            <Input
              label="LinkedIn Profile URL"
              leftIcon={<i className="fa-brands fa-linkedin text-xs"></i>}
              error={errors.linkedinUrl?.message}
              {...register('linkedinUrl')}
            />
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <Button type="submit" variant="primary" size="md" isLoading={isSubmitting} leftIcon={<i className="fa-solid fa-floppy-disk text-xs"></i>}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
