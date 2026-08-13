import { View } from 'react-native';
import Svg, { ClipPath, Defs, Image as SvgImage, Path, Circle } from 'react-native-svg';
import { idCard } from '@/src/theme/tokens';
import { SHIELD_PATH } from '@/src/onboarding/campus';

export function ShieldPhoto({ size, uri }) {
  const vbW = 100;
  const vbH = 120;
  return (
    <View style={{ width: size, height: size * (vbH / vbW) }}>
      <Svg width={size} height={size * (vbH / vbW)} viewBox={`0 0 ${vbW} ${vbH}`}>
        <Defs>
          <ClipPath id="idShieldClip">
            <Path d={SHIELD_PATH} />
          </ClipPath>
        </Defs>
        <Path d={SHIELD_PATH} fill="#FFFFFF" />
        <Path d={SHIELD_PATH} fill={idCard.photoFill} clipPath="url(#idShieldClip)" />
        {uri ? (
          <SvgImage
            href={{ uri }}
            x="6"
            y="4"
            width="88"
            height="112"
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#idShieldClip)"
          />
        ) : (
          <>
            <Circle cx="50" cy="46" r="16" fill="#8B95A7" clipPath="url(#idShieldClip)" />
            <Path
              d="M22 108 C22 82 36 70 50 70 C64 70 78 82 78 108 Z"
              fill="#8B95A7"
              clipPath="url(#idShieldClip)"
            />
          </>
        )}
        <Path d={SHIELD_PATH} fill="none" stroke="#FFFFFF" strokeWidth="5" />
      </Svg>
    </View>
  );
}
