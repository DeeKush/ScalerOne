import { useEffect, useMemo, useRef } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { mixPath, parse } from 'react-native-redash';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { HUB_SECTIONS, getSection } from '@/src/data/hubSections';
import { usePressAnimation } from '@/src/hooks/usePressAnimation';
import { useNavStore } from '@/src/store/navStore';
import { useReducedMotion } from '@/src/hooks/useReducedMotion';
import { GlassSurface } from '@/src/hub/GlassSurface';
import { colors, fonts, radii, shadows, spacing, typography } from '@/src/theme/tokens';

const ICON_SIZE = 52;
const STRIDE = ICON_SIZE + 16;
const COUNT = HUB_SECTIONS.length;
const LOOP = [...HUB_SECTIONS, ...HUB_SECTIONS, ...HUB_SECTIONS];
const SPRING = { damping: 16, stiffness: 170 };
const BUMP_SPRING = { damping: 16, stiffness: 140 };
const BUMP_W = 72;
const BUMP_H = 16;
const START_OFFSET = COUNT * STRIDE;

const FLAT_PATH = parse(
  `M0 ${BUMP_H} C${BUMP_W * 0.25} ${BUMP_H} ${BUMP_W * 0.25} ${BUMP_H} ${BUMP_W / 2} ${BUMP_H} C${BUMP_W * 0.75} ${BUMP_H} ${BUMP_W * 0.75} ${BUMP_H} ${BUMP_W} ${BUMP_H}`
);
const PEAK_PATH = parse(
  `M0 ${BUMP_H} C${BUMP_W * 0.22} ${BUMP_H} ${BUMP_W * 0.34} 1 ${BUMP_W / 2} 1 C${BUMP_W * 0.66} 1 ${BUMP_W * 0.78} ${BUMP_H} ${BUMP_W} ${BUMP_H}`
);

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedFlatList = Animated.FlatList;

function glyph(name) {
  const map = {
    search: 'LF',
    bag: 'MP',
    car: 'TP',
    home: 'RS',
    camera: 'PH',
    cash: 'SM',
    list: '≡',
    alert: '!',
    upload: '↑',
    person: 'Me',
    flash: '≈',
    tag: 'Sell',
    heart: 'Sav',
    add: '+',
    chat: 'Req',
    grid: '##',
    folder: 'Alb',
    people: 'Grp',
    time: 'Hist',
  };
  return map[name] ?? '•';
}

function SectionGlyph({ section, active }) {
  if (section?.art) {
    return (
      <Image source={section.art} style={styles.iconArt} resizeMode="contain" />
    );
  }
  return (
    <Text style={[styles.iconGlyph, active && styles.iconGlyphActive]}>
      {glyph(section?.icon)}
    </Text>
  );
}

function NavHit({ onPress, children }) {
  const press = usePressAnimation(0.94);
  return (
    <Animated.View style={press.animatedStyle}>
      <Pressable
        style={styles.iconHit}
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

function wrapLoopOffset(x, itemCount) {
  const span = itemCount * STRIDE;
  if (x < span * 0.5) return x + span;
  if (x >= span * 1.5) return x - span;
  return x;
}

function NavBump({ scrollX, peak, reduced }) {
  const bumpStyle = useAnimatedStyle(() => {
    const i = Math.round(scrollX.value / STRIDE);
    const x = i * STRIDE + STRIDE / 2 - scrollX.value - BUMP_W / 2;
    return {
      transform: [{ translateX: reduced ? x : withSpring(x, BUMP_SPRING) }],
    };
  });

  const pathProps = useAnimatedProps(() => ({
    d: reduced ? mixPath(1, FLAT_PATH, PEAK_PATH) : mixPath(peak.value, FLAT_PATH, PEAK_PATH),
  }));

  return (
    <Animated.View style={[styles.bumpTrack, bumpStyle]} pointerEvents="none">
      <Svg width={BUMP_W} height={BUMP_H}>
        <AnimatedPath
          animatedProps={pathProps}
          fill="none"
          stroke={colors.accent}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      </Svg>
    </Animated.View>
  );
}

export function FloatingHubNav() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const mode = useNavStore((s) => s.mode);
  const activeSectionId = useNavStore((s) => s.activeSectionId);
  const activeSubIndex = useNavStore((s) => s.activeSubIndex);
  const enterSection = useNavStore((s) => s.enterSection);
  const exitToRoot = useNavStore((s) => s.exitToRoot);
  const setActiveSubIndex = useNavStore((s) => s.setActiveSubIndex);
  const morph = useSharedValue(mode === 'section' ? 1 : 0);
  const scrollX = useSharedValue(START_OFFSET);
  const peak = useSharedValue(1);
  const listRef = useRef(null);

  const section = activeSectionId ? getSection(activeSectionId) : undefined;

  const loopSubs = useMemo(() => {
    if (!section) return [];
    const base = section.subActions;
    return [...base, ...base, ...base];
  }, [section]);

  useEffect(() => {
    if (mode !== 'root') return;
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: START_OFFSET, animated: false });
      scrollX.value = START_OFFSET;
    });
  }, [mode, scrollX]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(1 + morph.value * 0.02, SPRING) }],
  }));

  const onRootScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  const silentReset = (x) => {
    const next = wrapLoopOffset(x, COUNT);
    if (next !== x) {
      listRef.current?.scrollToOffset({ offset: next, animated: false });
      scrollX.value = next;
    }
  };

  const tapHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  };

  const onRootPress = (item, index) => {
    tapHaptic();
    peak.value = reduced
      ? 1
      : withSequence(withTiming(0.25, { duration: 80 }), withSpring(1, BUMP_SPRING));
    const logical = index % COUNT;
    const middle = COUNT + logical;
    listRef.current?.scrollToOffset({ offset: middle * STRIDE, animated: !reduced });
    morph.value = reduced ? 1 : withSpring(1, SPRING);
    enterSection(item.id);
    router.push(item.route ?? `/(hub)/section/${item.id}`);
  };

  const onHome = () => {
    tapHaptic();
    morph.value = reduced ? 0 : withSpring(0, SPRING);
    exitToRoot();
    router.replace('/(hub)');
  };

  const onSubPress = (index) => {
    tapHaptic();
    peak.value = reduced
      ? 1
      : withSequence(withTiming(0.25, { duration: 80 }), withSpring(1, BUMP_SPRING));
    const logical = index % (section?.subActions.length ?? 1);
    setActiveSubIndex(logical);
    const subAction = section?.subActions[logical];
    if (subAction?.route) {
      router.push(subAction.route);
    }
  };

  const renderRoot = ({ item, index }) => (
    <NavHit onPress={() => onRootPress(item, index)}>
      <View style={[styles.iconOuter, item.art && styles.iconOuterArt]}>
        <SectionGlyph section={item} />
      </View>
      <Text style={styles.iconCaption} numberOfLines={1}>
        {item.title}
      </Text>
    </NavHit>
  );

  const renderSectionChrome = () => {
    if (!section) return null;
    const subLen = section.subActions.length;
    const bumpLeft = STRIDE + activeSubIndex * STRIDE + STRIDE / 2 - BUMP_W / 2;
    return (
      <View style={styles.sectionRow}>
        <NavHit onPress={onHome}>
          <View style={[styles.iconOuter, styles.iconOuterActive]}>
            <View style={styles.pill} />
            <Text style={[styles.iconGlyph, styles.iconGlyphActive]}>⌂</Text>
          </View>
          <Text style={styles.iconCaption}>Home</Text>
        </NavHit>

        <View style={styles.sectionListWrap}>
          <AnimatedFlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={loopSubs}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            contentContainerStyle={styles.loopContent}
            getItemLayout={(_, i) => ({ length: STRIDE, offset: STRIDE * i, index: i })}
            onMomentumScrollEnd={(e) => {
              const x = e.nativeEvent.contentOffset.x;
              const approx = Math.round(x / STRIDE);
              if (subLen > 0) setActiveSubIndex(((approx % subLen) + subLen) % subLen);
            }}
            renderItem={({ item, index }) => {
              const logical = index % subLen;
              const active = logical === activeSubIndex;
              return (
                <NavHit onPress={() => onSubPress(logical)}>
                  <View style={[styles.iconOuter, active && styles.iconOuterActive]}>
                    {active ? <View style={styles.pill} /> : null}
                    <Text style={[styles.iconGlyph, active && styles.iconGlyphActive]}>
                      {glyph(item.icon)}
                    </Text>
                  </View>
                  <Text style={styles.iconCaption} numberOfLines={1}>
                    {item.title}
                  </Text>
                </NavHit>
              );
            }}
          />
          <View style={[styles.bumpTrack, { transform: [{ translateX: bumpLeft }] }]} pointerEvents="none">
            <Svg width={BUMP_W} height={BUMP_H}>
              <Path
                d={`M0 ${BUMP_H} C${BUMP_W * 0.22} ${BUMP_H} ${BUMP_W * 0.34} 1 ${BUMP_W / 2} 1 C${BUMP_W * 0.66} 1 ${BUMP_W * 0.78} ${BUMP_H} ${BUMP_W} ${BUMP_H}`}
                fill="none"
                stroke={colors.accent}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            </Svg>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Animated.View style={[styles.wrap, { width: width - spacing.lg * 2 }, pillStyle]}>
      <GlassSurface style={styles.bar}>
        {mode === 'root' ? (
            <View style={styles.rootList}>
            <AnimatedFlatList
              ref={listRef}
              horizontal
              data={LOOP}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              getItemLayout={(_, i) => ({ length: STRIDE, offset: STRIDE * i, index: i })}
              onScroll={onRootScroll}
              scrollEventThrottle={16}
              snapToInterval={STRIDE}
              decelerationRate="fast"
              onMomentumScrollEnd={(e) => silentReset(e.nativeEvent.contentOffset.x)}
              renderItem={renderRoot}
            />
            <NavBump scrollX={scrollX} peak={peak} reduced={reduced} />
          </View>
        ) : (
          renderSectionChrome()
        )}
      </GlassSurface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    zIndex: 20,
    ...shadows.nav,
  },
  bar: {
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    minHeight: 88,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  listContent: {
    alignItems: 'center',
    paddingBottom: BUMP_H,
  },
  rootList: {
    position: 'relative',
  },
  bumpTrack: {
    position: 'absolute',
    left: 0,
    bottom: 2,
    width: BUMP_W,
    height: BUMP_H,
  },
  sectionListWrap: {
    flex: 1,
    paddingBottom: BUMP_H,
    position: 'relative',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  loopContent: {
    alignItems: 'center',
    paddingRight: spacing.md,
  },
  iconHit: {
    width: STRIDE,
    alignItems: 'center',
    gap: 4,
  },
  iconOuter: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconOuterArt: {
    backgroundColor: colors.white,
    shadowColor: '#1A2744',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  iconArt: {
    width: ICON_SIZE - 8,
    height: ICON_SIZE - 8,
    borderRadius: (ICON_SIZE - 8) / 2,
  },
  iconOuterActive: {},
  pill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.accentSoft,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  iconGlyph: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.text,
    zIndex: 1,
  },
  iconGlyphActive: {
    color: colors.accent,
  },
  iconCaption: {
    ...typography.caption,
    color: colors.textSoft,
    maxWidth: ICON_SIZE + 12,
    textAlign: 'center',
    fontSize: 10,
  },
});
