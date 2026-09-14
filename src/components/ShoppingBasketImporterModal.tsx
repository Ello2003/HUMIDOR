import React, { useState, useRef } from 'react';
import {
  ShoppingCart,
  Sparkles,
  Check,
  AlertCircle,
  Loader2,
  X,
  Plus,
  Bookmark,
  BookOpen,
  CheckCircle2,
  UploadCloud,
  FileCode,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Flame,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  DollarSign,
  Package,
  Building2,
  Tag,
} from 'lucide-react';
import {
  Cigar,
  Humidor,
  WishlistItem,
  CigarResearchItem,
  ExtractedBasketItem,
  ShoppingBasketExtractResult,
  WrapperType,
  StrengthRating,
} from '../types';
import { formatCurrency } from '../utils/currencyUtils';
import {
  findMatchingResearchCigar,
  mergeResearchBatch,
  extractMerchantFromUrlOrText,
  estimateAccurateSmokeTime,
} from '../utils/researchUtils';

interface ShoppingBasketImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  humidors: Humidor[];
  researchDatabase?: CigarResearchItem[];
  onAddMultipleToResearch: (items: CigarResearchItem[]) => void;
  onAddMultipleToHumidor: (cigars: Omit<Cigar, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  onAddMultipleToWishlist: (items: Omit<WishlistItem, 'id' | 'createdAt'>[]) => void;
  onSingleAddToResearch?: (item: CigarResearchItem) => void;
  onSingleAddCigar?: (cigar: Omit<Cigar, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onSingleAddToWishlist?: (item: Omit<WishlistItem, 'id' | 'createdAt'>) => void;
  onLogSmoke?: (cigarData: Partial<Cigar>) => void;
  defaultAutoAddToResearch?: boolean;
}

// Convert ExtractedBasketItem to CigarResearchItem
export function convertBasketItemToResearch(item: ExtractedBasketItem): CigarResearchItem {
  const isCuban = item.isCuban ?? /cuba|havana|habano/i.test(item.brand + ' ' + item.countryOrigin);
  const wrapperType: WrapperType = (item.wrapperType as WrapperType) || (
    /maduro/i.test(item.wrapper) ? 'Maduro' :
    /connecticut shade/i.test(item.wrapper) ? 'Connecticut Shade' :
    /connecticut broadleaf/i.test(item.wrapper) ? 'Connecticut Broadleaf' :
    /san andr/i.test(item.wrapper) ? 'San Andrés' :
    /corojo/i.test(item.wrapper) ? 'Corojo' :
    /cameroon/i.test(item.wrapper) ? 'Cameroon' :
    /sumatra/i.test(item.wrapper) ? 'Sumatra' :
    /candela/i.test(item.wrapper) ? 'Candela' :
    /habano/i.test(item.wrapper) ? 'Habano' : 'Habano'
  );

  const unitPrice = item.purchasePrice || 24.50;
  const lowPrice = Math.max(5, Math.round(unitPrice * 0.9 * 10) / 10);
  const highPrice = Math.round(unitPrice * 1.15 * 10) / 10;
  const currencySymbol = item.currency || '£';

  const flavorTags = item.flavorTags && item.flavorTags.length > 0
    ? item.flavorTags
    : ['Spanish Cedar', 'Rich Earth', 'Dark Chocolate', 'Leather'];

  const resolvedVendor = extractMerchantFromUrlOrText(item.vendor || 'Online Retailer');
  const smokeTime = estimateAccurateSmokeTime(item.vitola, item.lengthInches, item.ringGauge);

  return {
    id: `research-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    brand: item.brand,
    line: item.line || item.name,
    vitola: item.vitola || 'Robusto',
    lengthInches: item.lengthInches || 5.0,
    ringGauge: item.ringGauge || 50,
    smokeTimeMinutes: smokeTime.minutes,
    smokeTimeRange: smokeTime.range,
    countryOrigin: item.countryOrigin || (isCuban ? 'Cuba' : 'Nicaragua'),
    wrapper: item.wrapper || (isCuban ? 'Cuban Habano' : 'Ecuadorian Habano'),
    wrapperType,
    binder: item.binder || (isCuban ? 'Cuba' : 'Proprietary Selected'),
    filler: item.filler || (isCuban ? 'Cuba' : 'Proprietary Blend'),
    strength: item.strength || (isCuban ? 'Medium-Full' : 'Medium'),
    body: (item.strength === 'Full' || item.strength === 'Full-Bodied') ? 'Full' : (item.strength === 'Medium-Full' ? 'Medium-Full' : 'Medium'),
    averagePrice: unitPrice,
    priceRange: `${currencySymbol}${lowPrice.toFixed(2)} – ${currencySymbol}${highPrice.toFixed(2)}`,
    criticRating: item.criticRating || (isCuban ? 93 : 91),
    criticConsensus: `Renowned for exceptional construction, balanced draw, and signature ${item.countryOrigin} complexity with nuanced notes of ${flavorTags.slice(0, 3).join(', ')}.`,
    factoryTerroir: isCuban ? 'Habanos S.A., Cuba' : `${item.brand} Factory, ${item.countryOrigin}`,
    masterBlender: `${item.brand} Master Tobacconists`,
    reviewTastingNotes: {
      overview: item.notes || `A premier hand-rolled blend highlighting classic ${item.brand} terroir and silky ${item.wrapper} wrapper.`,
      firstThird: `Opens smoothly with fragrant ${flavorTags[0] || 'cedar'}, gentle white pepper, and velvety cream.`,
      secondThird: `Deepens into rich layers of ${flavorTags[1] || 'roasted coffee'}, dark cocoa, and nuanced leather.`,
      finalThird: `Finishes strong with bold earthy spices, toasted nuts, and a satisfying sweet finish.`,
      dominantFlavorTags: flavorTags,
      criticQuote: `A sublime smoking experience offering impeccable consistency and rich, evolving complexity.`,
      criticScore: item.criticRating || (isCuban ? 93 : 91),
    },
    recommendedPairings: isCuban
      ? ['Aged Cuban Rum', 'Single Malt Speyside Scotch', 'Dark Roast Espresso', 'Vintage Port']
      : ['Kentucky Bourbon', 'Islay Peated Scotch', 'Café Cubano', 'Stout Beer'],
    agingWindowMonths: item.idealRestMonths || (isCuban ? 12 : 6),
    isCuban,
    personalNotes: `Extracted from ${resolvedVendor} order (${item.quantity || 1} stick${(item.quantity || 1) > 1 ? 's' : ''} at ${currencySymbol}${unitPrice.toFixed(2)} ea).`,
    vendorPrices: [
      {
        id: `vp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        vendor: resolvedVendor,
        price: unitPrice,
        currency: currencySymbol,
        packageType: (item.quantity && item.quantity > 1) ? `Qty of ${item.quantity}` : 'Single',
        recordedAt: new Date().toISOString(),
        inStock: true,
      },
    ],
    userUpdatedAt: new Date().toISOString(),
  };
}

// Convert ExtractedBasketItem to Humidor Cigar
export function convertBasketItemToHumidor(
  item: ExtractedBasketItem,
  humidorId: string
): Omit<Cigar, 'id' | 'createdAt' | 'updatedAt'> {
  const isCuban = item.isCuban ?? /cuba|havana|habano/i.test(item.brand + ' ' + item.countryOrigin);
  const resolvedVendor = extractMerchantFromUrlOrText(item.vendor || 'Online Retailer');
  return {
    brand: item.brand,
    name: item.name,
    line: item.line || item.name,
    vitola: item.vitola || 'Robusto',
    lengthInches: item.lengthInches || 5.0,
    ringGauge: item.ringGauge || 50,
    countryOrigin: item.countryOrigin || (isCuban ? 'Cuba' : 'Nicaragua'),
    wrapper: item.wrapper || (isCuban ? 'Cuban Habano' : 'Ecuadorian Habano'),
    binder: item.binder || (isCuban ? 'Cuba' : 'Proprietary'),
    filler: item.filler || (isCuban ? 'Cuba' : 'Proprietary'),
    strength: item.strength || (isCuban ? 'Medium-Full' : 'Medium'),
    quantity: item.quantity || 1,
    humidorId,
    purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: item.purchasePrice,
    currency: item.currency || '£',
    vendor: resolvedVendor,
    targetRestMonths: item.idealRestMonths || (isCuban ? 12 : 6),
    notes: item.notes || `Stocked from shopping basket order (${resolvedVendor}).`,
    isFavorite: false,
    status: 'resting',
    flavorTags: item.flavorTags && item.flavorTags.length > 0 ? item.flavorTags : ['Spanish Cedar', 'Leather', 'Earth'],
    vendorPrices: [
      {
        id: `vp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        vendor: resolvedVendor,
        price: item.purchasePrice || 0,
        currency: item.currency || '£',
        packageType: (item.quantity && item.quantity > 1) ? `Qty of ${item.quantity}` : 'Single',
        recordedAt: new Date().toISOString(),
        inStock: true,
      },
    ],
  };
}

// Clean and format error messages to avoid raw JSON dumps
function cleanErrorMessage(raw: any): string {
  if (!raw) return 'An unexpected error occurred while parsing the shopping basket.';
  if (typeof raw === 'object') {
    if (raw.message) return cleanErrorMessage(raw.message);
    if (raw.error) return cleanErrorMessage(raw.error);
    return JSON.stringify(raw);
  }
  const str = String(raw).trim();
  if (str.startsWith('{') && str.endsWith('}')) {
    try {
      const parsed = JSON.parse(str);
      if (parsed.error?.message) return cleanErrorMessage(parsed.error.message);
      if (parsed.error && typeof parsed.error === 'string') return cleanErrorMessage(parsed.error);
      if (parsed.message) return cleanErrorMessage(parsed.message);
    } catch {
      // ignore
    }
  }
  if (str.includes('503') || str.includes('high demand') || str.includes('UNAVAILABLE') || str.includes('unavailable')) {
    return 'The AI service is experiencing a temporary spike in demand. Automatic retries are active—please try clicking "Extract Shopping Basket" again in a few moments, or use the local HTML file tab.';
  }
  return str;
}

const SAMPLE_BASKET_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>Shopping Basket - C.Gars Ltd</title>
</head>
<body>
  <div class="cgars-cart-container">
    <h1>Your Shopping Basket - C.Gars Ltd</h1>
    <table class="cart-items">
      <thead>
        <tr><th>Product Description</th><th>Qty</th><th>Price</th><th>Total</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>Montecristo No. 4</strong> - Single Cigar (Petit Corona, 42 RG x 5.12", Cuba, Cuban Habano wrapper, Medium-Full)
          </td>
          <td>3</td>
          <td>£22.50</td>
          <td>£67.50</td>
        </tr>
        <tr>
          <td>
            <strong>Partagás Serie D No. 4</strong> - Single Cigar (Robusto, 50 RG x 4.88", Cuba, Habano wrapper, Full strength)
          </td>
          <td>2</td>
          <td>£34.20</td>
          <td>£68.40</td>
        </tr>
        <tr>
          <td>
            <strong>Ramón Allones Specially Selected</strong> - Single Cigar (Robusto, 50 RG x 4.88", Cuba, Habano wrapper, Full strength)
          </td>
          <td>2</td>
          <td>£31.00</td>
          <td>£62.00</td>
        </tr>
        <tr>
          <td>
            <strong>Romeo y Julieta Wide Churchill</strong> - Single Cigar (Montesco / Gran Robusto, 55 RG x 5.12", Cuba, Habano, Medium)
          </td>
          <td>1</td>
          <td>£38.50</td>
          <td>£38.50</td>
        </tr>
        <tr>
          <td>
            <strong>Padrón 1964 Anniversary Series Exclusivo Maduro</strong> (Robusto, 50 RG x 5.5", Nicaragua, Maduro wrapper, Medium-Full)
          </td>
          <td>2</td>
          <td>£29.90</td>
          <td>£59.80</td>
        </tr>
      </tbody>
    </table>
    <div class="order-total">
      <p>Order Total: £296.20 (10 Cigars)</p>
    </div>
  </div>
</body>
</html>`;

export const ShoppingBasketImporterModal: React.FC<ShoppingBasketImporterModalProps> = ({
  isOpen,
  onClose,
  humidors,
  researchDatabase = [],
  onAddMultipleToResearch,
  onAddMultipleToHumidor,
  onAddMultipleToWishlist,
  onSingleAddToResearch,
  onSingleAddCigar,
  onSingleAddToWishlist,
  onLogSmoke,
  defaultAutoAddToResearch = true,
}) => {
  const [inputMode, setInputMode] = useState<'file' | 'paste' | 'url'>('file');
  const [htmlFileName, setHtmlFileName] = useState<string | null>(null);
  const [htmlFileSize, setHtmlFileSize] = useState<string | null>(null);
  const [htmlFileContent, setHtmlFileContent] = useState<string>('');
  const [pastedContent, setPastedContent] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Auto add to research toggle
  const [autoAddToResearch, setAutoAddToResearch] = useState(defaultAutoAddToResearch);

  // Extraction State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedResult, setExtractedResult] = useState<ShoppingBasketExtractResult | null>(null);
  const [extractedItems, setExtractedItems] = useState<ExtractedBasketItem[]>([]);

  // Batch Destination Controls
  const [selectedHumidorId, setSelectedHumidorId] = useState<string>(humidors[0]?.id || 'hum-1');
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setActionSuccessNotice(msg);
    setTimeout(() => setActionSuccessNotice(null), 4500);
  };

  const handleFileSelect = (file: File) => {
    if (!file) return;
    const isHtml =
      file.name.endsWith('.html') ||
      file.name.endsWith('.htm') ||
      file.name.endsWith('.mhtml') ||
      file.type.includes('html');

    if (!isHtml) {
      setError('Please upload a valid .html, .htm, or .mhtml shopping basket file.');
      return;
    }

    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    setHtmlFileName(file.name);
    setHtmlFileSize(sizeStr);
    setError(null);
    setActionSuccessNotice(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setHtmlFileContent(content || '');
    };
    reader.onerror = () => {
      setError('Failed to read local file content.');
    };
    reader.readAsText(file);
  };

  const handleProcessBasketExtraction = async () => {
    let contentToProcess = '';
    let fileNameToPass = htmlFileName || 'shopping-basket.html';

    if (inputMode === 'file') {
      contentToProcess = htmlFileContent;
      if (!contentToProcess.trim()) {
        setError('Please drop or select a saved shopping basket HTML file first.');
        return;
      }
    } else if (inputMode === 'paste') {
      contentToProcess = pastedContent;
      if (!contentToProcess.trim()) {
        setError('Please paste your shopping basket HTML or order confirmation text.');
        return;
      }
      fileNameToPass = 'pasted-shopping-basket.html';
    } else if (inputMode === 'url') {
      if (!url.trim()) {
        setError('Please enter a shopping basket or cart webpage link.');
        return;
      }
    }

    setLoading(true);
    setError(null);
    setExtractedResult(null);
    setExtractedItems([]);
    setActionSuccessNotice(null);

    try {
      let res: Response;
      if (inputMode === 'url') {
        res = await fetch('/api/import/basket-from-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url.trim() }),
        });
      } else {
        res = await fetch('/api/import/basket-from-html', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            htmlContent: contentToProcess,
            fileName: fileNameToPass,
          }),
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success || !data.data) {
        throw new Error(data.error || 'Failed to extract cigar items from shopping basket HTML.');
      }

      const basketData: ShoppingBasketExtractResult = data.data;
      setExtractedResult(basketData);

      const itemsWithSelected = (basketData.items || []).map((it, idx) => ({
        ...it,
        id: it.id || `ext-${Date.now()}-${idx}`,
        selected: it.selected !== undefined ? it.selected : true,
      }));
      setExtractedItems(itemsWithSelected);

      // AUTOMATIC RESEARCH POPULATION (Checks for duplicates and merges vendor prices)
      if (autoAddToResearch && itemsWithSelected.length > 0) {
        const researchItems = itemsWithSelected.map((item) => convertBasketItemToResearch(item));
        const mergeStats = mergeResearchBatch(itemsWithSelected, researchDatabase);
        onAddMultipleToResearch(researchItems);

        if (mergeStats.updatedPricesCount > 0 && mergeStats.addedCount > 0) {
          showToast(
            `⚡ Saved to Research: ${mergeStats.addedCount} new cigar${mergeStats.addedCount > 1 ? 's' : ''} added & ${mergeStats.updatedPricesCount} existing cigar${mergeStats.updatedPricesCount > 1 ? 's' : ''} updated with new shop price!`
          );
        } else if (mergeStats.updatedPricesCount > 0 && mergeStats.addedCount === 0) {
          showToast(
            `⚡ All ${mergeStats.updatedPricesCount} cigar${mergeStats.updatedPricesCount > 1 ? 's' : ''} already in Research; added new ${basketData.vendorName || 'shop'} price to existing entries!`
          );
        } else {
          showToast(
            `⚡ Added ${researchItems.length} new cigar${researchItems.length > 1 ? 's' : ''} to Research Catalog!`
          );
        }
      } else {
        showToast(`Successfully extracted ${itemsWithSelected.length} cigars from ${basketData.vendorName || 'shopping basket'}!`);
      }
    } catch (err: any) {
      setError(cleanErrorMessage(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelectItem = (index: number) => {
    setExtractedItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleToggleSelectAll = () => {
    const allSelected = extractedItems.every((item) => item.selected);
    setExtractedItems((prev) => prev.map((item) => ({ ...item, selected: !allSelected })));
  };

  const handleUpdateItemQuantity = (index: number, newQty: number) => {
    if (newQty < 1) return;
    setExtractedItems((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          const unitPrice = item.purchasePrice || 0;
          return {
            ...item,
            quantity: newQty,
            totalPrice: Math.round(unitPrice * newQty * 100) / 100,
          };
        }
        return item;
      })
    );
  };

  // Batch Destination Handlers
  const handleBatchAddToResearch = () => {
    const selected = extractedItems.filter((i) => i.selected);
    if (selected.length === 0) {
      setError('Please select at least one cigar item to add.');
      return;
    }
    const researchItems = selected.map((item) => convertBasketItemToResearch(item));
    const mergeStats = mergeResearchBatch(selected, researchDatabase);
    onAddMultipleToResearch(researchItems);

    if (mergeStats.updatedPricesCount > 0 && mergeStats.addedCount > 0) {
      showToast(
        `Added ${mergeStats.addedCount} new cigar${mergeStats.addedCount > 1 ? 's' : ''} to Research & attached shop prices to ${mergeStats.updatedPricesCount} existing cigar${mergeStats.updatedPricesCount > 1 ? 's' : ''}!`
      );
    } else if (mergeStats.updatedPricesCount > 0 && mergeStats.addedCount === 0) {
      showToast(
        `Attached new shop prices to ${mergeStats.updatedPricesCount} existing cigar${mergeStats.updatedPricesCount > 1 ? 's' : ''} in Research (no duplicates created)!`
      );
    } else {
      showToast(`Added ${researchItems.length} cigar${researchItems.length > 1 ? 's' : ''} to Research Database!`);
    }
  };

  const handleBatchAddToHumidor = () => {
    const selected = extractedItems.filter((i) => i.selected);
    if (selected.length === 0) {
      setError('Please select at least one cigar item to add.');
      return;
    }
    const humidorCigars = selected.map((item) => convertBasketItemToHumidor(item, selectedHumidorId));
    const researchItems = selected.map((item) => convertBasketItemToResearch(item));
    
    // Add / merge into Humidor
    onAddMultipleToHumidor(humidorCigars);
    // Also sync into Research Database automatically
    onAddMultipleToResearch(researchItems);

    const targetHum = humidors.find((h) => h.id === selectedHumidorId)?.name || 'Humidor';
    const totalSticks = selected.reduce((sum, it) => sum + (it.quantity || 1), 0);
    showToast(`Stocked ${totalSticks} cigars (${selected.length} lines) into ${targetHum} & synced retailer prices site-wide!`);
  };

  const handleBatchAddToWishlist = () => {
    const selected = extractedItems.filter((i) => i.selected);
    if (selected.length === 0) {
      setError('Please select at least one cigar item to add.');
      return;
    }
    const wishlistItems = selected.map((item) => ({
      brand: item.brand,
      name: item.name,
      vitola: item.vitola || 'Robusto',
      wrapper: item.wrapper,
      targetPrice: item.purchasePrice,
      estimatedPrice: item.purchasePrice,
      priority: 'Medium' as const,
      sourceRetailer: item.vendor || extractedResult?.vendorName || 'Online Retailer',
      notes: item.notes || `Wrapper: ${item.wrapper}, Origin: ${item.countryOrigin}, Strength: ${item.strength}`,
      vendorPrices: [
        {
          id: `vp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          vendor: item.vendor || extractedResult?.vendorName || 'Online Retailer',
          price: item.purchasePrice || 0,
          currency: item.currency || '£',
          packageType: (item.quantity && item.quantity > 1) ? `Qty of ${item.quantity}` : 'Single',
          recordedAt: new Date().toISOString(),
          inStock: true,
        },
      ],
    }));
    onAddMultipleToWishlist(wishlistItems);
    showToast(`Added ${wishlistItems.length} cigars to Wishlist!`);
  };

  // Single Item Actions
  const handleSingleResearch = (item: ExtractedBasketItem) => {
    const rItem = convertBasketItemToResearch(item);
    if (onSingleAddToResearch) {
      onSingleAddToResearch(rItem);
    } else {
      onAddMultipleToResearch([rItem]);
    }
    showToast(`Added "${item.brand} ${item.name}" to Research Database!`);
  };

  const handleSingleHumidor = (item: ExtractedBasketItem) => {
    const hCigar = convertBasketItemToHumidor(item, selectedHumidorId);
    const rItem = convertBasketItemToResearch(item);
    if (onSingleAddCigar) {
      onSingleAddCigar(hCigar);
    } else {
      onAddMultipleToHumidor([hCigar]);
    }
    // Also sync to research
    if (onSingleAddToResearch) {
      onSingleAddToResearch(rItem);
    } else {
      onAddMultipleToResearch([rItem]);
    }
    const targetHum = humidors.find((h) => h.id === selectedHumidorId)?.name || 'Humidor';
    showToast(`Stocked ${item.quantity || 1}x "${item.brand} ${item.name}" to ${targetHum} & synced quotes!`);
  };

  const handleSingleWishlist = (item: ExtractedBasketItem) => {
    const wItem = {
      brand: item.brand,
      name: item.name,
      vitola: item.vitola || 'Robusto',
      wrapper: item.wrapper,
      targetPrice: item.purchasePrice,
      priority: 'Medium' as const,
      sourceRetailer: item.vendor || extractedResult?.vendorName || 'Online Retailer',
      notes: item.notes || `Wrapper: ${item.wrapper}, Origin: ${item.countryOrigin}, Strength: ${item.strength}`,
    };
    if (onSingleAddToWishlist) {
      onSingleAddToWishlist(wItem);
    } else {
      onAddMultipleToWishlist([wItem]);
    }
    showToast(`Bookmarked "${item.brand} ${item.name}" to Wishlist!`);
  };

  const selectedCount = extractedItems.filter((i) => i.selected).length;
  const selectedSticks = extractedItems.filter((i) => i.selected).reduce((sum, it) => sum + (it.quantity || 1), 0);
  const selectedTotalValue = extractedItems
    .filter((i) => i.selected)
    .reduce((sum, it) => sum + (it.totalPrice || (it.purchasePrice || 0) * (it.quantity || 1)), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#161311] border border-[#2C2621] rounded-xl w-full max-w-5xl my-auto text-[#E5E1DA] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2C2621] flex items-center justify-between bg-[#1A1614] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#C5A059]/15 text-[#C5A059] rounded-lg border border-[#C5A059]/30">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-serif text-white font-medium">
                  Shopping Basket & Order HTML Importer
                </h2>
                <span className="px-2 py-0.5 bg-[#C5A059]/20 text-[#C5A059] text-[10px] font-bold uppercase tracking-wider rounded-sm border border-[#C5A059]/30">
                  Multi-Cigar AI Extraction
                </span>
              </div>
              <p className="text-xs text-[#A89F94] mt-0.5">
                Upload or paste a shopping basket / invoice HTML containing multiple cigars to automatically extract and populate them into your Research Database.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#A89F94] hover:text-white p-2 rounded-lg hover:bg-[#2C2621] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs sm:text-sm">
          {/* Notification Toast */}
          {actionSuccessNotice && (
            <div className="p-3.5 bg-[#2E281F] border border-[#C5A059]/50 rounded-lg flex items-center gap-3 text-[#C5A059] shadow-md animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-[#C5A059]" />
              <p className="font-medium text-xs sm:text-sm leading-relaxed">{actionSuccessNotice}</p>
            </div>
          )}

          {/* Error Notice */}
          {error && (
            <div className="p-3.5 bg-red-950/40 border border-red-800/60 rounded-lg flex items-start gap-3 text-red-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <div className="flex-1 text-xs leading-relaxed">
                <p className="font-semibold text-red-300">Extraction Notice</p>
                <p className="mt-0.5 text-red-200/90">{error}</p>
              </div>
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-[#2C2621] gap-1 pb-1">
            <button
              onClick={() => setInputMode('file')}
              className={`px-3.5 py-2 rounded-t-lg font-semibold text-xs transition cursor-pointer flex items-center gap-2 border-b-2 ${
                inputMode === 'file'
                  ? 'border-[#C5A059] text-[#C5A059] bg-[#241E1B]'
                  : 'border-transparent text-[#A89F94] hover:text-[#E5E1DA] hover:bg-[#1A1614]'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Saved HTML File (.html / .htm)</span>
            </button>
            <button
              onClick={() => setInputMode('paste')}
              className={`px-3.5 py-2 rounded-t-lg font-semibold text-xs transition cursor-pointer flex items-center gap-2 border-b-2 ${
                inputMode === 'paste'
                  ? 'border-[#C5A059] text-[#C5A059] bg-[#241E1B]'
                  : 'border-transparent text-[#A89F94] hover:text-[#E5E1DA] hover:bg-[#1A1614]'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Paste Basket HTML / Text</span>
            </button>
            <button
              onClick={() => setInputMode('url')}
              className={`px-3.5 py-2 rounded-t-lg font-semibold text-xs transition cursor-pointer flex items-center gap-2 border-b-2 ${
                inputMode === 'url'
                  ? 'border-[#C5A059] text-[#C5A059] bg-[#241E1B]'
                  : 'border-transparent text-[#A89F94] hover:text-[#E5E1DA] hover:bg-[#1A1614]'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Basket Web Link</span>
            </button>
          </div>

          {/* Tab 1: File Dropzone */}
          {inputMode === 'file' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".html,.htm,.mhtml,text/html"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              {!htmlFileName ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(true);
                  }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileSelect(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                    isDraggingFile
                      ? 'border-[#C5A059] bg-[#C5A059]/10'
                      : 'border-[#2C2621] bg-[#13110F] hover:border-[#C5A059]/60 hover:bg-[#1A1614]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-[#241E1B] border border-[#2C2621] flex items-center justify-center text-[#C5A059]">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">
                      Click to choose or Drag & Drop your Saved Basket HTML
                    </p>
                    <p className="text-xs text-[#A89F94] mt-1">
                      Supports .html, .htm, .mhtml from C.Gars Ltd, Havana House, Smoke King, Sautter, etc.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2.5 py-1 bg-[#1A1614] border border-[#2C2621] text-[#A89F94] rounded text-[11px]">
                      Tip: In browser, press Ctrl+S / Cmd+S on your basket page and save as HTML
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-[#13110F] border border-[#2C2621] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#C5A059]/15 text-[#C5A059] rounded-lg border border-[#C5A059]/30">
                      <FileCode className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{htmlFileName}</p>
                      <p className="text-xs text-[#A89F94] mt-0.5">
                        Size: {htmlFileSize} &bull; Ready for multi-cigar extraction
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-[#1A1614] hover:bg-[#2C2621] text-[#E5E1DA] border border-[#2C2621] rounded text-xs font-semibold transition cursor-pointer"
                    >
                      Change File
                    </button>
                    <button
                      onClick={() => {
                        setHtmlFileName(null);
                        setHtmlFileSize(null);
                        setHtmlFileContent('');
                      }}
                      className="p-1.5 text-[#A89F94] hover:text-red-400 transition cursor-pointer"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Paste HTML */}
          {inputMode === 'paste' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#A89F94]">
                  Paste Shopping Basket HTML Source or Cart Text:
                </label>
                <button
                  onClick={() => setPastedContent(SAMPLE_BASKET_HTML)}
                  className="text-xs text-[#C5A059] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Load Sample C.Gars Ltd Basket HTML (5 Cigars)</span>
                </button>
              </div>
              <textarea
                rows={7}
                placeholder="Paste the raw HTML source code of your shopping basket (e.g. <table>, <tr>, cart items) or copied basket text..."
                value={pastedContent}
                onChange={(e) => setPastedContent(e.target.value)}
                className="w-full bg-[#13110F] border border-[#2C2621] rounded-lg p-3 text-xs font-mono text-[#E5E1DA] focus:outline-hidden focus:border-[#C5A059] placeholder-[#A89F94]/50"
              />
            </div>
          )}

          {/* Tab 3: URL */}
          {inputMode === 'url' && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-[#A89F94]">
                Retailer Shopping Cart / Basket Web Address:
              </label>
              <input
                type="url"
                placeholder="https://www.cgarsltd.co.uk/shopping_cart.php or receipt URL..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-[#13110F] border border-[#2C2621] rounded-lg p-3 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#C5A059] placeholder-[#A89F94]/50"
              />
              <p className="text-[11px] text-[#A89F94]/80">
                Note: Some e-commerce cart sessions require login; if the web link is empty or private, use the <strong>Upload Saved HTML File</strong> or <strong>Paste Basket HTML</strong> tab.
              </p>
            </div>
          )}

          {/* Auto-Add to Research Checkbox & Extract Trigger Button */}
          <div className="p-4 bg-[#1A1614] border border-[#2C2621] rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <label className="flex items-start sm:items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoAddToResearch}
                onChange={(e) => setAutoAddToResearch(e.target.checked)}
                className="w-4 h-4 rounded text-[#C5A059] focus:ring-[#C5A059] border-[#2C2621] bg-[#13110F] mt-0.5 sm:mt-0"
              />
              <div>
                <span className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Automatically add all extracted cigars to Research Database</span>
                </span>
                <p className="text-[11px] text-[#A89F94]">
                  Populates complete tasting transitions, flavor profiles, vitola dimensions, critic ratings, and spirit pairings directly into your Research Library.
                </p>
              </div>
            </label>

            <button
              onClick={handleProcessBasketExtraction}
              disabled={loading}
              className="px-5 py-2.5 bg-[#C5A059] hover:brightness-110 disabled:opacity-50 text-[#0F0D0C] font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Extracting Multiple Cigars...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Extract Shopping Basket</span>
                </>
              )}
            </button>
          </div>

          {/* EXTRACTED CIGARS REVIEW SECTION */}
          {extractedItems.length > 0 && (
            <div className="space-y-4 pt-2">
              {/* Basket Overview Banner */}
              <div className="p-4 bg-[#1F1A17] border border-[#C5A059]/40 rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#C5A059]/20 text-[#C5A059] flex items-center justify-center font-bold text-sm border border-[#C5A059]/40">
                    {extractedItems.length}
                  </div>
                  <div>
                    <h3 className="font-serif font-semibold text-white text-sm sm:text-base">
                      {extractedResult?.vendorName || 'Retailer Basket'} &bull; {extractedItems.length} Cigar Lines Detected
                    </h3>
                    <p className="text-xs text-[#A89F94]">
                      Total Sticks: <strong className="text-[#E5E1DA]">{extractedResult?.itemCount || extractedItems.reduce((s, i) => s + (i.quantity || 1), 0)}</strong> &bull; Total Value: <strong className="text-[#C5A059]">{extractedResult?.currency || '£'}{(extractedResult?.basketTotal || selectedTotalValue).toFixed(2)}</strong>
                    </p>
                  </div>
                </div>

                {/* Batch Action Bar */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleBatchAddToResearch}
                    className="px-3 py-1.5 bg-[#C5A059] hover:brightness-110 text-[#0F0D0C] font-bold text-xs uppercase tracking-wider rounded-md shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Add Selected ({selectedCount}) to Research</span>
                  </button>

                  <div className="flex items-center gap-1.5 bg-[#13110F] p-1 rounded-md border border-[#2C2621]">
                    <select
                      value={selectedHumidorId}
                      onChange={(e) => setSelectedHumidorId(e.target.value)}
                      className="bg-transparent text-xs text-[#E5E1DA] focus:outline-hidden pr-2 font-medium"
                    >
                      {humidors.map((h) => (
                        <option key={h.id} value={h.id} className="bg-[#161311] text-[#E5E1DA]">
                          {h.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleBatchAddToHumidor}
                      className="px-2.5 py-1 bg-[#2C2621] hover:bg-[#3D352E] text-white text-xs font-semibold rounded transition cursor-pointer flex items-center gap-1"
                    >
                      <Package className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>Stock ({selectedSticks} sticks)</span>
                    </button>
                  </div>

                  <button
                    onClick={handleBatchAddToWishlist}
                    className="px-3 py-1.5 bg-[#13110F] hover:bg-[#241E1B] text-[#C5A059] border border-[#2C2621] text-xs font-semibold rounded-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Wishlist ({selectedCount})</span>
                  </button>
                </div>
              </div>

              {/* Table / Grid of Extracted Cigars */}
              <div className="border border-[#2C2621] rounded-xl overflow-hidden bg-[#13110F]">
                <div className="px-4 py-2.5 bg-[#1A1614] border-b border-[#2C2621] flex items-center justify-between text-xs text-[#A89F94]">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleToggleSelectAll}
                      className="flex items-center gap-1.5 hover:text-white font-medium cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={extractedItems.length > 0 && extractedItems.every((i) => i.selected)}
                        onChange={handleToggleSelectAll}
                        className="w-3.5 h-3.5 rounded text-[#C5A059] border-[#2C2621]"
                      />
                      <span>Select All ({extractedItems.length})</span>
                    </button>
                  </div>
                  <span>Click individual buttons for quick single-stick actions</span>
                </div>

                <div className="divide-y divide-[#2C2621] max-h-[420px] overflow-y-auto">
                  {extractedItems.map((item, index) => {
                    const matchInResearch = findMatchingResearchCigar(
                      { brand: item.brand, line: item.line || item.name, name: item.name, vitola: item.vitola },
                      researchDatabase
                    );

                    return (
                      <div
                        key={item.id || index}
                        className={`p-4 transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          item.selected ? 'bg-[#181412]' : 'bg-[#13110F] opacity-75'
                        }`}
                      >
                        {/* Left: Checkbox + Brand Info */}
                        <div className="flex items-start gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => handleToggleSelectItem(index)}
                            className="w-4 h-4 mt-1 rounded text-[#C5A059] border-[#2C2621] cursor-pointer"
                          />
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-serif text-sm font-bold text-white">
                                {item.brand} {item.name}
                              </h4>
                              {item.isCuban && (
                                <span className="px-1.5 py-0.5 bg-red-950/60 text-red-300 border border-red-800/50 text-[10px] font-bold uppercase tracking-wider rounded-xs">
                                  Cuban
                                </span>
                              )}
                              <span className="px-1.5 py-0.5 bg-[#2C2621] text-[#C5A059] text-[10px] font-semibold rounded-xs">
                                {item.vitola}
                              </span>
                              <span className="text-[11px] text-[#A89F94]">
                                {item.lengthInches ? `${item.lengthInches}"` : ''} {item.ringGauge ? `x ${item.ringGauge} RG` : ''}
                              </span>
                            </div>

                            {/* Duplicate & Research Status Indicator */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              {matchInResearch ? (
                                <span className="px-2 py-0.5 bg-blue-950/60 text-blue-300 border border-blue-800/50 text-[10px] font-medium rounded-xs inline-flex items-center gap-1">
                                  <Tag className="w-3 h-3 text-blue-400" />
                                  <span>In Research Catalog &bull; Will attach {item.vendor || 'Shop'} price ({item.currency || '£'}{(item.purchasePrice || 0).toFixed(2)})</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 text-[10px] font-medium rounded-xs inline-flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-emerald-400" />
                                  <span>New Cigar to Catalog</span>
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-[#A89F94] flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span>Origin: <strong className="text-[#E5E1DA]">{item.countryOrigin}</strong></span>
                              <span>Wrapper: <strong className="text-[#E5E1DA]">{item.wrapper}</strong></span>
                              <span>Strength: <strong className="text-[#E5E1DA]">{item.strength}</strong></span>
                              <span>Resting: <strong className="text-[#C5A059]">{item.idealRestMonths} mo</strong></span>
                            </p>

                            {/* Flavor tags */}
                            {item.flavorTags && item.flavorTags.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {item.flavorTags.slice(0, 4).map((tag, tIdx) => (
                                  <span
                                    key={tIdx}
                                    className="px-1.5 py-0.5 bg-[#1F1A17] border border-[#2C2621] text-[#A89F94] text-[10px] rounded-xs"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                      {/* Middle: Quantity & Price */}
                      <div className="flex items-center gap-4 shrink-0 pl-7 md:pl-0">
                        <div className="flex items-center gap-1.5">
                          <label className="text-[11px] text-[#A89F94]">Qty:</label>
                          <div className="flex items-center bg-[#13110F] border border-[#2C2621] rounded">
                            <button
                              onClick={() => handleUpdateItemQuantity(index, (item.quantity || 1) - 1)}
                              className="px-2 py-0.5 text-xs text-[#A89F94] hover:text-white hover:bg-[#2C2621]"
                            >
                              -
                            </button>
                            <span className="px-2 text-xs font-bold text-white">{item.quantity || 1}</span>
                            <button
                              onClick={() => handleUpdateItemQuantity(index, (item.quantity || 1) + 1)}
                              className="px-2 py-0.5 text-xs text-[#A89F94] hover:text-white hover:bg-[#2C2621]"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-bold text-[#C5A059]">
                            {item.currency || '£'}{(item.totalPrice || (item.purchasePrice || 0) * (item.quantity || 1)).toFixed(2)}
                          </p>
                          <p className="text-[10px] text-[#A89F94]">
                            {item.currency || '£'}{(item.purchasePrice || 0).toFixed(2)} / stick
                          </p>
                        </div>
                      </div>

                      {/* Right: Quick Action Buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 pl-7 md:pl-0 shrink-0">
                        <button
                          onClick={() => handleSingleResearch(item)}
                          className="px-2.5 py-1 bg-[#C5A059]/15 hover:bg-[#C5A059]/30 text-[#C5A059] border border-[#C5A059]/40 rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                          title="Save this cigar to Research Database"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>Research</span>
                        </button>

                        <button
                          onClick={() => handleSingleHumidor(item)}
                          className="px-2.5 py-1 bg-[#2C2621] hover:bg-[#3D352E] text-[#E5E1DA] rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                          title="Add to selected humidor"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Humidor</span>
                        </button>

                        <button
                          onClick={() => handleSingleWishlist(item)}
                          className="px-2 py-1 bg-[#1A1614] hover:bg-[#241E1B] text-[#A89F94] hover:text-white border border-[#2C2621] rounded text-xs transition cursor-pointer"
                          title="Add to wishlist"
                        >
                          <Bookmark className="w-3 h-3" />
                        </button>

                        {onLogSmoke && (
                          <button
                            onClick={() => {
                              onLogSmoke({
                                brand: item.brand,
                                name: item.name,
                                vitola: item.vitola,
                                wrapper: item.wrapper,
                                countryOrigin: item.countryOrigin,
                              });
                              onClose();
                            }}
                            className="px-2 py-1 bg-[#8B5E3C]/20 hover:bg-[#8B5E3C]/40 text-[#D4A373] border border-[#8B5E3C]/40 rounded text-xs transition cursor-pointer"
                            title="Log immediate smoke session"
                          >
                            <Flame className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>

              {/* Bottom Quick-Done Bar */}
              <div className="p-4 bg-[#1A1614] border border-[#2C2621] rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-[#A89F94]">
                  Selected: <strong className="text-white">{selectedCount} lines</strong> ({selectedSticks} sticks) &bull; Value: <strong className="text-[#C5A059]">{extractedResult?.currency || '£'}{selectedTotalValue.toFixed(2)}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-[#2C2621] hover:bg-[#3D352E] text-[#E5E1DA] font-semibold text-xs rounded-lg transition cursor-pointer"
                  >
                    Done & Close
                  </button>
                  <button
                    onClick={handleBatchAddToResearch}
                    className="px-4 py-2 bg-[#C5A059] hover:brightness-110 text-[#0F0D0C] font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Save All to Research Database</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
