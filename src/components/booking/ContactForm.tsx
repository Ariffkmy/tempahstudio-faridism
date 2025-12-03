import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ContactFormProps {
  formData: {
    name: string;
    email: string;
    phone: string;
    notes: string;
  };
  onFormChange: (field: string, value: string) => void;
}

export function ContactForm({ formData, onFormChange }: ContactFormProps) {
  return (
    <Card variant="outline" className="p-4">
      <h3 className="font-semibold mb-4">Maklumat Anda</h3>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nama Penuh *</Label>
          <Input
            id="name"
            placeholder="Masukkan nama penuh anda"
            value={formData.name}
            onChange={(e) => onFormChange('name', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Alamat Emel *</Label>
          <Input
            id="email"
            type="email"
            placeholder="anda@contoh.com"
            value={formData.email}
            onChange={(e) => onFormChange('email', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Nombor Telefon *</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+60 12-345 6789"
            value={formData.phone}
            onChange={(e) => onFormChange('phone', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Permintaan Khas (Pilihan)</Label>
          <Textarea
            id="notes"
            placeholder="Sebarang keperluan khas atau nota..."
            value={formData.notes}
            onChange={(e) => onFormChange('notes', e.target.value)}
            rows={3}
          />
        </div>
      </div>
    </Card>
  );
}
