/**
 * Module-Specific Illustration Components
 * Provides accurate visual representations for each module type
 */

import React from 'react';

interface BaseIllustrationProps {
  width: number;
  height: number;
  unit: string;
  frameWidth: number;
  frameHeight: number;
  labelPadding: number;
}

interface CasementIllustrationProps extends BaseIllustrationProps {
  panelCount: number;
  openingPanels: number;
}

interface SlidingWindowIllustrationProps extends BaseIllustrationProps {
  sashCount: 2 | 3;
}

interface NetIllustrationProps extends BaseIllustrationProps {
  // Net-specific props if needed
}

interface CurtainWallIllustrationProps extends BaseIllustrationProps {
  verticalPanels: number;
  horizontalPanels: number;
}

/**
 * Casement Window Illustration (M1)
 * Shows panels with opening indicators
 */
export const CasementIllustration: React.FC<CasementIllustrationProps> = ({
  width,
  height,
  unit,
  frameWidth,
  frameHeight,
  labelPadding,
  panelCount,
  openingPanels,
}) => {
  const openingPanelsNum = openingPanels || panelCount;

  // Calculate total dimensions including all labels
  const topLabelHeight = 50; // Space for width dimension above frame
  const rightLabelWidth = 80; // Space for height dimension to the right
  const bottomLabelHeight = 40; // Space for panel info below frame
  const totalWidth = frameWidth + rightLabelWidth;
  const totalHeight = topLabelHeight + frameHeight + bottomLabelHeight;

  // Use container-relative sizing with max constraints
  // Account for parent padding (p-12 = 48px on each side = 96px total)
  // Use conservative values to ensure content fits within available space
  const maxContainerWidth = 450; // Conservative max width accounting for padding
  const maxContainerHeight = 550; // Conservative max height accounting for padding
  
  // Calculate scale to fit within max container size
  const scaleX = maxContainerWidth / totalWidth;
  const scaleY = maxContainerHeight / totalHeight;
  const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down

  const scaledFrameWidth = frameWidth * scale;
  const scaledFrameHeight = frameHeight * scale;
  const scaledTotalWidth = totalWidth * scale;
  const scaledTotalHeight = totalHeight * scale;
  const scaledRightLabelWidth = rightLabelWidth * scale;
  const scaledTopLabelHeight = topLabelHeight * scale;
  const scaledBottomLabelHeight = bottomLabelHeight * scale;

  return (
    <div className="absolute inset-0 flex items-center justify-center p-12 overflow-hidden">
      <div
        className="relative"
        style={{
          width: `${scaledTotalWidth}px`,
          height: `${scaledTotalHeight}px`,
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      >
        {/* Frame container */}
        <div
          className="absolute"
          style={{
            top: `${scaledTopLabelHeight}px`,
            left: '0px',
            width: `${scaledFrameWidth}px`,
            height: `${scaledFrameHeight}px`,
          }}
        >
          {/* Outer Frame */}
          <div className="absolute inset-0 bg-gray-700 rounded-sm shadow-xl">
            {/* Inner Frame */}
            <div className="absolute inset-3 bg-gray-600">
              {/* Glass Area Container */}
              <div className="absolute inset-2 bg-white flex">
                {/* Panel dividers */}
                {Array.from({ length: panelCount }).map((_, index) => {
                  const isOpening = index < openingPanelsNum;
                  return (
                    <div key={index} className="flex-1 relative">
                      {/* Glass panel */}
                      <div className="absolute inset-1 bg-blue-50 border border-gray-400">
                        {/* Opening indicator - small handle icon */}
                        {isOpening && (
                          <div className="absolute top-1 right-1">
                            <svg
                              className="w-3 h-3 text-green-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      {/* Vertical divider between panels */}
                      {index < panelCount - 1 && (
                        <div className="absolute right-0 top-0 bottom-0 w-2 bg-gray-600"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Width dimension */}
        <div
          className="absolute"
          style={{
            top: '0px',
            left: '0px',
            width: `${scaledFrameWidth}px`,
            height: `${scaledTopLabelHeight}px`,
          }}
        >
          <div className="flex flex-col items-center justify-end w-full h-full pb-1">
            <div className="relative w-full flex items-center justify-center" style={{ height: '12px' }}>
              <div className="absolute left-0 w-0.5 h-3 bg-gray-900"></div>
              <div className="absolute left-0 right-0 h-0.5 bg-gray-900"></div>
              <div className="absolute right-0 w-0.5 h-3 bg-gray-900"></div>
            </div>
            <div className="text-sm font-bold text-gray-900 mt-1 text-center">
              {width} {unit}
            </div>
          </div>
        </div>

        {/* Height dimension */}
        <div
          className="absolute"
          style={{
            top: `${scaledTopLabelHeight}px`,
            left: `${scaledFrameWidth + 8}px`,
            width: `${scaledRightLabelWidth - 8}px`,
            height: `${scaledFrameHeight}px`,
          }}
        >
          <div className="flex items-center h-full">
            <div className="relative h-full flex items-center justify-center" style={{ width: '12px' }}>
              <div className="absolute top-0 w-3 h-0.5 bg-gray-900"></div>
              <div className="absolute top-0 bottom-0 w-0.5 bg-gray-900"></div>
              <div className="absolute bottom-0 w-3 h-0.5 bg-gray-900"></div>
            </div>
            <div className="ml-2 flex flex-col items-center">
              <div className="text-sm font-bold text-gray-900 transform -rotate-90 whitespace-nowrap">
                {height} {unit}
              </div>
            </div>
          </div>
        </div>

        {/* Panel info */}
        <div
          className="absolute"
          style={{
            top: `${scaledTopLabelHeight + scaledFrameHeight}px`,
            left: '0px',
            width: `${scaledFrameWidth}px`,
            height: `${scaledBottomLabelHeight}px`,
          }}
        >
          <div className="text-center w-full h-full flex items-start justify-center pt-2">
            <div className="text-sm font-semibold text-gray-900">
              {panelCount} Panel{panelCount > 1 ? 's' : ''} ({openingPanelsNum} Opening)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Sliding Window Illustration (M2-M5)
 * Shows horizontal sliding tracks and sashes
 */
export const SlidingWindowIllustration: React.FC<SlidingWindowIllustrationProps> = ({
  width,
  height,
  unit,
  frameWidth,
  frameHeight,
  labelPadding,
  sashCount,
}) => {
  const sashWidth = frameWidth / sashCount;

  // Calculate total dimensions including all labels
  const topLabelHeight = 50;
  const rightLabelWidth = 120; // Increased to accommodate rotated text (e.g., "1500 mm")
  const bottomLabelHeight = 40;
  const totalWidth = frameWidth + rightLabelWidth;
  const totalHeight = topLabelHeight + frameHeight + bottomLabelHeight;

  // Use container-relative sizing with max constraints
  // Account for parent padding (p-12 = 48px on each side = 96px total)
  // Use conservative values to ensure content fits within available space
  const maxContainerWidth = 450; // Conservative max width accounting for padding
  const maxContainerHeight = 550; // Conservative max height accounting for padding
  
  const scaleX = maxContainerWidth / totalWidth;
  const scaleY = maxContainerHeight / totalHeight;
  const scale = Math.min(scaleX, scaleY, 1);

  const scaledFrameWidth = frameWidth * scale;
  const scaledFrameHeight = frameHeight * scale;
  const scaledTotalWidth = totalWidth * scale;
  const scaledTotalHeight = totalHeight * scale;
  const scaledRightLabelWidth = rightLabelWidth * scale;
  const scaledTopLabelHeight = topLabelHeight * scale;
  const scaledBottomLabelHeight = bottomLabelHeight * scale;
  const scaledSashWidth = scaledFrameWidth / sashCount;

  return (
    <div className="absolute inset-0 flex items-center justify-center p-12 overflow-hidden">
      <div
        className="relative"
        style={{
          width: `${scaledTotalWidth}px`,
          height: `${scaledTotalHeight}px`,
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      >
        {/* Frame container */}
        <div
          className="absolute"
          style={{
            top: `${scaledTopLabelHeight}px`,
            left: '0px',
            width: `${scaledFrameWidth}px`,
            height: `${scaledFrameHeight}px`,
          }}
        >
          {/* Outer Frame */}
          <div className="absolute inset-0 bg-gray-700 rounded-sm shadow-xl">
            {/* Inner Frame */}
            <div className="absolute inset-3 bg-gray-600">
              {/* Track area - horizontal sliding */}
              <div className="absolute inset-2 bg-gray-100">
                {/* Sliding sashes */}
                {Array.from({ length: sashCount }).map((_, index) => (
                  <div
                    key={index}
                    className="absolute top-0 bottom-0 bg-blue-50 border border-gray-400"
                    style={{
                      left: `${(index * scaledSashWidth) + 2}px`,
                      width: `${scaledSashWidth - 4}px`,
                    }}
                  >
                    {/* Track indicator - horizontal line at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-500"></div>
                    {/* Handle indicator */}
                    <div className="absolute top-1/2 right-1 transform -translate-y-1/2">
                      <div className="w-2 h-4 bg-gray-600 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Width dimension */}
        <div
          className="absolute"
          style={{
            top: '0px',
            left: '0px',
            width: `${scaledFrameWidth}px`,
            height: `${scaledTopLabelHeight}px`,
          }}
        >
          <div className="flex flex-col items-center justify-end w-full h-full pb-1">
            <div className="relative w-full flex items-center justify-center" style={{ height: '12px' }}>
              <div className="absolute left-0 w-0.5 h-3 bg-gray-900"></div>
              <div className="absolute left-0 right-0 h-0.5 bg-gray-900"></div>
              <div className="absolute right-0 w-0.5 h-3 bg-gray-900"></div>
            </div>
            <div className="text-sm font-bold text-gray-900 mt-1 text-center">
              {width} {unit}
            </div>
          </div>
        </div>

        {/* Height dimension */}
        <div
          className="absolute"
          style={{
            top: `${scaledTopLabelHeight}px`,
            left: `${scaledFrameWidth + 8}px`,
            width: `${scaledRightLabelWidth - 8}px`,
            height: `${scaledFrameHeight}px`,
          }}
        >
          <div className="flex items-center h-full">
            <div className="relative h-full flex items-center justify-center" style={{ width: '12px' }}>
              <div className="absolute top-0 w-3 h-0.5 bg-gray-900"></div>
              <div className="absolute top-0 bottom-0 w-0.5 bg-gray-900"></div>
              <div className="absolute bottom-0 w-3 h-0.5 bg-gray-900"></div>
            </div>
            <div className="ml-2 flex flex-col items-center">
              <div className="text-sm font-bold text-gray-900 transform -rotate-90 whitespace-nowrap">
                {height} {unit}
              </div>
            </div>
          </div>
        </div>

        {/* Sash count label */}
        <div
          className="absolute"
          style={{
            top: `${scaledTopLabelHeight + scaledFrameHeight}px`,
            left: '0px',
            width: `${scaledFrameWidth}px`,
            height: `${scaledBottomLabelHeight}px`,
          }}
        >
          <div className="text-center w-full h-full flex items-start justify-center pt-2">
            <div className="text-sm font-semibold text-gray-900">
              {sashCount} Sash Sliding Window
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Net Illustration (M6-M8)
 * Shows net frame structure (not glass)
 */
export const NetIllustration: React.FC<NetIllustrationProps> = ({
  width,
  height,
  unit,
  frameWidth,
  frameHeight,
  labelPadding,
}) => {
  // Calculate total dimensions including all labels
  const topLabelHeight = 50;
  const rightLabelWidth = 100; // Wider for "inside-to-inside" text
  const bottomLabelHeight = 40;
  const totalWidth = frameWidth + rightLabelWidth;
  const totalHeight = topLabelHeight + frameHeight + bottomLabelHeight;

  // Use container-relative sizing with max constraints
  // Account for parent padding (p-12 = 48px on each side = 96px total)
  // Use conservative values to ensure content fits within available space
  const maxContainerWidth = 450; // Conservative max width accounting for padding
  const maxContainerHeight = 550; // Conservative max height accounting for padding
  
  const scaleX = maxContainerWidth / totalWidth;
  const scaleY = maxContainerHeight / totalHeight;
  const scale = Math.min(scaleX, scaleY, 1);

  const scaledFrameWidth = frameWidth * scale;
  const scaledFrameHeight = frameHeight * scale;
  const scaledTotalWidth = totalWidth * scale;
  const scaledTotalHeight = totalHeight * scale;
  const scaledRightLabelWidth = rightLabelWidth * scale;
  const scaledTopLabelHeight = topLabelHeight * scale;
  const scaledBottomLabelHeight = bottomLabelHeight * scale;

  return (
    <div className="absolute inset-0 flex items-center justify-center p-12 overflow-hidden">
      <div
        className="relative"
        style={{
          width: `${scaledTotalWidth}px`,
          height: `${scaledTotalHeight}px`,
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      >
        {/* Frame container */}
        <div
          className="absolute"
          style={{
            top: `${scaledTopLabelHeight}px`,
            left: '0px',
            width: `${scaledFrameWidth}px`,
            height: `${scaledFrameHeight}px`,
          }}
        >
          {/* Outer Frame - thicker for net */}
          <div className="absolute inset-0 bg-gray-800 rounded-sm shadow-xl">
            {/* Inner Frame */}
            <div className="absolute inset-4 bg-gray-700">
              {/* Net area - mesh pattern */}
              <div
                className="absolute inset-2 bg-green-50"
                style={{
                  backgroundImage: `
                    linear-gradient(45deg, #86efac 25%, transparent 25%),
                    linear-gradient(-45deg, #86efac 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #86efac 75%),
                    linear-gradient(-45deg, transparent 75%, #86efac 75%)
                  `,
                  backgroundSize: '8px 8px',
                  backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Width dimension - labeled as inside-to-inside */}
        <div
          className="absolute"
          style={{
            top: '0px',
            left: '0px',
            width: `${scaledFrameWidth}px`,
            height: `${scaledTopLabelHeight}px`,
          }}
        >
          <div className="flex flex-col items-center justify-end w-full h-full pb-1">
            <div className="relative w-full flex items-center justify-center" style={{ height: '12px' }}>
              <div className="absolute left-0 w-0.5 h-3 bg-gray-900"></div>
              <div className="absolute left-0 right-0 h-0.5 bg-gray-900"></div>
              <div className="absolute right-0 w-0.5 h-3 bg-gray-900"></div>
            </div>
            <div className="text-xs font-bold text-gray-900 mt-1 text-center">
              {width} {unit} (inside-to-inside)
            </div>
          </div>
        </div>

        {/* Height dimension - labeled as inside-to-inside */}
        <div
          className="absolute"
          style={{
            top: `${scaledTopLabelHeight}px`,
            left: `${scaledFrameWidth + 8}px`,
            width: `${scaledRightLabelWidth - 8}px`,
            height: `${scaledFrameHeight}px`,
          }}
        >
          <div className="flex items-center h-full">
            <div className="relative h-full flex items-center justify-center" style={{ width: '12px' }}>
              <div className="absolute top-0 w-3 h-0.5 bg-gray-900"></div>
              <div className="absolute top-0 bottom-0 w-0.5 bg-gray-900"></div>
              <div className="absolute bottom-0 w-3 h-0.5 bg-gray-900"></div>
            </div>
            <div className="ml-2 flex flex-col items-center">
              <div className="text-xs font-bold text-gray-900 transform -rotate-90 whitespace-nowrap">
                {height} {unit} (inside-to-inside)
              </div>
            </div>
          </div>
        </div>

        {/* Net label */}
        <div
          className="absolute"
          style={{
            top: `${scaledTopLabelHeight + scaledFrameHeight}px`,
            left: '0px',
            width: `${scaledFrameWidth}px`,
            height: `${scaledBottomLabelHeight}px`,
          }}
        >
          <div className="text-center w-full h-full flex items-start justify-center pt-2">
            <div className="text-sm font-semibold text-gray-900">Net Frame</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Curtain Wall Grid Illustration (M9)
 * Shows grid layout with vertical and horizontal mullions
 */
export const CurtainWallIllustration: React.FC<CurtainWallIllustrationProps> = ({
  width,
  height,
  unit,
  frameWidth,
  frameHeight,
  labelPadding,
  verticalPanels,
  horizontalPanels,
}) => {
  // Calculate total dimensions including all labels
  const topLabelHeight = 50;
  const rightLabelWidth = 120; // Increased to accommodate rotated text
  const bottomLabelHeight = 90; // Increased to fully accommodate longer grid info text (e.g., "4 × 4 Grid (16 Panels)")
  const totalWidth = frameWidth + rightLabelWidth;
  const totalHeight = topLabelHeight + frameHeight + bottomLabelHeight;

  // Use container-relative sizing with max constraints
  // Account for parent padding (p-12 = 48px on each side = 96px total)
  // Use conservative values to ensure content fits within available space
  const maxContainerWidth = 450; // Conservative max width accounting for padding
  const maxContainerHeight = 550; // Conservative max height accounting for padding
  
  const scaleX = maxContainerWidth / totalWidth;
  const scaleY = maxContainerHeight / totalHeight;
  const scale = Math.min(scaleX, scaleY, 1);

  const scaledFrameWidth = frameWidth * scale;
  const scaledFrameHeight = frameHeight * scale;
  const scaledTotalWidth = totalWidth * scale;
  const scaledTotalHeight = totalHeight * scale;
  const scaledRightLabelWidth = rightLabelWidth * scale;
  const scaledTopLabelHeight = topLabelHeight * scale;
  const scaledBottomLabelHeight = bottomLabelHeight * scale;
  const scaledCellWidth = scaledFrameWidth / verticalPanels;
  const scaledCellHeight = scaledFrameHeight / horizontalPanels;

  return (
    <div className="absolute inset-0 flex items-center justify-center p-12 overflow-hidden">
      <div
        className="relative"
        style={{
          width: `${scaledTotalWidth}px`,
          height: `${scaledTotalHeight}px`,
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      >
        {/* Frame container */}
        <div
          className="absolute"
          style={{
            top: `${scaledTopLabelHeight}px`,
            left: '0px',
            width: `${scaledFrameWidth}px`,
            height: `${scaledFrameHeight}px`,
          }}
        >
          {/* Outer Frame */}
          <div className="absolute inset-0 bg-gray-700 rounded-sm shadow-xl">
            {/* Inner Frame */}
            <div className="absolute inset-3 bg-gray-600">
              {/* Grid Container */}
              <div className="absolute inset-2 bg-white">
                {/* Grid cells */}
                {Array.from({ length: horizontalPanels }).map((_, rowIndex) =>
                  Array.from({ length: verticalPanels }).map((_, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className="absolute bg-blue-50 border border-gray-400"
                      style={{
                        left: `${colIndex * scaledCellWidth}px`,
                        top: `${rowIndex * scaledCellHeight}px`,
                        width: `${scaledCellWidth}px`,
                        height: `${scaledCellHeight}px`,
                      }}
                    >
                      {/* Vertical mullion */}
                      {colIndex < verticalPanels - 1 && (
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1 bg-gray-600"
                          style={{ zIndex: 10 }}
                        ></div>
                      )}
                      {/* Horizontal mullion */}
                      {rowIndex < horizontalPanels - 1 && (
                        <div
                          className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600"
                          style={{ zIndex: 10 }}
                        ></div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Width dimension */}
        <div
          className="absolute"
          style={{
            top: '0px',
            left: '0px',
            width: `${scaledFrameWidth}px`,
            height: `${scaledTopLabelHeight}px`,
          }}
        >
          <div className="flex flex-col items-center justify-end w-full h-full pb-1">
            <div className="relative w-full flex items-center justify-center" style={{ height: '12px' }}>
              <div className="absolute left-0 w-0.5 h-3 bg-gray-900"></div>
              <div className="absolute left-0 right-0 h-0.5 bg-gray-900"></div>
              <div className="absolute right-0 w-0.5 h-3 bg-gray-900"></div>
            </div>
            <div className="text-sm font-bold text-gray-900 mt-1 text-center">
              {width} {unit}
            </div>
          </div>
        </div>

        {/* Height dimension */}
        <div
          className="absolute"
          style={{
            top: `${scaledTopLabelHeight}px`,
            left: `${scaledFrameWidth + 8}px`,
            width: `${scaledRightLabelWidth - 8}px`,
            height: `${scaledFrameHeight}px`,
          }}
        >
          <div className="flex items-center h-full">
            <div className="relative h-full flex items-center justify-center" style={{ width: '12px' }}>
              <div className="absolute top-0 w-3 h-0.5 bg-gray-900"></div>
              <div className="absolute top-0 bottom-0 w-0.5 bg-gray-900"></div>
              <div className="absolute bottom-0 w-3 h-0.5 bg-gray-900"></div>
            </div>
            <div className="ml-2 flex flex-col items-center">
              <div className="text-sm font-bold text-gray-900 transform -rotate-90 whitespace-nowrap">
                {height} {unit}
              </div>
            </div>
          </div>
        </div>

        {/* Grid info */}
        <div
          className="absolute"
          style={{
            top: `${scaledTopLabelHeight + scaledFrameHeight}px`,
            left: '0px',
            width: `${scaledFrameWidth}px`,
            height: `${scaledBottomLabelHeight}px`,
          }}
        >
          <div className="text-center w-full h-full flex items-start justify-center pt-2">
            <div className="text-xs font-semibold text-gray-900">
              {verticalPanels} × {horizontalPanels} Grid ({verticalPanels * horizontalPanels} Panels)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

