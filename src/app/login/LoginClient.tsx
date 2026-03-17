"use client";

import { signIn } from "next-auth/react";

export default function LoginClient() {
  return (
    <main className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-rose-100/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-amber-100/30 blur-3xl" />
      </div>

      {/* Logo */}
      <div className="mb-14 text-center animate-fade-in-up relative">
        <div className="w-20 h-20 rounded-[22px] bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center mx-auto mb-7 shadow-xl shadow-rose-500/20">
          <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C8 2 4 6 4 10c0 5.25 7 11.5 7.68 12.07a.5.5 0 0 0 .64 0C13 21.5 20 15.25 20 10c0-4-4-8-8-8z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">Away Together</h1>
        <p className="mt-2.5 text-stone-400 text-[15px]">Travel stories worth sharing</p>
      </div>

      {/* Sign-in buttons */}
      <div className="w-full max-w-sm space-y-3 animate-fade-in-up delay-100 relative">
        <button
          onClick={() => signIn("google", { callbackUrl: "/feed" })}
          className="w-full flex items-center justify-center gap-3 h-[54px] px-5 rounded-2xl bg-white border border-stone-200/80 active:scale-[0.98] transition-all duration-200 font-semibold text-[15px] text-stone-700 shadow-sm shadow-stone-100"
        >
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <button
          onClick={() => signIn("apple", { callbackUrl: "/feed" })}
          className="w-full flex items-center justify-center gap-3 h-[54px] px-5 rounded-2xl bg-stone-900 text-white active:scale-[0.98] transition-all duration-200 font-semibold text-[15px] shadow-sm"
        >
          <svg className="w-[18px] h-[18px] fill-white" viewBox="0 0 814 1000">
            <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 600.3 0 500.3 0 404.5 0 152.8 173.9 10.8 345.2 10.8c80 0 146.5 52.7 195.9 52.7 47.1 0 120.9-55.8 212.2-55.8zM748.3 5.1c-39.2 0-82.9 26-110.3 62.7-22.5 30.6-40.8 76.5-40.8 122.3 0 5.8.6 11.5 1.3 17.3 3.2.6 8.3 1.3 13.5 1.3 33.5 0 74.8-22.5 98.5-58.5 27-39.5 44.6-84.5 44.6-130.3 0-5.1-.6-10.3-1.3-15.4z"/>
          </svg>
          Continue with Apple
        </button>
      </div>

      {/* Demo login */}
      <div className="w-full max-w-sm mt-10 animate-fade-in-up delay-200 relative">
        <div className="relative flex items-center my-5">
          <div className="flex-1 border-t border-stone-200/60" />
          <span className="mx-4 text-[11px] text-stone-300 uppercase tracking-[0.15em] font-medium">or</span>
          <div className="flex-1 border-t border-stone-200/60" />
        </div>
        <button
          onClick={() => signIn("demo-login", { callbackUrl: "/feed" })}
          className="w-full h-[54px] rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 text-white active:scale-[0.98] transition-all duration-200 font-semibold text-[15px] shadow-lg shadow-rose-500/25"
        >
          Explore as Guest
        </button>
      </div>

      <p className="mt-14 text-[12px] text-stone-300 text-center max-w-xs animate-fade-in-up delay-300 relative">
        By continuing you agree to our Terms of Service and Privacy Policy.
      </p>
    </main>
  );
}
