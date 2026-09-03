export type AchievementIcon =
  | 'skull'
  | 'floor'
  | 'gravity'
  | 'impact'
  | 'respawn'
  | 'height_low'
  | 'height_mid'
  | 'height_cloud'
  | 'height_sun'
  | 'height_peak'
  | 'height_rocket'
  | 'height_orbit'
  | 'height_billion'
  | 'target'
  | 'metronome'
  | 'mirror'
  | 'perfect_tired'
  | 'fiscal'
  | 'fiscal_shield'
  | 'fiscal_tax'
  | 'fiscal_mad'
  | 'coin'
  | 'coin_bag'
  | 'coin_stack'
  | 'coin_farm'
  | 'shop'
  | 'hat_prop'
  | 'potion'
  | 'backpack'
  | 'potion_perfect'
  | 'rank_sign'
  | 'rank_medal'
  | 'rank_crown'
  | 'rank_globe'
  | 'daily'
  | 'daily_done'
  | 'streak_3'
  | 'streak_7'
  | 'secret_near'
  | 'secret_idle'
  | 'secret_asmr'
  | 'secret_fall'
  | 'secret_breath'
  | 'clock'
  | 'moon'
  | 'secret_shop';

export type AchievementCategory =
  | 'queda'
  | 'altura'
  | 'perfeito'
  | 'fiscal'
  | 'moedas'
  | 'equip'
  | 'ranking'
  | 'diario'
  | 'secreta';

export interface AchievementDef {
  id: string;
  title: string;
  hint: string;
  icon: AchievementIcon;
  category: AchievementCategory;
  secret?: boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Quedas
  { id: 'fall_first', title: 'Primeira queda', hint: 'Todo mundo cai. Você só foi primeiro.', icon: 'skull', category: 'queda' },
  { id: 'fall_10', title: 'Já conheço o chão', hint: 'O chão te manda oi.', icon: 'floor', category: 'queda' },
  { id: 'fall_50', title: 'Profissional da gravidade', hint: 'Newton ficaria orgulhoso.', icon: 'gravity', category: 'queda' },
  { id: 'fall_100', title: 'Catástrofe recorrente', hint: 'Você não sobe. Você visita.', icon: 'impact', category: 'queda' },
  { id: 'fall_3_fast', title: 'Reencarnação express', hint: 'Respawn é hobby.', icon: 'respawn', category: 'queda' },

  // Altura
  { id: 'height_1k', title: 'Subiu um tantinho', hint: 'Ok, isso conta.', icon: 'height_low', category: 'altura' },
  { id: 'height_5k', title: 'Teto da sala', hint: 'Sua mãe já gritou “desce”?', icon: 'height_mid', category: 'altura' },
  { id: 'height_10k', title: 'Nuvem de algodão', hint: 'Quase tocando o céu pastel.', icon: 'height_cloud', category: 'altura' },
  { id: 'height_25k', title: 'Metade do caminho pro sol', hint: 'Protetor solar recomendado.', icon: 'height_sun', category: 'altura' },
  { id: 'height_50k', title: 'Na altura das nuvens', hint: 'O céu pediu licença e você passou.', icon: 'height_cloud', category: 'altura' },
  { id: 'height_100k', title: 'Centenário do ar', hint: 'Parabéns: o oxigênio te mandou cartão.', icon: 'height_peak', category: 'altura' },
  { id: 'height_500k', title: 'Meio milhão de “só mais um pulo”', hint: 'Mentira. Sempre tem mais um.', icon: 'height_rocket', category: 'altura' },
  { id: 'height_100m', title: 'Cem milhões', hint: 'Isso é altitude, não typo.', icon: 'height_orbit', category: 'altura' },
  { id: 'height_200m', title: 'Duzentos milhões', hint: 'GPS pediu arrego.', icon: 'height_orbit', category: 'altura' },
  { id: 'height_300m', title: 'Trezentos milhões', hint: 'Satélite te viu passar.', icon: 'height_orbit', category: 'altura' },
  { id: 'height_500m', title: 'Quinhentos milhões', hint: 'Meio bilhão de “quase”.', icon: 'height_orbit', category: 'altura' },
  { id: 'height_1b', title: 'Você é humano mesmo???', hint: 'Isso não é altura. Isso é audácia.', icon: 'height_billion', category: 'altura' },

  // Perfeito
  { id: 'perfect_first', title: 'Centro é meu', hint: 'No meio, sem drama.', icon: 'target', category: 'perfeito' },
  { id: 'perfect_10', title: 'Metrônomo', hint: 'Tic-tac no pixel certo.', icon: 'metronome', category: 'perfeito' },
  { id: 'perfect_25', title: 'Obsessão por simetria', hint: 'O fiscal aprovaria… talvez.', icon: 'mirror', category: 'perfeito' },
  { id: 'perfect_50_run', title: 'Perfeccionista cansado', hint: 'Relaxa. Ninguém pediu isso.', icon: 'perfect_tired', category: 'perfeito' },

  // Fiscal
  { id: 'gnome_first', title: 'Multa emocional', hint: 'Ele só queria conversar.', icon: 'fiscal', category: 'fiscal' },
  { id: 'gnome_survive', title: 'Sobrevivi ao fiscal', hint: 'Auditoria reprovada.', icon: 'fiscal_shield', category: 'fiscal' },
  { id: 'gnome_survive_5', title: 'Inimigo do imposto', hint: 'Contador pixelado derrotado.', icon: 'fiscal_tax', category: 'fiscal' },
  { id: 'gnome_hit_10', title: 'Fiscal, me deixa', hint: 'Ele te conhece pelo nome.', icon: 'fiscal_mad', category: 'fiscal' },

  // Moedas / loja
  { id: 'coin_first', title: 'Primeira moeda', hint: 'Rico! (relativamente)', icon: 'coin', category: 'moedas' },
  { id: 'coin_wallet_100', title: 'Bolso pesado', hint: 'Barulhinho de ASMR financeiro.', icon: 'coin_bag', category: 'moedas' },
  { id: 'coin_wallet_1000', title: 'Magnata soft', hint: 'Chapéu hélice quando?', icon: 'coin_stack', category: 'moedas' },
  { id: 'coin_run_500', title: 'Farmador de moeda', hint: 'Subiu ou só juntou troco?', icon: 'coin_farm', category: 'moedas' },
  { id: 'shop_first', title: 'Primeira compra', hint: 'Consumidor consciente… ou não.', icon: 'shop', category: 'moedas' },

  // Equipamento
  { id: 'gear_helicopter', title: 'Hélice ligada', hint: 'Ventilador de teto ambulante.', icon: 'hat_prop', category: 'equip' },
  { id: 'gear_potion', title: 'Blue mode', hint: 'Gravidade pediu arrego.', icon: 'potion', category: 'equip' },
  { id: 'gear_full', title: 'Full loadout', hint: 'Chegou equipado demais.', icon: 'backpack', category: 'equip' },
  { id: 'gear_perfect_potion', title: 'Poção no timing', hint: 'Química + precisão.', icon: 'potion_perfect', category: 'equip' },

  // Ranking
  { id: 'rank_submit', title: 'Nome registrado', hint: 'Agora é oficial. Sem apagar.', icon: 'rank_sign', category: 'ranking' },
  { id: 'rank_weekly_top10', title: 'Top 10 semanal', hint: 'Famosa por 7 dias.', icon: 'rank_medal', category: 'ranking' },
  { id: 'rank_weekly_1', title: 'Rei da colina', hint: 'Segunda que vem recomeça. Aproveita.', icon: 'rank_crown', category: 'ranking' },
  { id: 'rank_global_top10', title: 'Lenda global', hint: 'História do servidor.', icon: 'rank_globe', category: 'ranking' },

  // Diário / hábito
  { id: 'daily_first', title: 'Desafio do dia', hint: 'Checklist pixelada.', icon: 'daily', category: 'diario' },
  { id: 'daily_all_three', title: 'Três de três', hint: 'Funcionário do mês.', icon: 'daily_done', category: 'diario' },
  { id: 'streak_3', title: 'Voltei amanhã', hint: 'Vício saudável (?).', icon: 'streak_3', category: 'diario' },
  { id: 'streak_7', title: 'Semana inteira', hint: 'Você mora aqui agora.', icon: 'streak_7', category: 'diario' },

  // Secretas
  { id: 'secret_near_pb', title: 'Quase lá', hint: 'O jogo riu. Você também.', icon: 'secret_near', category: 'secreta', secret: true },
  { id: 'secret_title_idle', title: 'Só olhando', hint: 'Turista do menu.', icon: 'secret_idle', category: 'secreta', secret: true },
  { id: 'secret_landings_50', title: 'ASMR puro', hint: 'Só barulhinho bonito.', icon: 'secret_asmr', category: 'secreta', secret: true },
  { id: 'secret_speed_fall', title: 'Speedrun do chão', hint: 'Recorde… invertido.', icon: 'secret_fall', category: 'secreta', secret: true },
  { id: 'secret_breaths_20', title: 'Coletor de fôlego', hint: 'Pulmão de pixel.', icon: 'secret_breath', category: 'secreta', secret: true },
  { id: 'secret_play_10min', title: 'Cara, sai um pouco do jogo!', hint: '10 minutos. Vai beber água.', icon: 'clock', category: 'secreta', secret: true },
  { id: 'secret_night_owl', title: 'Coruja pixelada', hint: 'Jogando quando ninguém vê.', icon: 'moon', category: 'secreta', secret: true },
  { id: 'secret_shop_window', title: 'Vitrine eterna', hint: 'Olhou 5 vezes. Comprou zero.', icon: 'secret_shop', category: 'secreta', secret: true },
];

export const HEIGHT_THRESHOLDS: { id: string; min: number }[] = [
  { id: 'height_1k', min: 1_000 },
  { id: 'height_5k', min: 5_000 },
  { id: 'height_10k', min: 10_000 },
  { id: 'height_25k', min: 25_000 },
  { id: 'height_50k', min: 50_000 },
  { id: 'height_100k', min: 100_000 },
  { id: 'height_500k', min: 500_000 },
  { id: 'height_100m', min: 100_000_000 },
  { id: 'height_200m', min: 200_000_000 },
  { id: 'height_300m', min: 300_000_000 },
  { id: 'height_500m', min: 500_000_000 },
  { id: 'height_1b', min: 1_000_000_000 },
];

const byId = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

export function getAchievement(id: string): AchievementDef | undefined {
  return byId.get(id);
}

export function allAchievementIds(): string[] {
  return ACHIEVEMENTS.map((a) => a.id);
}
