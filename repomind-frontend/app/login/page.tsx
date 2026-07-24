"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Brain, Lock, Mail, User, ArrowRight, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    const user = localStorage.getItem("repomind_user");
    if (user) {
      router.push("/workspace");
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Mock validation
    setTimeout(() => {
      if (!email.includes("@")) {
        setError("Please enter a valid email address.");
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        setLoading(false);
        return;
      }
      if (!isLogin && !name.trim()) {
        setError("Name cannot be empty.");
        setLoading(false);
        return;
      }

      // Successful simulated login
      localStorage.setItem(
        "repomind_user",
        JSON.stringify({
          email,
          name: isLogin ? email.split("@")[0] : name,
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${isLogin ? email : name}`,
        })
      );
      router.push("/workspace");
    }, 800);
  };

  const handleDemoLogin = () => {
    localStorage.setItem(
      "repomind_user",
      JSON.stringify({
        email: "demo@repomind.ai",
        name: "DemoUser",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=DemoUser",
      })
    );
    router.push("/workspace");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden font-sans">
      {/* Decorative Floating Blurred Gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/30 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-blue-900/20 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Grid Pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)`,
          backgroundSize: "24px 24px"
        }}
      ></div>

      {/* Main Glass Card container */}
      <div className="relative w-full max-w-md p-8 mx-4 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-2xl shadow-2xl transition-all duration-300">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 bg-zinc-800/60 border border-zinc-700/50 rounded-xl mb-3 shadow-inner">
            <Brain className="w-8 h-8 text-purple-400 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            RepoMind
          </h1>
          <p className="text-zinc-500 text-xs mt-1">
            AI-Powered Codebase Intelligence & RAG Exploration
          </p>
        </div>

        {/* Action Toggle Tabs */}
        <div className="flex w-full p-1 bg-zinc-950 border border-zinc-800/80 rounded-lg mb-6">
          <button
            onClick={() => { setIsLogin(true); setError(""); }}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
              isLogin 
                ? "bg-zinc-800 text-white shadow-sm" 
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(""); }}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
              !isLogin 
                ? "bg-zinc-800 text-white shadow-sm" 
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="p-3 mb-4 text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg animate-shake">
            {error}
          </div>
        )}

        {/* Auth Forms */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5 font-sans">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Password
              </label>
              {isLogin && (
                <a href="#" className="text-[10px] text-zinc-500 hover:text-zinc-300">
                  Forgot Password?
                </a>
              )}
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition"
                required
              />
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 mt-2 bg-white text-black font-semibold text-sm rounded-lg hover:bg-zinc-200 disabled:opacity-50 transition active:scale-[0.98]"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                {isLogin ? "Sign In" : "Create Account"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-zinc-900/50 px-2 text-zinc-600 uppercase tracking-wider text-[10px]">
              Or Quick Access
            </span>
          </div>
        </div>

        {/* Demo Fast Entry button */}
        <button
          onClick={handleDemoLogin}
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-zinc-800 hover:border-zinc-700 hover:bg-zinc-950/40 text-zinc-400 hover:text-zinc-200 text-xs rounded-lg transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          Access Demo Account
        </button>
      </div>
    </div>
  );
}
