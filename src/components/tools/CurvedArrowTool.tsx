import { useState, useEffect } from 'react';

interface CurvedArrowToolProps {
  canvas: HTMLCanvasElement | null;
  onAdd: (tool: 'arrow', properties: any) => void;
  selectedPreset: string | null;
  onRedraw: () => void;
}

export default function CurvedArrowTool({ canvas, onAdd, selectedPreset, onRedraw }: CurvedArrowToolProps) {
  const [color, setColor] = useState('#FF3C00');
  const [thickness, setThickness] = useState(7);
  const [headSize, setHeadSize] = useState(20);
  const [dashed, setDashed] = useState(false);
  const [arcHeight, setArcHeight] = useState(50);
  const [bendEnabled, setBendEnabled] = useState(true);
  const [shadow, setShadow] = useState(true);
  const [shadowColor, setShadowColor] = useState('#808080');
  const [shadowOffset, setShadowOffset] = useState(10);
  const [shadowBlur, setShadowBlur] = useState(10);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (selectedPreset) {
      setColor(selectedPreset);
    }
  }, [selectedPreset]);

  useEffect(() => {
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!startPoint) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      drawPreview(x, y);
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (!startPoint) {
        setStartPoint({ x, y });
      } else {
        onAdd('arrow', {
          startX: startPoint.x,
          startY: startPoint.y,
          endX: x,
          endY: y,
          color,
          thickness,
          headSize,
          dashed,
          arcHeight: bendEnabled ? arcHeight : 0,
          shadow,
          shadowColor,
          shadowOffset,
          shadowBlur,
        });

        setStartPoint(null);
      }
    };

    const handleRightClick = (e: MouseEvent) => {
      e.preventDefault();
      setStartPoint(null);
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
  }, [canvas, startPoint, color, thickness, headSize, dashed, arcHeight, bendEnabled, shadow, shadowColor, shadowOffset, shadowBlur, onAdd, onRedraw]);

  const drawPreview = (mouseX: number, mouseY: number) => {
    if (!canvas || !startPoint) return;

    onRedraw();

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.globalAlpha = 0.5;

    if (shadow) {
      ctx.shadowColor = shadowColor;
      ctx.shadowOffsetY = shadowOffset;
      ctx.shadowBlur = shadowBlur;
    }

    const effectiveArcHeight = bendEnabled ? arcHeight : 0;
    const controlX = (startPoint.x + mouseX) / 2;
    const controlY = Math.min(startPoint.y, mouseY) - effectiveArcHeight;

    const gradient = ctx.createLinearGradient(startPoint.x, startPoint.y, mouseX, mouseY);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, color + '4D');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = thickness;
    if (dashed) {
      ctx.setLineDash([10, 5]);
    }

    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.quadraticCurveTo(controlX, controlY, mouseX, mouseY);
    ctx.stroke();

    ctx.setLineDash([]);

    const t = 0.99;
    const arrowX = (1 - t) * (1 - t) * startPoint.x + 2 * (1 - t) * t * controlX + t * t * mouseX;
    const arrowY = (1 - t) * (1 - t) * startPoint.y + 2 * (1 - t) * t * controlY + t * t * mouseY;

    const dx = mouseX - controlX;
    const dy = mouseY - controlY;
    const angle = Math.atan2(dy, dx);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(mouseX, mouseY);
    ctx.lineTo(
      arrowX - headSize * Math.cos(angle - Math.PI / 6),
      arrowY - headSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      arrowX - headSize * Math.cos(angle + Math.PI / 6),
      arrowY - headSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  return (
    <div className="space-y-6">
      <div className="text-center pb-4 border-b">
        <h3 className="text-lg font-bold text-text">Curved Arrow Properties</h3>
      </div>

      <div>
        <label className="text-sm font-semibold text-text block mb-2">Color</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-16 h-10 rounded border-2 cursor-pointer"
          />
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between mb-2">
          <label className="text-sm font-semibold text-text">Thickness</label>
          <span className="text-sm text-gray-600">{thickness}px</span>
        </div>
        <input
          type="range"
          min="2"
          max="30"
          value={thickness}
          onChange={(e) => setThickness(parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <div className="flex justify-between mb-2">
          <label className="text-sm font-semibold text-text">Head Size</label>
          <span className="text-sm text-gray-600">{headSize}px</span>
        </div>
        <input
          type="range"
          min="5"
          max="40"
          value={headSize}
          onChange={(e) => setHeadSize(parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-text">Dashed Line</label>
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

      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-text">Enable Bend</label>
        <button
          onClick={() => setBendEnabled(!bendEnabled)}
          className={`w-12 h-6 rounded-full transition-colors relative ${
            bendEnabled ? 'bg-orange-gradient' : 'bg-gray-300'
          }`}
        >
          <div
            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
              bendEnabled ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {bendEnabled && (
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-semibold text-text">Arc Height</label>
            <span className="text-sm text-gray-600">{arcHeight}</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={arcHeight}
            onChange={(e) => setArcHeight(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-text">Shadow</label>
        <button
          onClick={() => setShadow(!shadow)}
          className={`w-12 h-6 rounded-full transition-colors relative ${
            shadow ? 'bg-orange-gradient' : 'bg-gray-300'
          }`}
        >
          <div
            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
              shadow ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {shadow && (
        <>
          <div>
            <label className="text-sm font-semibold text-text block mb-2">Shadow Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={shadowColor}
                onChange={(e) => setShadowColor(e.target.value)}
                className="w-16 h-10 rounded border-2 cursor-pointer"
              />
              <input
                type="text"
                value={shadowColor}
                onChange={(e) => setShadowColor(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-semibold text-text">Shadow Offset</label>
              <span className="text-sm text-gray-600">{shadowOffset}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={shadowOffset}
              onChange={(e) => setShadowOffset(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-semibold text-text">Shadow Blur</label>
              <span className="text-sm text-gray-600">{shadowBlur}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={shadowBlur}
              onChange={(e) => setShadowBlur(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </>
      )}

      <div className="pt-4 border-t">
        <p className="text-sm text-gray-500 text-center mb-2">
          {startPoint ? 'Click to set end point' : 'Click to set start point'}
        </p>
        <p className="text-sm text-gray-500 text-center">
          Right-click to cancel
        </p>
      </div>
    </div>
  );
}
