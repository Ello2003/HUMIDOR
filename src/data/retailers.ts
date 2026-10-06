/**
 * Single source of truth for UK cigar retailer names used across quick-quote
 * pickers, settings defaults, and price entry forms.
 *
 * Before this file existed, this exact list (and the "start typing a vendor
 * name" state/load/save logic around it) was hand-copied into
 * WishlistHunting.tsx, CigarResearchHub.tsx, HumidorInventory.tsx,
 * GlobalPriceEditorModal.tsx, AppSettingsModal.tsx and versionHistory.ts.
 * Editing the list meant finding and updating every copy by hand, and they
 * had already drifted out of sync in places. Import from here instead of
 * inlining the list again.
 */
export const DEFAULT_QUICK_QUOTE_RETAILERS: string[] = [
  'C.Gars Ltd',
  'Havana House',
  'Smoke King',
  'Sautter London',
  'Neptune',
  'Fox Cigar',
  'Davidoff London',
  "Holt's",
];
