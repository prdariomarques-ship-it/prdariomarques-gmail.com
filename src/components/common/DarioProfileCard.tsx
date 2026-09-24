import React, { useState, useRef } from 'react';
import { Camera, Sparkles, ShieldCheck, Award, Upload, Image as ImageIcon } from 'lucide-react';
import { useUserProfile } from '../../hooks/useUserProfile';
import { ProfilePhotoModal } from './ProfilePhotoModal';

interface DarioProfileCardProps {
  quote?: string;
  onOpenSettings?: () => void;
}

export const DarioProfileCard: React.FC<DarioProfileCardProps> = ({
  quote = 'Estratégia transforma informação em liberdade.',
  onOpenSettings,
}) => {
  const { photoUrl, updatePhoto } = useUserProfile();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDirectPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const res = event.target?.result as string;
        if (res) {
          updatePhoto(res);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3 w-full max-w-[280px] shrink-0">
        {/* Main Executive Portrait Card */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#141F33] via-[#0E1626] to-[#0A101C] border border-slate-700/60 shadow-xl group">
          {/* Photo Container */}
          <div className="relative w-full aspect-[4/5] overflow-hidden bg-slate-900 flex items-center justify-center">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Dário Marques"
                className="w-full h-full object-cover object-top filter brightness-100 contrast-105 transition duration-300 group-hover:scale-102"
              />
            ) : (
              /* High-Detail Stylized Executive Avatar matching Dário's portrait */
              <div className="relative w-full h-full flex flex-col items-center justify-end bg-gradient-to-b from-slate-800 via-slate-900 to-[#070D18]">
                {/* Background ambient architectural glow */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(37,99,235,0.25),transparent_70%)]" />
                <div className="absolute top-4 right-4 w-12 h-12 bg-cyan-500/10 rounded-full blur-xl" />

                {/* Stylized Executive Portrait Illustration matching photo */}
                <div className="relative z-10 w-full h-full flex flex-col items-center justify-center pt-2">
                  <svg
                    viewBox="0 0 200 240"
                    className="w-[88%] h-[88%] drop-shadow-2xl"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient id="skinGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#d29676" />
                        <stop offset="60%" stopColor="#bf815f" />
                        <stop offset="100%" stopColor="#9a5e3f" />
                      </linearGradient>
                      <linearGradient id="blazerGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1e3a8a" />
                        <stop offset="50%" stopColor="#172554" />
                        <stop offset="100%" stopColor="#0a1228" />
                      </linearGradient>
                      <linearGradient id="blackShirtGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1e293b" />
                        <stop offset="100%" stopColor="#090d16" />
                      </linearGradient>
                      <linearGradient id="hairGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#3a3d45" />
                        <stop offset="60%" stopColor="#22252b" />
                        <stop offset="100%" stopColor="#121316" />
                      </linearGradient>
                    </defs>

                    {/* Dark Black Collared Shirt (Inner) */}
                    <path
                      d="M75 160 L100 215 L125 160 Z"
                      fill="url(#blackShirtGrad)"
                    />
                    {/* Shirt Buttons */}
                    <circle cx="100" cy="180" r="1.5" fill="#475569" />
                    <circle cx="100" cy="195" r="1.5" fill="#475569" />

                    {/* Tailored Navy Blue Suit Jacket / Blazer */}
                    {/* Left Shoulder & Lapel */}
                    <path
                      d="M20 240 C 20 180, 50 162, 82 160 L 100 230 L 20 240 Z"
                      fill="url(#blazerGrad)"
                    />
                    {/* Right Shoulder & Lapel */}
                    <path
                      d="M180 240 C 180 180, 150 162, 118 160 L 100 230 L 180 240 Z"
                      fill="url(#blazerGrad)"
                    />
                    {/* Left Notch Lapel */}
                    <path
                      d="M60 165 L 85 205 L 75 162 Z"
                      fill="#2563eb"
                      opacity="0.3"
                    />
                    {/* Right Notch Lapel */}
                    <path
                      d="M140 165 L 115 205 L 125 162 Z"
                      fill="#2563eb"
                      opacity="0.3"
                    />

                    {/* Neck */}
                    <rect x="86" y="132" width="28" height="34" rx="6" fill="#bf815f" />
                    {/* Neck shadow */}
                    <path d="M86 132 Q100 144 114 132 L114 140 Q100 152 86 140 Z" fill="#8c5132" opacity="0.4" />

                    {/* Head / Face Shape */}
                    <path
                      d="M60 92 C 60 48, 140 48, 140 92 C 140 132, 126 154, 100 154 C 74 154, 60 132, 60 92 Z"
                      fill="url(#skinGrad)"
                    />

                    {/* Haircut: Short Textured Hair with slight temple recession */}
                    <path
                      d="M58 82 C 58 40, 75 28, 100 28 C 125 28, 142 40, 142 82 C 138 60, 128 44, 100 44 C 72 44, 62 60, 58 82 Z"
                      fill="url(#hairGrad)"
                    />
                    {/* Hair texture / salt-and-pepper highlights */}
                    <path d="M68 50 Q100 36 132 50" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                    <path d="M74 42 Q100 32 126 42" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />

                    {/* Ears */}
                    <circle cx="58" cy="95" r="7.5" fill="#bf815f" />
                    <circle cx="142" cy="95" r="7.5" fill="#bf815f" />

                    {/* Distinct Masculine Eyebrows */}
                    <path d="M70 78 Q84 74 94 78" stroke="#181a1f" strokeWidth="3" strokeLinecap="round" />
                    <path d="M106 78 Q116 74 130 78" stroke="#181a1f" strokeWidth="3" strokeLinecap="round" />

                    {/* Expressive Eyes */}
                    <ellipse cx="82" cy="87" rx="4.5" ry="2.8" fill="#18191c" />
                    <ellipse cx="118" cy="87" rx="4.5" ry="2.8" fill="#18191c" />
                    <circle cx="83.5" cy="86" r="1.2" fill="#fff" />
                    <circle cx="119.5" cy="86" r="1.2" fill="#fff" />

                    {/* Nose Bridge and Tip */}
                    <path d="M100 85 L100 108 L96 112 L104 112" stroke="#7c4728" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

                    {/* Facial Hair: Groomed Goatee + Stubble along jawline (matching photo) */}
                    {/* Jawline Stubble */}
                    <path
                      d="M66 102 C 66 136, 78 148, 100 150 C 122 148, 134 136, 134 102"
                      stroke="#22262e"
                      strokeWidth="2.5"
                      strokeDasharray="2,2"
                      fill="none"
                      opacity="0.8"
                    />
                    {/* Goatee & Soul Patch */}
                    <path
                      d="M82 116 Q100 119 118 116 C 118 136, 114 150, 100 151 C 86 150, 82 136, 82 116 Z"
                      fill="#1a1d24"
                      opacity="0.9"
                    />
                    {/* Mustache */}
                    <path d="M82 118 Q100 116 118 118" stroke="#1a1d24" strokeWidth="3.5" strokeLinecap="round" />
                    {/* Soul patch */}
                    <ellipse cx="100" cy="129" rx="2" ry="3.5" fill="#1a1d24" />

                    {/* Lips */}
                    <path d="M88 126 Q100 128 112 126" stroke="#68341b" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                  </svg>
                </div>
              </div>
            )}

            {/* Vignette & Soft Gradient on bottom of portrait */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#090F1C] via-[#090F1C]/40 to-transparent pointer-events-none" />

            {/* Verification badge */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 border border-emerald-500/40 text-[11px] font-semibold text-emerald-300 shadow-md backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Online</span>
            </div>

            {/* Quick action button to change or view photo */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="absolute top-3 right-3 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 shadow-lg backdrop-blur-sm transition cursor-pointer"
              title="Trocar ou carregar foto de perfil de Dário Marques"
            >
              <Camera className="w-4 h-4 text-cyan-400" />
            </button>

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

        {/* Botão de Destaque: Alterar Foto */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition cursor-pointer shadow-xs"
        >
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          <span>{photoUrl ? 'Alterar Foto Oficial' : 'Carregar Minha Foto'}</span>
        </button>

        {/* Quote Card */}
        <div className="relative p-3.5 rounded-xl bg-[#0F1829]/90 border border-slate-800/90 shadow-md text-center flex items-center justify-center">
          <p className="text-xs text-slate-300 font-medium italic leading-relaxed">
            <span className="text-blue-400 font-serif mr-1">❝</span>
            {quote}
            <span className="text-blue-400 font-serif ml-1">❞</span>
          </p>
        </div>
      </div>

      {/* Modal de Gestão de Foto */}
      <ProfilePhotoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
