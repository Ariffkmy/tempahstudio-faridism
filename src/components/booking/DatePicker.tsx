import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
}

export function DatePicker({ selected, onSelect, disabled }: DatePickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);

  const defaultDisabled = (date: Date) => {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    return dateOnly < today || date > maxDate || date.getDay() === 0;
  };

  return (
    <Card variant="outline" className="p-4">
      <h3 className="font-semibold mb-4">Pilih Tarikh</h3>
      <Calendar
        mode="single"
        selected={selected}
        onSelect={onSelect}
        disabled={disabled || defaultDisabled}
        className={cn("rounded-md pointer-events-auto")}
      />
    </Card>
  );
}
