/**
 * Utilitário de Horário Local e Sessão de Mercado (B3 / Bovespa & Mercados Globais).
 * Determina se o pregão está ABERTO, FECHADO, em PRÉ-ABERTURA ou em PÓS-MERCADO (After-Market)
 * com base no Horário Oficial de Brasília (America/Sao_Paulo - UTC-3).
 */

export type MarketSessionStatus = 'OPEN' | 'PRE_MARKET' | 'AFTER_MARKET' | 'CLOSED';

export interface MarketSessionInfo {
  /**
   * Status da sessão de negociação.
   */
  status: MarketSessionStatus;
  /**
   * Rótulo descritivo completo em português.
   */
  label: string;
  /**
   * Rótulo abreviado para telas pequenas e badges.
   */
  shortLabel: string;
  /**
   * Explicação contextual para tooltips e status executivo.
   */
  description: string;
  /**
   * Próximo marco horário da sessão (ex: "Fecha às 17:00" ou "Abre hoje às 10:00").
   */
  nextEvent: string;
  /**
   * Horário formatado na praça de referência (Brasília / B3).
   */
  brasiliaTime: string;
  /**
   * Classes visuais Tailwind correspondentes ao status para badges e indicadores.
   */
  visual: {
    dotColor: string;
    pingColor: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    statusIcon: 'ACTIVE' | 'WARNING' | 'STANDBY';
  };
}

/**
 * Converte qualquer data para a hora e minuto vigentes no Horário Oficial de Brasília (UTC-3).
 */
export function getBrasiliaDateParts(date: Date = new Date()): {
  dayOfWeek: number; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  hours: number;
  minutes: number;
  seconds: number;
  formattedTime: string;
  dateStr: string;
} {
  try {
    // Utiliza Intl com America/Sao_Paulo para cálculo exato de fuso
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour12: false,
      weekday: 'narrow',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const parts = formatter.formatToParts(date);
    let hours = 0;
    let minutes = 0;
    let seconds = 0;
    let day = 1;
    let month = 1;
    let year = 2026;

    for (const part of parts) {
      if (part.type === 'hour') hours = parseInt(part.value, 10);
      if (part.type === 'minute') minutes = parseInt(part.value, 10);
      if (part.type === 'second') seconds = parseInt(part.value, 10);
      if (part.type === 'day') day = parseInt(part.value, 10);
      if (part.type === 'month') month = parseInt(part.value, 10);
      if (part.type === 'year') year = parseInt(part.value, 10);
    }

    // Obter dia da semana em Brasília
    const weekdayStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'short',
    }).format(date);

    const weekdayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    const dayOfWeek = weekdayMap[weekdayStr] ?? date.getDay();

    const pad = (n: number) => String(n).padStart(2, '0');
    const formattedTime = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    const dateStr = `${pad(day)}/${pad(month)}/${year}`;

    return {
      dayOfWeek,
      hours,
      minutes,
      seconds,
      formattedTime,
      dateStr,
    };
  } catch {
    // Fallback defensivo usando horário local se Intl falhar
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      dayOfWeek: date.getDay(),
      hours,
      minutes,
      seconds,
      formattedTime: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
      dateStr: date.toLocaleDateString('pt-BR'),
    };
  }
}

/**
 * Verifica o status da sessão de mercado para B3 / Mercados Financeiros.
 *
 * Grade de Horários B3 (Horário de Brasília):
 * - Fins de semana (Sábado/Domingo): FECHADO
 * - Dias de semana (Segunda a Sexta):
 *   - 00:00 - 09:45: FECHADO (Overnight / Aguardando Abertura)
 *   - 09:45 - 09:59: PRÉ-ABERTURA (Leilão de Pré-Abertura)
 *   - 10:00 - 17:00: PREGÃO ABERTO (Negociação regular contínua)
 *   - 17:00 - 18:00: PÓS-MERCADO (After-Market B3)
 *   - 18:00 - 23:59: FECHADO (Fechamento diário / Consolidação)
 */
export function checkMarketSession(date: Date = new Date()): MarketSessionInfo {
  const { dayOfWeek, hours, minutes, formattedTime } = getBrasiliaDateParts(date);
  const totalMinutes = hours * 60 + minutes;

  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Final de semana
  if (isWeekend) {
    const isSaturday = dayOfWeek === 6;
    return {
      status: 'CLOSED',
      label: 'MERCADO FECHADO',
      shortLabel: 'FECHADO',
      description: 'Fim de semana • Pregões B3 e bolsas internacionais encerrados. Cotações congeladas no fechamento de sexta.',
      nextEvent: isSaturday ? 'Abre segunda-feira às 10:00' : 'Abre amanhã às 10:00',
      brasiliaTime: `${formattedTime} (Brasília)`,
      visual: {
        dotColor: 'bg-slate-400',
        pingColor: 'bg-slate-400/50',
        badgeBg: 'bg-slate-800/80',
        badgeText: 'text-slate-300',
        badgeBorder: 'border-slate-700',
        statusIcon: 'STANDBY',
      },
    };
  }

  // Segunda a Sexta: Análise por faixa de minutos
  const PRE_MARKET_START = 9 * 60 + 45; // 09:45
  const REGULAR_OPEN = 10 * 60; // 10:00
  const REGULAR_CLOSE = 17 * 60; // 17:00
  const AFTER_MARKET_CLOSE = 18 * 60; // 18:00

  // 1. Pré-Abertura (09:45 às 09:59)
  if (totalMinutes >= PRE_MARKET_START && totalMinutes < REGULAR_OPEN) {
    return {
      status: 'PRE_MARKET',
      label: 'PRÉ-ABERTURA',
      shortLabel: 'PRÉ-MKT',
      description: 'Leilão de pré-abertura B3 em andamento. Formação de preços teóricos de abertura.',
      nextEvent: 'Abertura regular às 10:00',
      brasiliaTime: `${formattedTime} (Brasília)`,
      visual: {
        dotColor: 'bg-cyan-400',
        pingColor: 'bg-cyan-400/60',
        badgeBg: 'bg-cyan-500/10',
        badgeText: 'text-cyan-300',
        badgeBorder: 'border-cyan-500/30',
        statusIcon: 'ACTIVE',
      },
    };
  }

  // 2. Pregão Regular Aberto (10:00 às 17:00)
  if (totalMinutes >= REGULAR_OPEN && totalMinutes < REGULAR_CLOSE) {
    const minutesToClose = REGULAR_CLOSE - totalMinutes;
    const hoursLeft = Math.floor(minutesToClose / 60);
    const minsLeft = minutesToClose % 60;
    const timeRemainingStr = hoursLeft > 0 ? `${hoursLeft}h ${minsLeft}min` : `${minsLeft}min`;

    return {
      status: 'OPEN',
      label: 'PREGÃO ABERTO',
      shortLabel: 'ABERTO',
      description: 'Pregão regular em negociação contínua na B3 e mercado internacional. Liquidez plena.',
      nextEvent: `Fecha às 17:00 (restam ${timeRemainingStr})`,
      brasiliaTime: `${formattedTime} (Brasília)`,
      visual: {
        dotColor: 'bg-emerald-400',
        pingColor: 'bg-emerald-400/80',
        badgeBg: 'bg-emerald-500/10',
        badgeText: 'text-emerald-300',
        badgeBorder: 'border-emerald-500/30',
        statusIcon: 'ACTIVE',
      },
    };
  }

  // 3. Pós-Mercado / After-Market (17:00 às 18:00)
  if (totalMinutes >= REGULAR_CLOSE && totalMinutes < AFTER_MARKET_CLOSE) {
    const minutesToAfterClose = AFTER_MARKET_CLOSE - totalMinutes;
    return {
      status: 'AFTER_MARKET',
      label: 'PÓS-MERCADO',
      shortLabel: 'AFTER-MKT',
      description: 'Sessão After-Market B3 ativa. Ajustes de posições, liquidez reduzida e oscilação limitada.',
      nextEvent: `Encerramento do After-Market às 18:00 (restam ${minutesToAfterClose}min)`,
      brasiliaTime: `${formattedTime} (Brasília)`,
      visual: {
        dotColor: 'bg-amber-400',
        pingColor: 'bg-amber-400/75',
        badgeBg: 'bg-amber-500/10',
        badgeText: 'text-amber-300',
        badgeBorder: 'border-amber-500/30',
        statusIcon: 'WARNING',
      },
    };
  }

  // 4. Mercado Fechado (Antes das 09:45 ou após as 18:00)
  const isNight = totalMinutes >= AFTER_MARKET_CLOSE;
  const isFriday = dayOfWeek === 5;

  let nextOpenText = 'Abre hoje às 10:00';
  if (isNight) {
    if (isFriday) {
      nextOpenText = 'Abre segunda-feira às 10:00';
    } else {
      nextOpenText = 'Abre amanhã às 10:00';
    }
  }

  return {
    status: 'CLOSED',
    label: 'MERCADO FECHADO',
    shortLabel: 'FECHADO',
    description: isNight
      ? 'Fechamento do pregão diário. Cotações consolidadas para marcação a mercado e liquidação fiduciária.'
      : 'Madrugada / Pré-pregão. Cotações refletem o fechamento do dia útil anterior.',
    nextEvent: nextOpenText,
    brasiliaTime: `${formattedTime} (Brasília)`,
    visual: {
      dotColor: 'bg-slate-400',
      pingColor: 'bg-slate-400/40',
      badgeBg: 'bg-slate-800/60',
      badgeText: 'text-slate-300',
      badgeBorder: 'border-slate-700/80',
      statusIcon: 'STANDBY',
    },
  };
}

/**
 * Retorna true se a sessão estiver em negociação contínua regular.
 */
export function isMarketOpen(date: Date = new Date()): boolean {
  return checkMarketSession(date).status === 'OPEN';
}

/**
 * Retorna true se estiver ocorrendo qualquer tipo de negociação (Regular, Pré ou Pós).
 */
export function isMarketTradingActive(date: Date = new Date()): boolean {
  const { status } = checkMarketSession(date);
  return status === 'OPEN' || status === 'AFTER_MARKET' || status === 'PRE_MARKET';
}
