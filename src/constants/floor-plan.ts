import type { FloorPlan, EstimateCategory } from '../types';

export const sampleFloorPlan: FloorPlan = {
  walls: [
    { id: 'w1', start: { x: 50, y: 50 }, end: { x: 450, y: 50 } },
    { id: 'w2', start: { x: 450, y: 50 }, end: { x: 450, y: 350 } },
    { id: 'w3', start: { x: 450, y: 350 }, end: { x: 50, y: 350 } },
    { id: 'w4', start: { x: 50, y: 350 }, end: { x: 50, y: 50 } },
    { id: 'w5', start: { x: 200, y: 50 }, end: { x: 200, y: 200 } },
    { id: 'w6', start: { x: 50, y: 200 }, end: { x: 200, y: 200 } },
  ],
  doors: [
    { id: 'd1', position: { x: 100, y: 50 }, width: 30 },
    { id: 'd2', position: { x: 200, y: 150 }, width: 30 },
  ],
  windows: [
    { id: 'win1', position: { x: 250, y: 350 }, width: 60 },
    { id: 'win2', position: { x: 450, y: 150 }, width: 60 },
  ],
};

export const initialEstimates: EstimateCategory[] = [
  {
    name: 'Framing & Drywall',
    items: [
      { id: 'studs', description: '8ft Wood Studs', quantity: 0, unit: 'ea', unitCost: 4.50, total: 0 },
      { id: 'drywall', description: '4x8 Drywall Sheet', quantity: 0, unit: 'sqft', unitCost: 0.50, total: 0 },
    ],
  },
  {
    name: 'Openings',
    items: [
      { id: 'doors', description: 'Interior Door', quantity: 0, unit: 'ea', unitCost: 150, total: 0 },
      { id: 'windows', description: 'Standard Window', quantity: 0, unit: 'ea', unitCost: 250, total: 0 },
    ],
  },
  {
    name: 'Labor',
    items: [
      { id: 'framing_labor', description: 'Framing Labor', quantity: 8, unit: 'hr', unitCost: 75, total: 600 },
      { id: 'drywall_labor', description: 'Drywall & Finishing', quantity: 16, unit: 'hr', unitCost: 65, total: 1040 },
    ]
  }
];

