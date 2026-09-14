import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '@/src/theme/tokens';

// Stroke icons for the hub nav's sub-actions. Drawn on a 24x24 grid with a
// uniform 2pt round stroke so they sit at the same weight as the section art.
// Stroke (not PNG) so the active state can retint them to colors.accent.
const PATHS = {
  // section level — only used if a section ever loses its art entry
  search: (
    <>
      <Circle cx="11" cy="11" r="6.5" />
      <Path d="M16 16 L21 21" />
    </>
  ),
  bag: (
    <>
      <Path d="M5.5 8 h13 l1 12.5 h-15 Z" />
      <Path d="M9 8 V6 a3 3 0 0 1 6 0 v2" />
    </>
  ),
  car: (
    <>
      <Path d="M3 16.5 v-3 l2.5-5 h13 l2.5 5 v3 h-2" />
      <Path d="M3 16.5 h2.5" />
      <Path d="M9.5 16.5 h5" />
      <Circle cx="7" cy="16.5" r="2" />
      <Circle cx="17" cy="16.5" r="2" />
    </>
  ),
  home: (
    <>
      <Path d="M4 10.5 L12 4 l8 6.5 V20 H4 Z" />
      <Path d="M9.5 20 v-5.5 h5 V20" />
    </>
  ),
  camera: (
    <>
      <Path d="M3 8.5 h4 L8.5 6 h7 L17 8.5 h4 v10.5 H3 Z" />
      <Circle cx="12" cy="13.5" r="3.5" />
    </>
  ),
  cash: (
    <>
      <Rect x="2.5" y="6" width="19" height="12" rx="2" />
      <Circle cx="12" cy="12" r="2.5" />
    </>
  ),

  // sub-actions
  list: (
    <>
      <Path d="M9 7 h11" />
      <Path d="M9 12 h11" />
      <Path d="M9 17 h11" />
      <Path d="M4.5 7 h.01" />
      <Path d="M4.5 12 h.01" />
      <Path d="M4.5 17 h.01" />
    </>
  ),
  alert: (
    <>
      <Path d="M12 4 L21 19.5 H3 Z" />
      <Path d="M12 10 v4" />
      <Path d="M12 17 h.01" />
    </>
  ),
  upload: (
    <>
      <Path d="M12 15.5 V4" />
      <Path d="M7.5 8.5 L12 4 l4.5 4.5" />
      <Path d="M4 15 v3.5 a1.5 1.5 0 0 0 1.5 1.5 h13 a1.5 1.5 0 0 0 1.5-1.5 V15" />
    </>
  ),
  person: (
    <>
      <Circle cx="12" cy="8" r="3.75" />
      <Path d="M4.5 20 a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  flash: <Path d="M13.5 3 L5 13.5 h5.5 L10 21 l8.5-10.5 H13 Z" />,
  tag: (
    <>
      <Path d="M11 3 H20 a1 1 0 0 1 1 1 v9 l-9 8 -9-9 Z" />
      <Circle cx="16.5" cy="7.5" r="1.5" />
    </>
  ),
  heart: <Path d="M12 20.5 L4.5 13 a4.5 4.5 0 0 1 7.5-4.8 A4.5 4.5 0 0 1 19.5 13 Z" />,
  add: (
    <>
      <Path d="M12 4.5 v15" />
      <Path d="M4.5 12 h15" />
    </>
  ),
  chat: <Path d="M20.5 15 a2 2 0 0 1-2 2 H8.5 L4 20.5 V6 a2 2 0 0 1 2-2 h12.5 a2 2 0 0 1 2 2 Z" />,
  grid: (
    <>
      <Rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <Rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <Rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <Rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  folder: <Path d="M3 19 V6 a1.5 1.5 0 0 1 1.5-1.5 h4.5 L11.5 7.5 h8 A1.5 1.5 0 0 1 21 9 v10 Z" />,
  people: (
    <>
      <Circle cx="9.5" cy="8" r="3.25" />
      <Path d="M3.5 19.5 a6 6 0 0 1 12 0" />
      <Path d="M16 5.2 a3.25 3.25 0 0 1 0 5.6" />
      <Path d="M17.5 14.4 a6 6 0 0 1 3 5.1" />
    </>
  ),
  time: (
    <>
      <Circle cx="12" cy="12" r="8.5" />
      <Path d="M12 7 v5.3 l3.4 2" />
    </>
  ),
};

export function HubIcon({ name, color = colors.text, size = 22 }) {
  const shape = PATHS[name];
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {shape ?? <Circle cx="12" cy="12" r="2.5" fill={color} stroke="none" />}
    </Svg>
  );
}
