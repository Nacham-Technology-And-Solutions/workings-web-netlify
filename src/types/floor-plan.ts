export interface Point {
  x: number;
  y: number;
}

export interface Wall {
  id: string;
  start: Point;
  end: Point;
}

export interface Door {
  id: string;
  position: Point;
  width: number;
}

export interface Window {
  id: string;
  position: Point;
  width: number;
}

export interface FloorPlan {
  walls: Wall[];
  doors: Door[];
  windows: Window[];
}

export interface EstimateItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  total: number;
}

export interface EstimateCategory {
  name: string;
  items: EstimateItem[];
}

export type Tool = 'SELECT' | 'WALL' | 'DOOR' | 'WINDOW';

