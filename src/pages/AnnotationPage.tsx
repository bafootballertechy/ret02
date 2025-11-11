import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Undo,
  Trash2,
  Circle as CircleIcon,
  ArrowRight,
  Triangle,
  Zap,
  Sun,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import SpotlightTool from '../components/tools/SpotlightTool';
import CircleTool from '../components/tools/CircleTool';
import PolygonTool from '../components/tools/PolygonTool';
import CurvedArrowTool from '../components/tools/CurvedArrowTool';

type ToolType = 'spotlight' | 'circle' | 'polygon' | 'arrow' | null;

interface DrawingData {
  tool: ToolType;
  properties: any;
}

export default function AnnotationPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frozenFrame, setFrozenFrame] = useState<string>('');
  const [currentTool, setCurrentTool] = useState<ToolType>(null);
  const [drawings, setDrawings] = useState<DrawingData[]>([]);
  const [fadeIn, setFadeIn] = useState(true);
  const [fadeOut, setFadeOut] = useState(true);
  const [duration, setDuration] = useState(3);
  const [editingAnnotation, setEditingAnnotation] = useState<any>(null);
  const [freezeTime, setFreezeTime] = useState(0);
  const navigate = useNavigate();

  const presetColors = ['#FF3C00', '#FFD700', '#FFFFFF', '#0066FF', '#00FF00', '#FF0000'];
  const [selectedPreset, setSelectedPreset] = useState<string | null>('#FF3C00');

  useEffect(() => {
    const frame = sessionStorage.getItem('frozenFrame');
    const time = sessionStorage.getItem('freezeTime');
    const editing = sessionStorage.getItem('editingAnnotation');

    if (frame) {
      setFrozenFrame(frame);
    }

    if (time) {
      setFreezeTime(parseFloat(time));
    }

    if (editing) {
      const annotationData = JSON.parse(editing);
      setEditingAnnotation(annotationData);
      setDrawings(annotationData.drawings || []);
      setFadeIn(annotationData.fade_in);
      setFadeOut(annotationData.fade_out);
      setDuration(annotationData.duration);
      if (annotationData.color) {
        setSelectedPreset(annotationData.color);
      }
    }
  }, []);

  useEffect(() => {
    if (frozenFrame && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        redrawAll();
      };
      img.src = frozenFrame;
    }
  }, [frozenFrame]);

  const redrawAll = () => {
    if (!canvasRef.current || !frozenFrame) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      drawings.forEach((drawing) => {
        if (drawing.tool === 'spotlight') {
          drawSpotlight(ctx, drawing.properties);
        } else if (drawing.tool === 'circle') {
          drawCircle(ctx, drawing.properties);
        } else if (drawing.tool === 'polygon') {
          drawPolygon(ctx, drawing.properties);
        } else if (drawing.tool === 'arrow') {
          drawCurvedArrow(ctx, drawing.properties);
        }
      });
    };
    img.src = frozenFrame;
  };

  const drawSpotlight = (ctx: CanvasRenderingContext2D, props: any) => {
    const { x, y, size, intensity, rotation } = props;

    ctx.save();
    ctx.translate(x, y);

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
    gradient.addColorStop(0.5, `rgba(255, 255, 255, ${intensity * 0.5})`);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.scale(1, rotation);
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(255, 255, 255, ${intensity * 0.8})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.9, 0, Math.PI * 2);
    ctx.stroke();

    if (props.particles) {
      props.particles.forEach((particle: any) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.6})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    ctx.restore();
  };

  const drawCircle = (ctx: CanvasRenderingContext2D, props: any) => {
    const { x, y, radius, outerColor, innerColor, glow, rotateX, scale } = props;

    ctx.save();
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
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = innerColor;
    ctx.lineWidth = 6;
    ctx.setLineDash([20, 10]);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
    ctx.restore();
  };

  const drawPolygon = (ctx: CanvasRenderingContext2D, props: any) => {
    const { vertices, borderColor, borderThickness, dashed, fillColor, fillOpacity, markerSize } = props;

    if (vertices.length < 2) return;

    ctx.save();

    ctx.fillStyle = fillColor;
    ctx.globalAlpha = fillOpacity / 100;
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderThickness;
    if (dashed) {
      ctx.setLineDash([10, 5]);
    }
    ctx.stroke();

    ctx.setLineDash([]);
    vertices.forEach((vertex: any) => {
      ctx.fillStyle = borderColor;
      ctx.shadowColor = 'white';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(vertex.x, vertex.y, markerSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    ctx.restore();
  };

  const drawCurvedArrow = (ctx: CanvasRenderingContext2D, props: any) => {
    const { startX, startY, endX, endY, color, thickness, headSize, dashed, arcHeight, shadow, shadowColor, shadowOffset, shadowBlur } = props;

    ctx.save();

    if (shadow) {
      ctx.shadowColor = shadowColor;
      ctx.shadowOffsetY = shadowOffset;
      ctx.shadowBlur = shadowBlur;
    }

    const controlX = (startX + endX) / 2;
    const controlY = Math.min(startY, endY) - arcHeight;

    const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, color + '4D');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = thickness;
    if (dashed) {
      ctx.setLineDash([10, 5]);
    }

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(controlX, controlY, endX, endY);
    ctx.stroke();

    ctx.setLineDash([]);

    const t = 0.99;
    const arrowX = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * controlX + t * t * endX;
    const arrowY = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * controlY + t * t * endY;

    const dx = endX - controlX;
    const dy = endY - controlY;
    const angle = Math.atan2(dy, dx);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(endX, endY);
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

    ctx.strokeStyle = adjustBrightness(color, -20);
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  };

  const adjustBrightness = (color: string, amount: number) => {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.slice(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.slice(2, 4), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.slice(4, 6), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const handleUndo = () => {
    setDrawings(prev => prev.slice(0, -1));
    setTimeout(redrawAll, 0);
  };

  const handleClearAll = () => {
    setDrawings([]);
    setTimeout(redrawAll, 0);
  };

  const handleCancel = () => {
    sessionStorage.removeItem('frozenFrame');
    sessionStorage.removeItem('freezeTime');
    sessionStorage.removeItem('editingAnnotation');
    navigate('/analysis');
  };

  const handleSave = async () => {
    if (drawings.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const thumbnail = canvas.toDataURL('image/jpeg', 0.3);
    const videoName = sessionStorage.getItem('videoName') || 'Untitled Video';

    const annotationData = {
      video_name: videoName,
      timestamp: freezeTime,
      type: currentTool || 'mixed',
      drawings: drawings,
      fade_in: fadeIn,
      fade_out: fadeOut,
      duration: duration,
      color: selectedPreset || '#FF3C00',
      thumbnail: thumbnail,
    };

    if (editingAnnotation) {
      const { error } = await supabase
        .from('annotations')
        .update({
          ...annotationData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingAnnotation.id);

      if (!error) {
        sessionStorage.removeItem('editingAnnotation');
        navigate('/analysis');
      }
    } else {
      const { error } = await supabase
        .from('annotations')
        .insert([annotationData]);

      if (!error) {
        navigate('/analysis');
      }
    }
  };

  const handlePresetColorSelect = (color: string, e: React.MouseEvent) => {
    if (e.button === 2) {
      e.preventDefault();
      const newColor = prompt('Enter a hex color code:', color);
      if (newColor && /^#[0-9A-F]{6}$/i.test(newColor)) {
        setSelectedPreset(newColor);
      }
    } else {
      setSelectedPreset(color);
    }
  };

  const addDrawing = (tool: ToolType, properties: any) => {
    setDrawings(prev => [...prev, { tool, properties }]);
    setTimeout(redrawAll, 0);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-8 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-text" />
            </button>
            <h1 className="text-xl font-bold text-text">Annotation Mode</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-text">Duration:</span>
              <input
                type="range"
                min="2"
                max="5"
                step="0.5"
                value={duration}
                onChange={(e) => setDuration(parseFloat(e.target.value))}
                className="w-32"
              />
              <span className="text-sm font-semibold text-text w-8">{duration}s</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-[70vh] cursor-crosshair"
              style={{ display: 'block' }}
            />
          </div>
        </div>

        <div className="w-96 bg-white border-l border-gray-200 p-6 overflow-y-auto">
          {currentTool === 'spotlight' && (
            <SpotlightTool
              canvas={canvasRef.current}
              onAdd={addDrawing}
              selectedPreset={selectedPreset}
              onRedraw={redrawAll}
            />
          )}
          {currentTool === 'circle' && (
            <CircleTool
              canvas={canvasRef.current}
              onAdd={addDrawing}
              selectedPreset={selectedPreset}
              onRedraw={redrawAll}
            />
          )}
          {currentTool === 'polygon' && (
            <PolygonTool
              canvas={canvasRef.current}
              onAdd={addDrawing}
              selectedPreset={selectedPreset}
              onRedraw={redrawAll}
            />
          )}
          {currentTool === 'arrow' && (
            <CurvedArrowTool
              canvas={canvasRef.current}
              onAdd={addDrawing}
              selectedPreset={selectedPreset}
              onRedraw={redrawAll}
            />
          )}
          {!currentTool && (
            <div className="text-center text-gray-400 py-12">
              <p>Select a tool to start drawing</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentTool('spotlight')}
              className={`p-4 rounded-xl transition-all ${
                currentTool === 'spotlight'
                  ? 'bg-orange-gradient text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-text hover:bg-gray-200'
              }`}
            >
              <Sun className="w-6 h-6" />
            </button>
            <button
              onClick={() => setCurrentTool('circle')}
              className={`p-4 rounded-xl transition-all ${
                currentTool === 'circle'
                  ? 'bg-orange-gradient text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-text hover:bg-gray-200'
              }`}
            >
              <CircleIcon className="w-6 h-6" />
            </button>
            <button
              onClick={() => setCurrentTool('polygon')}
              className={`p-4 rounded-xl transition-all ${
                currentTool === 'polygon'
                  ? 'bg-orange-gradient text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-text hover:bg-gray-200'
              }`}
            >
              <Triangle className="w-6 h-6" />
            </button>
            <button
              onClick={() => setCurrentTool('arrow')}
              className={`p-4 rounded-xl transition-all ${
                currentTool === 'arrow'
                  ? 'bg-orange-gradient text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-text hover:bg-gray-200'
              }`}
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {presetColors.map((color) => (
              <button
                key={color}
                onClick={(e) => handlePresetColorSelect(color, e)}
                onContextMenu={(e) => handlePresetColorSelect(color, e)}
                className={`w-10 h-10 rounded-full transition-all ${
                  selectedPreset === color ? 'ring-4 ring-primary scale-110' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
            <button
              onClick={() => setSelectedPreset(null)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                selectedPreset === null
                  ? 'bg-orange-gradient text-white'
                  : 'bg-gray-100 text-text hover:bg-gray-200'
              }`}
            >
              Custom
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleUndo}
              disabled={drawings.length === 0}
              className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Undo className="w-5 h-5 text-text" />
            </button>
            <button
              onClick={handleClearAll}
              disabled={drawings.length === 0}
              className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-5 h-5 text-text" />
            </button>
            <button
              onClick={handleCancel}
              className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-text font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={drawings.length === 0}
              className="px-6 py-3 rounded-xl bg-orange-gradient text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingAnnotation ? 'Update Annotation' : 'Add to Video'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
