import type { CSSProperties } from 'react';
import { initials } from '@/lib/greeting';

type Props = {
  name: string;
  color?: string;
  size?: number;
};

const PALETTE = ['#3598CB', '#D13095', '#7B5CFF', '#F07B3F', '#12A594', '#D99A00'];

function colorOf(name: string) {
  const i = [...name].reduce((s, c) => s + c.charCodeAt(0), 0) % PALETTE.length;
  return PALETTE[i];
}

export function Avatar({ name, color, size = 36 }: Props) {
  const c = color ?? colorOf(name);
  return (
    <div
      className="avatar"
      style={
        {
          '--c': c,
          width: size,
          height: size,
          fontSize: Math.round(size * 0.36),
        } as CSSProperties
      }
    >
      {initials(name)}
    </div>
  );
}