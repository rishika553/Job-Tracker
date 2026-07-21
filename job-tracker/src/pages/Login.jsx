import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Google "G" logo SVG — avoids any external image dependency
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
  </svg>
);

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const { login, register, googleLogin, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  // Redirect away from login once authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, from]);

  // Stable refs — avoids re-initializing the Google SDK on every render
  const googleLoginRef = useRef(googleLogin);
  useEffect(() => { googleLoginRef.current = googleLogin; }, [googleLogin]);

  // Callback passed to Google SDK — stable identity via useCallback + refs
  const handleGoogleCredential = useCallback(async (response) => {
    setLocalError('');
    setSubmitting(true);
    try {
      await googleLoginRef.current(response.credential);
      // Navigation is handled by the isAuthenticated useEffect above
    } catch (err) {
      setLocalError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, []);

  // Initialize Google Identity SDK once — no renderButton() call, so no iframe/403
  const googleInitialized = useRef(false);
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || googleInitialized.current) return;

    const init = () => {
      if (!window.google?.accounts?.id) return false;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      googleInitialized.current = true;
      return true;
    };

    if (!init()) {
      const id = window.setInterval(() => { if (init()) window.clearInterval(id); }, 100);
      return () => window.clearInterval(id);
    }
  }, [handleGoogleCredential]);

  // Trigger Google One Tap / account chooser popup — no iframe rendered in page
  const handleGoogleSignIn = useCallback(() => {
    if (!window.google?.accounts?.id) {
      setLocalError('Google sign-in is not ready yet. Please wait a moment.');
      return;
    }
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // One Tap was suppressed (e.g. user previously dismissed) — show error hint
        setLocalError(
          notification.getNotDisplayedReason() === 'opt_out_or_no_session'
            ? 'No Google account found. Please sign in via Google first.'
            : 'Google sign-in was dismissed. Please try again.'
        );
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSubmitting(true);
    try {
      if (isSignUp) {
        await register({ email, password, full_name: fullName });
        await login(email, password);
      } else {
        await login(email, password);
      }
      // Navigation handled by isAuthenticated useEffect
    } catch (err) {
      setLocalError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Dev-only mock bypass
  const handleDevGoogleAuth = async () => {
    setLocalError('');
    setSubmitting(true);
    try {
      await googleLogin('mock-google-token-12345');
      // Navigation handled by isAuthenticated useEffect
    } catch (err) {
      setLocalError(err.message || 'Google login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isSignUp ? 'Create a CareerTrack Account' : 'Welcome back to CareerTrack'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {isSignUp
              ? 'Start tracking job applications automatically'
              : 'Sign in to access your AI application dashboard'}
          </p>
        </div>

        {localError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{localError}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Johnson"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/25"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? 'Sign Up' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-800" />
          <span className="text-xs text-slate-500 uppercase tracking-wider">or</span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        {/* Custom Google button — no GSI renderButton(), no iframe, no 403 */}
        <div className="space-y-3">
          {GOOGLE_CLIENT_ID ? (
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-700 font-medium text-sm rounded-xl flex items-center justify-center gap-3 transition-all border border-gray-200 shadow-sm"
            >
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>
          ) : null}

          {import.meta.env.DEV && (
            <button
              type="button"
              onClick={handleDevGoogleAuth}
              disabled={submitting}
              className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 font-medium text-xs rounded-xl transition-colors"
            >
              Dev: Mock Google Login
            </button>
          )}
        </div>

        <div className="mt-8 text-center text-xs text-slate-400">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setLocalError(''); }}
            className="text-indigo-400 font-semibold hover:underline ml-1"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
