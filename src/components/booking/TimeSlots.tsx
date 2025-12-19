import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TimeSlotsProps {
  slots: { time: string; available: boolean }[];
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
}

export function TimeSlots({ slots, selectedTime, onSelectTime }: TimeSlotsProps) {
  console.log('⏰ TimeSlots component received:', {
    totalSlots: slots.length,
    availableSlots: slots.filter(s => s.available).length,
    unavailableSlots: slots.filter(s => !s.available).length,
    slots: slots.map(s => ({ time: s.time, available: s.available }))
  });

  return (
    <Card variant="outline" className="p-4">
      <h3 className="font-semibold mb-4">Pilih Slot Masa</h3>

      <div className="grid grid-cols-3 gap-2">
        {slots.map((slot) => (
          <Button
            key={slot.time}
            variant={selectedTime === slot.time ? 'default' : 'outline'}
            size="sm"
            disabled={!slot.available}
            onClick={() => {
              console.log('🖱️ Slot clicked:', { time: slot.time, available: slot.available });
              if (slot.available) {
                onSelectTime(slot.time);
              }
            }}
            className={cn(
              "font-mono",
              !slot.available && "opacity-40 cursor-not-allowed"
            )}
          >
            {slot.time}
          </Button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        All times are in Malaysia time (UTC+8)
      </p>
    </Card>
  );
}
