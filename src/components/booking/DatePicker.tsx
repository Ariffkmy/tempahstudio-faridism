import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
}

export function DatePicker({ selected, onSelect }: DatePickerProps) {
  const today = new Date();
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);

  return (
    <Card variant="outline" className="p-4">
      <h3 className="font-semibold mb-4">Select Date</h3>
      <Calendar
        mode="single"
        selected={selected}
        onSelect={onSelect}
        disabled={(date) => date < today || date > maxDate || date.getDay() === 0}
        className={cn("rounded-md pointer-events-auto")}
      />
      <p className="text-xs text-muted-foreground mt-3">
        Closed on Sundays. Book up to 3 months in advance.
      </p>
    </Card>
  );
}
