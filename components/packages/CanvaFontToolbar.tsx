'use client';
import React, { useState } from 'react';
import {
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
  X,
  SlidersHorizontal,
  MoveHorizontal,
  MoveVertical,
} from 'lucide-react';
import { ALL_FONTS, FONT_WEIGHTS, FONT_SIZES, LUXURY_COLORS } from '@/lib/fonts';
import { TextStyleConfig } from '@/types';

interface CanvaFontToolbarProps {
  selectedElementId: string | null;
  selectedLabel: string;
  currentStyle: TextStyleConfig;
  onStyleChange: (updatedStyle: TextStyleConfig, applyGlobally?: boolean) => void;
  onDeselect: () => void;
  role?: 'headline' | 'script' | 'body';
}

export function CanvaFontToolbar({
  selectedElementId,
  selectedLabel,
  currentStyle,
  onStyleChange,
  onDeselect,
  role = 'headline',
}: CanvaFontToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showSpacingMenu, setShowSpacingMenu] = useState(false);

  const isBold =
    currentStyle.fontWeight === '700' ||
    currentStyle.fontWeight === '800' ||
    currentStyle.fontWeight === 'bold';
  const isItalic = currentStyle.fontStyle === 'italic';
  const isUppercase = currentStyle.textTransform === 'uppercase';

  const toggleBold = () => {
    onStyleChange({
      ...currentStyle,
      fontWeight: isBold ? '400' : '700',
    });
  };

  const toggleItalic = () => {
    onStyleChange({
      ...currentStyle,
      fontStyle: isItalic ? 'normal' : 'italic',
    });
  };

  const toggleUppercase = () => {
    onStyleChange({
      ...currentStyle,
      textTransform: isUppercase ? 'none' : 'uppercase',
    });
  };

  const setTextAlign = (align: 'left' | 'center' | 'right') => {
    onStyleChange({
      ...currentStyle,
      textAlign: align,
    });
  };

  const setFontFamily = (family: string) => {
    onStyleChange({
      ...currentStyle,
      fontFamily: family,
    });
    setShowFontMenu(false);
  };

  const setFontWeight = (weight: string) => {
    onStyleChange({
      ...currentStyle,
      fontWeight: weight,
    });
  };

  const setColor = (hex: string) => {
    onStyleChange({
      ...currentStyle,
      color: hex,
    });
  };

  return (
    <div className="no-print w-full max-w-[520px] bg-white/95 backdrop-blur-md border border-gray-200 shadow-xl rounded-xl p-1.5 transition-all animate-in fade-in slide-in-from-top-1 duration-150 text-gray-800">
      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 py-0.5">
        {/* 1. Font Family Dropdown */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowFontMenu(!showFontMenu)}
            className="h-7 sm:h-8 px-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-medium flex items-center gap-1 text-gray-800 min-w-[110px] sm:min-w-[130px] justify-between transition-colors"
            style={{ fontFamily: currentStyle.fontFamily || 'inherit' }}
          >
            <span className="truncate">{currentStyle.fontFamily || 'Font'}</span>
            <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
          </button>

          {showFontMenu && (
            <div className="absolute top-9 left-0 z-50 w-60 max-h-64 overflow-y-auto bg-white rounded-xl shadow-2xl border border-gray-200 p-1 space-y-0.5">
              {ALL_FONTS.map((font) => (
                <button
                  key={font.family}
                  type="button"
                  onClick={() => setFontFamily(font.family)}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    currentStyle.fontFamily === font.family
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'hover:bg-gray-50 text-gray-800'
                  }`}
                  style={{ fontFamily: font.family }}
                >
                  <span className="truncate">{font.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. Font Weight */}
        <select
          value={currentStyle.fontWeight || '400'}
          onChange={(e) => setFontWeight(e.target.value)}
          className="h-7 sm:h-8 px-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[11px] font-medium text-gray-800 cursor-pointer focus:outline-none shrink-0"
        >
          {FONT_WEIGHTS.map((w) => (
            <option key={w.value} value={w.value}>
              {w.value}
            </option>
          ))}
        </select>

        {/* 3. Font Size Stepper (- / +) */}
        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg h-7 sm:h-8 px-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              const current = currentStyle.fontSize || 16;
              onStyleChange({ ...currentStyle, fontSize: Math.max(8, current - 2) });
            }}
            className="w-5 h-5 flex items-center justify-center rounded text-gray-600 hover:bg-white font-bold text-xs"
            title="Decrease Size"
          >
            -
          </button>
          <select
            value={currentStyle.fontSize || ''}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (val) onStyleChange({ ...currentStyle, fontSize: val });
            }}
            className="h-5 px-0.5 bg-transparent text-[11px] font-semibold text-gray-800 text-center cursor-pointer focus:outline-none"
          >
            <option value="">{currentStyle.fontSize ? `${currentStyle.fontSize}` : 'Size'}</option>
            {FONT_SIZES.map((sz) => (
              <option key={sz} value={sz}>
                {sz}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              const current = currentStyle.fontSize || 16;
              onStyleChange({ ...currentStyle, fontSize: Math.min(72, current + 2) });
            }}
            className="w-5 h-5 flex items-center justify-center rounded text-gray-600 hover:bg-white font-bold text-xs"
            title="Increase Size"
          >
            +
          </button>
        </div>

        {/* 4. Bold (B) */}
        <button
          type="button"
          onClick={toggleBold}
          className={`h-7 sm:h-8 w-7 sm:w-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
            isBold
              ? 'bg-blue-600 text-white font-bold'
              : 'bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700'
          }`}
          title="Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        {/* 5. Italic (I) */}
        <button
          type="button"
          onClick={toggleItalic}
          className={`h-7 sm:h-8 w-7 sm:w-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
            isItalic
              ? 'bg-blue-600 text-white italic font-semibold'
              : 'bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700'
          }`}
          title="Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        {/* 6. Uppercase (aA) */}
        <button
          type="button"
          onClick={toggleUppercase}
          className={`h-7 sm:h-8 px-1.5 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 transition-all ${
            isUppercase
              ? 'bg-blue-600 text-white'
              : 'bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700'
          }`}
          title="Uppercase"
        >
          aA
        </button>

        {/* 7. Color */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="h-7 sm:h-8 px-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg flex items-center gap-1"
            title="Color"
          >
            <div
              className="w-3.5 h-3.5 rounded-full border border-gray-300 shadow-inner"
              style={{ backgroundColor: currentStyle.color || '#2b2725' }}
            />
          </button>

          {showColorPicker && (
            <div className="absolute top-9 left-0 z-50 p-2 bg-white rounded-xl shadow-2xl border border-gray-200 w-48 space-y-1.5">
              <div className="grid grid-cols-4 gap-1">
                {LUXURY_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => {
                      setColor(c.value);
                      setShowColorPicker(false);
                    }}
                    className="w-7 h-7 rounded-full border border-gray-300 relative flex items-center justify-center"
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
              <input
                type="color"
                value={currentStyle.color || '#2b2725'}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-6 rounded cursor-pointer border border-gray-200 p-0.5"
              />
            </div>
          )}
        </div>

        {/* 8. Align */}
        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setTextAlign('left')}
            className={`p-1 rounded text-gray-600 ${currentStyle.textAlign === 'left' ? 'bg-white shadow-xs text-blue-600' : ''}`}
            title="Align Left"
          >
            <AlignLeft className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => setTextAlign('center')}
            className={`p-1 rounded text-gray-600 ${currentStyle.textAlign === 'center' ? 'bg-white shadow-xs text-blue-600' : ''}`}
            title="Align Center"
          >
            <AlignCenter className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => setTextAlign('right')}
            className={`p-1 rounded text-gray-600 ${currentStyle.textAlign === 'right' ? 'bg-white shadow-xs text-blue-600' : ''}`}
            title="Align Right"
          >
            <AlignRight className="w-3 h-3" />
          </button>
        </div>

        {/* 9. Spacing (Letter spacing & Line height) */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowSpacingMenu(!showSpacingMenu)}
            className="h-7 sm:h-8 px-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg flex items-center gap-1"
            title="Letter Spacing & Line Height"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-600" />
          </button>

          {showSpacingMenu && (
            <div className="absolute top-9 right-0 z-50 p-2.5 bg-white rounded-xl shadow-2xl border border-gray-200 w-52 space-y-2 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-gray-500 uppercase">Letter Spacing</span>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { label: 'Tight', val: '-0.02em' },
                    { label: 'Norm', val: 'normal' },
                    { label: 'Wide', val: '0.15em' },
                    { label: 'Ultra', val: '0.35em' },
                  ].map((sp) => (
                    <button
                      key={sp.val}
                      type="button"
                      onClick={() => onStyleChange({ ...currentStyle, letterSpacing: sp.val })}
                      className={`h-5 text-[10px] rounded border ${
                        currentStyle.letterSpacing === sp.val ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      {sp.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1 pt-1.5 border-t border-gray-100">
                <span className="text-[10px] font-semibold text-gray-500 uppercase">Line Height</span>
                <div className="grid grid-cols-4 gap-1">
                  {['1.0', '1.3', '1.6', '2.0'].map((lh) => (
                    <button
                      key={lh}
                      type="button"
                      onClick={() => onStyleChange({ ...currentStyle, lineHeight: lh })}
                      className={`h-5 text-[10px] rounded border ${
                        currentStyle.lineHeight === lh ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      {lh}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={onDeselect}
          className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-700 ml-auto shrink-0"
          title="Done"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
