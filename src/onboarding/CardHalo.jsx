import { StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { radii } from '@/src/theme/tokens';

export function CardHalo({ width, height }) {
  const pad = 16;
  const w = width + pad * 2;
  const h = height + pad * 2;

  return (
    <Svg
      pointerEvents="none"
      width={w}
      height={h}
      style={[styles.halo, { left: -pad, top: -pad }]}
    >
      <Rect
        x={1}
        y={1}
        width={w - 2}
        height={h - 2}
        rx={radii.card + 8}
        ry={radii.card + 8}
        fill="rgba(74, 144, 226, 0.12)"
        stroke="rgba(74, 144, 226, 0.18)"
        strokeWidth={1}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  halo: {
    position: 'absolute',
  },
});
