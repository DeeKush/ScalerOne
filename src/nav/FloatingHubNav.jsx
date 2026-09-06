import { useMemo, useRef } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { HUB_SECTIONS, getSection } from '@/src/data/hubSections';
import { useNavStore } from '@/src/store/navStore';
import { useReducedMotion } from '@/src/hooks/useReducedMotion';
import { GlassSurface } from '@/src/hub/GlassSurface';
import { colors, fonts, radii, spacing, typography } from '@/src/theme/tokens';

const ICON_SIZE = 52;
const SPRING = { damping: 16, stiffness: 170 };

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

/** Tile artwork when the section has it, otherwise the original text glyph. */
function SectionGlyph({ section, active }) {
  if (section?.art) {
    return <Image source={section.art} style={styles.iconArt} resizeMode="contain" />;
  }
  return (
    <Text style={[styles.iconGlyph, active && styles.iconGlyphActive]}>
      {glyph(section?.icon)}
    </Text>
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
  const listRef = useRef(null);

  const section = activeSectionId ? getSection(activeSectionId) : undefined;

  const loopSubs = useMemo(() => {
    if (!section) return [];
    const base = section.subActions;
    return [...base, ...base, ...base];
  }, [section]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(1 + morph.value * 0.02, SPRING) }],
  }));

  const onRootPress = (item) => {
    morph.value = reduced ? 1 : withSpring(1, SPRING);
    enterSection(item.id);
    router.push(item.route ?? `/(hub)/section/${item.id}`);
  };

  const onHome = () => {
    morph.value = reduced ? 0 : withSpring(0, SPRING);
    exitToRoot();
    router.replace('/(hub)');
  };

  const onSubPress = (index, subAction) => {
    setActiveSubIndex(index % (section?.subActions.length ?? 1));
    if (subAction?.route) {
      router.push(subAction.route);
      return;
    }
    // Unbuilt module: land on its "Coming soon" screen rather than no-op.
    // replace(), not push(), since that screen is usually already on top.
    if (section) router.replace(`/(hub)/section/${section.id}`);
  };

  const renderRoot = ({ item }) => (
    <Pressable style={styles.iconHit} onPress={() => onRootPress(item)}>
      <View style={[styles.iconOuter, item.art && styles.iconOuterArt]}>
        <SectionGlyph section={item} />
      </View>
      <Text style={styles.iconCaption} numberOfLines={1}>
        {item.title}
      </Text>
    </Pressable>
  );

  const renderSectionChrome = () => {
    if (!section) return null;
    return (
      <View style={styles.sectionRow}>
        <Pressable style={styles.iconHit} onPress={onHome}>
          <View style={[styles.iconOuter, styles.iconOuterActive]}>
            <View style={styles.pill} />
            <Text style={[styles.iconGlyph, styles.iconGlyphActive]}>⌂</Text>
          </View>
          <Text style={styles.iconCaption}>Home</Text>
        </Pressable>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={loopSubs}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={styles.loopContent}
          onMomentumScrollEnd={(e) => {
            const x = e.nativeEvent.contentOffset.x;
            const approx = Math.round(x / (ICON_SIZE + 12));
            const len = section.subActions.length;
            if (len > 0) setActiveSubIndex(((approx % len) + len) % len);
          }}
          renderItem={({ item, index }) => {
            const logical = index % section.subActions.length;
            const active = logical === activeSubIndex;
            return (
              <Pressable style={styles.iconHit} onPress={() => onSubPress(logical, item)}>
                <View style={[styles.iconOuter, active && styles.iconOuterActive]}>
                  {active ? <View style={styles.pill} /> : null}
                  <Text style={[styles.iconGlyph, active && styles.iconGlyphActive]}>
                    {glyph(item.icon)}
                  </Text>
                </View>
                <Text style={styles.iconCaption} numberOfLines={1}>
                  {item.title}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>
    );
  };

  return (
    <Animated.View style={[styles.wrap, { width: width - spacing.lg * 2 }, pillStyle]}>
      <GlassSurface style={styles.bar}>
        {mode === 'root' ? (
          <FlatList
            ref={listRef}
            horizontal
            data={HUB_SECTIONS}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={renderRoot}
          />
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
  },
  bar: {
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    minHeight: 72,
    justifyContent: 'center',
  },
  listContent: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  loopContent: {
    gap: spacing.sm,
    paddingRight: spacing.md,
    alignItems: 'center',
  },
  iconHit: {
    width: ICON_SIZE + 8,
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
    backgroundColor: colors.surface,
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
