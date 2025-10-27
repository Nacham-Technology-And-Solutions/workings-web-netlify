
import React, { useState, useRef } from 'react';
import type { FloorPlan, Tool, Point } from '../types';

interface CanvasProps {
  floorPlan: FloorPlan;
  activeTool: Tool;
  addWall: (start: Point, end: Point) => void;
  addDoor: (position: Point) => void;
  addWindow: (position: Point) => void;
}

const Canvas: React.FC<CanvasProps> = ({ floorPlan, activeTool, addWall, addDoor, addWindow }) => {
  const [drawingWall, setDrawingWall] = useState<Point | null>(null);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  
  const getSVGPoint = (e: React.MouseEvent): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
    return { x: svgP.x, y: svgP.y };
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos(getSVGPoint(e));
  };

  const handleClick = (e: React.MouseEvent) => {
    const point = getSVGPoint(e);
    
    switch (activeTool) {
      case 'WALL':
        if (drawingWall) {
          addWall(drawingWall, point);
          setDrawingWall(null);
        } else {
          setDrawingWall(point);
        }
        break;
      case 'DOOR':
        addDoor(point);
        break;
      case 'WINDOW':
        addWindow(point);
        break;
      default:
        break;
    }
  };

  return (
    <div className="w-full h-full bg-primary rounded-lg shadow-inner overflow-hidden border border-primary/20">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        className="cursor-crosshair"
      >
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#8a9ea2" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Render existing floor plan */}
        {floorPlan.walls.map(wall => (
          <line key={wall.id} x1={wall.start.x} y1={wall.start.y} x2={wall.end.x} y2={wall.end.y} stroke="#ffffff" strokeWidth="5" />
        ))}
        {floorPlan.doors.map(door => (
          <rect key={door.id} x={door.position.x - door.width / 2} y={door.position.y - 5} width={door.width} height="10" fill="#8a9ea2" />
        ))}
        {floorPlan.windows.map(win => (
          <rect key={win.id} x={win.position.x - win.width / 2} y={win.position.y - 3} width={win.width} height="6" fill="#ffffff" stroke="#2d2e2e" strokeWidth="2" />
        ))}
        
        {/* Render drawing helpers */}
        {drawingWall && (
          <line x1={drawingWall.x} y1={drawingWall.y} x2={mousePos.x} y2={mousePos.y} stroke="#8a9ea2" strokeWidth="3" strokeDasharray="5,5" />
        )}
      </svg>
    </div>
  );
};

export default Canvas;
