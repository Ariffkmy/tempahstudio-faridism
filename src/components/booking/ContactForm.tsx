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
      <h3 className="font-semibold mb-4">Your Details</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={(e) => onFormChange('name', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => onFormChange('email', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
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
          <Label htmlFor="notes">Special Requests (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Any special requirements or notes..."
            value={formData.notes}
            onChange={(e) => onFormChange('notes', e.target.value)}
            rows={3}
          />
        </div>
      </div>
    </Card>
  );
}
