export type HubSubAction = {
  id: string;
  title: string;
  icon: string;
};

export type HubSection = {
  id: string;
  title: string;
  icon: string;
  subActions: HubSubAction[];
};

export const HUB_SECTIONS: HubSection[] = [
  {
    id: 'lost-found',
    title: 'Lost & Found',
    icon: 'search',
    subActions: [
      { id: 'lf-home', title: 'Browse', icon: 'list' },
      { id: 'lf-report', title: 'Report Lost', icon: 'alert' },
      { id: 'lf-upload', title: 'Upload Found', icon: 'upload' },
      { id: 'lf-mine', title: 'My Items', icon: 'person' },
    ],
  },
  {
    id: 'marketplace',
    title: 'Marketplace',
    icon: 'bag',
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
    subActions: [
      { id: 'sm-groups', title: 'Groups', icon: 'people' },
      { id: 'sm-new', title: 'New Split', icon: 'add' },
      { id: 'sm-history', title: 'History', icon: 'time' },
    ],
  },
];

export function getSection(id: string): HubSection | undefined {
  return HUB_SECTIONS.find((s) => s.id === id);
}
