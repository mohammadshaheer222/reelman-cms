'use client';
import React, { useState } from 'react';
import { PackageData, TextStyleConfig, BookletPageItem, PageBackgroundConfig } from '@/types';
import { DEFAULT_BOOKLET_PAGES } from '@/lib/defaultPackage';
import { Camera, Plus, Trash2, Palette, Image as ImageIcon, Sparkles, X, Upload } from 'lucide-react';
import { CanvaFontToolbar } from './CanvaFontToolbar';

interface PackageBookletProps {
  pkg: PackageData;
  activePageIndex?: number;
  isPrintMode?: boolean;
  onUpdatePkg?: (updater: (prev: PackageData) => PackageData) => void;
  onOpenImagePicker?: () => void;
  onNavigatePage?: (idx: number) => void;
}

const BG_PALETTE = [
  { label: 'Classic Cream', value: '#F5EFE6' },
  { label: 'Warm Almond', value: '#EADBC8' },
  { label: 'Pure White', value: '#FFFFFF' },
  { label: 'Warm Linen', value: '#FAF6F0' },
  { label: 'Soft Sand', value: '#EFEAE2' },
  { label: 'Dark Charcoal', value: '#1F1C1B' },
  { label: 'Editorial Dark', value: '#2B2725' },
  { label: 'Deep Black', value: '#0A0A0A' },
];

function isDarkColor(hex?: string): boolean {
  if (!hex) return false;
  if (hex.startsWith('#')) {
    const c = hex.substring(1);
    const rgb = parseInt(c.length === 3 ? c.split('').map((x) => x + x).join('') : c, 16);
    if (isNaN(rgb)) return false;
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma < 130;
  }
  return false;
}

interface EditableSpanProps {
  id: string;
  label: string;
  role: 'headline' | 'script' | 'body';
  value: string;
  onChange?: (val: string) => void;
  className?: string;
  style?: React.CSSProperties;
  tag?: any;
  placeholder?: string;
  isPrintMode?: boolean;
  multiline?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

function EditableSpan({
  id,
  label,
  role,
  value,
  onChange,
  className = '',
  style = {},
  tag: Tag = 'span',
  placeholder = 'Click to edit...',
  isPrintMode = false,
  multiline = false,
  isSelected = false,
  onSelect,
}: EditableSpanProps) {
  // Ensure text-align works: inline elements ignore text-align, so set display:block when needed
  const effectiveStyle: React.CSSProperties = style.textAlign
    ? { display: 'block', ...style }
    : style;

  if (isPrintMode || !onChange) {
    return (
      <Tag className={className} style={effectiveStyle}>
        {value}
      </Tag>
    );
  }

  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      className={`canva-editable relative transition-all duration-150 ${
        isSelected
          ? 'ring-2 ring-blue-500 bg-blue-50/20 rounded shadow-xs'
          : 'hover:ring-1 hover:ring-blue-300 hover:bg-blue-50/10'
      } ${className}`}
      style={effectiveStyle}
      title="Click to edit text"
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect?.();
      }}
      onFocus={() => {
        onSelect?.();
      }}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        const text = e.currentTarget.innerText;
        onChange(text);
      }}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (!multiline && e.key === 'Enter') {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
      }}
    >
      {value || placeholder}
    </Tag>
  );
}

export function PackageBooklet({
  pkg,
  activePageIndex,
  isPrintMode = false,
  onUpdatePkg,
  onOpenImagePicker,
  onNavigatePage,
}: PackageBookletProps) {
  const [selectedElement, setSelectedElement] = useState<{
    id: string;
    label: string;
    role: 'headline' | 'script' | 'body';
  } | null>(null);

  const [activeBgPopoverPageId, setActiveBgPopoverPageId] = useState<string | null>(null);

  // Fallback font roles
  const headlineFont = pkg.headlineFont || 'Cormorant Garamond';
  const scriptFont = pkg.scriptFont || 'Alex Brush';
  const bodyFont = pkg.bodyFont || 'Montserrat';

  const pagesList: BookletPageItem[] = pkg.pagesList && pkg.pagesList.length > 0
    ? pkg.pagesList
    : DEFAULT_BOOKLET_PAGES;

  const updateField = (key: keyof PackageData, val: any) => {
    if (onUpdatePkg) {
      onUpdatePkg((prev) => ({ ...prev, [key]: val }));
    }
  };

  // Helper to compute effective style for an element
  const getStyleFor = (
    id: string,
    role: 'headline' | 'script' | 'body',
    baseStyle: React.CSSProperties = {}
  ): React.CSSProperties => {
    const custom = pkg.textStyles?.[id] || {};

    const defaultFamily =
      role === 'headline' ? headlineFont : role === 'script' ? scriptFont : bodyFont;

    const defaultWeight =
      role === 'headline'
        ? pkg.headlineFontWeight || '400'
        : role === 'script'
        ? pkg.scriptFontWeight || '400'
        : pkg.bodyFontWeight || '400';

    const defaultItalic =
      role === 'headline'
        ? pkg.headlineItalic
        : role === 'script'
        ? pkg.scriptItalic
        : pkg.bodyItalic;

    const defaultSize =
      role === 'headline'
        ? pkg.headlineFontSize && pkg.headlineFontSize !== 'default'
          ? `${pkg.headlineFontSize}px`
          : undefined
        : role === 'body'
        ? pkg.bodyFontSize && pkg.bodyFontSize !== 'default'
          ? `${pkg.bodyFontSize}px`
          : undefined
        : undefined;

    return {
      ...baseStyle,
      fontFamily: custom.fontFamily || defaultFamily,
      fontWeight: custom.fontWeight || defaultWeight,
      fontStyle:
        custom.fontStyle || (defaultItalic ? 'italic' : baseStyle.fontStyle || 'normal'),
      color: custom.color || baseStyle.color,
      fontSize: custom.fontSize
        ? `${custom.fontSize}px`
        : defaultSize || baseStyle.fontSize,
      letterSpacing: custom.letterSpacing || baseStyle.letterSpacing,
      lineHeight: custom.lineHeight || baseStyle.lineHeight,
      textTransform: custom.textTransform || baseStyle.textTransform,
      textAlign: custom.textAlign || baseStyle.textAlign,
    };
  };

  // Handle toolbar updates
  const handleToolbarStyleChange = (
    updated: TextStyleConfig,
    applyGlobally: boolean = false
  ) => {
    if (!onUpdatePkg || !selectedElement) return;

    if (applyGlobally) {
      if (selectedElement.role === 'headline') {
        onUpdatePkg((prev) => ({
          ...prev,
          headlineFont: updated.fontFamily || prev.headlineFont,
          headlineFontWeight: updated.fontWeight || prev.headlineFontWeight,
          headlineItalic: updated.fontStyle === 'italic',
        }));
      } else if (selectedElement.role === 'script') {
        onUpdatePkg((prev) => ({
          ...prev,
          scriptFont: updated.fontFamily || prev.scriptFont,
          scriptFontWeight: updated.fontWeight || prev.scriptFontWeight,
          scriptItalic: updated.fontStyle === 'italic',
        }));
      } else {
        onUpdatePkg((prev) => ({
          ...prev,
          bodyFont: updated.fontFamily || prev.bodyFont,
          bodyFontWeight: updated.fontWeight || prev.bodyFontWeight,
          bodyItalic: updated.fontStyle === 'italic',
        }));
      }
    }

    onUpdatePkg((prev) => ({
      ...prev,
      textStyles: {
        ...(prev.textStyles || {}),
        [selectedElement.id]: updated,
      },
    }));
  };

  const activeStyleConfig: TextStyleConfig = selectedElement
    ? {
        fontFamily:
          pkg.textStyles?.[selectedElement.id]?.fontFamily ||
          (selectedElement.role === 'headline'
            ? headlineFont
            : selectedElement.role === 'script'
            ? scriptFont
            : bodyFont),
        fontWeight:
          pkg.textStyles?.[selectedElement.id]?.fontWeight ||
          (selectedElement.role === 'headline'
            ? pkg.headlineFontWeight || '400'
            : selectedElement.role === 'script'
            ? pkg.scriptFontWeight || '400'
            : pkg.bodyFontWeight || '400'),
        fontStyle:
          pkg.textStyles?.[selectedElement.id]?.fontStyle ||
          ((selectedElement.role === 'headline'
            ? pkg.headlineItalic
            : selectedElement.role === 'script'
            ? pkg.scriptItalic
            : pkg.bodyItalic)
            ? 'italic'
            : 'normal'),
        color: pkg.textStyles?.[selectedElement.id]?.color,
        fontSize: pkg.textStyles?.[selectedElement.id]?.fontSize,
        letterSpacing: pkg.textStyles?.[selectedElement.id]?.letterSpacing,
        lineHeight: pkg.textStyles?.[selectedElement.id]?.lineHeight,
        textTransform: pkg.textStyles?.[selectedElement.id]?.textTransform,
        textAlign: pkg.textStyles?.[selectedElement.id]?.textAlign,
      }
    : {};

  // PAGE MANAGEMENT (Add, Delete, Backgrounds)
  const handleAddPage = () => {
    const newId = `page-${Date.now()}`;
    const newPage: BookletPageItem = {
      id: newId,
      type: 'custom',
      title: 'SPECIAL HIGHLIGHTS',
      subtitle: 'Memories & Notes',
      content:
        'Click to customize this page. You can share your story, vendor details, special shooting guidelines, or personalized messages for your couple.',
    };
    const updated = [...pagesList, newPage];
    updateField('pagesList', updated);
    if (onNavigatePage) {
      onNavigatePage(updated.length - 1);
    }
  };

  const handleDeletePage = (pageId: string) => {
    if (pagesList.length <= 1) {
      alert('Booklet must have at least 1 page.');
      return;
    }
    const idx = pagesList.findIndex((p) => p.id === pageId);
    const updated = pagesList.filter((p) => p.id !== pageId);
    updateField('pagesList', updated);
    if (onNavigatePage) {
      onNavigatePage(Math.max(0, Math.min(idx, updated.length - 1)));
    }
  };

  const handleUpdatePageBg = (pageId: string, bg: PageBackgroundConfig) => {
    const updated = {
      ...(pkg.pageBackgrounds || {}),
      [pageId]: { ...(pkg.pageBackgrounds?.[pageId] || {}), ...bg },
    };
    updateField('pageBackgrounds', updated);
  };

  const handleApplyBgToAllPages = (bg: PageBackgroundConfig) => {
    const updated: Record<string, PageBackgroundConfig> = {};
    pagesList.forEach((p) => {
      updated[p.id] = { ...bg };
    });
    updateField('pageBackgrounds', updated);
    setActiveBgPopoverPageId(null);
  };

  const handleUpdateCustomPage = (
    pageId: string,
    patch: Partial<BookletPageItem>
  ) => {
    const updated = pagesList.map((p) =>
      p.id === pageId ? { ...p, ...patch } : p
    );
    updateField('pagesList', updated);
  };

  // Render a specific page item by its configuration
  const renderPageContent = (page: BookletPageItem, pageIdx: number) => {
    const pageBg = pkg.pageBackgrounds?.[page.id] || {};
    const effectiveBgColor =
      pageBg.color || (page.type === 'cover' ? '#0a0a0a' : '#F5EFE6');
    const effectiveBgImage =
      pageBg.image !== undefined
        ? pageBg.image
        : page.type === 'cover'
        ? pkg.coverImage
        : undefined;

    const isDark = isDarkColor(effectiveBgColor) || Boolean(effectiveBgImage);
    const textColorClass = isDark ? 'text-white' : 'text-[#2b2725]';
    const isLast = pageIdx === pagesList.length - 1;

    return (
      <div
        key={page.id}
        className={`pdf-sheet ${isLast ? 'pdf-sheet-last' : ''} relative w-full ${
          isPrintMode ? 'rounded-none shadow-none' : 'aspect-[1/1.4142] rounded-xl shadow-xl'
        } overflow-hidden flex flex-col justify-between p-5 sm:p-10 md:p-12 select-none transition-all mx-auto ${textColorClass}`}
        style={{
          backgroundColor: effectiveBgColor,
          backgroundImage: effectiveBgImage
            ? `linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.68) 100%), url(${effectiveBgImage})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          ...(isPrintMode && isLast
            ? { breakAfter: 'avoid', pageBreakAfter: 'avoid' }
            : {}),
        }}
        onClick={() => {
          setSelectedElement(null);
          setActiveBgPopoverPageId(null);
        }}
      >
        {/* Decorative inner border removed for cleaner look */}

        {/* Page Top Control Bar (Canva-Style: Page #, Background, Delete) */}
        {!isPrintMode && (
          <div className="no-print relative z-30 flex items-center justify-between w-full pb-1">
            <span
              className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-md ${
                isDark
                  ? 'bg-black/50 text-white/90'
                  : 'bg-white/80 text-gray-700 shadow-xs'
              }`}
            >
              Page {pageIdx + 1} of {pagesList.length}
            </span>

            <div className="flex items-center gap-1">
              {/* Background Color & Image Popover Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveBgPopoverPageId(
                      activeBgPopoverPageId === page.id ? null : page.id
                    );
                  }}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-colors ${
                    isDark
                      ? 'bg-black/60 hover:bg-black/80 text-white border border-white/20'
                      : 'bg-white/90 hover:bg-white text-gray-800 border border-gray-200 shadow-xs'
                  }`}
                  title="Change page background color or photo"
                >
                  <Palette className="w-3 h-3 text-blue-500" />
                  <span className="hidden sm:inline">Background</span>
                </button>

                {activeBgPopoverPageId === page.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-8 right-0 z-50 p-3 bg-white text-gray-800 rounded-xl shadow-2xl border border-gray-200 w-64 space-y-2.5 text-xs animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div className="flex items-center justify-between font-semibold pb-1 border-b border-gray-100 text-[11px]">
                      <span>Page {pageIdx + 1} Background</span>
                      <button
                        type="button"
                        onClick={() => setActiveBgPopoverPageId(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Color Swatches */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 font-semibold uppercase">
                        Colors
                      </span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {BG_PALETTE.map((c) => (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() =>
                              handleUpdatePageBg(page.id, { color: c.value })
                            }
                            className="h-7 rounded-md border border-gray-300 relative flex items-center justify-center hover:scale-105 transition-transform shadow-2xs"
                            style={{ backgroundColor: c.value }}
                            title={c.label}
                          >
                            {effectiveBgColor === c.value && (
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isDarkColor(c.value)
                                    ? 'bg-white'
                                    : 'bg-black'
                                }`}
                              />
                            )}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5 pt-1">
                        <input
                          type="color"
                          value={effectiveBgColor}
                          onChange={(e) =>
                            handleUpdatePageBg(page.id, { color: e.target.value })
                          }
                          className="w-7 h-7 rounded cursor-pointer border border-gray-200 p-0.5"
                          title="Custom Color"
                        />
                        <span className="text-[10px] text-gray-500 font-mono">
                          {effectiveBgColor}
                        </span>
                      </div>
                    </div>

                    {/* Image / Photo */}
                    <div className="space-y-1 pt-1.5 border-t border-gray-100">
                      <span className="text-[10px] text-gray-400 font-semibold uppercase">
                        Background Photo
                      </span>
                      <div className="flex items-center gap-1">
                        <label className="flex-1 text-center py-1 px-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-[11px] font-medium cursor-pointer flex items-center justify-center gap-1">
                          <Upload className="w-3 h-3 text-blue-600" />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  if (ev.target?.result) {
                                    handleUpdatePageBg(page.id, {
                                      image: ev.target.result as string,
                                    });
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>

                        {effectiveBgImage && (
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdatePageBg(page.id, { image: '' })
                            }
                            className="py-1 px-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded text-[11px] font-medium"
                            title="Remove background photo"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Apply to all pages */}
                    <button
                      type="button"
                      onClick={() =>
                        handleApplyBgToAllPages({
                          color: effectiveBgColor,
                          image: effectiveBgImage,
                        })
                      }
                      className="w-full py-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-800 rounded text-[10px] font-semibold transition-colors pt-1"
                    >
                      Apply background to all pages
                    </button>
                  </div>
                )}
              </div>

              {/* Delete Page */}
              {pagesList.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete Page ${pageIdx + 1}?`)) {
                      handleDeletePage(page.id);
                    }
                  }}
                  className={`p-1 rounded-md transition-colors ${
                    isDark
                      ? 'bg-black/50 hover:bg-red-600 text-white/80 hover:text-white'
                      : 'bg-white/90 hover:bg-red-50 text-gray-500 hover:text-red-600 border border-gray-200 shadow-xs'
                  }`}
                  title="Delete this page"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* PAGE 1: COVER */}
        {page.type === 'cover' && (
          <>
            <div className="relative z-10 text-center mb-4 sm:mb-8 px-2 sm:px-4 mt-auto">
              <h1 className="text-xl sm:text-3xl md:text-4xl tracking-[0.25em] sm:tracking-[0.35em] uppercase drop-shadow-md">
                <EditableSpan
                  id="coverBrand"
                  label="Brand Header"
                  role="headline"
                  value={pkg.coverBrand || 'REELMAN'}
                  onChange={(val) => updateField('coverBrand', val)}
                  style={getStyleFor('coverBrand', 'headline')}
                  isSelected={selectedElement?.id === 'coverBrand'}
                  onSelect={() =>
                    setSelectedElement({
                      id: 'coverBrand',
                      label: 'Brand Header',
                      role: 'headline',
                    })
                  }
                  isPrintMode={isPrintMode}
                />
              </h1>

              <p className="text-2xl sm:text-4xl md:text-5xl -mt-1 sm:-mt-3 drop-shadow-md block">
                <EditableSpan
                  id="coverSubtitle"
                  label="Cover Subtitle"
                  role="script"
                  value={pkg.coverSubtitle || 'Production'}
                  onChange={(val) => updateField('coverSubtitle', val)}
                  style={getStyleFor('coverSubtitle', 'script')}
                  isSelected={selectedElement?.id === 'coverSubtitle'}
                  onSelect={() =>
                    setSelectedElement({
                      id: 'coverSubtitle',
                      label: 'Cover Subtitle',
                      role: 'script',
                    })
                  }
                  isPrintMode={isPrintMode}
                />
              </p>

              <p className="tracking-[0.2em] sm:tracking-[0.25em] text-[10px] sm:text-xs uppercase mt-2 sm:mt-4 block opacity-90">
                <EditableSpan
                  id="clientName"
                  label="Client / Proposal"
                  role="body"
                  value={
                    pkg.clientName
                      ? `Curated for ${pkg.clientName}`
                      : 'Curated Proposal'
                  }
                  onChange={(val) =>
                    updateField('clientName', val.replace('Curated for ', ''))
                  }
                  style={getStyleFor('clientName', 'body')}
                  isSelected={selectedElement?.id === 'clientName'}
                  onSelect={() =>
                    setSelectedElement({
                      id: 'clientName',
                      label: 'Client Text',
                      role: 'body',
                    })
                  }
                  isPrintMode={isPrintMode}
                />
              </p>
            </div>

            <div className="relative z-10 text-center">
              <p
                className="tracking-[0.2em] sm:tracking-[0.25em] text-[8px] sm:text-[10px] uppercase opacity-75"
                style={getStyleFor('coverFooterText', 'body')}
              >
                <EditableSpan
                  id="coverFooterText"
                  label="Cover Footer"
                  role="body"
                  value={
                    pkg.coverFooterText ||
                    `${pkg.coverBrand || 'REELMAN'} PRODUCTION.`
                  }
                  onChange={(val) => updateField('coverFooterText', val)}
                  style={getStyleFor('coverFooterText', 'body')}
                  isSelected={selectedElement?.id === 'coverFooterText'}
                  onSelect={() =>
                    setSelectedElement({
                      id: 'coverFooterText',
                      label: 'Cover Footer',
                      role: 'body',
                    })
                  }
                  isPrintMode={isPrintMode}
                />
              </p>
            </div>
          </>
        )}

        {/* PAGE 2: STORY (Who We Are) */}
        {page.type === 'story' && (
          <>
            <div className="flex-1 flex flex-col justify-center max-w-sm sm:max-w-md mx-auto text-center space-y-4 sm:space-y-6">
              <h2 className="text-base sm:text-xl md:text-2xl tracking-[0.2em] sm:tracking-[0.28em] uppercase">
                <EditableSpan
                  id="whoWeAreTitle"
                  label="Page 2 Title"
                  role="headline"
                  value={pkg.whoWeAreTitle || 'Who we are?'}
                  onChange={(val) => updateField('whoWeAreTitle', val)}
                  style={getStyleFor('whoWeAreTitle', 'headline')}
                  isSelected={selectedElement?.id === 'whoWeAreTitle'}
                  onSelect={() =>
                    setSelectedElement({
                      id: 'whoWeAreTitle',
                      label: 'Who We Are Title',
                      role: 'headline',
                    })
                  }
                  isPrintMode={isPrintMode}
                />
              </h2>

              <div className="text-[10px] sm:text-xs md:text-sm tracking-normal sm:tracking-[0.06em] leading-relaxed sm:leading-[1.9] text-justify sm:text-center opacity-90">
                <EditableSpan
                  id="whoWeAreText"
                  label="Who We Are Story"
                  role="body"
                  value={pkg.whoWeAreText}
                  onChange={(val) => updateField('whoWeAreText', val)}
                  style={getStyleFor('whoWeAreText', 'body')}
                  isSelected={selectedElement?.id === 'whoWeAreText'}
                  onSelect={() =>
                    setSelectedElement({
                      id: 'whoWeAreText',
                      label: 'Who We Are Story',
                      role: 'body',
                    })
                  }
                  isPrintMode={isPrintMode}
                  multiline={true}
                />
              </div>
            </div>

            <div className="text-center pt-4 sm:pt-6">
              <p
                className="text-[11px] sm:text-xs tracking-widest opacity-80"
                style={getStyleFor('whoWeAreFooter', 'script', {
                  fontSize: '1.15rem',
                })}
              >
                <EditableSpan
                  id="whoWeAreFooter"
                  label="Story Footer"
                  role="script"
                  value={
                    pkg.whoWeAreFooter ||
                    `${pkg.coverBrand} ${pkg.coverSubtitle}`
                  }
                  onChange={(val) => updateField('whoWeAreFooter', val)}
                  style={getStyleFor('whoWeAreFooter', 'script', {
                    fontSize: '1.15rem',
                  })}
                  isSelected={selectedElement?.id === 'whoWeAreFooter'}
                  onSelect={() =>
                    setSelectedElement({
                      id: 'whoWeAreFooter',
                      label: 'Story Footer',
                      role: 'script',
                    })
                  }
                  isPrintMode={isPrintMode}
                />
              </p>
            </div>
          </>
        )}

        {/* PAGE 3: SCOPE */}
        {page.type === 'scope' && (
          <>
            <div className="text-right z-10">
              <h2 className="text-base sm:text-xl tracking-[0.2em] uppercase">
                <EditableSpan
                  id="pricelistTitle"
                  label="Scope Header"
                  role="headline"
                  value={pkg.pricelistTitle || 'WEDDING'}
                  onChange={(val) => updateField('pricelistTitle', val)}
                  style={getStyleFor('pricelistTitle', 'headline')}
                  isSelected={selectedElement?.id === 'pricelistTitle'}
                  onSelect={() =>
                    setSelectedElement({
                      id: 'pricelistTitle',
                      label: 'Scope Header',
                      role: 'headline',
                    })
                  }
                  isPrintMode={isPrintMode}
                />
              </h2>
              <p className="text-xl sm:text-3xl -mt-1 sm:-mt-2 mr-1 opacity-90">
                <EditableSpan
                  id="pricelistSubtitle"
                  label="Scope Subtitle"
                  role="script"
                  value={pkg.pricelistSubtitle || 'pricelist'}
                  onChange={(val) => updateField('pricelistSubtitle', val)}
                  style={getStyleFor('pricelistSubtitle', 'script')}
                  isSelected={selectedElement?.id === 'pricelistSubtitle'}
                  onSelect={() =>
                    setSelectedElement({
                      id: 'pricelistSubtitle',
                      label: 'Scope Subtitle',
                      role: 'script',
                    })
                  }
                  isPrintMode={isPrintMode}
                />
              </p>
            </div>

            <div className="z-10 my-auto space-y-3 sm:space-y-6 max-w-sm w-full">
              {pkg.events && pkg.events.length > 0
                ? pkg.events.map((evt, idx) => (
                    <div key={idx} className="space-y-1 relative group/evt">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs sm:text-sm tracking-[0.2em] uppercase font-semibold">
                          <EditableSpan
                            id={`event-${idx}`}
                            label={`Event: ${evt.name}`}
                            role="headline"
                            value={evt.name}
                            onChange={(val) => {
                              const updated = [...pkg.events];
                              updated[idx].name = val;
                              updateField('events', updated);
                            }}
                            style={getStyleFor(`event-${idx}`, 'headline')}
                            isSelected={selectedElement?.id === `event-${idx}`}
                            onSelect={() =>
                              setSelectedElement({
                                id: `event-${idx}`,
                                label: evt.name,
                                role: 'headline',
                              })
                            }
                            isPrintMode={isPrintMode}
                          />
                        </h3>

                        {!isPrintMode && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = pkg.events.filter(
                                (_, i) => i !== idx
                              );
                              updateField('events', updated);
                            }}
                            className="no-print opacity-0 group-hover/evt:opacity-100 text-gray-400 hover:text-red-500 p-0.5"
                            title="Remove event"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-0.5">
                        {evt.crew.map((member, mIdx) => (
                          <p
                            key={mIdx}
                            className="text-[10px] sm:text-xs tracking-wider opacity-85"
                          >
                            <EditableSpan
                              id={`crew-${idx}-${mIdx}`}
                              label="Crew Assigned"
                              role="body"
                              value={member}
                              onChange={(val) => {
                                const updated = [...pkg.events];
                                updated[idx].crew[mIdx] = val;
                                updateField('events', updated);
                              }}
                              style={getStyleFor(`crew-${idx}-${mIdx}`, 'body')}
                              isSelected={
                                selectedElement?.id === `crew-${idx}-${mIdx}`
                              }
                              onSelect={() =>
                                setSelectedElement({
                                  id: `crew-${idx}-${mIdx}`,
                                  label: 'Crew Member',
                                  role: 'body',
                                })
                              }
                              isPrintMode={isPrintMode}
                            />
                          </p>
                        ))}
                      </div>
                    </div>
                  ))
                : null}

              {!isPrintMode && (
                <button
                  type="button"
                  onClick={() => {
                    updateField('events', [
                      ...pkg.events,
                      {
                        name: 'NEW EVENT',
                        crew: ['One Photographer', 'One Filmmaker'],
                      },
                    ]);
                  }}
                  className="no-print text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 py-0.5 px-2 rounded border border-dashed border-blue-200 hover:bg-blue-50/50"
                >
                  <Plus className="w-3 h-3" /> Add Event
                </button>
              )}
            </div>

            <div className="text-center pt-3 sm:pt-4 z-10">
              <p
                className="text-[9px] sm:text-[10px] tracking-widest opacity-75"
                style={getStyleFor('contactWebP3', 'body')}
              >
                <EditableSpan
                  id="contactWebP3"
                  label="Website Footer"
                  role="body"
                  value={pkg.contactWebsite}
                  onChange={(val) => updateField('contactWebsite', val)}
                  style={getStyleFor('contactWebP3', 'body')}
                  isSelected={selectedElement?.id === 'contactWebP3'}
                  onSelect={() =>
                    setSelectedElement({
                      id: 'contactWebP3',
                      label: 'Website Footer',
                      role: 'body',
                    })
                  }
                  isPrintMode={isPrintMode}
                />
              </p>
            </div>
          </>
        )}

        {/* PAGE 4: DELIVERABLES */}
        {page.type === 'deliverables' && (
          <>
            <div className="space-y-4 sm:space-y-6 z-10">
              <h2 className="text-base sm:text-xl tracking-[0.25em] uppercase">
                <EditableSpan
                  id="deliverablesTitle"
                  label="Deliverables Title"
                  role="headline"
                  value={pkg.deliverablesTitle || 'DELIVERABLES'}
                  onChange={(val) => updateField('deliverablesTitle', val)}
                  style={getStyleFor('deliverablesTitle', 'headline')}
                  isSelected={selectedElement?.id === 'deliverablesTitle'}
                  onSelect={() =>
                    setSelectedElement({
                      id: 'deliverablesTitle',
                      label: 'Deliverables Title',
                      role: 'headline',
                    })
                  }
                  isPrintMode={isPrintMode}
                />
              </h2>

              <ul className="space-y-1.5 sm:space-y-2.5 pt-1">
                {pkg.deliverables.map((item, idx) => (
                  <li
                    key={idx}
                    className="text-[10px] sm:text-xs sm:text-sm tracking-wider flex items-center justify-between group/deliv opacity-90"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                      <EditableSpan
                        id={`deliv-${idx}`}
                        label="Deliverable Item"
                        role="body"
                        value={item}
                        onChange={(val) => {
                          const updated = [...pkg.deliverables];
                          updated[idx] = val;
                          updateField('deliverables', updated);
                        }}
                        style={getStyleFor(`deliv-${idx}`, 'body')}
                        isSelected={selectedElement?.id === `deliv-${idx}`}
                        onSelect={() =>
                          setSelectedElement({
                            id: `deliv-${idx}`,
                            label: 'Deliverable',
                            role: 'body',
                          })
                        }
                        isPrintMode={isPrintMode}
                      />
                    </div>

                    {!isPrintMode && (
                      <button
                        type="button"
                        onClick={() => {
                          updateField(
                            'deliverables',
                            pkg.deliverables.filter((_, i) => i !== idx)
                          );
                        }}
                        className="no-print opacity-0 group-hover/deliv:opacity-100 text-gray-400 hover:text-red-500 p-0.5"
                        title="Delete item"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>

              {!isPrintMode && (
                <button
                  type="button"
                  onClick={() => {
                    updateField('deliverables', [
                      ...pkg.deliverables,
                      'New Deliverable Item',
                    ]);
                  }}
                  className="no-print text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 py-0.5 px-2 rounded border border-dashed border-blue-200 hover:bg-blue-50/50"
                >
                  <Plus className="w-3 h-3" /> Add Item
                </button>
              )}
            </div>

            <div className="space-y-2 sm:space-y-3 z-10 pt-4 sm:pt-6">
              <div className="space-y-0.5">
                <p className="text-sm sm:text-base tracking-wider font-semibold">
                  <EditableSpan
                    id="totalAmountLabel"
                    label="Price Label"
                    role="headline"
                    value={pkg.totalAmountLabel || 'Total Amount :'}
                    onChange={(val) => updateField('totalAmountLabel', val)}
                    style={getStyleFor('totalAmountLabel', 'headline')}
                    isSelected={selectedElement?.id === 'totalAmountLabel'}
                    onSelect={() =>
                      setSelectedElement({
                        id: 'totalAmountLabel',
                        label: 'Price Label',
                        role: 'headline',
                      })
                    }
                    isPrintMode={isPrintMode}
                  />{' '}
                  <EditableSpan
                    id="totalAmount"
                    label="Total Amount"
                    role="headline"
                    value={pkg.totalAmount}
                    onChange={(val) => updateField('totalAmount', val)}
                    style={getStyleFor('totalAmount', 'headline', {
                      fontWeight: '700',
                    })}
                    isSelected={selectedElement?.id === 'totalAmount'}
                    onSelect={() =>
                      setSelectedElement({
                        id: 'totalAmount',
                        label: 'Total Amount',
                        role: 'headline',
                      })
                    }
                    isPrintMode={isPrintMode}
                  />
                </p>
                {pkg.amountNote && (
                  <p className="text-[9px] sm:text-[11px] tracking-wider italic opacity-80">
                    <EditableSpan
                      id="amountNote"
                      label="Amount Note"
                      role="body"
                      value={pkg.amountNote}
                      onChange={(val) => updateField('amountNote', val)}
                      style={getStyleFor('amountNote', 'body')}
                      isSelected={selectedElement?.id === 'amountNote'}
                      onSelect={() =>
                        setSelectedElement({
                          id: 'amountNote',
                          label: 'Amount Note',
                          role: 'body',
                        })
                      }
                      isPrintMode={isPrintMode}
                    />
                  </p>
                )}
              </div>

              <div className="text-center pt-2">
                <p
                  className="text-[9px] sm:text-[10px] tracking-widest opacity-75"
                  style={getStyleFor('contactWebP4', 'body')}
                >
                  {pkg.contactWebsite}
                </p>
              </div>
            </div>
          </>
        )}

        {/* PAGE 5: TERMS */}
        {page.type === 'terms' && (
          <>
            <div className="space-y-3 sm:space-y-4 z-10">
              <h2 className="text-base sm:text-xl tracking-[0.2em] text-center uppercase mb-2 sm:mb-4">
                <EditableSpan
                  id="termsTitle"
                  label="Terms Title"
                  role="headline"
                  value={pkg.termsTitle || 'Terms and Conditions'}
                  onChange={(val) => updateField('termsTitle', val)}
                  style={getStyleFor('termsTitle', 'headline')}
                  isSelected={selectedElement?.id === 'termsTitle'}
                  onSelect={() =>
                    setSelectedElement({
                      id: 'termsTitle',
                      label: 'Terms Title',
                      role: 'headline',
                    })
                  }
                  isPrintMode={isPrintMode}
                />
              </h2>

              <div className="space-y-2 sm:space-y-3 max-w-md mx-auto">
                {pkg.terms.map((t, idx) => (
                  <div key={idx} className="space-y-0.5 relative group/term">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] sm:text-xs tracking-wider uppercase font-semibold">
                        •{' '}
                        <EditableSpan
                          id={`term-title-${idx}`}
                          label="Term Title"
                          role="body"
                          value={t.title}
                          onChange={(val) => {
                            const updated = [...pkg.terms];
                            updated[idx].title = val;
                            updateField('terms', updated);
                          }}
                          style={getStyleFor(`term-title-${idx}`, 'body', {
                            fontWeight: '600',
                          })}
                          isSelected={
                            selectedElement?.id === `term-title-${idx}`
                          }
                          onSelect={() =>
                            setSelectedElement({
                              id: `term-title-${idx}`,
                              label: t.title,
                              role: 'body',
                            })
                          }
                          isPrintMode={isPrintMode}
                        />
                      </h3>

                      {!isPrintMode && (
                        <button
                          type="button"
                          onClick={() => {
                            updateField(
                              'terms',
                              pkg.terms.filter((_, i) => i !== idx)
                            );
                          }}
                          className="no-print opacity-0 group-hover/term:opacity-100 text-gray-400 hover:text-red-500 p-0.5"
                          title="Delete term"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <p className="text-[9px] sm:text-[11px] leading-relaxed opacity-85">
                      <EditableSpan
                        id={`term-desc-${idx}`}
                        label="Term Description"
                        role="body"
                        value={t.description}
                        onChange={(val) => {
                          const updated = [...pkg.terms];
                          updated[idx].description = val;
                          updateField('terms', updated);
                        }}
                        style={getStyleFor(`term-desc-${idx}`, 'body')}
                        isSelected={selectedElement?.id === `term-desc-${idx}`}
                        onSelect={() =>
                          setSelectedElement({
                            id: `term-desc-${idx}`,
                            label: 'Term Detail',
                            role: 'body',
                          })
                        }
                        isPrintMode={isPrintMode}
                        multiline={true}
                      />
                    </p>
                  </div>
                ))}

                {!isPrintMode && (
                  <button
                    type="button"
                    onClick={() => {
                      updateField('terms', [
                        ...pkg.terms,
                        {
                          title: 'New Condition',
                          description: 'Enter condition terms here.',
                        },
                      ]);
                    }}
                    className="no-print text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 py-0.5 px-2 rounded border border-dashed border-blue-200 hover:bg-blue-50/50 mx-auto"
                  >
                    <Plus className="w-3 h-3" /> Add Condition
                  </button>
                )}
              </div>
            </div>

            <div className="text-center pt-3 sm:pt-4 z-10">
              <p
                className="text-[11px] sm:text-xs tracking-widest opacity-80"
                style={getStyleFor('p5Script', 'script', {
                  fontSize: '1.15rem',
                })}
              >
                {pkg.coverBrand} {pkg.coverSubtitle}
              </p>
            </div>
          </>
        )}

        {/* PAGE 6: DELIVERY TIMELINES */}
        {page.type === 'delivery' && (
          <>
            <div className="space-y-3 sm:space-y-4 z-10 max-w-md mx-auto w-full">
              <h2 className="text-base sm:text-xl tracking-[0.2em] text-center uppercase mb-2 sm:mb-4">
                <EditableSpan
                  id="deliveriesTitle"
                  label="Delivery Header"
                  role="headline"
                  value={pkg.deliveriesTitle || 'Delivery Timelines'}
                  onChange={(val) => updateField('deliveriesTitle', val)}
                  style={getStyleFor('deliveriesTitle', 'headline')}
                  isSelected={selectedElement?.id === 'deliveriesTitle'}
                  onSelect={() =>
                    setSelectedElement({
                      id: 'deliveriesTitle',
                      label: 'Delivery Header',
                      role: 'headline',
                    })
                  }
                  isPrintMode={isPrintMode}
                />
              </h2>

              {pkg.deliveries.map((deliv, idx) => (
                <div key={idx} className="space-y-0.5 relative group/del">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] sm:text-xs tracking-wider uppercase font-semibold">
                      •{' '}
                      <EditableSpan
                        id={`deliv-title-${idx}`}
                        label="Timeline Title"
                        role="body"
                        value={deliv.title}
                        onChange={(val) => {
                          const updated = [...pkg.deliveries];
                          updated[idx].title = val;
                          updateField('deliveries', updated);
                        }}
                        style={getStyleFor(`deliv-title-${idx}`, 'body', {
                          fontWeight: '600',
                        })}
                        isSelected={
                          selectedElement?.id === `deliv-title-${idx}`
                        }
                        onSelect={() =>
                          setSelectedElement({
                            id: `deliv-title-${idx}`,
                            label: deliv.title,
                            role: 'body',
                          })
                        }
                        isPrintMode={isPrintMode}
                      />
                    </h3>

                    {!isPrintMode && (
                      <button
                        type="button"
                        onClick={() => {
                          updateField(
                            'deliveries',
                            pkg.deliveries.filter((_, i) => i !== idx)
                          );
                        }}
                        className="no-print opacity-0 group-hover/del:opacity-100 text-gray-400 hover:text-red-500 p-0.5"
                        title="Delete milestone"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <p className="text-[9px] sm:text-[11px] leading-relaxed opacity-85 whitespace-pre-line">
                    <EditableSpan
                      id={`deliv-desc-${idx}`}
                      label="Timeline Description"
                      role="body"
                      value={deliv.description}
                      onChange={(val) => {
                        const updated = [...pkg.deliveries];
                        updated[idx].description = val;
                        updateField('deliveries', updated);
                      }}
                      style={getStyleFor(`deliv-desc-${idx}`, 'body')}
                      isSelected={selectedElement?.id === `deliv-desc-${idx}`}
                      onSelect={() =>
                        setSelectedElement({
                          id: `deliv-desc-${idx}`,
                          label: 'Timeline Text',
                          role: 'body',
                        })
                      }
                      isPrintMode={isPrintMode}
                      multiline={true}
                    />
                  </p>
                </div>
              ))}

              {!isPrintMode && (
                <button
                  type="button"
                  onClick={() => {
                    updateField('deliveries', [
                      ...pkg.deliveries,
                      {
                        title: 'New Delivery Milestone',
                        description: 'Timeline details go here.',
                      },
                    ]);
                  }}
                  className="no-print text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 py-0.5 px-2 rounded border border-dashed border-blue-200 hover:bg-blue-50/50 mx-auto"
                >
                  <Plus className="w-3 h-3" /> Add Milestone
                </button>
              )}
            </div>

            <div className="text-center pt-3 sm:pt-4 z-10">
              <p
                className="text-[11px] sm:text-xs tracking-widest opacity-80"
                style={getStyleFor('p6Script', 'script', {
                  fontSize: '1.15rem',
                })}
              >
                {pkg.coverBrand} {pkg.coverSubtitle}
              </p>
            </div>
          </>
        )}

        {/* PAGE 7: POLICIES */}
        {page.type === 'policies' && (
          <>
            <div className="space-y-3 sm:space-y-4 z-10">
              <h2 className="text-base sm:text-xl tracking-[0.2em] text-center uppercase mb-2 sm:mb-4">
                <EditableSpan
                  id="policiesTitle"
                  label="Policy Header"
                  role="headline"
                  value={pkg.policiesTitle || 'Additional Requests'}
                  onChange={(val) => updateField('policiesTitle', val)}
                  style={getStyleFor('policiesTitle', 'headline')}
                  isSelected={selectedElement?.id === 'policiesTitle'}
                  onSelect={() =>
                    setSelectedElement({
                      id: 'policiesTitle',
                      label: 'Policy Header',
                      role: 'headline',
                    })
                  }
                  isPrintMode={isPrintMode}
                />
              </h2>

              <div className="space-y-1.5 sm:space-y-2.5 max-w-md mx-auto">
                {pkg.policies.map((policy, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-1.5 group/pol"
                  >
                    <div className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-current mt-1 shrink-0" />
                      <p className="text-[9px] sm:text-[11px] leading-relaxed opacity-85">
                        <EditableSpan
                          id={`policy-${idx}`}
                          label="Policy Point"
                          role="body"
                          value={policy}
                          onChange={(val) => {
                            const updated = [...pkg.policies];
                            updated[idx] = val;
                            updateField('policies', updated);
                          }}
                          style={getStyleFor(`policy-${idx}`, 'body')}
                          isSelected={selectedElement?.id === `policy-${idx}`}
                          onSelect={() =>
                            setSelectedElement({
                              id: `policy-${idx}`,
                              label: 'Policy Point',
                              role: 'body',
                            })
                          }
                          isPrintMode={isPrintMode}
                          multiline={true}
                        />
                      </p>
                    </div>

                    {!isPrintMode && (
                      <button
                        type="button"
                        onClick={() => {
                          updateField(
                            'policies',
                            pkg.policies.filter((_, i) => i !== idx)
                          );
                        }}
                        className="no-print opacity-0 group-hover/pol:opacity-100 text-gray-400 hover:text-red-500 p-0.5 shrink-0"
                        title="Delete point"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}

                {!isPrintMode && (
                  <button
                    type="button"
                    onClick={() => {
                      updateField('policies', [
                        ...pkg.policies,
                        'New policy or request point.',
                      ]);
                    }}
                    className="no-print text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 py-0.5 px-2 rounded border border-dashed border-blue-200 hover:bg-blue-50/50 mx-auto"
                  >
                    <Plus className="w-3 h-3" /> Add Request
                  </button>
                )}
              </div>
            </div>

            <div className="text-center pt-3 sm:pt-4 z-10">
              <p
                className="text-[11px] sm:text-xs tracking-widest opacity-80"
                style={getStyleFor('p7Script', 'script', {
                  fontSize: '1.15rem',
                })}
              >
                {pkg.coverBrand} {pkg.coverSubtitle}
              </p>
            </div>
          </>
        )}

        {/* PAGE 8: CONTACT */}
        {page.type === 'contact' && (
          <>
            <div />

            <div className="space-y-3 my-auto text-center">
              <h2 className="text-base sm:text-xl md:text-2xl tracking-[0.25em] uppercase mb-2 sm:mb-3">
                <EditableSpan
                  id="getInTouchTitle"
                  label="Contact Header"
                  role="headline"
                  value={pkg.getInTouchTitle || 'Get in Touch'}
                  onChange={(val) => updateField('getInTouchTitle', val)}
                  style={getStyleFor('getInTouchTitle', 'headline')}
                  isSelected={selectedElement?.id === 'getInTouchTitle'}
                  onSelect={() =>
                    setSelectedElement({
                      id: 'getInTouchTitle',
                      label: 'Contact Header',
                      role: 'headline',
                    })
                  }
                  isPrintMode={isPrintMode}
                />
              </h2>
              <p className="text-[10px] sm:text-xs tracking-widest opacity-90">
                <EditableSpan
                  id="contactWebP8"
                  label="Website URL"
                  role="body"
                  value={pkg.contactWebsite}
                  onChange={(val) => updateField('contactWebsite', val)}
                  style={getStyleFor('contactWebP8', 'body')}
                  isSelected={selectedElement?.id === 'contactWebP8'}
                  onSelect={() =>
                    setSelectedElement({
                      id: 'contactWebP8',
                      label: 'Website URL',
                      role: 'body',
                    })
                  }
                  isPrintMode={isPrintMode}
                />
              </p>
              <p className="text-[10px] sm:text-xs tracking-widest opacity-90">
                <EditableSpan
                  id="contactPhones"
                  label="Phone Numbers"
                  role="body"
                  value={pkg.contactPhones.join(' , ')}
                  onChange={(val) =>
                    updateField(
                      'contactPhones',
                      val
                        .split(',')
                        .map((p) => p.trim())
                        .filter(Boolean)
                    )
                  }
                  style={getStyleFor('contactPhones', 'body')}
                  isSelected={selectedElement?.id === 'contactPhones'}
                  onSelect={() =>
                    setSelectedElement({
                      id: 'contactPhones',
                      label: 'Phone Numbers',
                      role: 'body',
                    })
                  }
                  isPrintMode={isPrintMode}
                />
              </p>
            </div>

            <div className="pt-4 sm:pt-6 text-center">
              <p
                className="text-[8px] sm:text-[10px] tracking-[0.25em] uppercase opacity-70"
                style={getStyleFor('tagline', 'body')}
              >
                <EditableSpan
                  id="tagline"
                  label="Tagline"
                  role="body"
                  value={pkg.tagline}
                  onChange={(val) => updateField('tagline', val)}
                  style={getStyleFor('tagline', 'body')}
                  isSelected={selectedElement?.id === 'tagline'}
                  onSelect={() =>
                    setSelectedElement({
                      id: 'tagline',
                      label: 'Tagline',
                      role: 'body',
                    })
                  }
                  isPrintMode={isPrintMode}
                />
              </p>
            </div>
          </>
        )}

        {/* CUSTOM USER-ADDED PAGE */}
        {page.type === 'custom' && (
          <>
            <div className="flex-1 flex flex-col justify-center max-w-sm sm:max-w-md mx-auto text-center space-y-4 my-auto">
              <h2 className="text-base sm:text-xl md:text-2xl tracking-[0.2em] uppercase font-semibold">
                <EditableSpan
                  id={`custom-title-${page.id}`}
                  label="Custom Page Title"
                  role="headline"
                  value={page.title || 'PAGE TITLE'}
                  onChange={(val) =>
                    handleUpdateCustomPage(page.id, { title: val })
                  }
                  style={getStyleFor(`custom-title-${page.id}`, 'headline')}
                  isSelected={selectedElement?.id === `custom-title-${page.id}`}
                  onSelect={() =>
                    setSelectedElement({
                      id: `custom-title-${page.id}`,
                      label: 'Title',
                      role: 'headline',
                    })
                  }
                  isPrintMode={isPrintMode}
                />
              </h2>

              <p className="text-lg sm:text-2xl -mt-1 block opacity-90">
                <EditableSpan
                  id={`custom-sub-${page.id}`}
                  label="Custom Subtitle"
                  role="script"
                  value={page.subtitle || 'Custom Subtitle'}
                  onChange={(val) =>
                    handleUpdateCustomPage(page.id, { subtitle: val })
                  }
                  style={getStyleFor(`custom-sub-${page.id}`, 'script')}
                  isSelected={selectedElement?.id === `custom-sub-${page.id}`}
                  onSelect={() =>
                    setSelectedElement({
                      id: `custom-sub-${page.id}`,
                      label: 'Subtitle',
                      role: 'script',
                    })
                  }
                  isPrintMode={isPrintMode}
                />
              </p>

              <div className="text-[10px] sm:text-xs md:text-sm tracking-normal leading-relaxed opacity-90 text-justify sm:text-center pt-2">
                <EditableSpan
                  id={`custom-content-${page.id}`}
                  label="Custom Content"
                  role="body"
                  value={
                    page.content ||
                    'Click here to edit this custom page content. You can write your itinerary, story, or special details.'
                  }
                  onChange={(val) =>
                    handleUpdateCustomPage(page.id, { content: val })
                  }
                  style={getStyleFor(`custom-content-${page.id}`, 'body')}
                  isSelected={
                    selectedElement?.id === `custom-content-${page.id}`
                  }
                  onSelect={() =>
                    setSelectedElement({
                      id: `custom-content-${page.id}`,
                      label: 'Content',
                      role: 'body',
                    })
                  }
                  isPrintMode={isPrintMode}
                  multiline={true}
                />
              </div>
            </div>

            <div className="text-center pt-4 sm:pt-6">
              <p
                className="text-[10px] tracking-widest uppercase opacity-70"
                style={getStyleFor('customFooter', 'body')}
              >
                {pkg.coverBrand} {pkg.coverSubtitle}
              </p>
            </div>
          </>
        )}
      </div>
    );
  };

  if (isPrintMode) {
    return (
      <div className="print-only-container">
        {pagesList.map((page, idx) => renderPageContent(page, idx))}
      </div>
    );
  }

  return (
    <div className="space-y-3 flex flex-col items-center w-full">
      {/* Canva Floating Format Bar */}
      {selectedElement && (
        <div className="sticky top-2 z-40 w-full flex justify-center px-1">
          <CanvaFontToolbar
            selectedElementId={selectedElement.id}
            selectedLabel={selectedElement.label}
            role={selectedElement.role}
            currentStyle={activeStyleConfig}
            onStyleChange={handleToolbarStyleChange}
            onDeselect={() => setSelectedElement(null)}
          />
        </div>
      )}

      {/* Preview mode (single page or all) */}
      {activePageIndex !== undefined && pagesList[activePageIndex] ? (
        <div className="w-full flex flex-col items-center gap-3">
          {renderPageContent(pagesList[activePageIndex], activePageIndex)}

          {/* Quick Add Page Button below current page */}
          <button
            type="button"
            onClick={handleAddPage}
            className="no-print py-1.5 px-3 bg-white hover:bg-gray-50 border border-dashed border-gray-300 rounded-xl text-xs font-medium text-gray-700 hover:text-blue-600 hover:border-blue-300 flex items-center gap-1.5 shadow-2xs transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>Add New Page</span>
          </button>
        </div>
      ) : (
        <div className="space-y-5 sm:space-y-6 flex flex-col items-center w-full">
          {pagesList.map((p, idx) => (
            <div key={p.id} className="w-full">
              {renderPageContent(p, idx)}
            </div>
          ))}

          {/* Add Page Button at the bottom of all pages */}
          <button
            type="button"
            onClick={handleAddPage}
            className="no-print py-2 px-4 bg-white hover:bg-gray-50 border border-dashed border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:text-blue-600 hover:border-blue-300 flex items-center gap-2 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            <span>Add New Page</span>
          </button>
        </div>
      )}
    </div>
  );
}
