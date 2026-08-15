import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { loginUser, registerUser, setAuthModalMode } from '../redux/authSlice';
import { toast } from 'react-hot-toast';

// Login Validation Schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});
type LoginFormData = z.infer<typeof loginSchema>;

// Signup Validation Schema matching backend User SignUp API
const signupSchema = z.object({
  firstName: z.string().min(1, 'First Name is required'),
  lastName: z.string().min(1, 'Last Name is required'),
  labelUserName: z.string().min(2, 'Username is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});
type SignupFormData = z.infer<typeof signupSchema>;

interface AuthPageProps {
  defaultMode?: 'login' | 'signup';
  onCloseModal?: () => void;
}

export const Login: React.FC<AuthPageProps> = ({ defaultMode, onCloseModal }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { loading, error, authModalMode } = useAppSelector((state) => state.auth);

  const initialMode = defaultMode || authModalMode || (location.pathname === '/signup' ? 'signup' : 'login');
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  useEffect(() => {
    if (authModalMode) {
      setMode(authModalMode);
    }
  }, [authModalMode]);

  // Login Form
  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'venkat@mailinator.com',
      password: 'Venkat@123',
    },
  });

  // Signup Form
  const {
    register: registerSignup,
    handleSubmit: handleSubmitSignup,
    formState: { errors: signupErrors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      labelUserName: '',
      email: '',
      password: '',
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

  const onLoginSubmit = async (data: LoginFormData) => {
    const result = await dispatch(loginUser(data));
    if (loginUser.fulfilled.match(result)) {
      const userObj = result.payload;
      const userName = userObj?.firstName || userObj?.fullName || userObj?.labelUserName || 'User';
      toast.success(`Welcome ${userName}`);
      handleClose();
      const fromPath = (location.state as any)?.from?.pathname;
      if (location.pathname === '/login' || location.pathname === '/signup') {
        if (fromPath && fromPath !== '/login' && fromPath !== '/signup') {
          navigate(fromPath);
        } else {
          navigate('/');
        }
      }
    } else {
      toast.error((result.payload as string) || 'Invalid Email or Password');
    }
  };

  const onSignupSubmit = async (data: SignupFormData) => {
    const result = await dispatch(registerUser({
      firstName: data.firstName,
      lastName: data.lastName,
      labelUserName: data.labelUserName,
      email: data.email,
      password: data.password,
      role: 'USER',
    }));
    if (registerUser.fulfilled.match(result)) {
      toast.success('User Created Successfully! Please Log In with your credentials.');
      // Switch mode to login so user can log in
      setMode('login');
      dispatch(setAuthModalMode('login'));
    } else {
      toast.error((result.payload as string) || 'Error while Creating the User');
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

        {/* LOG IN MODE */}
        {mode === 'login' ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1 pr-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading tracking-tight">
                Log in
              </h1>
              <p className="text-xs text-gray-400 font-sans">
                New user ?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-[#E5A117] hover:underline font-bold cursor-pointer"
                >
                  Register Now
                </button>
              </p>
            </div>

            <form onSubmit={handleSubmitLogin(onLoginSubmit)} className="flex flex-col gap-4">
              {/* Field 1: Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-200">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  className="w-full bg-[#090A0C] border border-white/15 focus:border-[#14B8A6] text-sm text-white placeholder-gray-500 px-3.5 py-2.5 rounded-lg outline-none transition-all"
                  {...registerLogin('email')}
                />
                {loginErrors.email && (
                  <span className="text-xs text-rose-400 font-sans">{loginErrors.email.message}</span>
                )}
              </div>

              {/* Field 2: Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-200">
                  Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    className="w-full bg-[#090A0C] border border-white/15 focus:border-[#14B8A6] text-sm text-white placeholder-gray-500 px-3.5 py-2.5 pr-10 rounded-lg outline-none transition-all"
                    {...registerLogin('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-gray-400 hover:text-white transition-colors cursor-pointer text-xs"
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                {loginErrors.password && (
                  <span className="text-xs text-rose-400 font-sans">{loginErrors.password.message}</span>
                )}
              </div>

              {error && <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-lg">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 mt-2 bg-[#14B8A6] hover:bg-[#0D9488] text-black font-extrabold text-base rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#A3E635]/20 active:scale-[0.99] disabled:opacity-50 font-sans"
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
        ) : (
          /* CREATE ACCOUNT SIGNUP MODE */
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1 pr-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading tracking-tight">
                Create Account
              </h1>
              <p className="text-xs text-gray-400 font-sans">
                Already have an account ?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-[#E5A117] hover:underline font-bold cursor-pointer"
                >
                  Log in
                </button>
              </p>
            </div>

            <form onSubmit={handleSubmitSignup(onSignupSubmit)} className="flex flex-col gap-3.5">
              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-200">First Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Venkat"
                    className="w-full bg-[#090A0C] border border-white/15 focus:border-[#14B8A6] text-xs text-white placeholder-gray-500 px-3 py-2 rounded-lg outline-none"
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
                    className="w-full bg-[#090A0C] border border-white/15 focus:border-[#14B8A6] text-xs text-white placeholder-gray-500 px-3 py-2 rounded-lg outline-none"
                    {...registerSignup('lastName')}
                  />
                  {signupErrors.lastName && (
                    <span className="text-[10px] text-rose-400">{signupErrors.lastName.message}</span>
                  )}
                </div>
              </div>

              {/* Username */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-200">Username</label>
                <input
                  type="text"
                  placeholder="e.g. venkat123"
                  className="w-full bg-[#090A0C] border border-white/15 focus:border-[#14B8A6] text-xs text-white placeholder-gray-500 px-3 py-2 rounded-lg outline-none"
                  {...registerSignup('labelUserName')}
                />
                {signupErrors.labelUserName && (
                  <span className="text-[10px] text-rose-400">{signupErrors.labelUserName.message}</span>
                )}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-200">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. venkat@mailinator.com"
                  className="w-full bg-[#090A0C] border border-white/15 focus:border-[#14B8A6] text-xs text-white placeholder-gray-500 px-3 py-2 rounded-lg outline-none"
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
                    placeholder="Create a strong password"
                    className="w-full bg-[#090A0C] border border-white/15 focus:border-[#14B8A6] text-xs text-white placeholder-gray-500 px-3 py-2 pr-9 rounded-lg outline-none"
                    {...registerSignup('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 text-gray-400 hover:text-white transition-colors cursor-pointer text-xs"
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                {signupErrors.password && (
                  <span className="text-[10px] text-rose-400">{signupErrors.password.message}</span>
                )}
              </div>

              {error && <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-lg">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 mt-2 bg-[#14B8A6] hover:bg-[#0D9488] text-black font-extrabold text-sm rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#A3E635]/20 active:scale-[0.99] disabled:opacity-50 font-sans"
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-circle-notch animate-spin text-black"></i>
                    <span>Creating User...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
