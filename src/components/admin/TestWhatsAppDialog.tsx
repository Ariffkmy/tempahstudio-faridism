import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function TestWhatsAppDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [recipient, setRecipient] = useState('');
    const [message, setMessage] = useState('Hello! This is a test WhatsApp message from Raya Studio. If you received this, the Twilio integration is working! 🎉');
    const [isSending, setIsSending] = useState(false);
    const { toast } = useToast();

    const handleSend = async () => {
        if (!recipient || !message) {
            toast({
                title: 'Error',
                description: 'Please fill in both recipient and message',
                variant: 'destructive',
            });
            return;
        }

        setIsSending(true);
        try {
            const { sendWhatsAppMessage } = await import('@/services/twilioService');

            // Ensure recipient has whatsapp: prefix
            const formattedRecipient = recipient.startsWith('whatsapp:')
                ? recipient
                : `whatsapp:${recipient}`;

            const result = await sendWhatsAppMessage(formattedRecipient, message);

            if (result.success) {
                toast({
                    title: 'Success',
                    description: `WhatsApp message sent successfully! SID: ${result.sid}`,
                });
                setIsOpen(false);
                // Reset form
                setRecipient('');
                setMessage('Hello! This is a test WhatsApp message from Raya Studio. If you received this, the Twilio integration is working! 🎉');
            } else {
                toast({
                    title: 'Failed to send',
                    description: result.error || 'Unknown error occurred',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error sending test WhatsApp:', error);
            toast({
                title: 'Error',
                description: 'Failed to send WhatsApp message. Check console for details.',
                variant: 'destructive',
            });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    Send Test WhatsApp
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Send Test WhatsApp Message</DialogTitle>
                    <DialogDescription>
                        Test your Twilio WhatsApp integration by sending a message to any number
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="recipient">Recipient Number</Label>
                        <Input
                            id="recipient"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            placeholder="+60123456789 or whatsapp:+60123456789"
                            className="font-mono"
                        />
                        <p className="text-xs text-muted-foreground">
                            Enter phone number with country code (e.g., +60123456789)
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Enter your test message..."
                            className="min-h-[120px]"
                        />
                        <p className="text-xs text-muted-foreground">
                            {message.length} characters
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        disabled={isSending}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={isSending || !recipient || !message}
                    >
                        {isSending ? 'Sending...' : 'Send Message'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
