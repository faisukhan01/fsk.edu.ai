'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  AtSign,
} from 'lucide-react';

// ==================== SVG Illustrations ====================

function DeskPersonIllustration() {
  return (
    <svg
      viewBox="0 0 400 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full max-w-[320px] mx-auto desk-illustration"
    >
      {/* Desk */}
      <rect x="60" y="200" width="280" height="12" rx="6" fill="#065f46" opacity="0.8" />
      <rect x="80" y="212" width="8" height="80" rx="3" fill="#064e3b" />
      <rect x="312" y="212" width="8" height="80" rx="3" fill="#064e3b" />
      <rect x="70" y="285" width="60" height="8" rx="3" fill="#064e3b" />
      <rect x="270" y="285" width="60" height="8" rx="3" fill="#064e3b" />

      {/* Laptop Base */}
      <rect x="110" y="182" width="160" height="18" rx="4" fill="#c8d6e5" />
      <rect x="108" y="196" width="164" height="6" rx="2" fill="#a4b0be" />

      {/* Laptop Screen */}
      <rect x="125" y="100" width="130" height="82" rx="6" fill="#2d3436" />
      <rect x="130" y="105" width="120" height="72" rx="4" fill="#059669" />
      {/* Screen Content */}
      <rect x="140" y="115" width="60" height="4" rx="2" fill="#34d399" opacity="0.8" />
      <rect x="140" y="125" width="100" height="3" rx="1.5" fill="#dfe6e9" opacity="0.5" />
      <rect x="140" y="133" width="85" height="3" rx="1.5" fill="#dfe6e9" opacity="0.4" />
      <rect x="140" y="141" width="95" height="3" rx="1.5" fill="#dfe6e9" opacity="0.3" />
      <rect x="140" y="153" width="40" height="14" rx="7" fill="#fff" opacity="0.3" />
      <rect x="190" y="153" width="40" height="14" rx="7" fill="#34d399" opacity="0.5" />
      {/* Code lines on screen */}
      <rect x="140" y="113" width="100" height="2" rx="1" fill="#34d399" opacity="0.3" />
      <rect x="140" y="119" width="80" height="2" rx="1" fill="#2dd4bf" opacity="0.3" />
      <rect x="140" y="149" width="90" height="2" rx="1" fill="#6ee7b7" opacity="0.3" />

      {/* Person - Body */}
      {/* Torso */}
      <path
        d="M175 120 C175 120 165 150 165 170 L165 195 L230 195 L230 170 C230 150 220 120 220 120 Z"
        fill="#059669"
      />
      {/* Shirt collar */}
      <path d="M185 110 L197 135 L209 110" stroke="#fff" strokeWidth="2" fill="none" opacity="0.6" />

      {/* Neck */}
      <rect x="190" y="85" width="20" height="25" rx="8" fill="#f0c8a0" />

      {/* Head */}
      <ellipse cx="200" cy="65" rx="28" ry="32" fill="#f0c8a0" />

      {/* Hair */}
      <path
        d="M172 55 C172 35 185 28 200 28 C215 28 228 35 228 55 C228 50 225 38 200 38 C175 38 172 50 172 55 Z"
        fill="#2d3436"
      />
      <path
        d="M170 55 C170 55 168 45 175 40"
        stroke="#2d3436"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M230 55 C230 55 232 45 225 40"
        stroke="#2d3436"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Eyes */}
      <ellipse cx="190" cy="62" rx="3.5" ry="4" fill="#2d3436" />
      <ellipse cx="210" cy="62" rx="3.5" ry="4" fill="#2d3436" />
      <circle cx="191" cy="61" r="1.2" fill="#fff" />
      <circle cx="211" cy="61" r="1.2" fill="#fff" />

      {/* Eyebrows */}
      <path d="M185 55 Q190 52 195 55" stroke="#2d3436" strokeWidth="1.5" fill="none" />
      <path d="M205 55 Q210 52 215 55" stroke="#2d3436" strokeWidth="1.5" fill="none" />

      {/* Nose */}
      <path d="M198 68 L200 74 L202 68" stroke="#d4a574" strokeWidth="1.2" fill="none" />

      {/* Smile */}
      <path d="M192 80 Q200 87 208 80" stroke="#c0785c" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Ears */}
      <ellipse cx="172" cy="65" rx="5" ry="7" fill="#f0c8a0" />
      <ellipse cx="228" cy="65" rx="5" ry="7" fill="#f0c8a0" />

      {/* Arms */}
      {/* Left arm reaching to keyboard */}
      <path
        d="M170 130 C155 140 145 160 150 180 L155 190 L168 185 L165 175 C162 165 165 150 172 142"
        fill="#059669"
        stroke="#047857"
        strokeWidth="1"
      />
      {/* Left hand */}
      <ellipse cx="155" cy="188" rx="8" ry="5" fill="#f0c8a0" transform="rotate(-10, 155, 188)" />

      {/* Right arm reaching to keyboard */}
      <path
        d="M225 130 C240 140 250 160 245 180 L240 190 L227 185 L230 175 C233 165 230 150 223 142"
        fill="#059669"
        stroke="#047857"
        strokeWidth="1"
      />
      {/* Right hand */}
      <ellipse cx="242" cy="188" rx="8" ry="5" fill="#f0c8a0" transform="rotate(10, 242, 188)" />

      {/* Chair */}
      <rect x="155" y="210" width="90" height="8" rx="4" fill="#065f46" />
      <rect x="170" y="218" width="6" height="50" rx="3" fill="#064e3b" />
      <rect x="224" y="218" width="6" height="50" rx="3" fill="#064e3b" />
      {/* Chair back */}
      <rect x="170" y="140" width="60" height="70" rx="8" fill="#065f46" opacity="0.7" />
      <rect x="180" y="148" width="40" height="54" rx="6" fill="#047857" opacity="0.5" />

      {/* Coffee mug on desk */}
      <rect x="290" y="182" width="20" height="18" rx="3" fill="#fff" opacity="0.8" />
      <path d="M310 188 C316 188 316 198 310 198" stroke="#fff" strokeWidth="2" fill="none" opacity="0.6" />
      {/* Steam */}
      <path d="M296 178 C296 172 300 172 300 166" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.3">
        <animate attributeName="d" values="M296 178 C296 172 300 172 300 166;M296 176 C298 170 294 170 296 164;M296 178 C296 172 300 172 300 166" dur="3s" repeatCount="indefinite" />
      </path>
      <path d="M304 178 C304 173 308 173 308 168" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.2">
        <animate attributeName="d" values="M304 178 C304 173 308 173 308 168;M304 176 C306 171 302 171 304 166;M304 178 C304 173 308 173 308 168" dur="3.5s" repeatCount="indefinite" />
      </path>

      {/* Small plant on desk */}
      <rect x="72" y="185" width="16" height="15" rx="3" fill="#34d399" opacity="0.7" />
      <circle cx="80" cy="180" r="10" fill="#10b981" opacity="0.7" />
      <circle cx="74" cy="175" r="7" fill="#14b8a6" opacity="0.6" />
      <circle cx="86" cy="177" r="6" fill="#2dd4bf" opacity="0.6" />
    </svg>
  );
}

function WelcomePersonIllustration() {
  return (
    <svg
      viewBox="0 0 400 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full max-w-[300px] mx-auto desk-illustration"
    >
      {/* Standing person */}
      {/* Legs */}
      <rect x="175" y="210" width="14" height="70" rx="6" fill="#2d3436" />
      <rect x="210" y="210" width="14" height="70" rx="6" fill="#2d3436" />

      {/* Shoes */}
      <ellipse cx="182" cy="282" rx="12" ry="6" fill="#2d3436" />
      <ellipse cx="217" cy="282" rx="12" ry="6" fill="#2d3436" />

      {/* Body / Shirt */}
      <path
        d="M168 100 C165 120 162 150 164 210 L235 210 C237 150 234 120 231 100 Z"
        fill="#0d9488"
      />

      {/* Arms up waving */}
      {/* Left arm */}
      <path
        d="M168 110 C145 100 130 80 135 55 L140 50"
        fill="#0d9488"
        stroke="#0f766e"
        strokeWidth="1"
      />
      <ellipse cx="138" cy="48" rx="7" ry="6" fill="#f0c8a0" transform="rotate(-20, 138, 48)" />

      {/* Right arm waving */}
      <path
        d="M231 110 C255 95 265 70 258 48"
        fill="#0d9488"
        stroke="#0f766e"
        strokeWidth="1"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 231 110;5 231 110;0 231 110;-5 231 110;0 231 110"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </path>
      <ellipse cx="260" cy="46" rx="7" ry="6" fill="#f0c8a0" transform="rotate(15, 260, 46)">
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="15 260 46;20 260 46;15 260 46;10 260 46;15 260 46"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </ellipse>

      {/* Neck */}
      <rect x="192" y="72" width="16" height="22" rx="7" fill="#f0c8a0" />

      {/* Head */}
      <ellipse cx="200" cy="50" rx="26" ry="30" fill="#f0c8a0" />

      {/* Hair */}
      <path
        d="M174 42 C174 22 187 15 200 15 C213 15 226 22 226 42 C226 37 223 25 200 25 C177 25 174 37 174 42 Z"
        fill="#065f46"
      />
      <path
        d="M172 42 C170 38 173 32 178 28"
        stroke="#065f46"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M228 42 C230 38 227 32 222 28"
        stroke="#065f46"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Eyes - happy squint */}
      <path d="M186 48 Q190 44 194 48" stroke="#2d3436" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M206 48 Q210 44 214 48" stroke="#2d3436" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Big smile */}
      <path d="M188 58 Q200 70 212 58" stroke="#c0785c" strokeWidth="2" fill="#e17055" opacity="0.5" strokeLinecap="round" />

      {/* Blush */}
      <ellipse cx="183" cy="56" rx="6" ry="3" fill="#fab1a0" opacity="0.4" />
      <ellipse cx="217" cy="56" rx="6" ry="3" fill="#fab1a0" opacity="0.4" />

      {/* Sparkles around */}
      <g>
        <path d="M130 30 L133 20 L136 30 L146 33 L136 36 L133 46 L130 36 L120 33 Z" fill="#ffeaa7" opacity="0.6">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
        </path>
        <path d="M260 80 L262 74 L264 80 L270 82 L264 84 L262 90 L260 84 L254 82 Z" fill="#dfe6e9" opacity="0.5">
          <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2.5s" repeatCount="indefinite" />
        </path>
        <path d="M155 100 L157 95 L159 100 L164 102 L159 104 L157 109 L155 104 L150 102 Z" fill="#ffeaa7" opacity="0.4">
          <animate attributeName="opacity" values="0.4;0.9;0.4" dur="1.8s" repeatCount="indefinite" />
        </path>
      </g>

      {/* Floating hearts */}
      <g opacity="0.5">
        <path d="M110 60 C110 55 115 50 120 55 C125 50 130 55 130 60 C130 68 120 75 120 75 C120 75 110 68 110 60 Z" fill="#fd79a8">
          <animateTransform attributeName="transform" type="translate" values="0,0;-5,-10;0,0" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="3s" repeatCount="indefinite" />
        </path>
        <path d="M270 35 C270 31 274 27 278 31 C282 27 286 31 286 35 C286 41 278 47 278 47 C278 47 270 41 270 35 Z" fill="#fd79a8">
          <animateTransform attributeName="transform" type="translate" values="0,0;5,-8;0,0" dur="3.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0.6;0.2" dur="3.5s" repeatCount="indefinite" />
        </path>
      </g>
    </svg>
  );
}

// ==================== Particle Background ====================

function ParticleBackground() {
  const particles = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 15,
      drift: (Math.random() - 0.5) * 60,
      opacity: Math.random() * 0.5 + 0.1,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-white"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animation: `particleFloat ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
            ['--drift' as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

// ==================== Password Strength ====================

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
  width: string;
} {
  if (!password) return { score: 0, label: '', color: '#e5e7eb', width: '0%' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Weak', color: '#ef4444', width: '20%' };
  if (score <= 2) return { score, label: 'Fair', color: '#f97316', width: '40%' };
  if (score <= 3) return { score, label: 'Good', color: '#eab308', width: '60%' };
  if (score <= 4) return { score, label: 'Strong', color: '#22c55e', width: '80%' };
  return { score, label: 'Very Strong', color: '#16a34a', width: '100%' };
}

// ==================== Floating Label Input ====================

interface FloatingInputProps {
  id: string;
  type: string;
  placeholder: string;
  icon: React.ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  success?: boolean;
  togglePassword?: () => void;
  showPassword?: boolean;
  autoComplete?: string;
}

function FloatingInput({
  id,
  type,
  placeholder,
  icon,
  value,
  onChange,
  error,
  success,
  togglePassword,
  showPassword,
  autoComplete,
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const isActive = focused || value.length > 0;

  return (
    <div className="login-input-wrapper relative">
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10">
          {icon}
        </span>
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder=" "
          autoComplete={autoComplete}
          className={`login-input w-full h-10 pl-11 pr-11 rounded-xl border-2 border-gray-200 bg-white text-gray-800 text-sm outline-none transition-all duration-300 ${
            error
              ? 'login-input-error'
              : success
                ? 'login-input-success'
                : ''
          }`}
        />
        <label
          htmlFor={id}
          className={`floating-label ${isActive ? 'top-0 translate-y-[-50%] !left-3 !text-xs !px-1 bg-white !text-emerald-600' : ''}`}
        >
          {placeholder}
        </label>
        {togglePassword && (
          <button
            type="button"
            onClick={togglePassword}
            className="eye-toggle absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-xs mt-1 ml-1"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

// ==================== Social Login Buttons ====================

// ==================== Animated Background Shapes ====================

function AnimatedGeometry() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Rotating outer ring */}
      <div className="geo-ring-1 absolute rounded-full border border-emerald-400/20"
        style={{ width: 340, height: 340, top: '50%', left: '50%', marginTop: -170, marginLeft: -170 }} />
      <div className="geo-ring-2 absolute rounded-full border border-teal-300/15"
        style={{ width: 480, height: 480, top: '50%', left: '50%', marginTop: -240, marginLeft: -240 }} />
      <div className="geo-ring-3 absolute rounded-full border border-emerald-300/10"
        style={{ width: 620, height: 620, top: '50%', left: '50%', marginTop: -310, marginLeft: -310 }} />

      {/* Floating triangles */}
      <svg className="geo-tri-1 absolute" style={{ top: '12%', left: '8%', width: 36, height: 36 }} viewBox="0 0 36 36">
        <polygon points="18,2 34,32 2,32" fill="none" stroke="rgba(52,211,153,0.4)" strokeWidth="1.5" />
      </svg>
      <svg className="geo-tri-2 absolute" style={{ top: '70%', left: '5%', width: 22, height: 22 }} viewBox="0 0 22 22">
        <polygon points="11,1 21,20 1,20" fill="rgba(52,211,153,0.12)" stroke="rgba(52,211,153,0.35)" strokeWidth="1.2" />
      </svg>
      <svg className="geo-tri-3 absolute" style={{ top: '20%', right: '6%', width: 28, height: 28 }} viewBox="0 0 28 28">
        <polygon points="14,2 26,25 2,25" fill="none" stroke="rgba(45,212,191,0.3)" strokeWidth="1.2" />
      </svg>

      {/* Floating diamonds */}
      <svg className="geo-diamond-1 absolute" style={{ top: '55%', right: '8%', width: 30, height: 30 }} viewBox="0 0 30 30">
        <rect x="7" y="7" width="16" height="16" rx="2" fill="none" stroke="rgba(110,231,183,0.35)" strokeWidth="1.5" transform="rotate(45 15 15)" />
      </svg>
      <svg className="geo-diamond-2 absolute" style={{ top: '80%', right: '15%', width: 20, height: 20 }} viewBox="0 0 20 20">
        <rect x="5" y="5" width="10" height="10" fill="rgba(52,211,153,0.1)" stroke="rgba(52,211,153,0.3)" strokeWidth="1" transform="rotate(45 10 10)" />
      </svg>
      <svg className="geo-diamond-3 absolute" style={{ top: '8%', right: '22%', width: 18, height: 18 }} viewBox="0 0 18 18">
        <rect x="4" y="4" width="10" height="10" fill="none" stroke="rgba(45,212,191,0.4)" strokeWidth="1.2" transform="rotate(45 9 9)" />
      </svg>

      {/* Floating hexagons */}
      <svg className="geo-hex-1 absolute" style={{ top: '40%', left: '3%', width: 40, height: 40 }} viewBox="0 0 40 40">
        <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="none" stroke="rgba(52,211,153,0.2)" strokeWidth="1.2" />
      </svg>
      <svg className="geo-hex-2 absolute" style={{ bottom: '10%', left: '18%', width: 26, height: 26 }} viewBox="0 0 26 26">
        <polygon points="13,1 24,7 24,19 13,25 2,19 2,7" fill="rgba(13,148,136,0.08)" stroke="rgba(45,212,191,0.3)" strokeWidth="1" />
      </svg>

      {/* Small glowing dots */}
      <div className="geo-dot-1 absolute w-2 h-2 rounded-full bg-emerald-400/50" style={{ top: '30%', left: '12%' }} />
      <div className="geo-dot-2 absolute w-1.5 h-1.5 rounded-full bg-teal-300/60" style={{ top: '65%', right: '12%' }} />
      <div className="geo-dot-3 absolute w-2.5 h-2.5 rounded-full bg-emerald-300/40" style={{ bottom: '25%', left: '25%' }} />
      <div className="geo-dot-4 absolute w-1.5 h-1.5 rounded-full bg-teal-400/50" style={{ top: '15%', right: '35%' }} />
      <div className="geo-dot-5 absolute w-2 h-2 rounded-full bg-emerald-500/40" style={{ bottom: '40%', right: '5%' }} />

      {/* Cross / plus signs */}
      <svg className="geo-cross-1 absolute" style={{ top: '48%', left: '18%', width: 16, height: 16 }} viewBox="0 0 16 16">
        <line x1="8" y1="1" x2="8" y2="15" stroke="rgba(110,231,183,0.4)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="1" y1="8" x2="15" y2="8" stroke="rgba(110,231,183,0.4)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <svg className="geo-cross-2 absolute" style={{ bottom: '18%', right: '28%', width: 12, height: 12 }} viewBox="0 0 12 12">
        <line x1="6" y1="1" x2="6" y2="11" stroke="rgba(45,212,191,0.35)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="1" y1="6" x2="11" y2="6" stroke="rgba(45,212,191,0.35)" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// ==================== Cover Panel ====================

interface CoverPanelProps {
  type: 'login' | 'signup';
}

function CoverPanel({ type }: CoverPanelProps) {
  const isLogin = type === 'login';

  const roundedClass = isLogin
    ? 'rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none md:rounded-br-none'
    : 'rounded-t-2xl md:rounded-r-2xl md:rounded-tl-none md:rounded-bl-none';

  return (
    <div className={`cover-gradient relative flex flex-col items-center justify-center px-6 py-8 sm:px-8 sm:py-10 md:p-10 min-h-[220px] sm:min-h-[260px] md:min-h-full overflow-hidden ${roundedClass}`}>
      <AnimatedGeometry />

      {/* Glow orbs */}
      <div className="glow-circle absolute w-56 h-56 rounded-full bg-emerald-400/10 -top-16 -left-16 blur-2xl" />
      <div className="glow-circle absolute w-44 h-44 rounded-full bg-teal-300/10 -bottom-12 -right-12 blur-2xl" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 text-center px-2">
        {/* Illustration */}
        <div className="mb-4 md:mb-6 fade-in-slide" style={{ '--delay': '0.2s' } as React.CSSProperties}>
          {isLogin ? <WelcomePersonIllustration /> : <DeskPersonIllustration />}
        </div>

        {/* Fancy quote heading */}
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="cover-heading text-xl sm:text-2xl md:text-3xl text-white mb-3 md:mb-4 leading-snug"
        >
          {isLogin ? (
            <>"Knowledge is the<br />lamp of the soul."</>
          ) : (
            <>"Every expert was<br />once a beginner."</>
          )}
        </motion.h2>

        {/* Decorative rule */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="w-12 h-px bg-white/40 mx-auto mb-3"
        />

        {/* Sub-quote */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="cover-subtext text-white/65 text-xs sm:text-sm max-w-[210px] mx-auto leading-relaxed italic"
        >
          {isLogin
            ? '— FSK EDU AI · Your intelligent study companion'
            : '— FSK EDU AI · Start your learning journey today'}
        </motion.p>
      </div>
    </div>
  );
}

// ==================== Login Form ====================

interface LoginFormProps {
  onToggle: () => void;
  onSuccess?: (name?: string) => void;
}

function LoginForm({ onToggle, onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const buttonRef = useRef<HTMLButtonElement>(null);

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Please enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Ripple effect
    const btn = buttonRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.left = `${rect.width / 2}px`;
      ripple.style.top = `${rect.height / 2}px`;
      ripple.style.width = ripple.style.height = `${Math.max(rect.width, rect.height)}px`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Map error message to the right field
        const msg: string = data.error || 'Login failed';
        if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('account')) {
          setErrors({ email: msg });
        } else {
          setErrors({ password: msg });
        }
        return;
      }

      // Success — session cookie is set by the server
      if (onSuccess) onSuccess(data.user?.name || undefined);
    } catch {
      setErrors({ password: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white flex flex-col justify-center p-5 sm:p-8 md:p-10 rounded-b-2xl md:rounded-r-2xl md:rounded-bl-none md:rounded-tl-none">
      <div className="slide-up">
        {/* Logo — centered, large */}
        <div className="flex flex-col items-center mb-5 md:mb-6">
          <img src="/fsk-logo.png" alt="FSK EDU AI" className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-contain" />
        </div>
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-1 leading-tight text-center">Sign In</h2>
        <p className="text-gray-400 text-[11px] sm:text-xs md:text-sm mb-4 sm:mb-5 md:mb-6 leading-snug text-center">Welcome back! Please sign in to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
        <div className="slide-up slide-up-delay-1">
          <FloatingInput
            id="login-email"
            type="email"
            placeholder="Email Address"
            icon={<Mail size={18} />}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            error={errors.email}
            success={!!(email && /\S+@\S+\.\S+/.test(email))}
            autoComplete="email"
          />
        </div>

        <div className="slide-up slide-up-delay-2">
          <FloatingInput
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            icon={<Lock size={18} />}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={errors.password}
            success={password.length >= 6}
            togglePassword={() => setShowPassword(!showPassword)}
            showPassword={showPassword}
            autoComplete="current-password"
          />
        </div>

        <div className="flex items-center justify-between slide-up slide-up-delay-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="custom-checkbox w-4 h-4 rounded"
            />
            <span className="text-sm text-gray-500">Remember me</span>
          </label>
          <button type="button" className="text-sm text-emerald-600 hover:text-teal-600 font-medium transition-colors">
            Forgot password?
          </button>
        </div>

        <div className="slide-up slide-up-delay-4">
          <motion.button
            ref={buttonRef}
            type="submit"
            disabled={isLoading}
            whileTap={{ scale: 0.98 }}
            className="btn-gradient w-full h-12 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? (
              <div className="spinner" />
            ) : (
              <>
                Sign In
                <ArrowRight size={18} />
              </>
            )}
          </motion.button>
        </div>
      </form>

      {/* ── Divider ── */}
      <div className="flex items-center gap-3 mt-4 mb-3 slide-up slide-up-delay-5">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs text-gray-400 font-medium">or</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {/* ── Google Sign In Button ── */}
      <motion.a
        href="/api/auth/google"
        whileHover={{ scale: 1.015, boxShadow: '0 4px 24px 0 rgba(66,133,244,0.13)' }}
        whileTap={{ scale: 0.97 }}
        className="slide-up slide-up-delay-5 flex items-center justify-center gap-3 w-full h-11 rounded-xl border-2 border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50/40 transition-all duration-200 cursor-pointer group"
      >
        <svg width="20" height="20" viewBox="0 0 48 48" className="shrink-0">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          <path fill="none" d="M0 0h48v48H0z"/>
        </svg>
        <span className="text-sm font-semibold text-gray-600 group-hover:text-gray-800 transition-colors">
          Continue with Google
        </span>
      </motion.a>

      {/* ── Divider ── */}
      <div className="flex items-center gap-3 mt-3 mb-3">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs text-gray-300 font-medium">new here?</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      <div className="text-center">
        <p className="text-xs sm:text-sm text-gray-400">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={onToggle}
            className="text-emerald-600 hover:text-teal-600 font-semibold transition-colors"
          >
            Create one free →
          </button>
        </p>
      </div>
    </div>
  );
}

// ==================== Signup Form ====================

interface SignupFormProps {
  onToggle: () => void;
  onSuccess: (name?: string) => void;
}

function SignupForm({ onToggle, onSuccess }: SignupFormProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});
  const buttonRef = useRef<HTMLButtonElement>(null);

  const passwordStrength = getPasswordStrength(password);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Please enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!agreeTerms) newErrors.terms = 'You must agree to the terms';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const btn = buttonRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.left = `${rect.width / 2}px`;
      ripple.style.top = `${rect.height / 2}px`;
      ripple.style.width = ripple.style.height = `${Math.max(rect.width, rect.height)}px`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fullName.trim(), email: email.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg: string = data.error || 'Signup failed';
        if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('account')) {
          setErrors({ email: msg });
        } else if (msg.toLowerCase().includes('password')) {
          setErrors({ password: msg });
        } else {
          setErrors({ email: msg });
        }
        return;
      }

      // Success — session cookie is set by the server
      onSuccess(data.user?.name || fullName.trim() || undefined);
    } catch {
      setErrors({ email: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white flex flex-col p-4 sm:p-6 md:p-8 rounded-b-2xl md:rounded-l-2xl md:rounded-br-none md:rounded-tr-none">
      {/* Logo */}
      <div className="flex flex-col items-center mb-2">
        <img src="/fsk-logo.png" alt="FSK EDU AI" className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain" />
      </div>
      <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-0.5 leading-tight text-center">Create Account</h2>
      <p className="text-gray-400 text-[10px] sm:text-xs mb-3 leading-snug text-center">Join us! Fill in your details to get started</p>

      <form onSubmit={handleSubmit} className="space-y-2">
        <FloatingInput
          id="signup-name"
          type="text"
          placeholder="Full Name"
          icon={<User size={16} />}
          value={fullName}
          onChange={(e) => { setFullName(e.target.value); if (errors.fullName) setErrors((p) => ({ ...p, fullName: undefined })); }}
          error={errors.fullName}
          success={fullName.trim().length > 0}
          autoComplete="name"
        />
        <FloatingInput
          id="signup-email"
          type="email"
          placeholder="Email Address"
          icon={<AtSign size={16} />}
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: undefined })); }}
          error={errors.email}
          success={!!email && /\S+@\S+\.\S+/.test(email)}
          autoComplete="email"
        />
        <div>
          <FloatingInput
            id="signup-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            icon={<Shield size={16} />}
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: undefined })); }}
            error={errors.password}
            success={password.length >= 8 && passwordStrength.score >= 3}
            togglePassword={() => setShowPassword(!showPassword)}
            showPassword={showPassword}
            autoComplete="new-password"
          />
          {password && (
            <div className="px-1 mt-1">
              <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="strength-bar rounded-full" style={{ width: passwordStrength.width, backgroundColor: passwordStrength.color }} />
              </div>
              <p className="text-[10px] mt-0.5" style={{ color: passwordStrength.color }}>{passwordStrength.label}</p>
            </div>
          )}
        </div>
        <FloatingInput
          id="signup-confirm"
          type={showConfirmPassword ? 'text' : 'password'}
          placeholder="Confirm Password"
          icon={<Lock size={16} />}
          value={confirmPassword}
          onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: undefined })); }}
          error={errors.confirmPassword}
          success={confirmPassword.length > 0 && password === confirmPassword}
          togglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
          showPassword={showConfirmPassword}
          autoComplete="new-password"
        />
        <div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => { setAgreeTerms(e.target.checked); if (errors.terms) setErrors((p) => ({ ...p, terms: undefined })); }}
              className="custom-checkbox w-4 h-4 rounded mt-0.5 shrink-0"
            />
            <span className="text-xs text-gray-500 leading-snug">
              I agree to the{' '}
              <span className="text-emerald-600 hover:text-teal-600 cursor-pointer font-medium">Terms of Service</span>
              {' '}and{' '}
              <span className="text-emerald-600 hover:text-teal-600 cursor-pointer font-medium">Privacy Policy</span>
            </span>
          </label>
          {errors.terms && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-red-500 text-[10px] mt-0.5 ml-6">
              {errors.terms}
            </motion.p>
          )}
        </div>
        <motion.button
          ref={buttonRef}
          type="submit"
          disabled={isLoading}
          whileTap={{ scale: 0.98 }}
          className="btn-gradient w-full h-11 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isLoading ? <div className="spinner" /> : <><span>Create Account</span><ArrowRight size={16} /></>}
        </motion.button>
      </form>

      {/* ── Divider ── */}
      <div className="flex items-center gap-3 my-3">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs text-gray-400 font-medium">or</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {/* ── Google Sign Up Button ── */}
      <motion.a
        href="/api/auth/google"
        whileHover={{ scale: 1.015, boxShadow: '0 4px 24px 0 rgba(66,133,244,0.13)' }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center justify-center gap-3 w-full h-11 rounded-xl border-2 border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50/40 transition-all duration-200 cursor-pointer group"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" className="shrink-0">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          <path fill="none" d="M0 0h48v48H0z"/>
        </svg>
        <span className="text-sm font-semibold text-gray-600 group-hover:text-gray-800 transition-colors">
          Continue with Google
        </span>
      </motion.a>

      {/* Already have an account */}
      <div className="mt-4 pt-3 border-t border-gray-100 text-center">
        <p className="text-xs sm:text-sm text-gray-400">
          Already have an account?{' '}
          <button type="button" onClick={onToggle} className="text-emerald-600 hover:text-teal-600 font-semibold transition-colors">
            Sign In →
          </button>
        </p>
      </div>
    </div>
  );
}

// ==================== Main Animated Login Page ====================

interface AnimatedLoginPageProps {
  onSuccess?: (name?: string) => void;
  googleError?: string | null;
}

export default function AnimatedLoginPage({ onSuccess, googleError }: AnimatedLoginPageProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleToggle = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  return (
    <div className="login-bg flex items-center justify-center min-h-screen p-3 sm:p-4 md:p-6">
      <ParticleBackground />

      {/* Google OAuth error banner */}
      {googleError && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {googleError}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="login-card-container relative z-10 w-full my-4"
      >
        {/* Sign In Card */}
        {!isFlipped && (
          <motion.div
            key="login"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex flex-col md:flex-row rounded-2xl shadow-2xl shadow-black/30 overflow-hidden bg-white w-full"
          >
            {/* Cover left on desktop */}
            <div className="w-full md:w-[42%] shrink-0">
              <CoverPanel type="login" />
            </div>
            {/* Form right on desktop */}
            <div className="w-full md:w-[58%]">
              <LoginForm onToggle={handleToggle} onSuccess={onSuccess ?? (() => {})} />
            </div>
          </motion.div>
        )}

        {/* Sign Up Card */}
        {isFlipped && (
          <motion.div
            key="signup"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex flex-col md:flex-row rounded-2xl shadow-2xl shadow-black/30 bg-white w-full"
          >
            {/* Form left on desktop, shown below cover on mobile */}
            <div className="w-full md:w-[58%] order-2 md:order-1">
              <SignupForm onToggle={handleToggle} onSuccess={onSuccess ?? (() => {})} />
            </div>
            {/* Cover right on desktop, shown above form on mobile */}
            <div className="w-full md:w-[42%] order-1 md:order-2 shrink-0">
              <CoverPanel type="signup" />
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
