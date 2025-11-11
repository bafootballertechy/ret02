import { useState, useEffect } from 'react';

interface SpotlightToolProps {
  canvas: HTMLCanvasElement | null;
  onAdd: (tool: 'spotlight', properties: any) => void;
  selectedPreset: string | null;
  onRedraw: () => void;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  angle: number;
  distance: number;
}

export default function SpotlightTool({ canvas, onAdd, selectedPreset, onRedraw }: SpotlightToolProps) {
  const [beamSize, setBeamSize] = useState(90);
  const [intensity, setIntensity] = useState(0.8);
  const [rotation, setRotation] = useState(0.6);
  const [ghostSpotlight, setGhostSpotlight] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setGhostSpotlight({ x, y });
      drawGhost(x, y);
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const particles: Particle[] = [];
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        particles.push({
          x: Math.cos(angle) * beamSize * 0.8,
          y: Math.sin(angle) * beamSize * 0.8 * rotation,
          size: 3,
          angle,
          distance: beamSize * 0.8,
        });
      }

      onAdd('spotlight', {
        x,
        y,
        size: beamSize,
        intensity,
        rotation,
        particles,
      });
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [canvas, beamSize, intensity, rotation, onAdd]);

  const drawGhost = (x: number, y: number) => {
    if (!canvas) return;

    onRedraw();

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.translate(x, y);

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, beamSize);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
    gradient.addColorStop(0.5, `rgba(255, 255, 255, ${intensity * 0.5})`);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.scale(1, rotation);
    ctx.beginPath();
    ctx.arc(0, 0, beamSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(255, 255, 255, ${intensity * 0.8})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, beamSize * 0.9, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const px = Math.cos(angle) * beamSize * 0.8;
      const py = Math.sin(angle) * beamSize * 0.8 * rotation;

      ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.6})`;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  return (
    <div className="space-y-6">
      <div className="text-center pb-4 border-b">
        <h3 className="text-lg font-bold text-text">Spotlight Properties</h3>
      </div>

      <div>
        <div className="flex justify-between mb-2">
          <label className="text-sm font-semibold text-text">Beam Size</label>
          <span className="text-sm text-gray-600">{beamSize}px</span>
        </div>
        <input
          type="range"
          min="30"
          max="150"
          value={beamSize}
          onChange={(e) => setBeamSize(parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <div className="flex justify-between mb-2">
          <label className="text-sm font-semibold text-text">Intensity</label>
          <span className="text-sm text-gray-600">{Math.round(intensity * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={intensity}
          onChange={(e) => setIntensity(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <div className="flex justify-between mb-2">
          <label className="text-sm font-semibold text-text">Rotation (Depth)</label>
          <span className="text-sm text-gray-600">{Math.round(rotation * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.2"
          max="1"
          step="0.1"
          value={rotation}
          onChange={(e) => setRotation(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="pt-4 border-t">
        <p className="text-sm text-gray-500 text-center">
          Click on the canvas to place spotlight
        </p>
      </div>
    </div>
  );
}
