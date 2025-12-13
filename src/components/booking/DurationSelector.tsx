import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';

interface DurationSelectorProps {
  duration: number;
  onDurationChange: (duration: number) => void;
  minDuration?: number;
  maxDuration?: number;
}

export function DurationSelector({
  duration,
  onDurationChange,
  minDuration = 1,
  maxDuration = 8,
}: DurationSelectorProps) {
  return (
    <Card variant="outline" className="p-4">
      <h3 className="font-semibold mb-4">Tempoh</h3>

      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onDurationChange(Math.max(minDuration, duration - 1))}
          disabled={duration <= minDuration}
        >
          <Minus className="h-4 w-4" />
        </Button>

        <div className="text-center min-w-[100px]">
          <span className="text-3xl font-bold">{duration}</span>
          <span className="text-muted-foreground ml-2">
            {duration === 1 ? 'jam' : 'jam'}
          </span>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onDurationChange(Math.min(maxDuration, duration + 1))}
          disabled={duration >= maxDuration}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-3">
        Minimum {minDuration} jam, maksimum {maxDuration} jam
      </p>
    </Card>
  );
}
