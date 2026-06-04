import { createCanvas, registerFont } from 'canvas';
import path from 'path';

const FONTS_DIR = path.resolve(__dirname, '../../assets/fonts');

try {
  registerFont(path.join(FONTS_DIR, 'Amiri-Bold.ttf'), { family: 'Amiri', weight: 'bold' });
  registerFont(path.join(FONTS_DIR, 'Amiri-Regular.ttf'), { family: 'Amiri', weight: 'normal' });
  registerFont(path.join(FONTS_DIR, 'AmiriQuran.ttf'), { family: 'AmiriQuran' });
} catch {
  // fonts already registered or not found
}

const COLORS = {
  teal: '#00695C',
  tealDark: '#004D40',
  gold: '#B8860B',
  goldLight: '#D4A843',
  cream: '#F5F0E8',
  navy: '#0D47A1',
  deepPurple: '#4A148C',
  white: '#FFFFFF',
  dark: '#1A1A2E',
  bg1: '#0D2137',
  bg2: '#1A3A4A',
  bg3: '#2D1B4E',
};

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function drawBackground(ctx: any, width: number, height: number, theme: 'teal' | 'navy' | 'purple' | 'gold') {
  const gradients: Record<string, [string, string]> = {
    teal: [COLORS.tealDark, COLORS.teal],
    navy: ['#0A1628', COLORS.navy],
    purple: ['#1A0A2E', COLORS.deepPurple],
    gold: ['#3D2910', '#6B4F1A'],
  };
  const [c1, c2] = gradients[theme] || gradients.teal;

  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, c1);
  grad.addColorStop(0.5, c2);
  grad.addColorStop(1, c1);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 8; i++) {
    const size = 60 + i * 30;
    ctx.strokeStyle = COLORS.white;
    ctx.lineWidth = 1;
    ctx.strokeRect(width / 2 - size, height / 2 - size, size * 2, size * 2);
    ctx.rotate(Math.PI / 16);
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.04;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(width * (0.2 + i * 0.3), height * (0.3 + i * 0.2), 120, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.goldLight;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.03;
  ctx.strokeStyle = COLORS.white;
  ctx.lineWidth = 0.5;
  for (let i = 0; i < width; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 30, height);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTopDeco(ctx: any, width: number) {
  ctx.save();
  for (let x = 0; x < width; x += 30) {
    ctx.fillStyle = hexToRgba(COLORS.gold, 0.15);
    ctx.fillRect(x, 4, 1, 2);
    ctx.fillStyle = hexToRgba(COLORS.gold, 0.08);
    ctx.fillRect(x + 15, 6, 1, 1);
  }

  ctx.fillStyle = hexToRgba(COLORS.gold, 0.4);
  ctx.fillRect(60, 0, width - 120, 1.5);
  ctx.fillRect(60, 9, width - 120, 1);
  ctx.restore();
}

function drawBottomDeco(ctx: any, width: number, height: number) {
  ctx.save();
  ctx.fillStyle = hexToRgba(COLORS.gold, 0.3);
  ctx.fillRect(60, height - 2, width - 120, 1.5);
  ctx.fillRect(60, height - 9, width - 120, 1);

  for (let x = 0; x < width; x += 30) {
    ctx.fillStyle = hexToRgba(COLORS.gold, 0.12);
    ctx.fillRect(x, height - 5, 1, 2);
  }
  ctx.restore();
}

function wrapText(ctx: any, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = '';

  for (const char of text) {
    const test = current + char;
    if (ctx.measureText(test).width > maxWidth && current.length > 0) {
      lines.push(current);
      current = char;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function generateDhikrImage(
  text: string,
  count: string,
  blessing: string,
): Promise<Buffer> {
  const width = 800;
  const height = 500;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const themes: ('teal' | 'navy' | 'purple' | 'gold')[] = ['teal', 'navy', 'purple', 'gold'];
  const theme = themes[Math.floor(Math.random() * themes.length)];

  drawBackground(ctx, width, height, theme);
  drawTopDeco(ctx, width);
  drawBottomDeco(ctx, width, height);

  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.direction = 'rtl';

  ctx.fillStyle = hexToRgba(COLORS.gold, 0.15);
  ctx.font = '18px AmiriQuran';
  ctx.fillText('﷽', width - 70, 30, 120);

  const textMaxWidth = width - 140;
  const fontSize = text.length > 80 ? 26 : text.length > 50 ? 30 : 34;
  ctx.font = `bold ${fontSize}px Amiri`;
  ctx.fillStyle = COLORS.cream;
  ctx.textAlign = 'center';

  const lines = wrapText(ctx, text, textMaxWidth);
  const lineHeight = fontSize * 1.8;
  const totalTextHeight = lines.length * lineHeight;
  const textStartY = (height - totalTextHeight) / 2 - 20;

  let y = textStartY;
  for (const line of lines) {
    ctx.fillText(line, width / 2, y, textMaxWidth);
    y += lineHeight;
  }

  const bottomY = height - 80;
  ctx.textAlign = 'right';
  ctx.direction = 'rtl';

  ctx.font = '20px Amiri';
  ctx.fillStyle = hexToRgba(COLORS.goldLight, 0.85);
  ctx.fillText(`العدد: ${count}`, width - 60, bottomY, 250);

  ctx.textAlign = 'left';
  ctx.direction = 'ltr';
  ctx.font = '18px Amiri';
  ctx.fillStyle = hexToRgba(COLORS.goldLight, 0.7);
  ctx.fillText(blessing, 60, bottomY + 2, 250);

  ctx.textAlign = 'center';
  ctx.direction = 'rtl';
  ctx.font = '16px Amiri';
  ctx.fillStyle = hexToRgba(COLORS.cream, 0.4);
  ctx.fillText('سِبْحَة', width / 2, height - 40, 200);

  return canvas.toBuffer('image/png');
}
