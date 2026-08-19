import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 p-1">
        <span className="font-bold text-white">CT</span>
      </div>
      <span className="text-xl font-bold text-slate-900">CareerTracker</span>
    </div>
  );
}

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [errors, setErrors] = useState({});
  
  const { login, register, googleLogin, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (!loading && isAuthenticated) navigate(from, { replace: true });
  }, [from, isAuthenticated, loading, navigate]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (isSignUp) {
      if (!fullName.trim()) {
        newErrors.fullName = 'Full name is required';
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getErrorMessage = (error) => {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail.map((item) => item.msg || item.detail).filter(Boolean).join(', ');
    return error.message || 'Something went wrong. Please try again.';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage({ type: '', text: '' });
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    try {
      if (isSignUp) {
        await register({ email, password, full_name: fullName });
        await login(email, password);
        setMessage({ type: 'success', text: 'Account created successfully!' });
      } else {
        await login(email, password);
      }
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    setMessage({ type: '', text: '' });
    setSubmitting(true);
    
    try {
      if (!credentialResponse?.credential) {
        throw new Error('No credential received from Google');
      }
      
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
      
      // Send the ID token to the backend to get an access token
      const response = await fetch(`${apiUrl}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refresh_token: credentialResponse.credential }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `Login failed: ${response.status}`);
      }
      
      // Store token then fetch user — this updates isAuthenticated in context
      localStorage.setItem('access_token', data.access_token);
      sessionStorage.setItem('has_session', '1');
      await googleLogin();  // fetches /me and sets isAuthenticated = true
      
      // navigate() is triggered by the useEffect watching isAuthenticated
    } catch (error) {
      console.error('Google login error:', error);
      
      let errorText = 'Google login failed';
      if (error.message.includes('No credential')) {
        errorText = 'Google authentication cancelled or failed to load. Please try again.';
      } else if (error.message.includes('audience')) {
        errorText = 'Google credentials mismatch. Please check your Google OAuth setup.';
      } else if (error.message.includes('401')) {
        errorText = 'Invalid Google credentials. Please verify your setup.';
      } else if (error.message.includes('503')) {
        errorText = 'Google service temporarily unavailable. Please try again.';
      } else {
        errorText = error.message || 'Unknown error occurred';
      }
      
      setMessage({ type: 'error', text: errorText });
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = () => {
    setIsSignUp((current) => !current);
    setMessage({ type: '', text: '' });
    setErrors({});
    setPassword('');
    setConfirmPassword('');
    setFullName('');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-screen flex-col items-center justify-center max-w-md">
        
        {/* Logo Section */}
        <div className="mb-8 w-full">
          <Logo />
        </div>

        {/* Card */}
        <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm">
          
          {/* Header */}
          <div className="border-b border-slate-200 px-6 py-8 sm:px-8">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {isSignUp 
                ? 'Join thousands organizing their job search in one place' 
                : 'Sign in to your account to continue'}
            </p>
          </div>

          {/* Body */}
          <div className="px-6 py-8 sm:px-8">
            
            {/* Messages */}
            {message.text && (
              <div className={`mb-6 flex gap-3 rounded-lg border px-4 py-3 text-sm ${
                message.type === 'error' 
                  ? 'border-red-200 bg-red-50 text-red-700' 
                  : message.type === 'info'
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}>
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 flex-none" />
                <span>{message.text}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Full Name Field (Sign Up only) */}
              {isSignUp && (
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1.5">
                    Full name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) setErrors({ ...errors, fullName: '' });
                    }}
                    placeholder="John Doe"
                    className={`w-full rounded-lg border px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 ${
                      errors.fullName
                        ? 'border-red-300 focus:ring-2 focus:ring-red-500/20'
                        : 'border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10'
                    }`}
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
                  )}
                </div>
              )}

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  placeholder="you@example.com"
                  className={`w-full rounded-lg border px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 ${
                    errors.email
                      ? 'border-red-300 focus:ring-2 focus:ring-red-500/20'
                      : 'border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10'
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength="8"
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: '' });
                    }}
                    placeholder="At least 8 characters"
                    className={`w-full rounded-lg border px-4 py-3 pr-11 text-sm outline-none transition placeholder:text-slate-400 ${
                      errors.password
                        ? 'border-red-300 focus:ring-2 focus:ring-red-500/20'
                        : 'border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password Field (Sign Up only) */}
              {isSignUp && (
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1.5">
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength="8"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                      }}
                      placeholder="Re-enter your password"
                      className={`w-full rounded-lg border px-4 py-3 pr-11 text-sm outline-none transition placeholder:text-slate-400 ${
                        errors.confirmPassword
                          ? 'border-red-300 focus:ring-2 focus:ring-red-500/20'
                          : 'border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              )}

              {/* Forgot Password Link (Login only) */}
              {!isSignUp && (
                <div className="flex justify-end">
                  <a href="#" className="text-xs font-medium text-emerald-600 hover:text-emerald-700">
                    Forgot password?
                  </a>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="mt-6 w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-emerald-600"
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{isSignUp ? 'Creating account...' : 'Signing in...'}</span>
                  </div>
                ) : (
                  <span>{isSignUp ? 'Create account' : 'Sign in'}</span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">Or</span>
              </div>
            </div>

            {/* Google Login Button */}
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => {
                console.error('Google login failed');
                setMessage({ 
                  type: 'error', 
                  text: 'Google login failed. Please check your credentials and try again.' 
                });
              }}
              theme="outline"
              size="large"
              width="100%"
            />

            {/* Toggle */}
            <p className="mt-6 text-center text-sm text-slate-600">
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <button
                type="button"
                onClick={switchMode}
                className="font-semibold text-emerald-600 hover:text-emerald-700"
              >
                {isSignUp ? 'Sign in' : 'Create account'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-slate-500">
          Track your job search. Land your dream role.
        </p>
      </div>
    </main>
  );
}
