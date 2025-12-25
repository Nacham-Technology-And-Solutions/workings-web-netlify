import React from 'react';
import { useTemplateStore } from '@/stores/templateStore';

const PDFExportSection: React.FC = () => {
  const { pdfExport, updatePDFExport, resetPDFExport } = useTemplateStore();

  const pageSizes = ['A4', 'Letter', 'Legal', 'A3', 'Custom'] as const;
  const fontFamilies = ['Helvetica', 'Arial', 'Times', 'Courier'];
  const dateFormats = [
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-25)' },
    { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (25-12-2024)' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/25/2024)' },
    { value: 'YYYY/MM/DD', label: 'YYYY/MM/DD (2024/12/25)' },
  ];

  const generateFileNamePreview = () => {
    const pattern = pdfExport.fileNaming.pattern;
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    
    return pattern
      .replace('{quoteId}', 'Q-20241225-0001')
      .replace('{projectName}', 'Sample Project')
      .replace('{customerName}', 'John Doe')
      .replace('{quoteNumber}', 'Q-20241225-0001')
      .replace('{date}', dateStr);
  };

  return (
    <div className="space-y-6">
      {/* Quote PDF Settings */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quote PDF Settings</h3>
        <div className="space-y-6">
          {/* Page Settings */}
          <div>
            <h4 className="text-base font-medium text-gray-800 mb-3">Page Settings</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Page Size</label>
                <select
                  value={pdfExport.quote.pageSize}
                  onChange={(e) =>
                    updatePDFExport({
                      quote: { ...pdfExport.quote, pageSize: e.target.value as any },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  {pageSizes.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
              {pdfExport.quote.pageSize === 'Custom' && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
                    <input
                      type="number"
                      value={pdfExport.quote.customSize?.width || 210}
                      onChange={(e) =>
                        updatePDFExport({
                          quote: {
                            ...pdfExport.quote,
                            customSize: {
                              ...pdfExport.quote.customSize,
                              width: parseInt(e.target.value) || 210,
                              unit: pdfExport.quote.customSize?.unit || 'mm',
                            },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                    <input
                      type="number"
                      value={pdfExport.quote.customSize?.height || 297}
                      onChange={(e) =>
                        updatePDFExport({
                          quote: {
                            ...pdfExport.quote,
                            customSize: {
                              ...pdfExport.quote.customSize,
                              height: parseInt(e.target.value) || 297,
                              unit: pdfExport.quote.customSize?.unit || 'mm',
                            },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <select
                      value={pdfExport.quote.customSize?.unit || 'mm'}
                      onChange={(e) =>
                        updatePDFExport({
                          quote: {
                            ...pdfExport.quote,
                            customSize: {
                              ...pdfExport.quote.customSize,
                              unit: e.target.value as 'mm' | 'in',
                            },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                      <option value="mm">mm</option>
                      <option value="in">in</option>
                    </select>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Page Orientation</label>
                <div className="flex gap-4">
                  {(['portrait', 'landscape'] as const).map((orientation) => (
                    <label key={orientation} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="quoteOrientation"
                        value={orientation}
                        checked={pdfExport.quote.orientation === orientation}
                        onChange={() =>
                          updatePDFExport({
                            quote: { ...pdfExport.quote, orientation },
                          })
                        }
                        className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-400"
                      />
                      <span className="text-sm text-gray-700 capitalize">{orientation}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Header/Footer */}
          <div>
            <h4 className="text-base font-medium text-gray-800 mb-3">Header & Footer</h4>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={pdfExport.quote.header.enabled}
                  onChange={(e) =>
                    updatePDFExport({
                      quote: {
                        ...pdfExport.quote,
                        header: { ...pdfExport.quote.header, enabled: e.target.checked },
                      },
                    })
                  }
                  className="w-5 h-5 text-gray-900 border-gray-300 rounded focus:ring-gray-400"
                />
                <span className="text-sm text-gray-700">Include header in PDF</span>
              </label>
              {pdfExport.quote.header.enabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Header Height ({pdfExport.quote.header.height}mm)
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={pdfExport.quote.header.height}
                    onChange={(e) =>
                      updatePDFExport({
                        quote: {
                          ...pdfExport.quote,
                          header: {
                            ...pdfExport.quote.header,
                            height: parseInt(e.target.value),
                          },
                        },
                      })
                    }
                    className="w-full"
                  />
                </div>
              )}
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={pdfExport.quote.footer.enabled}
                  onChange={(e) =>
                    updatePDFExport({
                      quote: {
                        ...pdfExport.quote,
                        footer: { ...pdfExport.quote.footer, enabled: e.target.checked },
                      },
                    })
                  }
                  className="w-5 h-5 text-gray-900 border-gray-300 rounded focus:ring-gray-400"
                />
                <span className="text-sm text-gray-700">Include footer in PDF</span>
              </label>
              {pdfExport.quote.footer.enabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Footer Height ({pdfExport.quote.footer.height}mm)
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={pdfExport.quote.footer.height}
                    onChange={(e) =>
                      updatePDFExport({
                        quote: {
                          ...pdfExport.quote,
                          footer: {
                            ...pdfExport.quote.footer,
                            height: parseInt(e.target.value),
                          },
                        },
                      })
                    }
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Logo Settings */}
          <div>
            <h4 className="text-base font-medium text-gray-800 mb-3">Logo in PDF</h4>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={pdfExport.quote.logo.enabled}
                  onChange={(e) =>
                    updatePDFExport({
                      quote: {
                        ...pdfExport.quote,
                        logo: { ...pdfExport.quote.logo, enabled: e.target.checked },
                      },
                    })
                  }
                  className="w-5 h-5 text-gray-900 border-gray-300 rounded focus:ring-gray-400"
                />
                <span className="text-sm text-gray-700">Include logo in PDF</span>
              </label>
              {pdfExport.quote.logo.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Logo Size</label>
                    <select
                      value={pdfExport.quote.logo.size}
                      onChange={(e) =>
                        updatePDFExport({
                          quote: {
                            ...pdfExport.quote,
                            logo: {
                              ...pdfExport.quote.logo,
                              size: e.target.value as any,
                            },
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Logo Position</label>
                    <select
                      value={pdfExport.quote.logo.position}
                      onChange={(e) =>
                        updatePDFExport({
                          quote: {
                            ...pdfExport.quote,
                            logo: {
                              ...pdfExport.quote.logo,
                              position: e.target.value as any,
                            },
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                      <option value="top-left">Top Left</option>
                      <option value="top-center">Top Center</option>
                      <option value="top-right">Top Right</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Font Settings */}
          <div>
            <h4 className="text-base font-medium text-gray-800 mb-3">Font Settings</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
                <select
                  value={pdfExport.quote.fonts.family}
                  onChange={(e) =>
                    updatePDFExport({
                      quote: {
                        ...pdfExport.quote,
                        fonts: { ...pdfExport.quote.fonts, family: e.target.value },
                      },
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Heading Size ({pdfExport.quote.fonts.headingSize}pt)
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="24"
                    value={pdfExport.quote.fonts.headingSize}
                    onChange={(e) =>
                      updatePDFExport({
                        quote: {
                          ...pdfExport.quote,
                          fonts: {
                            ...pdfExport.quote.fonts,
                            headingSize: parseInt(e.target.value),
                          },
                        },
                      })
                    }
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Body Size ({pdfExport.quote.fonts.bodySize}pt)
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="16"
                    value={pdfExport.quote.fonts.bodySize}
                    onChange={(e) =>
                      updatePDFExport({
                        quote: {
                          ...pdfExport.quote,
                          fonts: {
                            ...pdfExport.quote.fonts,
                            bodySize: parseInt(e.target.value),
                          },
                        },
                      })
                    }
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Table Size ({pdfExport.quote.fonts.tableSize}pt)
                  </label>
                  <input
                    type="range"
                    min="6"
                    max="14"
                    value={pdfExport.quote.fonts.tableSize}
                    onChange={(e) =>
                      updatePDFExport({
                        quote: {
                          ...pdfExport.quote,
                          fonts: {
                            ...pdfExport.quote.fonts,
                            tableSize: parseInt(e.target.value),
                          },
                        },
                      })
                    }
                    className="w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Heading Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={pdfExport.quote.fonts.headingColor}
                      onChange={(e) =>
                        updatePDFExport({
                          quote: {
                            ...pdfExport.quote,
                            fonts: {
                              ...pdfExport.quote.fonts,
                              headingColor: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={pdfExport.quote.fonts.headingColor}
                      onChange={(e) =>
                        updatePDFExport({
                          quote: {
                            ...pdfExport.quote,
                            fonts: {
                              ...pdfExport.quote.fonts,
                              headingColor: e.target.value,
                            },
                          },
                        })
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Body Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={pdfExport.quote.fonts.bodyColor}
                      onChange={(e) =>
                        updatePDFExport({
                          quote: {
                            ...pdfExport.quote,
                            fonts: {
                              ...pdfExport.quote.fonts,
                              bodyColor: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={pdfExport.quote.fonts.bodyColor}
                      onChange={(e) =>
                        updatePDFExport({
                          quote: {
                            ...pdfExport.quote,
                            fonts: {
                              ...pdfExport.quote.fonts,
                              bodyColor: e.target.value,
                            },
                          },
                        })
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Material List PDF Settings */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Material List PDF Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Page Size</label>
            <select
              value={pdfExport.materialList.pageSize}
              onChange={(e) =>
                updatePDFExport({
                  materialList: { ...pdfExport.materialList, pageSize: e.target.value as any },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              {pageSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Page Orientation</label>
            <div className="flex gap-4">
              {(['portrait', 'landscape'] as const).map((orientation) => (
                <label key={orientation} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="materialListOrientation"
                    value={orientation}
                    checked={pdfExport.materialList.orientation === orientation}
                    onChange={() =>
                      updatePDFExport({
                        materialList: { ...pdfExport.materialList, orientation },
                      })
                    }
                    className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-400"
                  />
                  <span className="text-sm text-gray-700 capitalize">{orientation}</span>
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={pdfExport.materialList.includeCuttingList}
              onChange={(e) =>
                updatePDFExport({
                  materialList: {
                    ...pdfExport.materialList,
                    includeCuttingList: e.target.checked,
                  },
                })
              }
              className="w-5 h-5 text-gray-900 border-gray-300 rounded focus:ring-gray-400"
            />
            <span className="text-sm text-gray-700">Include cutting list in PDF</span>
          </label>
          {pdfExport.materialList.includeCuttingList && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cutting List Format</label>
              <div className="flex gap-4">
                {(['table', 'list'] as const).map((format) => (
                  <label key={format} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="cuttingListFormat"
                      value={format}
                      checked={pdfExport.materialList.cuttingListFormat === format}
                      onChange={() =>
                        updatePDFExport({
                          materialList: {
                            ...pdfExport.materialList,
                            cuttingListFormat: format,
                          },
                        })
                      }
                      className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-400"
                    />
                    <span className="text-sm text-gray-700 capitalize">{format}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={pdfExport.materialList.includeGlassList}
              onChange={(e) =>
                updatePDFExport({
                  materialList: {
                    ...pdfExport.materialList,
                    includeGlassList: e.target.checked,
                  },
                })
              }
              className="w-5 h-5 text-gray-900 border-gray-300 rounded focus:ring-gray-400"
            />
            <span className="text-sm text-gray-700">Include glass list in PDF</span>
          </label>
        </div>
      </div>

      {/* File Naming */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export File Naming</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Name Pattern
            </label>
            <input
              type="text"
              value={pdfExport.fileNaming.pattern}
              onChange={(e) =>
                updatePDFExport({
                  fileNaming: { ...pdfExport.fileNaming, pattern: e.target.value },
                })
              }
              placeholder="Quote-{quoteId}-{projectName}"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
            <p className="mt-2 text-xs text-gray-500">
              Available variables: {'{quoteId}'}, {'{projectName}'}, {'{customerName}'}, {'{quoteNumber}'}, {'{date}'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
            <select
              value={pdfExport.fileNaming.dateFormat}
              onChange={(e) =>
                updatePDFExport({
                  fileNaming: { ...pdfExport.fileNaming, dateFormat: e.target.value },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              {dateFormats.map((format) => (
                <option key={format.value} value={format.value}>
                  {format.label}
                </option>
              ))}
            </select>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Preview:</p>
            <p className="text-sm font-mono text-gray-900">{generateFileNamePreview()}.pdf</p>
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to reset all PDF export settings to defaults?')) {
              resetPDFExport();
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

export default PDFExportSection;

