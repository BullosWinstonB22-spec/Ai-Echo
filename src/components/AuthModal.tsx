import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { authService, AuthService } from '../lib/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'forgot';
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrorMsg(null);
    setInfoMsg(null);
  };

  const handleSwitchMode = (newMode: 'login' | 'signup' | 'forgot') => {
    setErrorMsg(null);
    setInfoMsg(null);
    setMode(newMode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (mode === 'signup') {
      if (!name.trim()) {
        setErrorMsg('Please enter your name.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }

      setIsLoading(true);
      try {
        await authService.signUpWithEmail(name, email, password);
        onSuccess();
        onClose();
        resetForm();
      } catch (err: any) {
        setErrorMsg(AuthService.getFriendlyErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    } else if (mode === 'login') {
      if (!email.trim()) {
        setErrorMsg('Please enter your email.');
        return;
      }
      if (!password) {
        setErrorMsg('Please enter your password.');
        return;
      }

      setIsLoading(true);
      try {
        await authService.signInWithEmail(email, password);
        onSuccess();
        onClose();
        resetForm();
      } catch (err: any) {
        setErrorMsg(AuthService.getFriendlyErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    } else if (mode === 'forgot') {
      if (!email.trim() || !email.includes('@')) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }

      setIsLoading(true);
      try {
        await authService.sendPasswordReset(email);
        setInfoMsg('Password reset email sent! Check your inbox to choose a new password.');
      } catch (err: any) {
        setErrorMsg(AuthService.getFriendlyErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setIsLoading(true);
    try {
      await authService.signInWithGoogle();
      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      setErrorMsg(AuthService.getFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#1E1B4B]/40 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="relative w-full max-w-md p-6 sm:p-7 rounded-[32px] bg-white/95 backdrop-blur-2xl border border-white/90 shadow-[0_20px_60px_rgba(139,92,246,0.18)] z-10 overflow-hidden"
        >
          {/* Ambient Top Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-purple-300/30 rounded-full blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-[#1E1B4B] hover:bg-purple-50 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Title */}
          <div className="text-center space-y-1 mb-6">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-[#C084FC] via-[#A855F7] to-[#7C3AED] flex items-center justify-center text-white shadow-md shadow-purple-500/25 mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1E1B4B] tracking-tight">
              {mode === 'signup' && 'Create Your Echo Account'}
              {mode === 'login' && 'Welcome Back to Echo'}
              {mode === 'forgot' && 'Reset Echo Password'}
            </h2>
            <p className="text-xs text-[#71688D]">
              {mode === 'signup' && 'Sign up to safely save and sync your conversations across devices'}
              {mode === 'login' && 'Sign in to access your personal history, preferences, and mascot'}
              {mode === 'forgot' && "Enter your email and we'll send you a secure password reset link"}
            </p>
          </div>

          {/* Alert messages */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 mb-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {infoMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 mb-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{infoMsg}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#575073] block mb-1.5 ml-1">
                  Your Name
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Jackson Vance"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-purple-50/60 border border-purple-100 text-sm text-[#1E1B4B] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED] focus:bg-white transition-all shadow-2xs"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#575073] block mb-1.5 ml-1">
                Email Address
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-purple-50/60 border border-purple-100 text-sm text-[#1E1B4B] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED] focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1.5 ml-1 mr-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#575073]">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => handleSwitchMode('forgot')}
                      className="text-[11px] font-semibold text-[#7C3AED] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-11 py-3 rounded-2xl bg-purple-50/60 border border-purple-100 text-sm text-[#1E1B4B] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED] focus:bg-white transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-[#7C3AED] transition-colors cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#575073] block mb-1.5 ml-1">
                  Confirm Password
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-purple-50/60 border border-purple-100 text-sm text-[#1E1B4B] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED] focus:bg-white transition-all shadow-2xs"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9] hover:from-[#7C3AED] hover:to-[#5B21B6] text-white font-bold text-sm shadow-md shadow-purple-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>
                    {mode === 'signup' && 'Create Account'}
                    {mode === 'login' && 'Sign In'}
                    {mode === 'forgot' && 'Send Reset Email'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Social Sign-in Divider */}
          {mode !== 'forgot' && (
            <div className="mt-4 pt-4 border-t border-purple-100">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-purple-50/80 border border-purple-200 text-xs font-bold text-[#1E1B4B] shadow-2xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          )}

          {/* Toggle between Sign In / Sign Up */}
          <div className="mt-5 text-center text-xs text-[#71688D]">
            {mode === 'login' && (
              <p>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchMode('signup')}
                  className="font-bold text-[#7C3AED] hover:underline cursor-pointer ml-1"
                >
                  Create one now
                </button>
              </p>
            )}

            {mode === 'signup' && (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchMode('login')}
                  className="font-bold text-[#7C3AED] hover:underline cursor-pointer ml-1"
                >
                  Sign in
                </button>
              </p>
            )}

            {mode === 'forgot' && (
              <p>
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchMode('login')}
                  className="font-bold text-[#7C3AED] hover:underline cursor-pointer ml-1"
                >
                  Back to Sign In
                </button>
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
