import dotenv from 'dotenv';
dotenv.config();

export const config = {
  token: process.env.DISCORD_TOKEN || '',
  clientId: process.env.CLIENT_ID || '',
  guildId: process.env.GUILD_ID || '',
  adhanApi: process.env.ADHAN_API_URL || 'https://api.aladhan.com/v1',
  quranApi: process.env.QURAN_API_URL || 'https://api.alquran.cloud/v1',
  hadithApi: process.env.HADITH_API_URL || 'https://hadith.gading.dev',
  footer: 'سِبْحَة • فَاذْكُرُونِي أَذْكُرْكُمْ',
  botName: 'سِبْحَة',
  version: '2.0.0',
  monoIcon: '',
};

export const colors = {
  adhkar:   0x334D42 as const,
  prayer:   0x333D4D as const,
  quran:    0x4D4433 as const,
  hadith:   0x3D364D as const,
  fatawa:   0x2E4236 as const,
  zakat:    0x4D3833 as const,
  history:  0x403A30 as const,
  games:    0x4D3D33 as const,
  settings: 0x39404A as const,
  community:0x39404A as const,
  default:  0xC9A84C as const,
} as const;

export const icons: Record<string, string> = {
  adhkar:   '۞',
  prayer:   '🕌',
  quran:    '📖',
  hadith:   '📜',
  fatawa:   '⚖️',
  zakat:    '💎',
  history:  '🗡️',
  games:    '🎯',
  settings: '⚙️',
  community:'🌙',
  default:  '۞',
};

export const sectionNames: Record<string, string> = {
  adhkar:   'الأذكار',
  prayer:   'الصلاة',
  quran:    'القرآن الكريم',
  hadith:   'الحديث النبوي',
  fatawa:   'الفتاوى',
  zakat:    'الزكاة',
  history:  'التاريخ الإسلامي',
  games:    'الألعاب',
  settings: 'الإعدادات',
  community:'المجتمع',
  default:  '',
};

export const levels = [
  { name: 'طالب علم', minPoints: 0 },
  { name: 'مثقف', minPoints: 100 },
  { name: 'عالم', minPoints: 300 },
  { name: 'شيخ', minPoints: 600 },
  { name: 'قدوة', minPoints: 1000 },
];
