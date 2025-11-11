import { useState, useEffect } from 'react';

interface CircleToolProps {
  canvas: HTMLCanvasElement | null;
  onAdd: (tool: 'circle', properties: any) => void;
  selectedPreset: string | null;
  onRedraw: () => void;
}

export default function CircleTool({ canvas, onAdd, selectedPreset, onRedraw }: CircleToolProps) {
  const [outerColor, setOuterColor] = useState('#FF3C00');
  const [innerColor, setInnerColor] = useState('#FFD700');
  const [thickness, setThickness] = useState(80);
  const [glow, setGlow] = useState(20);
  const [rotateX, setRotateX] = useState(0);
  const [scale, setScale] = useState(1);
  const [ghostCircle, setGhostCircle] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (selectedPreset) {
      setOuterColor(selectedPreset);
    }
  }, [selectedPreset]);

  useEffect(() => {
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setGhostCircle({ x, y });
      drawGhost(x, y);
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      onAdd('circle', {
        x,
        y,
        radius: thickness,
        outerColor,
        innerColor,
        glow,
        rotateX,
        scale,
      });
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [canvas, outerColor, innerColor, thickness, glow, rotateX, scale, onAdd]);

  const drawGhost = (x: number, y: number) => {
    if (!canvas) return;

    onRedraw();

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    if (rotateX !== 0) {
      ctx.transform(1, 0, 0, Math.cos(rotateX * Math.PI / 180), 0, 0);
    }

    if (glow > 0) {
      ctx.shadowColor = outerColor;
      ctx.shadowBlur = glow;
    }

    ctx.strokeStyle = outerColor;
    ctx.lineWidth = 11;
    ctx.setLineDash([28, 12]);
    ctx.beginPath();
    ctx.arc(0, 0, thickness, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = innerColor;
    ctx.lineWidth = 6;
    ctx.setLineDash([20, 10]);
    ctx.beginPath();
    ctx.arc(0, 0, thickness * 0.7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
    ctx.restore();
  };

  return (
    <div className="space-y-6">
      <div className="text-center pb-4 border-b">
        <h3 className="text-lg font-bold text-text">Circle Properties</h3>
      </div>

      <div>
        <label className="text-sm font-semibold text-text block mb-2">Outer Color</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={outerColor}
            onChange={(e) => setOuterColor(e.target.value)}
            className="w-16 h-10 rounded border-2 cursor-pointer"
          />
          <input
            type="text"
            value={outerColor}
            onChange={(e) => setOuterColor(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-text block mb-2">Inner Color</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={innerColor}
            onChange={(e) => setInnerColor(e.target.value)}
            className="w-16 h-10 rounded border-2 cursor-pointer"
          />
          <input
            type="text"
            value={innerColor}
            onChange={(e) => setInnerColor(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between mb-2">
          <label className="text-sm font-semibold text-text">Radius</label>
          <span className="text-sm text-gray-600">{thickness}px</span>
        </div>
        <input
          type="range"
          min="30"
          max="150"
          value={thickness}
          onChange={(e) => setThickness(parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <div className="flex justify-between mb-2">
          <label className="text-sm font-semibold text-text">Glow Intensity</label>
          <span className="text-sm text-gray-600">{glow}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="50"
          value={glow}
          onChange={(e) => setGlow(parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <div className="flex justify-between mb-2">
          <label className="text-sm font-semibold text-text">Rotation (3D Tilt)</label>
          <span className="text-sm text-gray-600">{rotateX}°</span>
        </div>
        <input
          type="range"
          min="-90"
          max="90"
          value={rotateX}
          onChange={(e) => setRotateX(parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <div className="flex justify-between mb-2">
          <label className="text-sm font-semibold text-text">Scale</label>
          <span className="text-sm text-gray-600">{scale.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={scale}
          onChange={(e) => setScale(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="pt-4 border-t">
        <p className="text-sm text-gray-500 text-center">
          Click on the canvas to place circle
        </p>
      </div>
    </div>
  );
}
