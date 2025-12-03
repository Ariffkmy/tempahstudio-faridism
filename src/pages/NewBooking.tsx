import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutSelector } from '@/components/booking/LayoutSelector';
import { DatePicker } from '@/components/booking/DatePicker';
import { TimeSlots } from '@/components/booking/TimeSlots';
import { ContactForm } from '@/components/booking/ContactForm';
import { PaymentSelector } from '@/components/booking/PaymentSelector';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { mockLayouts, generateTimeSlots } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, ArrowRight } from 'lucide-react';

const NewBooking = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [uploadedFiles, setUploadedFiles] = useState({
    receipt: null as File | null,
    proof: null as File | null,
  });

  const layout = mockLayouts.find((l) => l.id === selectedLayout) || null;

  const isFormValid = Boolean(
    selectedLayout &&
    selectedPayment &&
    formData.name.trim() &&
    formData.email.trim() &&
    formData.phone.trim() &&
    (selectedPayment === 'cash' ||
     (selectedPayment === 'qr' && uploadedFiles.receipt) ||
     (selectedPayment === 'bank' && uploadedFiles.proof))
  );

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (type: 'receipt' | 'proof', file: File | null) => {
    setUploadedFiles((prev) => ({ ...prev, [type]: file }));
  };

  const handleSubmit = () => {
    if (!isFormValid) return;

    toast({
      title: "Tempahan Berjaya",
      description: "Tempahan anda telah dihantar untuk pengesahan.",
    });

    // In production, this would create the booking
    setTimeout(() => {
      navigate('/booking/confirmation');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <main className="pt-8 pb-16">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <div className="text-center mb-6">
              <img src="/studiorayalogo.png" alt="logo studio anda" className="mx-auto h-16 w-auto mb-2" />
              <p className="text-sm text-muted-foreground">Akan digantikan dengan logo studio anda</p>
              <h2 className="text-m bold">Nama studio anda</h2>
            </div>
            <h1 className="text-xl font-bold mb-2">Tempahan studio raya</h1>
            <p className="text-muted-foreground">
              Isi maklumat dan buat pembayaran untuk tempahan slot anda.
            </p>
          </div>

          <div className="space-y-6">
            {/* Layout Selection */}
            <LayoutSelector
              layouts={mockLayouts}
              selectedLayout={selectedLayout}
              onSelectLayout={setSelectedLayout}
            />

            {/* Contact Form */}
            <ContactForm
              formData={formData}
              onFormChange={handleFormChange}
            />

            {/* Payment Selection */}
            <PaymentSelector
              selectedPayment={selectedPayment}
              onSelectPayment={setSelectedPayment}
              onFileUpload={handleFileUpload}
            />

            {/* Date Selection */}
            <DatePicker
              selected={selectedDate}
              onSelect={setSelectedDate}
            />

            {/* Time Selection */}
            <TimeSlots
              slots={generateTimeSlots(selectedDate, selectedLayout)}
              selectedTime={selectedTime}
              onSelectTime={setSelectedTime}
            />

            {/* Summary Card */}
            {layout && (
              <Card variant="outline" className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Ringkasan Tempahan
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Layout:</span>
                    <span className="font-medium">{layout.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Kaedah Pembayaran:</span>
                    <span className="font-medium">
                      {selectedPayment === 'cash' ? 'Bayar melalui cash/QR di studio' :
                       selectedPayment === 'qr' ? 'Bayar melalui QR sekarang' :
                       selectedPayment === 'bank' ? 'Pemindahan Bank' : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Pelanggan:</span>
                    <span className="font-medium">{formData.name || '-'}</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid}
                size="lg"
                className="min-w-[200px]"
              >
                Hantar Tempahan
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NewBooking;
