// Tile artwork. Only four modules have art so far — anything without an entry
// falls back to the text glyph in FloatingHubNav's glyph() map.
export const HUB_ART = {
  'lost-found': require('../../assets/images/hub/lost-found.png'),
  marketplace: require('../../assets/images/hub/marketplace.png'),
  transport: require('../../assets/images/hub/transport.png'),
  'split-money': require('../../assets/images/hub/split-money.png'),
};

export const HUB_SECTIONS = [
  {
    id: 'lost-found',
    title: 'Lost & Found',
    icon: 'search',
    art: HUB_ART['lost-found'],
    route: '/(hub)/lost-found',
    subActions: [
      { id: 'lf-home', title: 'Browse', icon: 'list', route: '/(hub)/lost-found' },
      {
        id: 'lf-report',
        title: 'Report Lost',
        icon: 'alert',
        route: '/(hub)/lost-found/post?type=lost',
      },
      {
        id: 'lf-upload',
        title: 'Upload Found',
        icon: 'upload',
        route: '/(hub)/lost-found/post?type=found',
      },
      { id: 'lf-mine', title: 'My Items', icon: 'person', route: '/(hub)/lost-found/my-posts' },
      { id: 'lf-matches', title: 'Matches', icon: 'flash', route: '/(hub)/lost-found/matches' },
    ],
  },
  {
    id: 'marketplace',
    title: 'Marketplace',
    icon: 'bag',
    art: HUB_ART.marketplace,
    subActions: [
      { id: 'mp-browse', title: 'Browse', icon: 'list' },
      { id: 'mp-sell', title: 'Sell', icon: 'tag' },
      { id: 'mp-saved', title: 'Saved', icon: 'heart' },
    ],
  },
  {
    id: 'transport',
    title: 'Transport Pool',
    icon: 'car',
    art: HUB_ART.transport,
    subActions: [
      { id: 'tp-rides', title: 'Rides', icon: 'car' },
      { id: 'tp-offer', title: 'Offer', icon: 'add' },
      { id: 'tp-requests', title: 'Requests', icon: 'chat' },
    ],
  },
  {
    id: 'room-swap',
    title: 'Room Swap',
    icon: 'home',
    subActions: [
      { id: 'rs-browse', title: 'Browse', icon: 'list' },
      { id: 'rs-post', title: 'Post', icon: 'add' },
    ],
  },
  {
    id: 'photo-hub',
    title: 'Photo Hub',
    icon: 'camera',
    subActions: [
      { id: 'ph-feed', title: 'Feed', icon: 'grid' },
      { id: 'ph-upload', title: 'Upload', icon: 'upload' },
      { id: 'ph-albums', title: 'Albums', icon: 'folder' },
    ],
  },
  {
    id: 'split-money',
    title: 'Split Money',
    icon: 'cash',
    art: HUB_ART['split-money'],
    subActions: [
      { id: 'sm-groups', title: 'Groups', icon: 'people' },
      { id: 'sm-new', title: 'New Split', icon: 'add' },
      { id: 'sm-history', title: 'History', icon: 'time' },
    ],
  },
];

export function getSection(id) {
  return HUB_SECTIONS.find((s) => s.id === id);
}
