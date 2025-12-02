import { Link } from 'react-router-dom';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Calendar, Clock, MapPin, Mail } from 'lucide-react';

const BookingConfirmation = () => {
  return (
    <div className="min-h-screen bg-muted/20">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container">
          <div className="max-w-xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-6 animate-scale-in">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>

            <h1 className="text-3xl font-bold mb-2 animate-slide-up">Booking Confirmed!</h1>
            <p className="text-muted-foreground mb-8 animate-slide-up stagger-1">
              Your studio session has been successfully booked. We've sent a confirmation to your email.
            </p>

            <Card className="text-left mb-8 animate-slide-up stagger-2">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <span>Booking Reference</span>
                </div>
                <p className="text-2xl font-mono font-bold mb-6">RAYA-2024-004</p>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Thursday, December 12, 2024</p>
                      <p className="text-sm text-muted-foreground">Premium Suite</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">10:00 AM – 2:00 PM</p>
                      <p className="text-sm text-muted-foreground">4 hours</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Raya Studio KL</p>
                      <p className="text-sm text-muted-foreground">Kuala Lumpur, Malaysia</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Confirmation sent to</p>
                      <p className="text-sm text-muted-foreground">your@email.com</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border flex justify-between items-center">
                  <span className="text-muted-foreground">Total Paid</span>
                  <span className="text-xl font-bold text-primary">RM 1,176.00</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-3 justify-center animate-slide-up stagger-3">
              <Button variant="outline" asChild>
                <Link to="/">Return Home</Link>
              </Button>
              <Button asChild>
                <Link to="/book">Book Another Session</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookingConfirmation;
