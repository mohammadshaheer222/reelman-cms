'use client';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  Save,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Sparkles,
  Upload,
  Check,
  Eye,
  Type,
  Settings2,
  FileText,
  DollarSign,
  Palette,
} from 'lucide-react';
import { PackageData, Client } from '@/types';
import { DEFAULT_PACKAGE, DEFAULT_BOOKLET_PAGES } from '@/lib/defaultPackage';
import { ALL_FONTS, FONT_WEIGHTS } from '@/lib/fonts';
import { PackageBooklet } from './PackageBooklet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const CURATED_COVERS = [
  {
    name: 'Classic Black & White',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200',
  },
  {
    name: 'Golden Hour Silhouette',
    url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1200',
  },
  {
    name: 'Editorial Luxury Wedding',
    url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=1200',
  },
  {
    name: 'Intimate Ceremony',
    url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&q=80&w=1200',
  },
];

interface PackageBuilderProps {
  initialData?: PackageData;
  clients?: Client[];
  onSaved?: (savedPkg: PackageData) => void;
}

export function PackageBuilder({
  initialData,
  clients = [],
  onSaved,
}: PackageBuilderProps) {
  const [pkg, setPkg] = useState<PackageData>(() => {
    const base = initialData || DEFAULT_PACKAGE;
    return {
      ...base,
      pagesList:
        base.pagesList && base.pagesList.length > 0
          ? base.pagesList
          : DEFAULT_BOOKLET_PAGES,
      pageBackgrounds: base.pageBackgrounds || {},
    };
  });
  const [currentPage, setCurrentPage] = useState(0); // 0-7
  const [viewAll, setViewAll] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mobileTab, setMobileTab] = useState<'canvas' | 'settings'>('canvas');
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cover image upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPkg((prev) => ({
            ...prev,
            coverImage: event.target!.result as string,
          }));
          toast.success('Cover image updated');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove cover photo (syncs to DB if already saved)
  const handleDeleteCoverImage = async () => {
    setPkg((prev) => ({ ...prev, coverImage: '' }));
    toast.success('Cover photo removed');

    if (pkg._id) {
      try {
        await fetch(`/api/packages/${pkg._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coverImage: '' }),
        });
      } catch (err) {
        console.error('Failed to sync deletion:', err);
      }
    }
  };

  // Print / PDF Trigger
  const handlePrintPDF = () => {
    toast.dismiss();
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Save to DB
  const handleSave = async () => {
    setSaving(true);
    try {
      const url = pkg._id ? `/api/packages/${pkg._id}` : '/api/packages';
      const method = pkg._id ? 'PATCH' : 'POST';

      const payload = {
        ...pkg,
        pagesList:
          pkg.pagesList && pkg.pagesList.length > 0
            ? pkg.pagesList
            : DEFAULT_BOOKLET_PAGES,
        pageBackgrounds: pkg.pageBackgrounds || {},
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save package');

      toast.success(pkg._id ? 'Package updated' : 'Package saved successfully');
      setPkg(data.data);
      onSaved?.(data.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving package';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="no-print bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
              Package & Proposal Studio
            </h1>
            <p className="text-xs text-gray-500">
              Click any text to edit directly • Luxury 8-page PDF
            </p>
          </div>

          {/* Mobile switcher (Canvas vs Settings) */}
          <div className="flex lg:hidden bg-gray-100 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setMobileTab('canvas')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                mobileTab === 'canvas'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Canvas
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('settings')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                mobileTab === 'settings'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Settings
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewAll(!viewAll)}
            className="text-xs h-8 px-2.5"
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            {viewAll ? 'Single Page' : `All ${pkg.pagesList?.length || 8} Pages`}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintPDF}
            className="text-xs h-8 px-2.5 bg-gray-50 hover:bg-gray-100 text-gray-800"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Download PDF
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="text-xs h-8 px-3 bg-[#2C8567] hover:bg-[#236d54] text-white shadow-xs"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Main Layout: Settings Panel + Visual Live Canvas (Hidden during print) */}
      <div className="no-print grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Clean & Simple Settings (Hidden on mobile when on canvas tab) */}
        <div
          className={`no-print lg:col-span-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-4 max-h-[calc(100vh-140px)] overflow-y-auto ${
            mobileTab === 'settings' ? 'block' : 'hidden lg:block'
          }`}
        >
          <Tabs defaultValue="cover" className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full h-8 bg-gray-100 p-0.5 rounded-lg text-xs">
              <TabsTrigger value="cover">Cover & $</TabsTrigger>
              <TabsTrigger value="fonts">Fonts</TabsTrigger>
              <TabsTrigger value="client">Client</TabsTrigger>
            </TabsList>

            {/* TAB 1: COVER & PRICING */}
            <TabsContent value="cover" className="space-y-4 pt-1">
              {/* Cover Photo */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-gray-800">
                    Cover Photo
                  </Label>
                  <div className="flex items-center gap-2">
                    {pkg.coverImage && (
                      <button
                        type="button"
                        onClick={handleDeleteCoverImage}
                        className="text-[11px] text-red-600 hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" /> Upload
                    </button>
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                {/* Presets */}
                <div className="grid grid-cols-2 gap-2">
                  {CURATED_COVERS.map((cov, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPkg({ ...pkg, coverImage: cov.url })}
                      className={`relative h-16 rounded-lg overflow-hidden border transition-all ${
                        pkg.coverImage === cov.url
                          ? 'ring-2 ring-blue-600 border-transparent'
                          : 'border-gray-200 hover:opacity-90'
                      }`}
                    >
                      <img
                        src={cov.url}
                        alt={cov.name}
                        className="w-full h-full object-cover"
                      />
                      {pkg.coverImage === cov.url && (
                        <span className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-0.5">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price & Note */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <Label className="text-xs font-semibold text-gray-800">
                  Total Pricing
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={pkg.totalAmount}
                    onChange={(e) => setPkg({ ...pkg, totalAmount: e.target.value })}
                    placeholder="55,000/-"
                    className="h-8 text-xs font-bold"
                  />
                  <Input
                    value={pkg.amountNote}
                    onChange={(e) => setPkg({ ...pkg, amountNote: e.target.value })}
                    placeholder="(Travel extra)"
                    className="h-8 text-xs text-gray-600"
                  />
                </div>
              </div>

              {/* Brand Header & Subtitle */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <Label className="text-xs font-semibold text-gray-800">
                  Brand Titles
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={pkg.coverBrand}
                    onChange={(e) => setPkg({ ...pkg, coverBrand: e.target.value })}
                    placeholder="REELMAN"
                    className="h-8 text-xs uppercase"
                  />
                  <Input
                    value={pkg.coverSubtitle}
                    onChange={(e) => setPkg({ ...pkg, coverSubtitle: e.target.value })}
                    placeholder="Production"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: FONTS */}
            <TabsContent value="fonts" className="space-y-3 pt-1">
              {/* Headlines Font */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-800">
                  Headings & Titles Font
                </Label>
                <Select
                  value={pkg.headlineFont || 'Cormorant Garamond'}
                  onValueChange={(val) => setPkg({ ...pkg, headlineFont: val })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_FONTS.filter((f) => f.category === 'Serif').map((f) => (
                      <SelectItem key={f.family} value={f.family}>
                        <span style={{ fontFamily: f.family }} className="text-sm">
                          {f.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Script Font */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-800">
                  Signature / Subtitle Font
                </Label>
                <Select
                  value={pkg.scriptFont || 'Alex Brush'}
                  onValueChange={(val) => setPkg({ ...pkg, scriptFont: val })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_FONTS.filter((f) => f.category === 'Script').map((f) => (
                      <SelectItem key={f.family} value={f.family}>
                        <span style={{ fontFamily: f.family }} className="text-base">
                          {f.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Body Font */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-800">
                  Body & Paragraphs Font
                </Label>
                <Select
                  value={pkg.bodyFont || 'Montserrat'}
                  onValueChange={(val) => setPkg({ ...pkg, bodyFont: val })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_FONTS.filter((f) => f.category === 'Sans-Serif').map((f) => (
                      <SelectItem key={f.family} value={f.family}>
                        <span style={{ fontFamily: f.family }} className="text-xs">
                          {f.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* TAB 3: CLIENT & PROPOSAL */}
            <TabsContent value="client" className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-800">
                  Proposal Title (Internal)
                </Label>
                <Input
                  value={pkg.title}
                  onChange={(e) => setPkg({ ...pkg, title: e.target.value })}
                  placeholder="e.g. Signature Wedding Proposal"
                  className="h-8 text-xs"
                />
              </div>

              {clients.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-800">
                    Assign to Client
                  </Label>
                  <Select
                    value={pkg.clientId || 'none'}
                    onValueChange={(val) => {
                      if (val === 'none') {
                        setPkg({ ...pkg, clientId: undefined, clientName: undefined });
                      } else {
                        const cl = clients.find((c) => c._id === val);
                        setPkg({
                          ...pkg,
                          clientId: val,
                          clientName: cl?.name || cl?.clientId,
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">General / None</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.name || 'Unnamed'} ({c.clientId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Live Interactive Canvas (Always shown on desktop; shown on mobile when canvas tab active) */}
        <div
          className={`lg:col-span-8 flex flex-col items-center space-y-3 w-full ${
            mobileTab === 'canvas' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Page Navigator bar */}
          {!viewAll && (
            <div className="no-print flex items-center justify-between w-full max-w-[520px] bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-xs text-xs">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 flex items-center gap-1 font-medium text-gray-700"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <span className="font-semibold text-gray-700">
                Page {Math.min(currentPage, (pkg.pagesList?.length || 8) - 1) + 1} of{' '}
                {pkg.pagesList?.length || 8}
              </span>

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.min((pkg.pagesList?.length || 8) - 1, p + 1)
                  )
                }
                disabled={currentPage >= (pkg.pagesList?.length || 8) - 1}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 flex items-center gap-1 font-medium text-gray-700"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Render Booklet Canvas */}
          <div className="w-full flex justify-center px-1 sm:px-0">
            <div className="w-full max-w-[520px]">
              <PackageBooklet
                pkg={pkg}
                activePageIndex={viewAll ? undefined : Math.min(currentPage, (pkg.pagesList?.length || 8) - 1)}
                onUpdatePkg={setPkg}
                onOpenImagePicker={() => fileInputRef.current?.click()}
                onNavigatePage={(idx) => setCurrentPage(idx)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Direct-to-body print container portal: eliminates all ancestor margins, paddings, and page calculation overflows */}
      {mounted &&
        typeof document !== 'undefined' &&
        createPortal(
          <div id="print-root">
            <PackageBooklet pkg={pkg} isPrintMode={true} />
          </div>,
          document.body
        )}
    </div>
  );
}
