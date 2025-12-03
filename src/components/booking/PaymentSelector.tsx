import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Wallet, Building2, Download, Copy, Upload } from 'lucide-react';

interface PaymentSelectorProps {
  selectedPayment: string;
  onSelectPayment: (payment: string) => void;
  onFileUpload?: (type: 'receipt' | 'proof', file: File | null) => void;
}

// Mock admin settings - in production this would come from a context or API
const adminSettings = {
  bankAccountNumber: '1234567890123',
  accountOwnerName: 'Raya Studio KL Sdn Bhd',
  qrCode: '/placeholder.svg', // This would be the actual QR code file path
};

const paymentMethods = [
  {
    id: 'cash',
    name: 'Bayar melalui cash/QR di studio',
    description: 'Bayar secara tunai atau scan QR di premis studio',
    icon: CreditCard,
  },
  {
    id: 'qr',
    name: 'Bayar melalui QR sekarang',
    description: 'Bayar melalui QR code dan muat naik resit',
    icon: Wallet,
  },
  {
    id: 'bank',
    name: 'Pemindahan Bank',
    description: 'Bayar melalui bank transfer dan muat naik bukti pembayaran',
    icon: Building2,
  },
];

export function PaymentSelector({ selectedPayment, onSelectPayment, onFileUpload }: PaymentSelectorProps) {
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);

  const handleCopyAccountNumber = () => {
    navigator.clipboard.writeText(adminSettings.bankAccountNumber);
    // Could add toast notification here
  };

  const handleDownloadQR = () => {
    // In production, this would trigger a download of the QR code file
    const link = document.createElement('a');
    link.href = adminSettings.qrCode;
    link.download = 'payment-qr-code.png';
    link.click();
  };

  return (
    <Card variant="outline" className="p-4">
      <h3 className="font-semibold mb-4">Kaedah Pembayaran</h3>

      <RadioGroup value={selectedPayment} onValueChange={onSelectPayment}>
        <div className="space-y-3">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <div key={method.id} className="flex items-center space-x-3">
                <RadioGroupItem value={method.id} id={method.id} />
                <Label htmlFor={method.id} className="flex items-center gap-3 cursor-pointer flex-1">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium">{method.name}</div>
                    <div className="text-sm text-muted-foreground">{method.description}</div>
                  </div>
                </Label>
              </div>
            );
          })}
        </div>
      </RadioGroup>

      {/* QR Payment Details */}
      {selectedPayment === 'qr' && (
        <>
          <Separator className="my-4" />
          <div className="space-y-4">
            <h4 className="font-medium">Maklumat Pembayaran QR</h4>

            <div className="flex flex-col items-center space-y-4 p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Scan kod QR berikut untuk membuat pembayaran:</div>
              <img
                src={adminSettings.qrCode}
                alt="Payment QR Code"
                className="w-48 h-48 object-contain border rounded"
              />
              <Button variant="outline" onClick={handleDownloadQR} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Muat Turun Kod QR
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="receipt-upload">Muat Naik Resit Pembayaran *</Label>
              <Input
                id="receipt-upload"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setReceiptFile(file);
                  onFileUpload?.('receipt', file);
                }}
                required
              />
              {receiptFile && (
                <div className="text-sm text-muted-foreground">
                  Fail dipilih: {receiptFile.name}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Bank Transfer Details */}
      {selectedPayment === 'bank' && (
        <>
          <Separator className="my-4" />
          <div className="space-y-4">
            <h4 className="font-medium">Maklumat Perbankan</h4>

            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">No Akaun Bank:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{adminSettings.bankAccountNumber}</span>
                  <Button variant="outline" size="sm" onClick={handleCopyAccountNumber}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Nama Pemilik Akaun:</span>
                <span className="text-sm">{adminSettings.accountOwnerName}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proof-upload">Muat Naik Bukti Pembayaran *</Label>
              <Input
                id="proof-upload"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setProofFile(file);
                  onFileUpload?.('proof', file);
                }}
                required
              />
              {proofFile && (
                <div className="text-sm text-muted-foreground">
                  Fail dipilih: {proofFile.name}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
