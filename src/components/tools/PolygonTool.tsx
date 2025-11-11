import { useState, useEffect } from 'react';

interface PolygonToolProps {
  canvas: HTMLCanvasElement | null;
  onAdd: (tool: 'polygon', properties: any) => void;
  selectedPreset: string | null;
  onRedraw: () => void;
}

interface Vertex {
  x: number;
  y: number;
}

export default function PolygonTool({ canvas, onAdd, selectedPreset, onRedraw }: PolygonToolProps) {
  const [borderColor, setBorderColor] = useState('#FF3C00');
  const [borderThickness, setBorderThickness] = useState(3);
  const [dashed, setDashed] = useState(false);
  const [fillColor, setFillColor] = useState('#FF3C00');
  const [fillOpacity, setFillOpacity] = useState(30);
  const [markerSize, setMarkerSize] = useState(6);
  const [currentVertices, setCurrentVertices] = useState<Vertex[]>([]);
  const [lastClickTime, setLastClickTime] = useState(0);

  useEffect(() => {
    if (selectedPreset) {
      setBorderColor(selectedPreset);
      setFillColor(selectedPreset);
    }
  }, [selectedPreset]);

  useEffect(() => {
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (currentVertices.length === 0) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      drawPreview(x, y);
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const now = Date.now();
      if (now - lastClickTime < 200 && currentVertices.length >= 3) {
        finishPolygon();
        return;
      }

      setLastClickTime(now);
      setCurrentVertices(prev => [...prev, { x, y }]);
    };

    const handleRightClick = (e: MouseEvent) => {
      e.preventDefault();
      setCurrentVertices([]);
      onRedraw();
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('contextmenu', handleRightClick);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('contextmenu', handleRightClick);
    };
  }, [canvas, currentVertices, lastClickTime, borderColor, borderThickness, dashed, fillColor, fillOpacity, markerSize, onRedraw]);

  const drawPreview = (mouseX: number, mouseY: number) => {
    if (!canvas) return;

    onRedraw();

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();

    if (currentVertices.length > 0) {
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderThickness;
      if (dashed) {
        ctx.setLineDash([10, 5]);
      }

      ctx.beginPath();
      ctx.moveTo(currentVertices[0].x, currentVertices[0].y);
      for (let i = 1; i < currentVertices.length; i++) {
        ctx.lineTo(currentVertices[i].x, currentVertices[i].y);
      }
      ctx.lineTo(mouseX, mouseY);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.globalAlpha = 0.7;
      currentVertices.forEach(vertex => {
        ctx.fillStyle = borderColor;
        ctx.shadowColor = 'white';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(vertex.x, vertex.y, markerSize, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.shadowBlur = 0;
    }

    ctx.restore();
  };

  const finishPolygon = () => {
    if (currentVertices.length < 3) return;

    onAdd('polygon', {
      vertices: [...currentVertices],
      borderColor,
      borderThickness,
      dashed,
      fillColor,
      fillOpacity,
      markerSize,
    });

    setCurrentVertices([]);
  };

  return (
    <div className="space-y-6">
      <div className="text-center pb-4 border-b">
        <h3 className="text-lg font-bold text-text">Polygon Properties</h3>
      </div>

      <div>
        <label className="text-sm font-semibold text-text block mb-2">Border Color</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={borderColor}
            onChange={(e) => setBorderColor(e.target.value)}
            className="w-16 h-10 rounded border-2 cursor-pointer"
          />
          <input
            type="text"
            value={borderColor}
            onChange={(e) => setBorderColor(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between mb-2">
          <label className="text-sm font-semibold text-text">Border Thickness</label>
          <span className="text-sm text-gray-600">{borderThickness}px</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={borderThickness}
          onChange={(e) => setBorderThickness(parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-text">Dashed Border</label>
        <button
          onClick={() => setDashed(!dashed)}
          className={`w-12 h-6 rounded-full transition-colors relative ${
            dashed ? 'bg-orange-gradient' : 'bg-gray-300'
          }`}
        >
          <div
            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
              dashed ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div>
        <label className="text-sm font-semibold text-text block mb-2">Fill Color</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={fillColor}
            onChange={(e) => setFillColor(e.target.value)}
            className="w-16 h-10 rounded border-2 cursor-pointer"
          />
          <input
            type="text"
            value={fillColor}
            onChange={(e) => setFillColor(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between mb-2">
          <label className="text-sm font-semibold text-text">Fill Opacity</label>
          <span className="text-sm text-gray-600">{fillOpacity}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={fillOpacity}
          onChange={(e) => setFillOpacity(parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <div className="flex justify-between mb-2">
          <label className="text-sm font-semibold text-text">Marker Size</label>
          <span className="text-sm text-gray-600">{markerSize}px</span>
        </div>
        <input
          type="range"
          min="3"
          max="10"
          value={markerSize}
          onChange={(e) => setMarkerSize(parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="pt-4 border-t">
        <p className="text-sm text-gray-500 text-center mb-2">
          Click to add vertices
        </p>
        <p className="text-sm text-gray-500 text-center mb-2">
          Double-click to finish (min 3 vertices)
        </p>
        <p className="text-sm text-gray-500 text-center">
          Right-click to cancel
        </p>
        {currentVertices.length > 0 && (
          <div className="mt-3 text-center">
            <span className="text-sm font-semibold text-primary">
              {currentVertices.length} vertices placed
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
