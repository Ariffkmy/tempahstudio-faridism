import { format } from 'date-fns';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StudioLayout } from '@/types/booking';
import { Calendar, Clock, MapPin } from 'lucide-react';

interface BookingSummaryProps {
  layout: StudioLayout | null;
  date: Date | undefined;
  startTime: string | null;
  duration: number;
  onConfirm: () => void;
  isValid: boolean;
}

export function BookingSummary({
  layout,
  date,
  startTime,
  duration,
  onConfirm,
  isValid,
}: BookingSummaryProps) {
  const subtotal = layout ? layout.pricePerHour * duration : 0;
  const serviceFee = subtotal * 0.05;
  const total = subtotal + serviceFee;

  const getEndTime = () => {
    if (!startTime) return '--:--';
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHour = hours + duration;
    return `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle className="text-lg">Booking Summary</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {layout ? (
          <>
            <div>
              <p className="font-medium">{layout.name}</p>
              <p className="text-sm text-muted-foreground">RM {layout.pricePerHour}/hour</p>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{date ? format(date, 'EEEE, MMMM d, yyyy') : 'Select a date'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{startTime || '--:--'} – {getEndTime()} ({duration}h)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>Raya Studio KL</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  RM {layout.pricePerHour} × {duration} hours
                </span>
                <span>RM {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service fee (5%)</span>
                <span>RM {serviceFee.toFixed(2)}</span>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-primary">RM {total.toFixed(2)}</span>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Select a studio layout to see pricing
          </p>
        )}
      </CardContent>

      <CardFooter>
        <Button 
          className="w-full" 
          size="lg" 
          disabled={!isValid}
          onClick={onConfirm}
        >
          Proceed to Payment
        </Button>
      </CardFooter>
    </Card>
  );
}
