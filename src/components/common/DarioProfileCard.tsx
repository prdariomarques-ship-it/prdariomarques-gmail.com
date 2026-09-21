import React, { useState, useEffect, useRef } from 'react';
import { Camera, Sparkles, ShieldCheck, Award, Upload } from 'lucide-react';

interface DarioProfileCardProps {
  quote?: string;
  onOpenSettings?: () => void;
}

export const DarioProfileCard: React.FC<DarioProfileCardProps> = ({
  quote = 'Estratégia transforma informação em liberdade.',
  onOpenSettings,
}) => {
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('flowcore_dario_custom_photo');
      if (saved) {
        setCustomPhoto(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const res = event.target?.result as string;
        setCustomPhoto(res);
        try {
          localStorage.setItem('flowcore_dario_custom_photo', res);
        } catch {
          // ignore
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full max-w-[280px] shrink-0">
      {/* Main Executive Portrait Card */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#141F33] via-[#0E1626] to-[#0A101C] border border-slate-700/60 shadow-xl group">
        {/* Photo Container */}
        <div className="relative w-full aspect-[4/5] overflow-hidden bg-slate-900 flex items-center justify-center">
          {customPhoto ? (
            <img
              src={customPhoto}
              alt="Dário Marques"
              className="w-full h-full object-cover object-top filter brightness-95 contrast-105"
            />
          ) : (
            /* High-Detail Stylized Executive Avatar representing Dário Marques */
            <div className="relative w-full h-full flex flex-col items-center justify-end bg-gradient-to-b from-slate-800 via-slate-900 to-[#070D18]">
              {/* Background ambient architectural glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(37,99,235,0.25),transparent_70%)]" />
              <div className="absolute top-4 right-4 w-12 h-12 bg-cyan-500/10 rounded-full blur-xl" />

              {/* Stylized Executive Portrait Illustration */}
              <div className="relative z-10 w-full h-full flex flex-col items-center justify-center pt-2">
                <svg
                  viewBox="0 0 200 240"
                  className="w-[85%] h-[85%] drop-shadow-2xl"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="skinGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#c68a68" />
                      <stop offset="100%" stopColor="#9e6242" />
                    </linearGradient>
                    <linearGradient id="shirtGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1e3a8a" />
                      <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                    <linearGradient id="hairGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#2c2c2c" />
                      <stop offset="100%" stopColor="#151515" />
                    </linearGradient>
                  </defs>

                  {/* Shoulders / Navy Polo Shirt */}
                  <path
                    d="M30 240 C 30 185, 60 170, 100 170 C 140 170, 170 185, 170 240 Z"
                    fill="url(#shirtGrad)"
                  />
                  {/* Polo Collar */}
                  <path
                    d="M80 170 L100 200 L120 170 L108 170 L100 188 L92 170 Z"
                    fill="#172554"
                  />
                  <line x1="100" y1="200" x2="100" y2="228" stroke="#3b82f6" strokeWidth="2" />

                  {/* Neck */}
                  <rect x="85" y="140" width="30" height="36" rx="6" fill="#9e6242" />

                  {/* Head / Face */}
                  <path
                    d="M62 95 C 62 50, 138 50, 138 95 C 138 135, 126 155, 100 155 C 74 155, 62 135, 62 95 Z"
                    fill="url(#skinGrad)"
                  />

                  {/* Short Dark Hair */}
                  <path
                    d="M58 85 C 58 45, 75 32, 100 32 C 125 32, 142 45, 142 85 C 138 65, 125 46, 100 46 C 75 46, 62 65, 58 85 Z"
                    fill="url(#hairGrad)"
                  />

                  {/* Ears */}
                  <circle cx="59" cy="98" r="8" fill="#9e6242" />
                  <circle cx="141" cy="98" r="8" fill="#9e6242" />
                  {/* Wireless Earpiece on ear */}
                  <rect x="139" y="94" width="5" height="9" rx="2.5" fill="#0f172a" />
                  <circle cx="141" cy="96" r="1.5" fill="#38bdf8" />

                  {/* Eyes & Brows */}
                  {/* Eyebrows */}
                  <path d="M72 82 Q84 79 94 83" stroke="#222" strokeWidth="3" strokeLinecap="round" />
                  <path d="M106 83 Q116 79 128 82" stroke="#222" strokeWidth="3" strokeLinecap="round" />

                  {/* Eyes */}
                  <ellipse cx="83" cy="91" rx="4" ry="2.5" fill="#1c1917" />
                  <ellipse cx="117" cy="91" rx="4" ry="2.5" fill="#1c1917" />
                  <circle cx="84" cy="90" r="1" fill="#fff" />
                  <circle cx="118" cy="90" r="1" fill="#fff" />

                  {/* Nose */}
                  <path d="M100 89 L100 112 L96 116 L104 116" stroke="#7c4a2d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

                  {/* Beard / Goatee */}
                  <path
                    d="M80 118 Q100 120 120 118 C 120 138, 115 152, 100 153 C 85 152, 80 138, 80 118 Z"
                    fill="#1f242e"
                    opacity="0.88"
                  />
                  {/* Moustache */}
                  <path d="M84 122 Q100 120 116 122" stroke="#1f242e" strokeWidth="3.5" strokeLinecap="round" />
                  {/* Mouth */}
                  <path d="M88 132 Q100 135 112 132" stroke="#68341b" strokeWidth="2" strokeLinecap="round" fill="none" />
                </svg>
              </div>
            </div>
          )}

          {/* Vignette & Soft Gradient on bottom of portrait */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#090F1C] via-[#090F1C]/40 to-transparent pointer-events-none" />

          {/* Quick upload photo button on hover */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute top-3 right-3 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 opacity-0 group-hover:opacity-100 transition shadow-lg backdrop-blur-sm"
            title="Carregar / Trocar foto de perfil"
          >
            <Camera className="w-4 h-4" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            accept="image/*"
            className="hidden"
          />

          {/* Verification badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/70 border border-emerald-500/40 text-[11px] font-semibold text-emerald-300 shadow-md backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Online</span>
          </div>

          {/* Name & Credentials Overlay at bottom of portrait */}
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <h3 className="text-xl font-bold text-white tracking-tight leading-tight drop-shadow-md">
              Dário Marques
            </h3>
            <p className="text-xs font-medium text-cyan-300 drop-shadow-sm mt-0.5">
              Especialista em Investimentos
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[11px] text-cyan-200/90 font-semibold tracking-wide">
                MPX Wealth Management
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Card */}
      <div className="relative p-3.5 rounded-xl bg-[#0F1829]/90 border border-slate-800/90 shadow-md text-center flex items-center justify-center">
        <p className="text-xs text-slate-300 font-medium italic leading-relaxed">
          <span className="text-blue-400 font-serif mr-1">❝</span>
          {quote}
          <span className="text-blue-400 font-serif ml-1">❞</span>
        </p>
      </div>
    </div>
  );
};
