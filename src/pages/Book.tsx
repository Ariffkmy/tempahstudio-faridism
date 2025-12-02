import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { DatePicker } from '@/components/booking/DatePicker';
import { TimeSlots } from '@/components/booking/TimeSlots';
import { DurationSelector } from '@/components/booking/DurationSelector';
import { LayoutSelector } from '@/components/booking/LayoutSelector';
import { ContactForm } from '@/components/booking/ContactForm';
import { BookingSummary } from '@/components/booking/BookingSummary';
import { mockLayouts, generateTimeSlots } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

const Book = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const initialLayout = searchParams.get('layout') || null;

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<string | null>(initialLayout);
  const [duration, setDuration] = useState(2);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });

  const timeSlots = useMemo(() => {
    if (!selectedDate || !selectedLayout) return [];
    return generateTimeSlots(selectedDate, selectedLayout);
  }, [selectedDate, selectedLayout]);

  const layout = mockLayouts.find((l) => l.id === selectedLayout) || null;

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
      title: "Booking Submitted",
      description: "Redirecting to payment... (Demo mode)",
    });
    
    // In production, this would redirect to payment gateway
    setTimeout(() => {
      navigate('/booking/confirmation');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Book Your Studio</h1>
              <p className="text-muted-foreground">
                Select your preferred date, time, and studio layout
              </p>
            </div>

            <div className="grid lg:grid-cols-[1fr,340px] gap-8">
              {/* Left Column - Form */}
              <div className="space-y-6">
                <LayoutSelector
                  layouts={mockLayouts}
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
                  
                  {selectedDate && (
                    <TimeSlots
                      slots={timeSlots}
                      selectedTime={selectedTime}
                      onSelectTime={setSelectedTime}
                    />
                  )}
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

export default Book;
