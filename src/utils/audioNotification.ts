/**
 * Utilitário de Áudio do FlowCore Compliance Sentinel
 * Emite sinal sonoro suave e profissional (duplo tom harmônico estilo Bloomberg/Refinitiv)
 * quando um alerta crítico de desenquadramento for detectado.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

const STORAGE_KEY = 'FLOWCORE_alert_sound_enabled';

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === null ? true : stored === 'true';
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
}

/**
 * Toca sinal sonoro profissional de alerta crítico:
 * Tom 1: 587.33 Hz (D5) -> Tom 2: 880 Hz (A5) com decaimento exponencial suave.
 */
export function playCriticalAlertSound(): void {
  if (!isSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {
        // Ignora silenciosamente se o navegador bloquear autoplay
      });
    }

    const now = ctx.currentTime;

    // Primeiro tom (D5 - 587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.35);

    // Segundo tom mais agudo e penetrante (A5 - 880 Hz) com leve atraso de 120ms
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.22, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.12);
    osc2.stop(now + 0.65);
  } catch (err) {
    // Falha silenciosa em navegadores sem suporte a áudio
    console.debug('Aviso sonoro de compliance indisponível:', err);
  }
}
