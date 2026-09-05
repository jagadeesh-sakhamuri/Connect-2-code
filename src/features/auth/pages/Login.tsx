import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  loginUser,
  setAuthModalMode,
  generatePasswordResetOtpThunk,
  verifyPasswordResetOtpThunk,
} from '../redux/authSlice';
import { authService } from '../../../services/authService';
import { toast } from 'react-hot-toast';

// 1. Login Validation Schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});
type LoginFormData = z.infer<typeof loginSchema>;

// 2. Signup Validation Schema (Strictly NO username field!)
const signupSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'First Name must be at least 2 characters')
      .regex(/^[a-zA-Z\s]+$/, 'First Name must contain only letters'),
    lastName: z
      .string()
      .min(1, 'Last Name is required')
      .regex(/^[a-zA-Z\s]+$/, 'Last Name must contain only letters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type SignupFormData = z.infer<typeof signupSchema>;

interface AuthPageProps {
  defaultMode?: 'login' | 'signup' | 'forgot';
  onCloseModal?: () => void;
}

export const Login: React.FC<AuthPageProps> = ({ defaultMode, onCloseModal }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { loading, error, authModalMode } = useAppSelector((state) => state.auth);

  const initialMode =
    defaultMode ||
    authModalMode ||
    (location.pathname === '/signup'
      ? 'signup'
      : location.pathname === '/forgot-password'
      ? 'forgot'
      : 'login');

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // --------------------------------------------------------------------------
  // SIGNUP WITH OTP VERIFICATION STATE
  // --------------------------------------------------------------------------
  const [signupStep, setSignupStep] = useState<1 | 2>(1); // 1: Fill details, 2: Verify OTP
  const [pendingSignupData, setPendingSignupData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  } | null>(null);
  const [signupOtpCode, setSignupOtpCode] = useState<string>('');
  const [signupOtpTimer, setSignupOtpTimer] = useState<number>(0);
  const [signupOtpLoading, setSignupOtpLoading] = useState<boolean>(false);
  const [signupOtpError, setSignupOtpError] = useState<string>('');

  // --------------------------------------------------------------------------
  // FORGOT PASSWORD STATE (EXACT 2-STEP OTP FLOW)
  // --------------------------------------------------------------------------
  const [forgotStep, setForgotStep] = useState<1 | 2>(1); // 1: Send OTP, 2: Verify OTP & Reset
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [forgotOtpCode, setForgotOtpCode] = useState<string>('');
  const [forgotNewPassword, setForgotNewPassword] = useState<string>('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showNewConfirmPassword, setShowNewConfirmPassword] = useState<boolean>(false);
  const [forgotOtpTimer, setForgotOtpTimer] = useState<number>(0);
  const [forgotOtpLoading, setForgotOtpLoading] = useState<boolean>(false);
  const [forgotOtpError, setForgotOtpError] = useState<string>('');
  const [forgotCodeError, setForgotCodeError] = useState<string>('');
  const [forgotNewPasswordError, setForgotNewPasswordError] = useState<string>('');
  const [forgotConfirmPasswordError, setForgotConfirmPasswordError] = useState<string>('');

  // Sync mode with Redux authModalMode
  useEffect(() => {
    if (authModalMode) {
      setMode(authModalMode);
    }
  }, [authModalMode]);

  // Signup OTP Countdown Timer
  useEffect(() => {
    let interval: any = null;
    if (signupOtpTimer > 0) {
      interval = setInterval(() => {
        setSignupOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [signupOtpTimer]);

  // Forgot Password OTP Countdown Timer
  useEffect(() => {
    let interval: any = null;
    if (forgotOtpTimer > 0) {
      interval = setInterval(() => {
        setForgotOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [forgotOtpTimer]);

  // React Hook Form for Login
  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    setValue: setLoginValue,
    formState: { errors: loginErrors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // React Hook Form for Signup
  const {
    register: registerSignup,
    handleSubmit: handleSubmitSignup,
    reset: resetSignup,
    formState: { errors: signupErrors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const handleClose = () => {
    if (onCloseModal) {
      onCloseModal();
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  // --------------------------------------------------------------------------
  // LOGIN SUBMIT
  // --------------------------------------------------------------------------
  const onLoginSubmit = async (data: LoginFormData) => {
    const result = await dispatch(loginUser(data));
    if (loginUser.fulfilled.match(result)) {
      const userObj = result.payload;
      const userName = userObj?.firstName || userObj?.fullName || 'User';
      toast.success(`Welcome ${userName}`);

      const userRole = String(userObj?.role || '').toUpperCase();
      const isAdmin = userRole === 'ADMIN' || userRole === 'ROLE_ADMIN' || userRole.includes('ADMIN');

      if (onCloseModal) {
        onCloseModal();
      }

      const fromPath = (location.state as any)?.from?.pathname;
      if (isAdmin) {
        navigate('/admin/dashboard');
      } else if (fromPath && fromPath !== '/login' && fromPath !== '/signup') {
        navigate(fromPath);
      } else {
        navigate('/practice');
      }
    } else {
      toast.error((result.payload as string) || 'Invalid Email or Password');
    }
  };

  // --------------------------------------------------------------------------
  // SIGNUP STEP 1: VALIDATE DETAILS & SEND OTP
  // --------------------------------------------------------------------------
  const onSignupSubmitStep1 = async (data: SignupFormData) => {
    setSignupOtpError('');
    setSignupOtpLoading(true);

    try {
      // Generate OTP via backend API
      const res = await authService.generatePasswordResetOtp(data.email.trim());
      setSignupOtpLoading(false);

      if (res && (res.statusCode === 200 || res.data === true)) {
        toast.success(`Verification OTP sent to ${data.email.trim()}! Check your inbox.`);
        setPendingSignupData({
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          email: data.email.trim(),
          password: data.password,
        });
        setSignupStep(2);
        setSignupOtpCode('');
        setSignupOtpTimer(60);
      } else {
        const errMsg = res?.message || 'Failed to send OTP to this email address.';
        setSignupOtpError(errMsg);
        toast.error(errMsg);
      }
    } catch (err: any) {
      setSignupOtpLoading(false);
      const errMsg = err?.message || (err?.errors && err?.errors[0]) || 'Failed to send verification OTP. Please try again.';
      setSignupOtpError(errMsg);
      toast.error(errMsg);
    }
  };

  // --------------------------------------------------------------------------
  // SIGNUP STEP 2: VERIFY OTP & CALL SIGNUP API
  // --------------------------------------------------------------------------
  const handleVerifySignupOtpAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupOtpCode.trim()) {
      setSignupOtpError('Please enter the 6-digit OTP.');
      return;
    }
    if (signupOtpCode.trim().length !== 6) {
      setSignupOtpError('OTP must be exactly 6 digits.');
      return;
    }
    if (!pendingSignupData) {
      setSignupStep(1);
      return;
    }

    setSignupOtpError('');
    setSignupOtpLoading(true);

    try {
      // 1. First verify the OTP with the backend
      const verifyRes = await authService.verifyPasswordResetOtp({
        email: pendingSignupData.email,
        otp: signupOtpCode.trim(),
        password: pendingSignupData.password,
      });

      if (!verifyRes || (verifyRes.statusCode !== 200 && verifyRes.data !== true)) {
        setSignupOtpLoading(false);
        const errMsg = verifyRes?.message || 'Invalid or expired OTP. Please check and try again.';
        setSignupOtpError(errMsg);
        toast.error(errMsg);
        return;
      }

      // 2. Once OTP is successfully verified, call real SignUp API!
      const signUpRes = await authService.signUp({
        firstName: pendingSignupData.firstName,
        lastName: pendingSignupData.lastName,
        email: pendingSignupData.email,
        password: pendingSignupData.password,
        role: 'USER',
      });

      setSignupOtpLoading(false);

      if (signUpRes && (signUpRes.statusCode === 200 || signUpRes.statusCode === 201 || signUpRes.data)) {
        toast.success('Account Created Successfully! Please Log In with your credentials.');
        // Pre-fill email in login form
        setLoginValue('email', pendingSignupData.email);
        resetSignup();
        setPendingSignupData(null);
        setSignupStep(1);
        setSignupOtpCode('');
        setMode('login');
        dispatch(setAuthModalMode('login'));
      } else {
        const errMsg = signUpRes?.message || (signUpRes?.errors && signUpRes?.errors[0]) || 'Error while Creating the User';
        setSignupOtpError(errMsg);
        toast.error(errMsg);
      }
    } catch (err: any) {
      setSignupOtpLoading(false);
      const errMsg = err?.message || (err?.errors && err?.errors[0]) || 'Failed to complete registration. Please try again.';
      setSignupOtpError(errMsg);
      toast.error(errMsg);
    }
  };

  const handleResendSignupOtp = async () => {
    if (!pendingSignupData?.email || signupOtpTimer > 0) return;
    setSignupOtpLoading(true);
    setSignupOtpError('');
    try {
      const res = await authService.generatePasswordResetOtp(pendingSignupData.email);
      setSignupOtpLoading(false);
      if (res && (res.statusCode === 200 || res.data === true)) {
        toast.success(`New verification OTP sent to ${pendingSignupData.email}!`);
        setSignupOtpTimer(60);
      } else {
        toast.error(res?.message || 'Failed to resend OTP.');
      }
    } catch (err: any) {
      setSignupOtpLoading(false);
      toast.error(err?.message || 'Failed to resend OTP.');
    }
  };

  // --------------------------------------------------------------------------
  // FORGOT PASSWORD STEP 1: SEND RESET OTP
  // --------------------------------------------------------------------------
  const handleSendForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setForgotOtpError('Please enter a valid email address.');
      return;
    }
    setForgotOtpError('');
    setForgotOtpLoading(true);

    try {
      const res = await dispatch(generatePasswordResetOtpThunk(forgotEmail.trim()));
      setForgotOtpLoading(false);

      if (generatePasswordResetOtpThunk.fulfilled.match(res)) {
        toast.success('Password Reset OTP Sent Successfully! Check your inbox.');
        setForgotStep(2);
        setForgotOtpTimer(60);
        setForgotOtpCode('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
        setForgotCodeError('');
        setForgotNewPasswordError('');
        setForgotConfirmPasswordError('');
      } else {
        const errMsg = (res.payload as string) || 'Failed to send OTP. Please check email address.';
        setForgotOtpError(errMsg);
        toast.error(errMsg);
      }
    } catch (err: any) {
      setForgotOtpLoading(false);
      setForgotOtpError(err?.message || 'Failed to send OTP.');
      toast.error(err?.message || 'Failed to send OTP.');
    }
  };

  // --------------------------------------------------------------------------
  // FORGOT PASSWORD STEP 2: VERIFY OTP & RESET PASSWORD WITH STRICT VALIDATION
  // --------------------------------------------------------------------------
  const handleVerifyForgotOtpAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotOtpError('');
    setForgotCodeError('');
    setForgotNewPasswordError('');
    setForgotConfirmPasswordError('');

    let hasError = false;

    // Validate OTP Code
    if (!forgotOtpCode.trim()) {
      setForgotCodeError('OTP Code is required.');
      hasError = true;
    } else if (forgotOtpCode.trim().length !== 6) {
      setForgotCodeError('OTP must be exactly 6 digits.');
      hasError = true;
    }

    // Validate New Password
    if (!forgotNewPassword) {
      setForgotNewPasswordError('New Password is required.');
      hasError = true;
    } else if (forgotNewPassword.length < 6) {
      setForgotNewPasswordError('Password must be at least 6 characters long.');
      hasError = true;
    }

    // Validate Confirm Password
    if (!forgotConfirmPassword) {
      setForgotConfirmPasswordError('Please confirm your new password.');
      hasError = true;
    } else if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotConfirmPasswordError('Passwords do not match.');
      hasError = true;
    }

    if (hasError) return;

    setForgotOtpLoading(true);

    try {
      const res = await dispatch(
        verifyPasswordResetOtpThunk({
          email: forgotEmail.trim(),
          otp: forgotOtpCode.trim(),
          password: forgotNewPassword,
        })
      );

      setForgotOtpLoading(false);

      if (verifyPasswordResetOtpThunk.fulfilled.match(res)) {
        toast.success('Password Reset Successfully! Please log in with your new password.');
        setLoginValue('email', forgotEmail.trim());
        setMode('login');
        dispatch(setAuthModalMode('login'));
        setForgotStep(1);
        setForgotOtpCode('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
      } else {
        const errMsg = (res.payload as string) || 'Failed to reset password. Invalid or expired OTP.';
        setForgotOtpError(errMsg);
        toast.error(errMsg);
      }
    } catch (err: any) {
      setForgotOtpLoading(false);
      setForgotOtpError(err?.message || 'Error resetting password.');
      toast.error(err?.message || 'Error resetting password.');
    }
  };

  const handleResendForgotOtp = async () => {
    if (!forgotEmail.trim() || forgotOtpTimer > 0) return;
    setForgotOtpLoading(true);
    setForgotOtpError('');
    try {
      const res = await dispatch(generatePasswordResetOtpThunk(forgotEmail.trim()));
      setForgotOtpLoading(false);
      if (generatePasswordResetOtpThunk.fulfilled.match(res)) {
        toast.success(`New OTP sent to ${forgotEmail.trim()}!`);
        setForgotOtpTimer(60);
      } else {
        toast.error((res.payload as string) || 'Failed to resend OTP.');
      }
    } catch (err: any) {
      setForgotOtpLoading(false);
      toast.error(err?.message || 'Failed to resend OTP.');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in font-sans">
      <div className="relative w-full max-w-md bg-[#121316] border border-white/15 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.95)] p-5 sm:p-8 text-white my-auto max-h-[90vh] overflow-y-auto animate-scale-up">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white w-8 h-8 rounded-full bg-[#090A0C] border border-white/15 hover:border-white/40 flex items-center justify-center transition-colors cursor-pointer z-10"
          aria-label="Close modal"
        >
          <i className="fa-solid fa-xmark text-sm"></i>
        </button>

        {/* ================================================================= */}
        {/* 1. LOG IN MODE                                                    */}
        {/* ================================================================= */}
        {mode === 'login' && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1 pr-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading tracking-tight">
                Log in
              </h1>
              <p className="text-xs text-gray-400 font-sans">
                New user ?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setSignupStep(1);
                    dispatch(setAuthModalMode('signup'));
                  }}
                  className="text-[#A3E635] hover:underline font-bold cursor-pointer"
                >
                  Register Now
                </button>
              </p>
            </div>

            <form onSubmit={handleSubmitLogin(onLoginSubmit)} className="flex flex-col gap-4">
              {/* Email Address */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-200">Email Address</label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  className="w-full bg-[#090A0C] border border-white/15 focus:border-[#A3E635] text-sm text-white placeholder-gray-500 px-3.5 py-2.5 rounded-lg outline-none transition-all"
                  {...registerLogin('email')}
                />
                {loginErrors.email && (
                  <span className="text-xs text-rose-400 font-sans">{loginErrors.email.message}</span>
                )}
              </div>

              {/* Password & Forgot Password Link */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-200">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setForgotStep(1);
                      setForgotEmail('');
                      setForgotOtpCode('');
                      setForgotNewPassword('');
                      setForgotConfirmPassword('');
                      setForgotOtpError('');
                      dispatch(setAuthModalMode('forgot'));
                    }}
                    className="text-xs text-[#A3E635] hover:underline font-bold cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    className="w-full bg-[#090A0C] border border-white/15 focus:border-[#A3E635] text-sm text-white placeholder-gray-500 px-3.5 py-2.5 pr-10 rounded-lg outline-none transition-all"
                    {...registerLogin('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-gray-400 hover:text-white transition-colors cursor-pointer text-xs"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                {loginErrors.password && (
                  <span className="text-xs text-rose-400 font-sans">{loginErrors.password.message}</span>
                )}
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 mt-2 bg-[#A3E635] hover:bg-[#84CC16] text-black font-extrabold text-base rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#A3E635]/25 active:scale-[0.99] disabled:opacity-50 font-sans"
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-circle-notch animate-spin text-black"></i>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>Log In</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ================================================================= */}
        {/* 2. SIGN UP MODE (STEP 1: FILL DETAILS & NO USERNAME)              */}
        {/* ================================================================= */}
        {mode === 'signup' && signupStep === 1 && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1 pr-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading tracking-tight">
                Create Account
              </h1>
              <p className="text-xs text-gray-400 font-sans">
                Already have an account ?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    dispatch(setAuthModalMode('login'));
                  }}
                  className="text-[#A3E635] hover:underline font-bold cursor-pointer"
                >
                  Log in
                </button>
              </p>
            </div>

            <form onSubmit={handleSubmitSignup(onSignupSubmitStep1)} className="flex flex-col gap-3.5">
              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-200">First Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Venkat"
                    className="w-full bg-[#090A0C] border border-white/15 focus:border-[#A3E635] text-xs text-white placeholder-gray-500 px-3 py-2 rounded-lg outline-none"
                    {...registerSignup('firstName')}
                  />
                  {signupErrors.firstName && (
                    <span className="text-[10px] text-rose-400">{signupErrors.firstName.message}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-200">Last Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Kaveti"
                    className="w-full bg-[#090A0C] border border-white/15 focus:border-[#A3E635] text-xs text-white placeholder-gray-500 px-3 py-2 rounded-lg outline-none"
                    {...registerSignup('lastName')}
                  />
                  {signupErrors.lastName && (
                    <span className="text-[10px] text-rose-400">{signupErrors.lastName.message}</span>
                  )}
                </div>
              </div>

              {/* Email Address */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-200">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. venkat@mailinator.com"
                  className="w-full bg-[#090A0C] border border-white/15 focus:border-[#A3E635] text-xs text-white placeholder-gray-500 px-3 py-2 rounded-lg outline-none"
                  {...registerSignup('email')}
                />
                {signupErrors.email && (
                  <span className="text-[10px] text-rose-400">{signupErrors.email.message}</span>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-200">Password</label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password (min 6 characters)"
                    className="w-full bg-[#090A0C] border border-white/15 focus:border-[#A3E635] text-xs text-white placeholder-gray-500 px-3 py-2 pr-9 rounded-lg outline-none"
                    {...registerSignup('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 text-gray-400 hover:text-white transition-colors cursor-pointer text-xs"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                {signupErrors.password && (
                  <span className="text-[10px] text-rose-400">{signupErrors.password.message}</span>
                )}
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-200">Confirm Password</label>
                <div className="relative flex items-center">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    className="w-full bg-[#090A0C] border border-white/15 focus:border-[#A3E635] text-xs text-white placeholder-gray-500 px-3 py-2 pr-9 rounded-lg outline-none"
                    {...registerSignup('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 text-gray-400 hover:text-white transition-colors cursor-pointer text-xs"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    <i className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                {signupErrors.confirmPassword && (
                  <span className="text-[10px] text-rose-400">{signupErrors.confirmPassword.message}</span>
                )}
              </div>

              {signupOtpError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-lg">
                  {signupOtpError}
                </div>
              )}

              <button
                type="submit"
                disabled={signupOtpLoading}
                className="w-full py-2.5 px-4 mt-2 bg-[#A3E635] hover:bg-[#84CC16] text-black font-extrabold text-sm rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#A3E635]/25 active:scale-[0.99] disabled:opacity-50 font-sans"
              >
                {signupOtpLoading ? (
                  <>
                    <i className="fa-solid fa-circle-notch animate-spin text-black"></i>
                    <span>Sending Verification Code...</span>
                  </>
                ) : (
                  <span>Sign Up &amp; Verify Email</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ================================================================= */}
        {/* 2B. SIGN UP MODE (STEP 2: OTP VERIFICATION & API SUBMIT)          */}
        {/* ================================================================= */}
        {mode === 'signup' && signupStep === 2 && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1 pr-6">
              <h1 className="text-2xl font-extrabold text-white font-heading tracking-tight">
                Verify Your Email
              </h1>
              <p className="text-xs text-gray-400 font-sans">
                We sent a 6-digit verification code to{' '}
                <strong className="text-white font-mono">{pendingSignupData?.email}</strong>
              </p>
            </div>

            <form onSubmit={handleVerifySignupOtpAndRegister} className="flex flex-col gap-4">
              {/* 6-Digit OTP Code */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-200">Enter 6-Digit Code</label>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  placeholder="e.g. 550865"
                  value={signupOtpCode}
                  onChange={(e) => setSignupOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-[#090A0C] border border-white/15 focus:border-[#A3E635] text-lg text-center tracking-widest font-mono text-white placeholder-gray-600 px-4 py-3 rounded-lg outline-none"
                />
                {signupOtpError && (
                  <span className="text-xs text-rose-400 font-sans">{signupOtpError}</span>
                )}
              </div>

              {/* Resend OTP Counter */}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Didn't receive code?</span>
                {signupOtpTimer > 0 ? (
                  <span className="font-mono text-gray-400">
                    Resend in <strong className="text-[#A3E635]">{signupOtpTimer}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendSignupOtp}
                    disabled={signupOtpLoading}
                    className="text-[#A3E635] hover:underline font-bold cursor-pointer"
                  >
                    Resend Code
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={signupOtpLoading || signupOtpCode.length !== 6}
                className="w-full py-3 px-4 bg-[#A3E635] hover:bg-[#84CC16] text-black font-extrabold text-sm rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#A3E635]/25 active:scale-[0.99] disabled:opacity-50 font-sans"
              >
                {signupOtpLoading ? (
                  <>
                    <i className="fa-solid fa-circle-notch animate-spin text-black"></i>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <span>Verify &amp; Create Account</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSignupStep(1)}
                className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer text-center"
              >
                <i className="fa-solid fa-arrow-left mr-1.5 text-xs"></i>
                Change Email / Edit Details
              </button>
            </form>
          </div>
        )}

        {/* ================================================================= */}
        {/* 3. FORGOT PASSWORD MODE (EXACT 2-STEP OTP IMPLEMENTATION)         */}
        {/* ================================================================= */}
        {mode === 'forgot' && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1 pr-6">
              <h1 className="text-2xl font-extrabold text-white font-heading tracking-tight">
                Reset Password
              </h1>
              <p className="text-xs text-gray-400 font-sans">
                {forgotStep === 1
                  ? 'Enter your registered email address to receive a 6-digit reset OTP.'
                  : `Enter the 6-digit code sent to ${forgotEmail} and choose a new password.`}
              </p>
            </div>

            {/* STEP 1: Enter Email & Send OTP */}
            {forgotStep === 1 ? (
              <form onSubmit={handleSendForgotOtp} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-200">Email Address</label>
                  <input
                    type="email"
                    placeholder="Enter registered email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-[#090A0C] border border-white/15 focus:border-[#A3E635] text-sm text-white placeholder-gray-500 px-3.5 py-2.5 rounded-lg outline-none transition-all"
                  />
                  {forgotOtpError && (
                    <span className="text-xs text-rose-400 font-sans">{forgotOtpError}</span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={forgotOtpLoading || !forgotEmail.trim()}
                  className="w-full py-3 px-4 bg-[#A3E635] hover:bg-[#84CC16] text-black font-extrabold text-sm rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#A3E635]/25 active:scale-[0.99] disabled:opacity-50 font-sans"
                >
                  {forgotOtpLoading ? (
                    <>
                      <i className="fa-solid fa-circle-notch animate-spin text-black"></i>
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <span>Send Reset OTP</span>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      dispatch(setAuthModalMode('login'));
                    }}
                    className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <i className="fa-solid fa-arrow-left text-xs"></i>
                    <span>Back to Login</span>
                  </button>
                </div>
              </form>
            ) : (
              /* STEP 2: Verify OTP & Reset Password with Full Validation */
              <form onSubmit={handleVerifyForgotOtpAndReset} className="flex flex-col gap-3.5">
                {/* 6-Digit OTP */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-200">6-Digit OTP Code *</label>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    placeholder="e.g. 550865"
                    value={forgotOtpCode}
                    onChange={(e) => setForgotOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-[#090A0C] border border-white/15 focus:border-[#A3E635] text-base text-center tracking-widest font-mono text-white placeholder-gray-600 px-3 py-2 rounded-lg outline-none"
                  />
                  {forgotCodeError && (
                    <span className="text-[10px] text-rose-400">{forgotCodeError}</span>
                  )}
                </div>

                {/* New Password */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-200">New Password *</label>
                  <div className="relative flex items-center">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Enter new password (min 6 characters)"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      className="w-full bg-[#090A0C] border border-white/15 focus:border-[#A3E635] text-xs text-white placeholder-gray-500 px-3 py-2 pr-9 rounded-lg outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 text-gray-400 hover:text-white transition-colors cursor-pointer text-xs"
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      <i className={`fa-solid ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                  {forgotNewPasswordError && (
                    <span className="text-[10px] text-rose-400">{forgotNewPasswordError}</span>
                  )}
                </div>

                {/* Confirm New Password */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-200">Confirm New Password *</label>
                  <div className="relative flex items-center">
                    <input
                      type={showNewConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter new password"
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      className="w-full bg-[#090A0C] border border-white/15 focus:border-[#A3E635] text-xs text-white placeholder-gray-500 px-3 py-2 pr-9 rounded-lg outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewConfirmPassword(!showNewConfirmPassword)}
                      className="absolute right-2.5 text-gray-400 hover:text-white transition-colors cursor-pointer text-xs"
                      aria-label={showNewConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      <i className={`fa-solid ${showNewConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                  {forgotConfirmPasswordError && (
                    <span className="text-[10px] text-rose-400">{forgotConfirmPasswordError}</span>
                  )}
                </div>

                {forgotOtpError && (
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-lg">
                    {forgotOtpError}
                  </div>
                )}

                {/* Resend OTP Bar */}
                <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                  <span>Didn't receive OTP?</span>
                  {forgotOtpTimer > 0 ? (
                    <span className="font-mono text-gray-400">
                      Resend in <strong className="text-[#A3E635]">{forgotOtpTimer}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendForgotOtp}
                      disabled={forgotOtpLoading}
                      className="text-[#A3E635] hover:underline font-bold cursor-pointer"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={forgotOtpLoading}
                  className="w-full py-2.5 px-4 mt-1 bg-[#A3E635] hover:bg-[#84CC16] text-black font-extrabold text-sm rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#A3E635]/25 active:scale-[0.99] disabled:opacity-50 font-sans"
                >
                  {forgotOtpLoading ? (
                    <>
                      <i className="fa-solid fa-circle-notch animate-spin text-black"></i>
                      <span>Resetting Password...</span>
                    </>
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <i className="fa-solid fa-arrow-left mr-1 text-xs"></i>
                    Change Email
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      dispatch(setAuthModalMode('login'));
                    }}
                    className="text-[#A3E635] hover:underline font-bold cursor-pointer"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
