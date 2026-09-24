import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Trash2, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';
import { useUserProfile } from '../../hooks/useUserProfile';

interface ProfilePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfilePhotoModal: React.FC<ProfilePhotoModalProps> = ({ isOpen, onClose }) => {
  const { photoUrl, updatePhoto, clearPhoto, isLoading } = useUserProfile();
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor selecione um arquivo de imagem válido (JPEG, PNG, WebP).');
      return;
    }

    // Limite de 15MB
    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('A imagem selecionada é muito grande (máximo 15MB).');
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (!preview) return;
    try {
      await updatePhoto(preview);
      setSuccessMessage('Foto de perfil de Dário Marques aplicada com sucesso em todo o sistema!');
      setTimeout(() => {
        setSuccessMessage(null);
        setPreview(null);
        onClose();
      }, 1500);
    } catch {
      setErrorMessage('Erro ao salvar imagem. Tente novamente.');
    }
  };

  const handleRemove = async () => {
    try {
      await clearPhoto();
      setPreview(null);
      setSuccessMessage('Foto personalizada removida.');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1200);
    } catch {
      setErrorMessage('Erro ao remover imagem.');
    }
  };

  const currentDisplay = preview || photoUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#10192A] to-[#0A101C] rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Foto de Perfil do Gestor
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                  DÁRIO MARQUES
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Esta foto será exibida no Cockpit Executivo e no cabeçalho ao lado do seu nome.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Mensagens de Feedback */}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Visualizador de Imagem / Pré-visualização */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="relative w-28 h-36 rounded-xl overflow-hidden bg-slate-950 border-2 border-cyan-500/40 shadow-lg shrink-0 flex items-center justify-center">
              {currentDisplay ? (
                <img
                  src={currentDisplay}
                  alt="Dário Marques"
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-500 text-center p-2">
                  <UserCheck className="w-8 h-8 mb-1 text-slate-600" />
                  <span className="text-[10px]">Sem foto</span>
                </div>
              )}
            </div>

            <div className="text-xs space-y-1.5 flex-1">
              <div className="font-bold text-white text-sm">Dário Marques Neto</div>
              <div className="text-cyan-400 font-medium">Especialista em Investimentos</div>
              <div className="text-slate-400 text-[11px]">MPX Wealth Management • Itaú Private & Avenue</div>
              <div className="pt-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Gestor Ativo
                </span>
                {photoUrl && (
                  <button
                    onClick={handleRemove}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remover Foto</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Área de Drag & Drop e Seleção de Arquivo */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
              dragActive
                ? 'border-cyan-400 bg-cyan-950/20'
                : 'border-slate-700 hover:border-cyan-500/60 bg-slate-900/40 hover:bg-slate-900/80'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleInputChange}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />
            <div className="p-3 rounded-full bg-slate-800 text-cyan-400">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                Arraste e solte sua foto aqui, ou <span className="text-cyan-400 underline">procure no dispositivo</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Compatível com arquivos JPEG, PNG, WhatsApp Image (até 15MB)
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            {preview && (
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Salvar Esta Foto</span>
              </button>
            )}
            {!preview && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/40 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Selecionar Foto</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
