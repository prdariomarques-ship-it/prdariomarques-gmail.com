/**
 * Utilitário de Notificação Sonora utilizando Web Audio API nativa.
 * Não requer arquivos externos de áudio e funciona em navegadores modernos.
 */

let soundEnabled = true;

export const isSoundEnabled = (): boolean => soundEnabled;

export const setSoundEnabled = (enabled: boolean): void => {
  soundEnabled = enabled;
};

/**
 * Toca um aviso sonoro elegante de alerta de mercado (duplo tom de alta fidelidade)
 */
export const playCriticalAlertSound = (): void => {
  if (!soundEnabled || typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    // Primeiro tom (fundamental)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain1.gain.setValueAtTime(0.18, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.35);

    // Segundo tom (harmônico confirmatório)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.12); // C6
    osc2.frequency.exponentialRampToValueAtTime(1318.5, ctx.currentTime + 0.28); // E6

    gain2.gain.setValueAtTime(0, ctx.currentTime);
    gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.45);
  } catch (err) {
    // Autoplay policy pode bloquear áudio antes de interação do usuário
    console.debug('Áudio suspenso ou não permitido pelo navegador:', err);
  }
};
