
import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check, PenTool } from 'lucide-react';
import Button from './Button';

interface Props {
  onSave: (base64Signature: string) => void;
  onClear: () => void;
  existingSignature?: string;
}

const SignaturePad: React.FC<Props> = ({ onSave, onClear, existingSignature }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    // Resize canvas to fit container
    const canvas = canvasRef.current;
    if (canvas) {
        const rect = canvas.parentElement?.getBoundingClientRect();
        if (rect) {
            canvas.width = rect.width;
            canvas.height = 200;
        }
        
        // Context setup
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#000000';
        }
    }
  }, []);

  const getCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in event) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = (event as React.MouseEvent).clientX;
        clientY = (event as React.MouseEvent).clientY;
    }

    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling on touch
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.beginPath();
    ctx?.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
        ctx.lineTo(x, y);
        ctx.stroke();
        setHasSignature(true);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleSave = () => {
      const canvas = canvasRef.current;
      if (canvas) {
          const dataUrl = canvas.toDataURL('image/png');
          onSave(dataUrl);
      }
  };

  const handleClear = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          setHasSignature(false);
          onClear();
      }
  };

  if (existingSignature) {
      return (
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800 text-center">
              <p className="text-sm text-green-600 dark:text-green-400 font-bold mb-2 flex items-center justify-center">
                  <Check size={16} className="mr-1.5" /> Assinado Digitalmente
              </p>
              <img src={existingSignature} alt="Assinatura" className="max-h-24 mx-auto mb-3 border-b border-gray-300 dark:border-gray-600 pb-2" />
              <button 
                onClick={onClear}
                className="text-xs text-red-500 hover:underline"
              >
                Remover Assinatura
              </button>
          </div>
      )
  }

  return (
    <div className="w-full">
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-50 touch-none relative overflow-hidden group">
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-[200px] cursor-crosshair"
            />
            {!hasSignature && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
                    <span className="text-gray-400 font-handwriting text-xl">Assine aqui</span>
                </div>
            )}
        </div>
        
        <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                <PenTool size={12} className="mr-1" /> Use o dedo ou mouse
            </p>
            <div className="flex gap-2">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleClear} 
                    className="text-gray-500"
                    disabled={!hasSignature}
                >
                    <Eraser size={16} className="mr-1" /> Limpar
                </Button>
                <Button 
                    size="sm" 
                    onClick={handleSave}
                    disabled={!hasSignature}
                    className={hasSignature ? 'animate-pulse' : ''}
                >
                    <Check size={16} className="mr-1" /> Confirmar Assinatura
                </Button>
            </div>
        </div>
    </div>
  );
};

export default SignaturePad;
