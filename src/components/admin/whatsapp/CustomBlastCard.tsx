import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Plus, X, Eye, History, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { sendBlast, getBlastHistory, getBlastProgress, type BlastRecipient, type BlastHistory, type MessageTracking } from '@/services/whatsappBaileysService';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';

interface CustomBlastCardProps {
    studioId: string;
    isConnected: boolean;
    recipients: Array<{ name: string; phone: string }>;
    setRecipients: React.Dispatch<React.SetStateAction<Array<{ name: string; phone: string }>>>;
}

export function CustomBlastCard({ studioId, isConnected, recipients, setRecipients }: CustomBlastCardProps) {
    const { toast } = useToast();
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState('');
    // recipients is now controlled by parent component
    const [newRecipientName, setNewRecipientName] = useState('');
    const [newRecipientPhone, setNewRecipientPhone] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [history, setHistory] = useState<BlastHistory[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [selectedBlastId, setSelectedBlastId] = useState<string | null>(null);
    const [messageTracking, setMessageTracking] = useState<MessageTracking[]>([]);
    const [loadingTracking, setLoadingTracking] = useState(false);

    // Progress tracking state
    const [currentBlastId, setCurrentBlastId] = useState<string | null>(null);
    const [blastProgress, setBlastProgress] = useState<{
        percentage: number;
        sent: number;
        total: number;
        failed: number;
    } | null>(null);

    // Fetch blast history
    // Note: Recipients are now managed by parent component and passed as props

    const fetchHistory = async () => {
        try {
            setLoadingHistory(true);
            const data = await getBlastHistory(studioId);
            setHistory(data);
        } catch (error: any) {
            console.error('Error fetching history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    // Fetch message tracking for a specific blast
    const fetchMessageTracking = async (blastId: string) => {
        try {
            setLoadingTracking(true);
            console.log('Fetching tracking for blast:', blastId);
            const { data, error } = await supabase
                .from('whatsapp_message_tracking')
                .select('*')
                .eq('blast_id', blastId)
                .order('created_at', { ascending: false });

            console.log('Tracking query result:', { data, error });

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            setMessageTracking(data || []);
            console.log('Message tracking loaded:', data?.length || 0, 'messages');
        } catch (error: any) {
            console.error('Error fetching message tracking:', error);
            toast({
                title: 'Error',
                description: 'Failed to load message tracking',
                variant: 'destructive',
            });
        } finally {
            setLoadingTracking(false);
        }
    };

    // Auto-load history on mount and when connected
    useEffect(() => {
        if (isConnected) {
            fetchHistory();
            // Refresh history every 10 seconds
            const interval = setInterval(fetchHistory, 10000);
            return () => clearInterval(interval);
        }
    }, [isConnected, studioId]);

    // Track if we've already pre-filled the message
    const hasPrefilledRef = useRef(false);

    // Fetch studio settings and pre-fill message template
    useEffect(() => {
        const fetchStudioSettings = async () => {
            console.log('🔍 Fetching studio settings...', {
                studioId,
                hasPrefilledBefore: hasPrefilledRef.current
            });

            // Only pre-fill once
            if (hasPrefilledRef.current) {
                console.log('⏭️ Already pre-filled, skipping');
                return;
            }

            try {
                const { loadStudioSettings } = await import('@/services/studioSettings');
                const settings = await loadStudioSettings(studioId);

                console.log('📋 Settings loaded:', settings);

                if (settings && settings.studioName) {
                    // Pre-fill message template with actual values
                    const baseUrl = window.location.origin;
                    const bookingUrl = `${baseUrl}/booking`;
                    const defaultMessage = `Assalammualaikum! ${settings.studioName} kini sudah menerima tempahan studio raya untuk 2026. Klik link untuk membuat tempahan!\n\n${bookingUrl}`;
                    console.log('✅ Pre-filling message:', defaultMessage);
                    setMessage(defaultMessage);
                    hasPrefilledRef.current = true;
                } else {
                    console.log('❌ Missing studio name:', {
                        hasSettings: !!settings,
                        hasStudioName: !!settings?.studioName,
                    });
                }
            } catch (error) {
                console.error('❌ Error fetching studio settings:', error);
            }
        };

        fetchStudioSettings();
    }, [studioId]); // Only run when studioId changes

    // Fetch tracking when blast is selected and poll for updates
    useEffect(() => {
        if (selectedBlastId) {
            fetchMessageTracking(selectedBlastId);
            // Poll for updates every 3 seconds
            const interval = setInterval(() => {
                fetchMessageTracking(selectedBlastId);
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [selectedBlastId]);

    // Poll for blast progress when sending
    useEffect(() => {
        if (currentBlastId && sending) {
            const pollProgress = async () => {
                try {
                    const progress = await getBlastProgress(currentBlastId);
                    setBlastProgress({
                        percentage: progress.progressPercentage,
                        sent: progress.successfulSends,
                        total: progress.totalRecipients,
                        failed: progress.failedSends,
                    });

                    // Stop polling if blast is completed
                    if (progress.status === 'completed' || progress.status === 'failed') {
                        setCurrentBlastId(null);
                        setBlastProgress(null);
                    }
                } catch (error) {
                    console.error('Error fetching progress:', error);
                }
            };

            // Poll immediately, then every second
            pollProgress();
            const interval = setInterval(pollProgress, 1000);

            return () => clearInterval(interval);
        }
    }, [currentBlastId, sending]);

    const handleViewDetails = (blastId: string) => {
        setSelectedBlastId(blastId);
    };

    const handleCloseDetails = () => {
        setSelectedBlastId(null);
        setMessageTracking([]);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'delivered':
                return <CheckCircle2 className="h-4 w-4 text-green-600" />;
            case 'read':
                return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
            case 'sent':
                return <Clock className="h-4 w-4 text-yellow-600" />;
            case 'failed':
            case 'error':
                return <XCircle className="h-4 w-4 text-red-600" />;
            default:
                return <Clock className="h-4 w-4 text-gray-400" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
            delivered: 'default',
            read: 'default',
            sent: 'secondary',
            failed: 'destructive',
            error: 'destructive',
            pending: 'secondary',
        };
        return (
            <Badge variant={variants[status] || 'secondary'}>
                {status}
            </Badge>
        );
    };

    const handleAddRecipient = () => {
        if (!newRecipientPhone) {
            toast({
                title: 'Phone Required',
                description: 'Please enter a phone number',
                variant: 'destructive',
            });
            return;
        }

        // Clean phone number (remove spaces, dashes, etc.)
        const cleanPhone = newRecipientPhone.replace(/[^0-9+]/g, '');

        setRecipients([
            ...recipients,
            {
                phone: cleanPhone,
                name: newRecipientName || undefined,
            },
        ]);

        setNewRecipientName('');
        setNewRecipientPhone('');
    };

    const handleRemoveRecipient = (index: number) => {
        setRecipients(recipients.filter((_, i) => i !== index));
    };

    const handleSendBlast = async () => {
        console.log('\n🚀 Frontend: Starting blast send...');

        if (!message.trim()) {
            console.error('❌ Frontend: No message provided');
            toast({
                title: 'Message Required',
                description: 'Please enter a message to send',
                variant: 'destructive',
            });
            return;
        }

        if (recipients.length === 0) {
            console.error('❌ Frontend: No recipients');
            toast({
                title: 'No Recipients',
                description: 'Please add at least one recipient',
                variant: 'destructive',
            });
            return;
        }

        console.log('✓ Frontend: Validation passed');
        console.log('  - Studio ID:', studioId);
        console.log('  - Recipients:', recipients.length);
        console.log('  - Message length:', message.length);
        console.log('  - Recipients list:', recipients);

        try {
            setSending(true);
            setBlastProgress({
                percentage: 0,
                sent: 0,
                total: recipients.length,
                failed: 0,
            });
            console.log('📤 Frontend: Calling sendBlast API...');

            const result = await sendBlast({
                studioId,
                recipients,
                message,
            });

            console.log('✓ Frontend: Blast API response:', result);

            // Set blast ID for progress tracking
            if (result.blastId) {
                setCurrentBlastId(result.blastId);
            }

            toast({
                title: 'Blast Sent',
                description: `Successfully sent ${result.successCount} messages. ${result.failCount > 0 ? `Failed: ${result.failCount}` : ''
                    }`,
                variant: result.failCount > 0 ? 'default' : 'default',
            });

            // Clear form
            setMessage('');
            setRecipients([]);

            // Refresh history
            fetchHistory();
        } catch (error: any) {
            console.error('❌ Frontend: Blast failed');
            console.error('  Error:', error);
            console.error('  Message:', error.message);
            toast({
                title: 'Blast Failed',
                description: error.message || 'Failed to send messages',
                variant: 'destructive',
            });
        } finally {
            setSending(false);
            setCurrentBlastId(null);
            setBlastProgress(null);
            console.log('🏁 Frontend: Blast send complete\n');
        }
    };

    if (!isConnected) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5" />
                        Custom Message Blast
                    </CardTitle>
                    <CardDescription>Send custom WhatsApp messages to multiple recipients</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                        <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Please connect your WhatsApp account first to send messages</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Message Composer */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5" />
                        Custom Message Blast
                    </CardTitle>
                    <CardDescription>
                        Create and send personalized WhatsApp messages to multiple recipients
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Message Template */}
                    <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                            id="message"
                            placeholder="Enter your message here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={6}
                            className="resize-none"
                        />
                        <p className="text-sm text-muted-foreground">
                            {message.length} characters
                        </p>
                    </div>



                    {/* Add Recipients */}
                    <div className="space-y-4">
                        <Label>Recipients</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Name (optional)"
                                value={newRecipientName}
                                onChange={(e) => setNewRecipientName(e.target.value)}
                                className="flex-1"
                            />
                            <Input
                                placeholder="Phone number (e.g., +60123456789)"
                                value={newRecipientPhone}
                                onChange={(e) => setNewRecipientPhone(e.target.value)}
                                className="flex-1"
                            />
                            <Button onClick={handleAddRecipient} variant="outline" className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add
                            </Button>
                        </div>

                        {/* Recipients List */}
                        {recipients.length > 0 && (
                            <div className="border rounded-lg p-4 space-y-2">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">
                                        {recipients.length} recipient{recipients.length > 1 ? 's' : ''}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowPreview(!showPreview)}
                                        className="gap-2"
                                    >
                                        <Eye className="h-4 w-4" />
                                        {showPreview ? 'Hide' : 'Preview'}
                                    </Button>
                                </div>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {recipients.map((recipient, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-2 bg-muted rounded"
                                        >
                                            <div className="flex-1">
                                                <div className="font-medium">{recipient.name || 'No name'}</div>
                                                <div className="text-sm text-muted-foreground">{recipient.phone}</div>
                                                {showPreview && (
                                                    <div className="text-sm mt-2 p-2 bg-background rounded border">
                                                        {message}
                                                    </div>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveRecipient(index)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Send Button */}
                    <div className="flex gap-2">
                        <Button
                            onClick={handleSendBlast}
                            disabled={sending || !message || recipients.length === 0}
                            size="lg"
                            className="gap-2"
                        >
                            {sending && <Loader2 className="h-4 w-4 animate-spin" />}
                            <Send className="h-4 w-4" />
                            Send Blast to {recipients.length} Recipient{recipients.length > 1 ? 's' : ''}
                        </Button>
                    </div>

                    {/* Progress Bar */}
                    {sending && blastProgress && (
                        <div className="space-y-2 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-blue-900 dark:text-blue-100">
                                    Sending messages...
                                </span>
                                <span className="font-bold text-blue-900 dark:text-blue-100">
                                    {blastProgress.percentage}%
                                </span>
                            </div>
                            <Progress value={blastProgress.percentage} className="h-2" />
                            <div className="flex items-center gap-4 text-xs text-blue-800 dark:text-blue-200">
                                <div className="flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                                    <span>Sent: {blastProgress.sent}/{blastProgress.total}</span>
                                </div>
                                {blastProgress.failed > 0 && (
                                    <div className="flex items-center gap-1">
                                        <XCircle className="h-3 w-3 text-red-600" />
                                        <span>Failed: {blastProgress.failed}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Warning */}
                    <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            <strong>⚠️ Rate Limiting:</strong> Messages will be sent with a 3-second delay
                            between each to prevent WhatsApp from blocking your account. Large blasts may take
                            some time to complete.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Blast History */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Blast History
                    </CardTitle>
                    <CardDescription>View your recent message blasts</CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingHistory ? (
                        <div className="text-center py-8">
                            <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
                            <p className="text-muted-foreground">Loading history...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No blast history yet</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Recipients</TableHead>
                                    <TableHead>Sent</TableHead>
                                    <TableHead>Failed</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {history.map((blast) => (
                                    <TableRow key={blast.id}>
                                        <TableCell>
                                            {format(new Date(blast.created_at), 'MMM dd, yyyy HH:mm')}
                                        </TableCell>
                                        <TableCell>{blast.total_recipients}</TableCell>
                                        <TableCell className="text-green-600">
                                            <div className="flex items-center gap-1">
                                                <CheckCircle2 className="h-4 w-4" />
                                                {blast.successful_sends}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-red-600">
                                            <div className="flex items-center gap-1">
                                                <XCircle className="h-4 w-4" />
                                                {blast.failed_sends}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    blast.status === 'completed'
                                                        ? 'default'
                                                        : blast.status === 'failed'
                                                            ? 'destructive'
                                                            : 'secondary'
                                                }
                                            >
                                                {blast.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleViewDetails(blast.id)}
                                            >
                                                <Eye className="h-4 w-4 mr-1" />
                                                View Details
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Message Tracking Details Dialog */}
            <Dialog open={!!selectedBlastId} onOpenChange={(open) => !open && handleCloseDetails()}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Message Delivery Details</DialogTitle>
                        <DialogDescription>
                            Real-time delivery status for each message. Updates every 3 seconds.
                        </DialogDescription>
                    </DialogHeader>

                    {loadingTracking ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">Loading message tracking...</p>
                        </div>
                    ) : messageTracking.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No tracking data available</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-4 gap-4">
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-600">
                                                {messageTracking.filter(m => m.status === 'delivered' || m.status === 'read').length}
                                            </div>
                                            <div className="text-xs text-muted-foreground">Delivered</div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {messageTracking.filter(m => m.status === 'read').length}
                                            </div>
                                            <div className="text-xs text-muted-foreground">Read</div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-yellow-600">
                                                {messageTracking.filter(m => m.status === 'sent').length}
                                            </div>
                                            <div className="text-xs text-muted-foreground">Sent</div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-red-600">
                                                {messageTracking.filter(m => m.status === 'failed' || m.status === 'error').length}
                                            </div>
                                            <div className="text-xs text-muted-foreground">Failed</div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Message List */}
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Recipient</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Sent At</TableHead>
                                        <TableHead>Delivered At</TableHead>
                                        <TableHead>Read At</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {messageTracking.map((msg) => (
                                        <TableRow key={msg.id}>
                                            <TableCell className="font-medium">
                                                {msg.recipient_name || 'Unknown'}
                                            </TableCell>
                                            <TableCell>{msg.recipient_phone}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(msg.status)}
                                                    {getStatusBadge(msg.status)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                {msg.sent_at ? format(new Date(msg.sent_at), 'HH:mm:ss') : '-'}
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                {msg.delivered_at ? format(new Date(msg.delivered_at), 'HH:mm:ss') : '-'}
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                {msg.read_at ? format(new Date(msg.read_at), 'HH:mm:ss') : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
