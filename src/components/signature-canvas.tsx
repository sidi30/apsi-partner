import { useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface SigCanvasProps {
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

function getPos(
  e: React.MouseEvent | React.TouchEvent,
  canvas: HTMLCanvasElement
) {
  const r = canvas.getBoundingClientRect();
  const src = "touches" in e ? e.touches[0] : e;
  return {
    x: (src.clientX - r.left) * (canvas.width / r.width),
    y: (src.clientY - r.top) * (canvas.height / r.height),
  };
}

export function SignatureCanvas({ onSave, onCancel }: SigCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const start = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const p = getPos(e, canvas);
      const ctx = canvas.getContext("2d")!;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      drawing.current = true;
    },
    []
  );

  const move = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!drawing.current) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const p = getPos(e, canvas);
      const ctx = canvas.getContext("2d")!;
      ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = "#00D9A8";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    },
    []
  );

  const stop = useCallback(() => {
    drawing.current = false;
  }, []);

  const clear = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
  }, []);

  return (
    <div>
      <div className="bg-surface border border-accent/20 rounded-xl mb-2.5 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={500}
          height={140}
          className="block cursor-crosshair touch-none w-full"
          style={{ height: "140px" }}
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={stop}
          onMouseLeave={stop}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={stop}
        />
      </div>
      <p className="text-muted text-[0.72rem] mb-3">
        Dessinez votre signature dans le cadre
      </p>
      <div className="flex gap-2">
        <Button small variant="ghost" onClick={clear}>
          Effacer
        </Button>
        <Button small variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
        <Button
          small
          onClick={() => onSave(canvasRef.current!.toDataURL())}
        >
          Valider
        </Button>
      </div>
    </div>
  );
}
