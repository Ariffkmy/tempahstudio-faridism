import { Link, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { BookingWithDetails } from '@/types/database';

const BookingConfirmation = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const booking = location.state?.booking as BookingWithDetails;
  const reference = location.state?.reference || booking?.reference || 'RAYA-2024-001';

  // Determine navigation paths based on user type
  // For "Book Another Session", always go to the booking form with the same studio
  const studioBookingPath = booking?.studio?.id
    ? `/book/${booking.studio.id}`
    : '/book';
  const bookAnotherSessionPath = studioBookingPath;
  const backToHomePath = isAuthenticated ? '/admin' : '/';

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ms-MY', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time range
  const formatTimeRange = (startTime: string, endTime: string) => {
    return `${startTime} – ${endTime}`;
  };
  return (
    <div className="min-h-screen bg-white">
      <main className="pt-8 pb-16">
        <div className="container">
          <div className="max-w-xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-6 animate-scale-in">
              <img src="/icons8-done.gif" alt="Done" className="w-12 h-12" />
            </div>

            <h1 className="text-3xl font-bold mb-2 animate-slide-up">Terima kasih kerana membuat tempahan</h1>
            <p className="text-muted-foreground mb-8 animate-slide-up stagger-1">
              Slot studio anda telah berjaya ditempah. Kami telah menghantar pengesahan ke emel anda.
            </p>

            <Card className="text-left mb-8 shadow-lg animate-slide-up stagger-2">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <span>Rujukan Tempahan</span>
                </div>
                <p className="text-2xl font-mono font-bold mb-6">{reference}</p>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {booking ? formatDate(booking.date) : 'Thursday, December 12, 2024'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking?.studio_layout?.name || 'Suite Perdana'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {booking ? formatTimeRange(booking.start_time, booking.end_time) : '10:00 AM – 2:00 PM'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking ? `${booking.duration} minit` : '240 minit'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">
                        {booking?.studio?.name || 'Tempah Studio'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking?.studio?.location || 'Kuala Lumpur, Malaysia'}
                      </p>

                      {/* Show map links if available */}
                      {(booking?.studio?.google_maps_link || booking?.studio?.waze_link) && (
                        <div className="flex items-center gap-2 mt-2">
                          {booking?.studio?.google_maps_link && (
                            <a
                              href={booking.studio.google_maps_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#4285F4] hover:bg-[#357ae8] rounded-md transition-colors"
                              title="Buka di Google Maps"
                            >
                              <img src="/google-maps-svgrepo-com.svg" alt="Google Maps" className="w-4 h-4" />
                              Google Maps
                            </a>
                          )}
                          {booking?.studio?.waze_link && (
                            <a
                              href={booking.studio.waze_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#33CCFF] hover:bg-[#00B8E6] rounded-md transition-colors"
                              title="Buka di Waze"
                            >
                              <img src="/brand-waze-svgrepo-com.svg" alt="Waze" className="w-4 h-4" />
                              Waze
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Pengesahan dihantar ke</p>
                      <p className="text-sm text-muted-foreground">
                        {booking?.customer?.email || 'your@email.com'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border flex justify-between items-center">
                  <span className="text-muted-foreground">Jumlah Dibayar</span>
                  <span className="text-xl font-bold text-primary">
                    RM {booking ? Number(booking.total_price).toFixed(2) : '1,176.00'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-3 justify-center animate-slide-up stagger-3">

              <Button asChild>
                <Link to={bookAnotherSessionPath}>Tempah Sesi Lain</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookingConfirmation;
