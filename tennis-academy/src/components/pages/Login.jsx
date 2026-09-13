import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Input from '../ui/Input';

// Pucho Brand Assets
import puchoLogo from '../../assets/brand/logo.png';
import LockIcon from '../../assets/icons/Property 2=Lock, Property 1=Default.png';
import ArrowRightIcon from '../../assets/icons/Property 2=Arrow Right, Property 1=Default.png';
import SparklesIcon from '../../assets/icons/Property 2=Magic-pen, Property 1=Default.png';
import ShieldIcon from '../../assets/icons/Property 2=agent.png';

// Mascots
import mascot1 from '../../assets/mascot_1.png';
import mascot3 from '../../assets/mascot_3.png';
import mascot4 from '../../assets/mascot_4.png';
import mascot5 from '../../assets/mascot_5.png';

// Floating Mascot Component (Individual Images) with Gaze Tracking
const Mascot = ({ imageSrc, delay, x, y, size = "w-16 h-16", cursorColor = "text-blue-500", cursorRotation = "0deg" }) => {
    return (
        <div
            className={`absolute ${x} ${y} z-20 animate-float transition-all duration-300 hover:scale-110 hover:rotate-6 cursor-pointer pointer-events-auto`}
            style={{ animationDelay: `${delay}s` }}
        >
            <div className={`${size} rounded-full overflow-hidden shadow-lg relative bg-white/50 backdrop-blur-sm border border-white/40`}>
                <img src={imageSrc} alt="Mascot" className="w-full h-full object-cover" />
            </div>
            <div className={`absolute -bottom-3 -right-3 ${cursorColor} drop-shadow-md`}
                style={{ transform: `rotate(${cursorRotation})` }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.5 3.5L10.5 20.5L13.5 13.5L20.5 10.5L3.5 3.5Z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                </svg>
            </div>
        </div>
    );
};

const DEFAULT_SEED_USERS = [
    { id: 'user_admin', name: 'Arnav Jain', email: 'admin@tennisacademy.com', password: 'admin123', role: 'ADMIN' },
    { id: 'user_ops', name: 'Ops Head', email: 'ops@tennisacademy.com', password: 'ops123', role: 'OPS_HEAD' },
    { id: 'user_coach_santosh', name: 'Santosh', email: 'santosh@tennisacademy.com', password: 'coach123', role: 'COACH' },
    { id: 'user_coach_anil', name: 'Anil', email: 'anil@tennisacademy.com', password: 'coach123', role: 'COACH' },
    { id: 'user_coach_jagdish', name: 'Jagdish', email: 'jagdish@tennisacademy.com', password: 'coach123', role: 'COACH' },
    { id: 'user_coach_sunil', name: 'Sunil', email: 'sunil@tennisacademy.com', password: 'coach123', role: 'COACH' },
    { id: 'user_coach_karan', name: 'Karan', email: 'karan@tennisacademy.com', password: 'coach123', role: 'COACH' },
    { id: 'user_coach_karim', name: 'Karim', email: 'karim@tennisacademy.com', password: 'coach123', role: 'COACH' },
    { id: 'user_coach_vinod', name: 'Vinod D', email: 'vinod.d@tennisacademy.com', password: 'coach123', role: 'COACH' },
    { id: 'user_coach_nanu', name: 'Nanu', email: 'nanu@tennisacademy.com', password: 'coach123', role: 'COACH' },
    { id: 'user_coach_fitness', name: 'Team One Aim', email: 'team.one.aim@tennisacademy.com', password: 'coach123', role: 'COACH' },
    { id: 'user_coach_parth', name: 'Parth Kalke', email: 'parth.kalke@tennisacademy.com', password: 'coach123', role: 'COACH' },
];

const Login = () => {
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('admin@tennisacademy.com');
    const [password, setPassword] = useState('admin123');
    const [error, setError] = useState('');
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isTouchDevice, setIsTouchDevice] = useState(false);
    const [seedUsers, setSeedUsers] = useState(DEFAULT_SEED_USERS);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    // Load available users for quick preset selection on mount (excluding parents)
    useEffect(() => {
        import('../../services/usersService').then(({ usersService }) => {
            usersService.list({ pageSize: 500 }).then((res) => {
                const list = (Array.isArray(res) ? res : res?.data || []).filter(u => (u.role || '').toLowerCase() !== 'parent');
                if (list && list.length > 0) {
                    setSeedUsers(list);
                }
            }).catch(() => {});
        });
    }, []);

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            const path = user.role === 'admin' ? '/admin' : user.role === 'ops_head' ? '/ops' : user.role === 'coach' ? '/coach' : '/parent';
            navigate(path, { replace: true });
        }
    }, [user, navigate]);

    // Detect touch device
    useEffect(() => {
        setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    }, []);

    // Mouse tracking (desktop only)
    useEffect(() => {
        if (isTouchDevice) return;
        const handleMouseMove = (e) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isTouchDevice]);

    // Close dropdown on outside click
    useEffect(() => {
        if (!dropdownOpen) return;
        const handleOutsideClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [dropdownOpen]);

    const handleSelectPresetUser = async (u) => {
        const targetEmail = u.email;
        const targetPassword = u.password || '1234';
        setEmail(targetEmail);
        setPassword(targetPassword);
        setDropdownOpen(false);
        setError('');
        setLoading(true);

        const result = await login(targetEmail, targetPassword);
        if (!result.success) {
            setError(result.message || 'Login failed. Please check your credentials.');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) { setError('Please enter your email address'); return; }
        if (!password) { setError('Please enter your password'); return; }
        setLoading(true);
        setError('');

        const result = await login(email, password);
        if (!result.success) {
            setError(result.message || 'Login failed. Please check your credentials.');
            setLoading(false);
        }
    };

    return (
        <div
            className="h-dvh w-full bg-[#FAFAFF] relative flex items-center justify-center p-4 lg:p-8 overflow-x-hidden overflow-y-auto md:overflow-hidden font-sans"
            role="main"
            aria-label="Login page"
        >
            {/* Full Screen Grid Pattern - Base */}
            <div
                className="absolute inset-0 z-0 opacity-100 pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)`,
                    backgroundSize: '64px 64px',
                    maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 40%, rgba(0,0,0,0) 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 40%, rgba(0,0,0,0) 100%)'
                }}
            />

            {/* Interactive Grid Spotlight (Purple Glow) - Desktop only */}
            {!isTouchDevice && (
                <div
                    className="absolute inset-0 z-0 pointer-events-none opacity-50"
                    style={{
                        background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(139, 92, 246, 0.15), transparent 40%)`
                    }}
                />
            )}

            {/* Ambient Gradients - Left & Right */}
            <div className="absolute top-0 left-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-purple-600/30 rounded-full blur-[60px] sm:blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-blue-600/30 rounded-full blur-[60px] sm:blur-[120px] pointer-events-none translate-x-1/2 translate-y-1/2" />

            {/* Floating Mascots - Individual Images */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden h-full w-full">
                {/* Top Left - Woman Green Beanie */}
                <Mascot
                    imageSrc={mascot1}
                    x="top-[2%] left-2 md:top-[2%] md:left-[1%]"
                    delay={0}
                    size="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16"
                    cursorColor="text-blue-500"
                    cursorRotation="-10deg"
                />
                {/* Top Center-Right - Man Cap */}
                <Mascot
                    imageSrc={mascot5}
                    x="top-[2%] right-2 md:top-[2%] md:right-[1%]"
                    delay={1.5}
                    size="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16"
                    cursorColor="text-purple-500"
                    cursorRotation="15deg"
                />
                {/* Bottom Center-Left - Man Turban */}
                <Mascot
                    imageSrc={mascot3}
                    x="bottom-[2%] left-2 md:bottom-[2%] md:left-[2%]"
                    delay={0.8}
                    size="w-10 h-10 sm:w-10 sm:h-10 md:w-16 md:h-16"
                    cursorColor="text-yellow-500"
                    cursorRotation="-5deg"
                />
                {/* Bottom Right - Woman Hijab */}
                <Mascot
                    imageSrc={mascot4}
                    x="bottom-[2%] right-2 md:bottom-[2%] md:right-[2%]"
                    delay={2.2}
                    size="w-10 h-10 sm:w-10 sm:h-10 md:w-16 md:h-16"
                    cursorColor="text-green-500"
                    cursorRotation="10deg"
                />
            </div>

            {/* Mobile Logo - Absolute Top Center */}
            <div className="absolute top-6 left-0 right-0 flex justify-center md:hidden z-20">
                <img src={puchoLogo} alt="Pucho.ai" className="h-6" />
            </div>

            <div className="w-full max-w-7xl mx-auto grid md:grid-cols-2 gap-6 md:gap-12 lg:gap-24 relative z-10 items-center h-full md:h-auto content-center">

                {/* Left Side: Marketing Content */}
                <div className="text-center md:text-left space-y-4 md:space-y-8 md:pl-8 lg:pl-16">
                    {/* Desktop/Tablet Logo */}
                    <div className="hidden md:flex justify-start mb-8 lg:mb-16">
                        <img src={puchoLogo} alt="Pucho.ai" className="h-7 lg:h-9" />
                    </div>

                    <div className="space-y-2 md:space-y-4 lg:space-y-6">
                        <div className="space-y-1 md:space-y-2">
                            <div className="font-semibold text-[#111834] text-sm md:text-base lg:text-lg">
                                Tennis Academy Management
                            </div>
                            <div className="text-[10px] md:text-[11px] lg:text-xs font-bold text-purple-600 tracking-wider uppercase drop-shadow-sm">
                                BUILT ON PUCHO.AI
                            </div>
                        </div>

                        <h1
                            className="text-3xl md:text-5xl lg:text-[70px] font-bold text-[#111834] leading-[1.1] md:leading-[1] lg:leading-[0.95] tracking-tight"
                            style={{ fontFamily: '"Space Grotesk", Inter, sans-serif' }}
                        >
                            Coach.<br />
                            <span className="text-[#8b5cf6]/80">Train.</span><br />
                            Excel.
                        </h1>

                        <p className="text-[#111834] text-xs md:text-sm lg:text-base leading-relaxed max-w-md mx-auto md:mx-0 opacity-70 hidden md:block">
                            The Club &amp; TOTS Tennis &mdash; Academy management platform for coaches and administrators.
                        </p>
                    </div>

                    {/* Badges */}
                    <div className="hidden md:flex flex-wrap justify-center md:justify-start gap-2 md:gap-3 lg:gap-4 pt-2 md:pt-3 lg:pt-4">
                        <div className="flex items-center gap-2 px-3 lg:px-4 py-1.5 lg:py-2 bg-purple-50 border border-purple-100 rounded-full text-[10px] lg:text-xs font-bold text-purple-700">
                            <img src={ShieldIcon} alt="Shield" className="w-3 h-3" />
                            Role-Based Access
                        </div>
                        <div className="flex items-center gap-2 px-3 lg:px-4 py-1.5 lg:py-2 bg-green-50 border border-green-100 rounded-full text-[10px] lg:text-xs font-bold text-green-700">
                            <img src={SparklesIcon} alt="Secure" className="w-4 h-4" />
                            Secure Platform
                        </div>
                    </div>
                </div>

                {/* Right Side: Floating Login Card with Glassmorphism */}
                <div className="flex flex-col items-center justify-center md:justify-end w-full">
                    <div className="bg-white/70 backdrop-blur-xl p-6 md:p-8 lg:p-12 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] w-full max-w-sm md:max-w-md border border-white/50 relative overflow-visible group">
                        <div className="space-y-2 mb-5 md:mb-7">
                            <h2 className="text-2xl font-bold text-[#111834]">Welcome Back</h2>
                            <p className="text-gray-400 text-sm">Access your academy dashboard.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Preset Account Quick Selector */}
                            <div className="space-y-1.5" ref={dropdownRef}>
                                <div className="flex justify-between items-center">
                                    <label className="block text-[10px] font-semibold text-[#6B7280] uppercase tracking-[0.04em]">
                                        Quick Select Account / Role
                                    </label>
                                    <span className="text-[10px] text-purple-600 font-semibold">One-Click Login</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setDropdownOpen(o => !o)}
                                    className="w-full h-[48px] px-4 rounded-xl border border-purple-100 bg-purple-50/60 text-xs text-[#111834] font-medium outline-none hover:bg-purple-100/60 transition-all cursor-pointer flex items-center justify-between gap-2"
                                >
                                    <span className="truncate text-left font-semibold text-[#111834]">
                                        {(() => {
                                            const matched = seedUsers.find(u => u.email === email);
                                            if (matched) {
                                                return `${matched.name} (${matched.role})`;
                                            }
                                            return email ? email : 'Choose account for instant login...';
                                        })()}
                                    </span>
                                    <svg className={`w-4 h-4 text-purple-600 shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M6 8l4 4 4-4" />
                                    </svg>
                                </button>

                                {dropdownOpen && (
                                    <div className="relative z-30">
                                        <div className="absolute top-1 left-0 right-0 bg-white rounded-2xl border border-gray-200 shadow-[0_12px_30px_rgba(20,24,40,0.15)] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                                            <div className="max-h-[220px] overflow-y-auto overscroll-contain py-1">
                                                <div className="px-4 py-1.5 text-[10px] font-semibold text-[#8C93A6] uppercase tracking-[0.06em] bg-white sticky top-0 border-b border-gray-100 flex justify-between items-center">
                                                    <span>Quick Login Accounts</span>
                                                    <span className="text-[9px] text-purple-600">Click to Sign In</span>
                                                </div>
                                                {seedUsers.map((u) => (
                                                    <button
                                                        key={u.id || u.email}
                                                        type="button"
                                                        onClick={() => handleSelectPresetUser(u)}
                                                        className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center gap-2.5 group
                                                            ${u.email === email ? 'bg-[#F1ECFF] text-brand-600 font-semibold' : 'text-[#111834] hover:bg-[#F8F8FC]'}`}
                                                    >
                                                        <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 uppercase">
                                                            {(u.role || 'U').charAt(0)}
                                                        </span>
                                                        <div className="flex flex-col overflow-hidden min-w-0 flex-1">
                                                            <span className="truncate font-semibold text-[#111834] group-hover:text-purple-700 transition-colors">{u.name}</span>
                                                            <span className="text-[10px] text-gray-400 truncate">{u.email}</span>
                                                        </div>
                                                        <span className="text-[9px] uppercase font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full flex-shrink-0">{u.role}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Email Input */}
                            <div className="space-y-1">
                                <label className="block text-[10px] font-semibold text-[#6B7280] uppercase tracking-[0.04em]">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    placeholder="e.g. admin@tennisacademy.com"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                    className="w-full h-[50px] px-4 rounded-xl border border-gray-200 bg-white/90 text-sm text-[#111834] outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/15 transition-all"
                                />
                            </div>

                            {/* Password Input */}
                            <Input
                                label="Password"
                                type="password"
                                icon={LockIcon}
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                autoComplete="current-password"
                                name="password"
                            />

                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-medium border border-red-100">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className={`
                                    relative w-full h-[52px] flex items-center justify-center gap-3 rounded-full
                                    transition-all duration-300 ease-in-out
                                    font-['Inter'] font-semibold text-[16px] leading-[150%] text-white
                                    overflow-hidden group
                                    disabled:opacity-70 disabled:cursor-not-allowed
                                `}
                                style={{
                                    background: 'linear-gradient(180deg, #5833EF 0%, #3A10CE 100%)',
                                    boxShadow: '0px 4.4px 8.8px rgba(58, 16, 206, 0.3)',
                                }}
                            >
                                {/* Highlight/Gloss Effect - Top Half */}
                                <div
                                    className="absolute top-[1px] left-[1px] right-[1px] h-[26px] rounded-full pointer-events-none transition-opacity duration-300 group-hover:opacity-0 group-active:opacity-0"
                                    style={{
                                        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0) 100%)',
                                        zIndex: 1,
                                    }}
                                />
                                {/* Label & Icon */}
                                <span className="relative z-10 flex items-center gap-2 drop-shadow-md">
                                    {loading ? 'Signing in...' : 'Sign In'}
                                    {!loading && <img src={ArrowRightIcon} alt="Arrow" className="w-5 h-5 -rotate-45 invert brightness-0" />}
                                </span>
                            </button>
                        </form>
                    </div>

                    {/* Mobile Only: Description and Badges moved below form */}
                    <div className="block md:hidden text-center mt-6 space-y-4">
                        <p className="text-[#111834] text-xs leading-relaxed max-w-xs mx-auto opacity-70">
                            The Club &amp; TOTS Tennis &mdash; Academy management platform for coaches and administrators.
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-100 rounded-full text-[10px] font-bold text-purple-700">
                                <img src={ShieldIcon} alt="Shield" className="w-3 h-3" />
                                Role-Based Access
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-100 rounded-full text-[10px] font-bold text-green-700">
                                <img src={SparklesIcon} alt="Secure" className="w-4 h-4" />
                                Secure Platform
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Login;