import React, { useState } from 'react';
import { useTemplateStore } from '@/stores/templateStore';

const QuoteFormatSection: React.FC = () => {
  const { quoteFormat, updateQuoteFormat, resetQuoteFormat } = useTemplateStore();
  const [logoPreview, setLogoPreview] = useState<string | null>(quoteFormat.header.logoUrl || null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Logo file size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        updateQuoteFormat({
          header: { ...quoteFormat.header, logoUrl: result },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    updateQuoteFormat({
      header: { ...quoteFormat.header, logoUrl: undefined },
    });
  };

  const fontFamilies = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana'];

  return (
    <div className="space-y-6">
      {/* Header Settings */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Header Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
            {logoPreview ? (
              <div className="flex items-center gap-4">
                <img src={logoPreview} alt="Logo" className="h-20 w-auto object-contain" />
                <button
                  onClick={handleRemoveLogo}
                  className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50"
                >
                  Remove Logo
                </button>
              </div>
            ) : (
              <div>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg
                      className="w-10 h-10 mb-3 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG or GIF (MAX. 5MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoUpload}
                  />
                </label>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
            <input
              type="text"
              value={quoteFormat.header.companyName}
              onChange={(e) =>
                updateQuoteFormat({
                  header: { ...quoteFormat.header, companyName: e.target.value },
                })
              }
              placeholder="Enter company name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tagline (Optional)</label>
            <input
              type="text"
              value={quoteFormat.header.tagline || ''}
              onChange={(e) =>
                updateQuoteFormat({
                  header: { ...quoteFormat.header, tagline: e.target.value },
                })
              }
              placeholder="Enter tagline or subtitle"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Header Alignment</label>
            <div className="flex gap-4">
              {(['left', 'center', 'right'] as const).map((alignment) => (
                <label key={alignment} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="headerAlignment"
                    value={alignment}
                    checked={quoteFormat.header.alignment === alignment}
                    onChange={() =>
                      updateQuoteFormat({
                        header: { ...quoteFormat.header, alignment },
                      })
                    }
                    className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-400"
                  />
                  <span className="text-sm text-gray-700 capitalize">{alignment}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Settings */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Footer Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-3 mb-2">
              <input
                type="checkbox"
                checked={quoteFormat.footer.visible}
                onChange={(e) =>
                  updateQuoteFormat({
                    footer: { ...quoteFormat.footer, visible: e.target.checked },
                  })
                }
                className="w-5 h-5 text-gray-900 border-gray-300 rounded focus:ring-gray-400"
              />
              <span className="text-sm font-medium text-gray-700">Show footer</span>
            </label>
          </div>
          {quoteFormat.footer.visible && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Footer Content</label>
                <textarea
                  value={quoteFormat.footer.content}
                  onChange={(e) =>
                    updateQuoteFormat({
                      footer: { ...quoteFormat.footer, content: e.target.value },
                    })
                  }
                  placeholder="Enter footer text (e.g., terms, contact info)"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Footer Alignment</label>
                <div className="flex gap-4">
                  {(['left', 'center', 'right'] as const).map((alignment) => (
                    <label key={alignment} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="footerAlignment"
                        value={alignment}
                        checked={quoteFormat.footer.alignment === alignment}
                        onChange={() =>
                          updateQuoteFormat({
                            footer: { ...quoteFormat.footer, alignment },
                          })
                        }
                        className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-400"
                      />
                      <span className="text-sm text-gray-700 capitalize">{alignment}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Color Scheme */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Color Scheme</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['primary', 'secondary', 'accent'] as const).map((colorKey) => (
            <div key={colorKey}>
              <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                {colorKey} Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={quoteFormat.colors[colorKey]}
                  onChange={(e) =>
                    updateQuoteFormat({
                      colors: { ...quoteFormat.colors, [colorKey]: e.target.value },
                    })
                  }
                  className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={quoteFormat.colors[colorKey]}
                  onChange={(e) =>
                    updateQuoteFormat({
                      colors: { ...quoteFormat.colors, [colorKey]: e.target.value },
                    })
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Typography */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Typography</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
            <select
              value={quoteFormat.typography.fontFamily}
              onChange={(e) =>
                updateQuoteFormat({
                  typography: { ...quoteFormat.typography, fontFamily: e.target.value },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              {fontFamilies.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heading Size ({quoteFormat.typography.headingSize}px)
              </label>
              <input
                type="range"
                min="12"
                max="32"
                value={quoteFormat.typography.headingSize}
                onChange={(e) =>
                  updateQuoteFormat({
                    typography: {
                      ...quoteFormat.typography,
                      headingSize: parseInt(e.target.value),
                    },
                  })
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Body Size ({quoteFormat.typography.bodySize}px)
              </label>
              <input
                type="range"
                min="8"
                max="20"
                value={quoteFormat.typography.bodySize}
                onChange={(e) =>
                  updateQuoteFormat({
                    typography: {
                      ...quoteFormat.typography,
                      bodySize: parseInt(e.target.value),
                    },
                  })
                }
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Page Settings */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Page Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Page Orientation</label>
            <div className="flex gap-4">
              {(['portrait', 'landscape'] as const).map((orientation) => (
                <label key={orientation} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="orientation"
                    value={orientation}
                    checked={quoteFormat.page.orientation === orientation}
                    onChange={() =>
                      updateQuoteFormat({
                        page: { ...quoteFormat.page, orientation },
                      })
                    }
                    className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-400"
                  />
                  <span className="text-sm text-gray-700 capitalize">{orientation}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Margins (mm)</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(['top', 'bottom', 'left', 'right'] as const).map((margin) => (
                <div key={margin}>
                  <label className="block text-xs text-gray-600 mb-1 capitalize">{margin}</label>
                  <input
                    type="number"
                    min="0"
                    value={quoteFormat.page.margins[margin]}
                    onChange={(e) =>
                      updateQuoteFormat({
                        page: {
                          ...quoteFormat.page,
                          margins: {
                            ...quoteFormat.page.margins,
                            [margin]: parseInt(e.target.value) || 0,
                          },
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section Spacing ({quoteFormat.page.sectionSpacing}px)
            </label>
            <input
              type="range"
              min="0"
              max="50"
              value={quoteFormat.page.sectionSpacing}
              onChange={(e) =>
                updateQuoteFormat({
                  page: {
                    ...quoteFormat.page,
                    sectionSpacing: parseInt(e.target.value),
                  },
                })
              }
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Section Visibility */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Section Visibility & Ordering</h3>
        <div className="space-y-3">
          {Object.entries(quoteFormat.sections)
            .sort(([, a], [, b]) => a.order - b.order)
            .map(([key, section]) => (
              <div
                key={key}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={section.visible}
                      onChange={(e) =>
                        updateQuoteFormat({
                          sections: {
                            ...quoteFormat.sections,
                            [key]: { ...section, visible: e.target.checked },
                          },
                        })
                      }
                      className="w-5 h-5 text-gray-900 border-gray-300 rounded focus:ring-gray-400"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {key
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, (str) => str.toUpperCase())
                        .trim()}
                    </span>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const currentOrder = section.order;
                      const otherSection = Object.entries(quoteFormat.sections).find(
                        ([k, s]) => s.order === currentOrder - 1
                      );
                      if (otherSection) {
                        updateQuoteFormat({
                          sections: {
                            ...quoteFormat.sections,
                            [key]: { ...section, order: currentOrder - 1 },
                            [otherSection[0]]: { ...otherSection[1], order: currentOrder },
                          },
                        });
                      }
                    }}
                    disabled={section.order === 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      const currentOrder = section.order;
                      const otherSection = Object.entries(quoteFormat.sections).find(
                        ([k, s]) => s.order === currentOrder + 1
                      );
                      if (otherSection) {
                        updateQuoteFormat({
                          sections: {
                            ...quoteFormat.sections,
                            [key]: { ...section, order: currentOrder + 1 },
                            [otherSection[0]]: { ...otherSection[1], order: currentOrder },
                          },
                        });
                      }
                    }}
                    disabled={section.order === Object.keys(quoteFormat.sections).length}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Reset Button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to reset all quote format settings to defaults?')) {
              resetQuoteFormat();
              setLogoPreview(null);
            }
          }}
          className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default QuoteFormatSection;

