import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { 
  Mail, 
  Lock, 
  AlertCircle, 
  Loader2, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Search,
  MessageSquare,
  BarChart3,
  MapPin,
  Users,
  Sparkles,
  Globe,
  Shield,
  CheckCircle,
  Zap,
  Star
} from 'lucide-react';

interface AuthFormProps {
  onAuthSuccess: () => void;
}

/* ── EOS Shield Logo (SVG recreation) ── */
function EosLogo({ size = 56, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 138" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Shield outer glow */}
      <defs>
        <linearGradient id="silverGrad" x1="30" y1="20" x2="90" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f0f0f0"/>
          <stop offset="30%" stopColor="#d0d0d0"/>
          <stop offset="60%" stopColor="#b0b0b0"/>
          <stop offset="100%" stopColor="#c8c8c8"/>
        </linearGradient>
        <linearGradient id="silverGrad2" x1="40" y1="30" x2="80" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e8e8e8"/>
          <stop offset="50%" stopColor="#a0a0a0"/>
          <stop offset="100%" stopColor="#c0c0c0"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Shield shape - blue outline */}
      <path 
        d="M60 4 L110 28 C110 28 112 80 60 132 C8 80 10 28 10 28 Z" 
        fill="none" 
        stroke="#2979FF" 
        strokeWidth="8" 
        strokeLinejoin="round"
        filter="url(#glow)"
      />
      
      {/* Shield inner fill (subtle dark) */}
      <path 
        d="M60 12 L104 33 C104 33 106 78 60 125 C14 78 16 33 16 33 Z" 
        fill="#0D1B3E" 
        fillOpacity="0.3"
      />
      
      {/* Letter e - silver metallic */}
      <g fill="url(#silverGrad)">
        {/* e vertical bar */}
        <rect x="28" y="38" width="12" height="55" rx="2"/>
        {/* e top horizontal */}
        <rect x="28" y="38" width="28" height="11" rx="2"/>
        {/* e middle horizontal */}
        <rect x="28" y="58" width="28" height="11" rx="2"/>
        {/* e right vertical (short) */}
        <rect x="45" y="38" width="11" height="31" rx="2"/>
        {/* e bottom horizontal (turns P into e) */}
        <rect x="28" y="82" width="28" height="11" rx="2"/>
      </g>
      
      {/* Letter s - silver metallic */}
      <g fill="url(#silverGrad2)">
        {/* S top horizontal */}
        <rect x="64" y="38" width="28" height="11" rx="2"/>
        {/* S left vertical (top half) */}
        <rect x="64" y="38" width="12" height="31" rx="2"/>
        {/* S middle horizontal */}
        <rect x="64" y="58" width="28" height="11" rx="2"/>
        {/* S right vertical (bottom half) */}
        <rect x="80" y="58" width="12" height="31" rx="2"/>
        {/* S bottom horizontal */}
        <rect x="64" y="78" width="28" height="11" rx="2"/>
      </g>
    </svg>
  );
}

/* ── Brand Logo with text ── */
function BrandLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="relative animate-pulse-glow rounded-2xl">
        <EosLogo size={60} />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-white leading-tight tracking-wide">ESLA7-OS</h1>
        <p className="text-xs text-blue-300 -mt-0.5">نظام اكتساب عملاء متكامل</p>
      </div>
    </div>
  );
}

/* ── Feature Card Component ── */
function FeatureCard({ icon: Icon, title, description, delay }: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  delay: string;
}) {
  return (
    <div className={`glass-dark rounded-2xl p-5 hover:bg-white/20 transition-all duration-300 group cursor-default animate-fade-in-up ${delay}`}>
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400/20 to-white/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 border border-blue-400/20">
          <Icon className="w-5 h-5 text-blue-300" />
        </div>
        <div className="text-right flex-1">
          <h3 className="text-white font-semibold text-sm mb-1">{title}</h3>
          <p className="text-blue-200/70 text-xs leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Stat Badge Component ── */
function StatBadge({ value, label, delay }: { value: string; label: string; delay: string }) {
  return (
    <div className={`text-center animate-count-up ${delay}`}>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-blue-300/80 mt-0.5">{label}</div>
    </div>
  );
}

/* ── Floating Particle ── */
function FloatingParticle({ size, top, left, delay }: { size: number; top: string; left: string; delay: string }) {
  return (
    <div 
      className="absolute rounded-full bg-blue-400/10 animate-float"
      style={{ width: size, height: size, top, left, animationDelay: delay }}
    />
  );
}


export default function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    return strength;
  };

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength < 25) return 'bg-red-500';
    if (strength < 50) return 'bg-orange-500';
    if (strength < 75) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const getPasswordStrengthText = (strength: number): string => {
    if (strength < 25) return 'ضعيف';
    if (strength < 50) return 'متوسط';
    if (strength < 75) return 'جيد';
    return 'قوي';
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!validateEmail(email)) {
      newErrors.email = 'تنسيق البريد الإلكتروني غير صحيح';
    }

    if (!isPasswordReset) {
      if (!password) {
        newErrors.password = 'كلمة المرور مطلوبة';
      } else if (password.length < 6) {
        newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
      }

      if (isSignUp) {
        if (!confirmPassword) {
          newErrors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
        } else if (password !== confirmPassword) {
          newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordStrength(calculatePasswordStrength(value));
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: '' }));
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setServerError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      let result;
      
      if (isPasswordReset) {
        result = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`
        });
        if (result.error) throw result.error;
        toast.success('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
        setSuccessMessage('تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني. تحقق من صندوق الوارد.');
        setIsPasswordReset(false);
        return;
      } else if (isSignUp) {
        result = await supabase.auth.signUp({ email, password });
        if (result.error) throw result.error;
        if (result.data.user && !result.data.session) {
          toast.success('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.');
          setSuccessMessage('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.');
          setIsSignUp(false);
          setPassword('');
          setConfirmPassword('');
          return;
        }
      } else {
        result = await supabase.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
      }

      onAuthSuccess();
      toast.success(isSignUp ? 'مرحباً بك! تم إنشاء حسابك بنجاح' : 'مرحباً بك مرة أخرى!');
    } catch (err: any) {
      const errorMessages: { [key: string]: string } = {
        'Invalid login credentials': 'بيانات تسجيل الدخول غير صحيحة',
        'User already registered': 'المستخدم مسجل مسبقاً',
        'Password should be at least 6 characters': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        'Unable to validate email address: invalid format': 'تنسيق البريد الإلكتروني غير صحيح',
        'Email not confirmed': 'يرجى تأكيد بريدك الإلكتروني أولاً',
        'Too many requests': 'محاولات كثيرة جداً، يرجى المحاولة لاحقاً'
      };
      const errorMessage = errorMessages[err.message] || 'حدث خطأ، يرجى المحاولة مرة أخرى';
      toast.error(errorMessage);
      setServerError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
    setPasswordStrength(0);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setServerError('');
    setSuccessMessage('');
  };

  const switchMode = (mode: 'signin' | 'signup' | 'reset') => {
    resetForm();
    setIsSignUp(mode === 'signup');
    setIsPasswordReset(mode === 'reset');
  };

  /* ══════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════ */
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      
      {/* ─── LEFT SIDE: Hero / Branding Panel ─── */}
      <div className="relative lg:w-[55%] overflow-hidden flex flex-col justify-between p-8 lg:p-12 min-h-[340px] lg:min-h-screen"
        style={{ background: 'linear-gradient(135deg, #080f24 0%, #0D1B3E 40%, #132c57 70%, #0D1B3E 100%)' }}
      >
        
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating blobs - blue theme */}
          <div className="absolute top-10 right-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-blob" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-blue-400/8 rounded-full blur-3xl animate-blob animation-delay-4000" />
          
          {/* Radial glow behind logo area */}
          <div className="absolute top-0 left-0 w-full h-full" 
            style={{ background: 'radial-gradient(ellipse at 30% 40%, rgba(41, 121, 255, 0.08) 0%, transparent 60%)' }} 
          />
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
          
          {/* Floating particles */}
          <FloatingParticle size={6} top="15%" left="20%" delay="0s" />
          <FloatingParticle size={4} top="30%" left="70%" delay="1s" />
          <FloatingParticle size={8} top="60%" left="15%" delay="2s" />
          <FloatingParticle size={5} top="75%" left="80%" delay="3s" />
          <FloatingParticle size={7} top="45%" left="50%" delay="4s" />
          <FloatingParticle size={3} top="85%" left="40%" delay="1.5s" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          
          {/* Logo */}
          <div className="animate-scale-in">
            <BrandLogo />
          </div>

          {/* Main Hero Content */}
          <div className="flex-1 flex flex-col justify-center py-8 lg:py-16">
            <div className="max-w-lg">
              <h2 className="text-3xl lg:text-5xl font-bold text-white leading-tight mb-4 animate-fade-in-up delay-200">
                من خرائط جوجل
                <span className="block mt-2 bg-gradient-to-l from-blue-300 via-gray-300 to-blue-400 bg-clip-text text-transparent">
                  إلى عميل  فعلي
                </span>
              </h2>
              <p className="text-blue-200/70 text-base lg:text-lg leading-relaxed mb-8 animate-fade-in-up delay-400 max-w-md">
                استخرج · رتّب · تواصل · أغلق — نظام متكامل لاكتساب العملاء من الاستخراج إلى الإغلاق
              </p>

              {/* Stats Row */}
              <div className="glass-dark rounded-2xl p-5 mb-8 animate-fade-in-up delay-500" style={{ borderColor: 'rgba(41,121,255,0.15)' }}>
                <div className="flex items-center justify-around">
                  <StatBadge value="50" label="رصيد مجاني عند التسجيل" delay="delay-500" />
                  <div className="w-px h-10 bg-blue-400/20" />
                  <StatBadge value="180+" label="نشاط بالدقيقة" delay="delay-600" />
                  <div className="w-px h-10 bg-blue-400/20" />
                  <StatBadge value="100%" label="إدارة عميل كاملة" delay="delay-700" />
                </div>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="hidden lg:grid grid-cols-2 gap-3 max-w-lg">
              <FeatureCard 
                icon={Search} 
                title="توليد عملاء محتملين" 
                description="استخراج بيانات الأنشطة من خرائط جوجل فوراً"
                delay="delay-400"
              />
              <FeatureCard 
                icon={BarChart3} 
                title="ذكاء مبيعات" 
                description="تحليلات وتقارير لمتابعة أداء الحملات"
                delay="delay-500"
              />
              <FeatureCard 
                icon={Users} 
                title="اكتساب عملاء متكامل" 
                description="CRM مدمج لإدارة العملاء من البداية للنهاية"
                delay="delay-600"
              />
              <FeatureCard 
                icon={MessageSquare} 
                title="تواصل مباشر" 
                description="قوالب واتساب جاهزة وحملات تسويقية فورية"
                delay="delay-700"
              />
            </div>
          </div>

          {/* Bottom trust strip */}
          <div className="relative z-10 hidden lg:block">
            <div className="flex items-center gap-6 text-blue-300/60 text-xs">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                <span>تشفير كامل</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                <span>تغطية عالمية</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>تحديثات مستمرة</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── RIGHT SIDE: Auth Form Panel ─── */}
      <div className="flex-1 bg-gradient-to-br from-gray-50 via-white to-blue-50/30 flex items-center justify-center p-6 lg:p-12 relative overflow-hidden">
        
        {/* Subtle background decoration */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-blue-100/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-50/40 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />
        
        <div className="w-full max-w-md relative z-10">
          
          {/* Mobile-only logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <EosLogo size={48} />
          </div>

          {/* Form Header */}
          <div className="text-center mb-8 animate-fade-in-up delay-100">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              {isPasswordReset ? 'إعادة تعيين كلمة المرور' : isSignUp ? 'إنشاء حساب جديد' : 'مرحباً بك مرة أخرى'}
            </h2>
            <p className="text-gray-500 text-sm">
              {isPasswordReset 
                ? 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين' 
                : isSignUp 
                  ? 'ابدأ الآن — من الاستخراج إلى الإغلاق'
                  : 'سجل دخولك للوصول إلى لوحة التحكم'
              }
            </p>
          </div>

          {/* Sign-up benefits */}
          {isSignUp && !isPasswordReset && (
            <div className="mb-6 bg-gradient-to-l from-blue-50 to-gray-50 rounded-xl p-4 border border-blue-100 animate-fade-in-up delay-200">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-gray-900">ما ستحصل عليه مجاناً</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Search, text: '50 رصيد بحث' },
                  { icon: MapPin, text: 'بحث خرائط جوجل' },
                  { icon: BarChart3, text: 'إدارة حملات' },
                  { icon: MessageSquare, text: 'قوالب واتساب' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shadow-sm border border-blue-100">
                      <item.icon className="w-3 h-3 text-blue-600" />
                    </div>
                    <span className="text-xs text-gray-700">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Form Card (Glassmorphic) ── */}
          <div className="glass rounded-3xl shadow-xl shadow-blue-100/40 p-7 lg:p-8 animate-fade-in-up delay-200">
            <form onSubmit={handleAuth} className="space-y-5">
              
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  البريد الإلكتروني
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center transition-colors group-focus-within:bg-blue-100">
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                    }}
                    className={`w-full pl-14 pr-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 text-right bg-white/60 ${
                      errors.email ? 'border-red-300 bg-red-50/60' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="example@email.com"
                    required
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-sm text-red-600 text-right flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              {!isPasswordReset && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    كلمة المرور
                  </label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center transition-colors group-focus-within:bg-blue-100">
                      <Lock className="w-4 h-4 text-blue-600" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-14 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      className={`w-full pl-24 pr-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 text-right bg-white/60 ${
                        errors.password ? 'border-red-300 bg-red-50/60' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  
                  {/* Password Strength */}
                  {isSignUp && password && (
                    <div className="mt-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-xs font-medium ${
                          passwordStrength >= 75 ? 'text-emerald-600' : passwordStrength >= 50 ? 'text-yellow-600' : 'text-red-500'
                        }`}>
                          {getPasswordStrengthText(passwordStrength)}
                        </span>
                        <span className="text-xs text-gray-400">قوة كلمة المرور</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ease-out ${getPasswordStrengthColor(passwordStrength)}`}
                          style={{ width: `${passwordStrength}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {errors.password && (
                    <p className="mt-1.5 text-sm text-red-600 text-right flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.password}
                    </p>
                  )}
                </div>
              )}

              {/* Confirm Password */}
              {isSignUp && !isPasswordReset && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    تأكيد كلمة المرور
                  </label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center transition-colors group-focus-within:bg-blue-100">
                      <Lock className="w-4 h-4 text-blue-600" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-14 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                      }}
                      className={`w-full pl-24 pr-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 text-right bg-white/60 ${
                        errors.confirmPassword ? 'border-red-300 bg-red-50/60' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1.5 text-sm text-red-600 text-right flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              )}

              {/* Forgot Password Link */}
              {!isPasswordReset && !isSignUp && (
                <div className="text-left">
                  <button
                    type="button"
                    onClick={() => switchMode('reset')}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
              )}

              {/* Server Error */}
              {serverError && (
                <div className="flex items-center gap-2 text-right text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{serverError}</span>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="flex items-center gap-2 text-right text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || (isPasswordReset && !email.trim())}
                className="w-full relative text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #2979FF 0%, #1565e0 50%, #0d47c2 100%)' }}
              >
                {/* Shimmer overlay */}
                <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                <span className="relative z-10">
                  {isPasswordReset ? 'إرسال رابط إعادة التعيين' : isSignUp ? 'إنشاء الحساب' : 'تسجيل الدخول'}
                </span>
                {!loading && <ArrowRight className="w-5 h-5 relative z-10 group-hover:-translate-x-1 transition-transform rtl-flip" />}
              </button>
            </form>

            {/* Mode Switch */}
            <div className="mt-6 pt-6 border-t border-gray-200/60">
              <p className="text-center text-sm text-gray-500">
                {isPasswordReset ? (
                  <button
                    onClick={() => switchMode('signin')}
                    className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                  >
                    ← العودة لتسجيل الدخول
                  </button>
                ) : isSignUp ? (
                  <>
                    لديك حساب بالفعل؟{' '}
                    <button
                      onClick={() => switchMode('signin')}
                      className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                    >
                      سجل الدخول
                    </button>
                  </>
                ) : (
                  <>
                    ليس لديك حساب؟{' '}
                    <button
                      onClick={() => switchMode('signup')}
                      className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                    >
                      إنشاء حساب مجاني
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-8 animate-fade-in-up delay-600">
            <div className="flex items-center justify-center gap-6 text-xs text-gray-400">
              <div className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                <Shield className="w-4 h-4" />
                <span>آمن ومحمي</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-gray-300" />
              <div className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                <CheckCircle className="w-4 h-4" />
                <span>موثوق</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-gray-300" />
              <div className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                <Zap className="w-4 h-4" />
                <span>سريع</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
