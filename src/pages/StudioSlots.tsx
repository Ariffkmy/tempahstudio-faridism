import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { DatePicker } from '@/components/booking/DatePicker';
import { TimeSlots } from '@/components/booking/TimeSlots';
import { DurationSelector } from '@/components/booking/DurationSelector';
import { LayoutSelector } from '@/components/booking/LayoutSelector';
import { ContactForm } from '@/components/booking/ContactForm';
import { BookingSummary } from '@/components/booking/BookingSummary';
import { mockStudios, generateTimeSlots } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const StudioSlots = () => {
  const { studioId } = useParams<{ studioId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const studio = mockStudios.find(s => s.id === studioId);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<string | null>(null);
  const [duration, setDuration] = useState(2);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });

  const timeSlots = useMemo(() => {
    return generateTimeSlots(selectedDate, selectedLayout);
  }, [selectedDate, selectedLayout]);

  const layout = studio?.layouts.find((l) => l.id === selectedLayout) || null;

  const isFormValid = Boolean(
    selectedLayout &&
    selectedDate &&
    selectedTime &&
    duration >= 1 &&
    formData.name.trim() &&
    formData.email.trim() &&
    formData.phone.trim()
  );

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleConfirm = () => {
    toast({
      title: "Tempahan Dihantar",
      description: "Mengalihkan ke pembayaran... (Mod demo)",
    });

    // In production, this would redirect to payment gateway
    setTimeout(() => {
      navigate('/booking/confirmation');
    }, 1500);
  };

  if (!studio) {
    return (
      <div className="min-h-screen bg-muted/20">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Studio tidak dijumpai</h1>
              <Button asChild>
                <Link to="/studios">Kembali ke senarai studio</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container">
          <div className="max-w-5xl mx-auto">
            {/* Back button and studio info */}
            <div className="mb-8">
              <Button variant="ghost" asChild className="mb-4">
                <Link to="/studios">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali ke senarai studio
                </Link>
              </Button>

              <div className="bg-card rounded-lg p-6 border">
                <h1 className="text-2xl font-bold mb-2">{studio.name}</h1>
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <MapPin className="h-4 w-4" />
                  <span>{studio.location}</span>
                </div>
                <p className="text-muted-foreground">{studio.description}</p>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">Tempah Slot Studio</h2>
              <p className="text-muted-foreground">
                Pilih tarikh, masa dan Layout studio pilihan anda
              </p>
            </div>

            <div className="grid lg:grid-cols-[1fr,340px] gap-8">
              {/* Left Column - Form */}
              <div className="space-y-6">
                <LayoutSelector
                  layouts={studio.layouts}
                  selectedLayout={selectedLayout}
                  onSelectLayout={setSelectedLayout}
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <DatePicker
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setSelectedTime(null);
                    }}
                  />

                  <TimeSlots
                    slots={timeSlots}
                    selectedTime={selectedTime}
                    onSelectTime={setSelectedTime}
                  />
                </div>

                <DurationSelector
                  duration={duration}
                  onDurationChange={setDuration}
                />

                <ContactForm
                  formData={formData}
                  onFormChange={handleFormChange}
                />
              </div>

              {/* Right Column - Summary */}
              <div>
                <BookingSummary
                  layout={layout}
                  date={selectedDate}
                  startTime={selectedTime}
                  duration={duration}
                  onConfirm={handleConfirm}
                  isValid={isFormValid}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default StudioSlots;
