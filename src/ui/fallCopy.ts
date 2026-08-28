export interface FallSummary {
  height: number;
  best: number;
  breaths: number;
  collectibles: number;
  startBest: number;
  runBestBroken: boolean;
}

export interface FallCopy {
  eyebrow: string;
  title: string;
  subtitle: string;
}

export function getFallCopy(s: FallSummary): FallCopy {
  const gap = Math.max(0, s.best - s.height);

  if (s.height <= 8) {
    return {
      eyebrow: 'fim da subida',
      title: 'ops…',
      subtitle: 'o chão chegou rápido demais',
    };
  }

  if (s.runBestBroken && s.height >= s.best && s.best > 0) {
    return {
      eyebrow: 'recorde na bagagem',
      title: 'uau!',
      subtitle: 'bateste teu recorde antes de cair',
    };
  }

  if (gap > 0 && gap <= 10) {
    return {
      eyebrow: 'quase lá',
      title: 'tão perto…',
      subtitle: gap === 1 ? 'faltou 1 pro recorde' : `faltaram ${gap} pro recorde`,
    };
  }

  if (s.height >= 90) {
    return {
      eyebrow: 'fim da subida',
      title: 'que vista!',
      subtitle: 'subiste alto — respira e sobe de novo',
    };
  }

  if (s.collectibles >= 3) {
    return {
      eyebrow: 'fim da subida',
      title: 'tesouros!',
      subtitle: `${s.collectibles} colecionáveis nesta subida`,
    };
  }

  if (s.breaths >= 4) {
    return {
      eyebrow: 'fim da subida',
      title: 'quase…',
      subtitle: `${s.breaths} respiros coletados — boa calma`,
    };
  }

  if (s.height >= 40) {
    return {
      eyebrow: 'fim da subida',
      title: 'quase…',
      subtitle: 'cada queda ensina o próximo pouso',
    };
  }

  return {
    eyebrow: 'fim da subida',
    title: 'quase…',
    subtitle: 'respira fundo e tenta outra vez',
  };
}

export function getFallGapLabel(s: FallSummary): string | null {
  if (s.best <= 0) return null;
  const gap = s.best - s.height;
  if (gap <= 0) return 'recorde!';
  return `−${gap} do recorde`;
}
