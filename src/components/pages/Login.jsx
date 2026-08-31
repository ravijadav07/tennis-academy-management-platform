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

const Login = () => {
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState('user_admin');
    const [pin, setPin] = useState('1234');
    const [error, setError] = useState('');
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isTouchDevice, setIsTouchDevice] = useState(false);
    const [seedUsers, setSeedUsers] = useState({ admins: [], coaches: [] });
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const allUsers = [...seedUsers.admins, ...seedUsers.coaches];

    // Load seed users on mount
    useEffect(() => {
        import('../../mocks/seedData').then(({ default: SEED }) => {
            setSeedUsers({
                admins: SEED.users.filter(u => u.role === 'ADMIN' || u.role === 'OPS_HEAD'),
                coaches: SEED.users.filter(u => u.role === 'COACH'),
            });
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

    // Keyboard navigation
    const handleDropdownKey = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(i => Math.min(i + 1, allUsers.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && highlightedIndex >= 0) {
            e.preventDefault();
            setSelectedUserId(allUsers[highlightedIndex].id);
            setDropdownOpen(false);
            setHighlightedIndex(-1);
        } else if (e.key === 'Escape') {
            setDropdownOpen(false);
        }
    };

    const getSelectedUser = () => allUsers.find(u => u.id === selectedUserId);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedUserId) { setError('Please select your account'); return; }
        setLoading(true);
        setError('');

        const result = await login(selectedUserId, pin);
        if (!result.success) {
            setError(result.message || 'Login failed');
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
                            The Club &amp; TOTS Tennis &mdash; Academy management platform for coaches, parents, and administrators.
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
                            {/* Custom Account Selection Dropdown */}
                            <div className="space-y-1.5" ref={dropdownRef}>
                                <label className="block text-[10px] font-semibold text-[#6B7280] uppercase tracking-[0.04em]">
                                    Sign in as
                                </label>
                                <button
                                    type="button"
                                    onClick={() => { setDropdownOpen(o => !o); setHighlightedIndex(-1); }}
                                    onKeyDown={handleDropdownKey}
                                    className="w-full h-[52px] px-4 rounded-2xl border border-gray-200 bg-white/80 text-sm text-[#111834] outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/15 transition-all cursor-pointer flex items-center justify-between"
                                >
                                    <span className={getSelectedUser() ? 'text-[#111834]' : 'text-gray-400'}>
                                        {getSelectedUser() ? `${getSelectedUser().name} (${getSelectedUser().role === 'OPS_HEAD' ? 'Ops Head' : getSelectedUser().role === 'ADMIN' ? 'Admin' : 'Coach'})` : 'Select your account...'}
                                    </span>
                                    <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M6 8l4 4 4-4" />
                                    </svg>
                                </button>

                                {dropdownOpen && (
                                    <div className="relative z-30">
                                        <div className="absolute top-1 left-0 right-0 bg-white rounded-2xl border border-gray-200 shadow-[0_12px_30px_rgba(20,24,40,0.10)] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                                            <div className="max-h-[220px] overflow-y-auto overscroll-contain py-1">
                                                {seedUsers.admins.length > 0 && (
                                                    <>
                                                        <div className="px-4 py-1.5 text-[10px] font-semibold text-[#8C93A6] uppercase tracking-[0.06em] bg-white sticky top-0">
                                                            Admin / Operations
                                                        </div>
                                                        {seedUsers.admins.map((u, idx) => (
                                                            <button
                                                                key={u.id}
                                                                type="button"
                                                                onClick={() => { setSelectedUserId(u.id); setDropdownOpen(false); setError(''); }}
                                                                onMouseEnter={() => setHighlightedIndex(idx)}
                                                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2.5
                                                                    ${u.id === selectedUserId ? 'bg-[#F1ECFF] text-brand-600 font-semibold' : highlightedIndex === idx ? 'bg-[#F8F8FC] text-[#111834]' : 'text-[#111834] hover:bg-[#F8F8FC]'}`}
                                                            >
                                                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${u.id === selectedUserId ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600'}`}>
                                                                    {u.name.charAt(0)}
                                                                </span>
                                                                <span>{u.name}</span>
                                                                <span className="text-[10px] text-[#8C93A6] ml-auto">{u.role === 'OPS_HEAD' ? 'Ops Head' : 'Admin'}</span>
                                                                {u.id === selectedUserId && (
                                                                    <svg className="w-4 h-4 text-brand-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </>
                                                )}
                                                {seedUsers.coaches.length > 0 && (
                                                    <>
                                                        <div className="px-4 py-1.5 text-[10px] font-semibold text-[#8C93A6] uppercase tracking-[0.06em] bg-white sticky top-0 border-t border-[#F0F0F0]">
                                                            Coaches
                                                        </div>
                                                        {seedUsers.coaches.map((u, idx) => {
                                                            const globalIdx = seedUsers.admins.length + idx;
                                                            return (
                                                                <button
                                                                    key={u.id}
                                                                    type="button"
                                                                    onClick={() => { setSelectedUserId(u.id); setDropdownOpen(false); setError(''); }}
                                                                    onMouseEnter={() => setHighlightedIndex(globalIdx)}
                                                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2.5
                                                                        ${u.id === selectedUserId ? 'bg-[#F1ECFF] text-brand-600 font-semibold' : highlightedIndex === globalIdx ? 'bg-[#F8F8FC] text-[#111834]' : 'text-[#111834] hover:bg-[#F8F8FC]'}`}
                                                                >
                                                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${u.id === selectedUserId ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600'}`}>
                                                                        {u.name.charAt(0)}
                                                                    </span>
                                                                    <span>{u.name}</span>
                                                                    <span className="text-[10px] text-[#8C93A6] ml-auto">Coach</span>
                                                                    {u.id === selectedUserId && (
                                                                        <svg className="w-4 h-4 text-brand-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                                    )}
                                                                </button>
                                                            );
                                                        })}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Input
                                label="PIN"
                                type="password"
                                icon={LockIcon}
                                placeholder="4-digit PIN"
                                value={pin}
                                onChange={(e) => { setPin(e.target.value.slice(0, 4)); setError(''); }}
                                autoComplete="off"
                                name="pin"
                            />

                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
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
                            The Club &amp; TOTS Tennis &mdash; Academy management platform for coaches, parents, and administrators.
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