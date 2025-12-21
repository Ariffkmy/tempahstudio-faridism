import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Smartphone, QrCode, Power, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import {
    initiateConnection,
    getConnectionStatus,
    disconnectDevice,
    getQRCode,
    checkServiceHealth,
    type WhatsAppConnectionStatus,
} from '@/services/whatsappBaileysService';

interface WhatsAppConnectionCardProps {
    studioId: string;
}

export function WhatsAppConnectionCard({ studioId }: WhatsAppConnectionCardProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [status, setStatus] = useState<WhatsAppConnectionStatus | null>(null);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [serviceRunning, setServiceRunning] = useState(false);

    // Check if service is running
    useEffect(() => {
        const checkService = async () => {
            const isRunning = await checkServiceHealth();
            setServiceRunning(isRunning);

            if (!isRunning) {
                toast({
                    title: 'Service Not Running',
                    description: 'WhatsApp service is not running. Please start it first.',
                    variant: 'destructive',
                });
            }
        };

        checkService();
    }, [toast]);

    // Fetch connection status
    useEffect(() => {
        if (!serviceRunning) return;

        const fetchStatus = async () => {
            try {
                setLoading(true);
                const connectionStatus = await getConnectionStatus(studioId);
                setStatus(connectionStatus);

                // If not connected but has QR, fetch it
                if (!connectionStatus.isConnected && connectionStatus.hasQR) {
                    const qr = await getQRCode(studioId);
                    setQrCode(qr);
                }
            } catch (error) {
                console.error('Error fetching status:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();

        // Poll status every 5 seconds
        const interval = setInterval(fetchStatus, 5000);

        return () => clearInterval(interval);
    }, [studioId, serviceRunning]);

    const handleConnect = async () => {
        try {
            setConnecting(true);
            const result = await initiateConnection(studioId);

            if (result.status === 'already_connected') {
                toast({
                    title: 'Already Connected',
                    description: 'WhatsApp is already connected',
                });
                setStatus({
                    isConnected: true,
                    deviceInfo: result.deviceInfo,
                });
            } else if (result.qrCode) {
                setQrCode(result.qrCode);
                toast({
                    title: 'QR Code Generated',
                    description: 'Scan the QR code with your WhatsApp mobile app',
                });
            }
        } catch (error: any) {
            toast({
                title: 'Connection Failed',
                description: error.message || 'Failed to initiate connection',
                variant: 'destructive',
            });
        } finally {
            setConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            setDisconnecting(true);
            await disconnectDevice(studioId);

            setStatus({ isConnected: false });
            setQrCode(null);

            toast({
                title: 'Disconnected',
                description: 'WhatsApp device disconnected successfully',
            });
        } catch (error: any) {
            toast({
                title: 'Disconnection Failed',
                description: error.message || 'Failed to disconnect device',
                variant: 'destructive',
            });
        } finally {
            setDisconnecting(false);
        }
    };

    const handleRefreshQR = async () => {
        await handleConnect();
    };

    if (!serviceRunning) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-destructive" />
                        WhatsApp Service Not Running
                    </CardTitle>
                    <CardDescription>
                        The WhatsApp backend service is not running. Please start it to use this feature.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm font-mono mb-2">To start the service, run:</p>
                        <code className="text-sm bg-background p-2 rounded block">
                            npm run whatsapp:service
                        </code>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Smartphone className="h-5 w-5" />
                            WhatsApp Connection
                        </CardTitle>
                        <CardDescription>
                            Connect your WhatsApp account to send messages directly
                        </CardDescription>
                    </div>
                    <Badge variant={status?.isConnected ? 'default' : 'secondary'} className="gap-1">
                        {status?.isConnected ? (
                            <>
                                <CheckCircle2 className="h-3 w-3" />
                                Connected
                            </>
                        ) : (
                            <>
                                <XCircle className="h-3 w-3" />
                                Disconnected
                            </>
                        )}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {status?.isConnected ? (
                    // Connected State
                    <div className="space-y-4">
                        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5" />
                                Device Connected
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Device Name:</span>
                                    <span className="font-medium">{status.deviceInfo?.name || 'Unknown'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Phone Number:</span>
                                    <span className="font-medium">{status.deviceInfo?.phoneNumber || 'Unknown'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Platform:</span>
                                    <span className="font-medium">{status.deviceInfo?.platform || 'WhatsApp'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={handleDisconnect}
                                disabled={disconnecting}
                                variant="destructive"
                                className="gap-2"
                            >
                                {disconnecting && <Loader2 className="h-4 w-4 animate-spin" />}
                                <Power className="h-4 w-4" />
                                Disconnect Device
                            </Button>
                        </div>

                        <div className="bg-muted p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                <strong>Note:</strong> Only one device can be connected at a time. Disconnecting will
                                require scanning a new QR code to reconnect.
                            </p>
                        </div>
                    </div>
                ) : (
                    // Disconnected State - Show QR Code
                    <div className="space-y-4">
                        {qrCode ? (
                            <div className="space-y-4">
                                <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg">
                                    <QrCode className="h-8 w-8 mb-4 text-muted-foreground" />
                                    <h3 className="font-semibold mb-2">Scan QR Code</h3>
                                    <p className="text-sm text-muted-foreground text-center mb-4">
                                        Open WhatsApp on your phone and scan this QR code
                                    </p>
                                    <div className="bg-white p-4 rounded-lg">
                                        <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
                                    </div>
                                    <Button
                                        onClick={handleRefreshQR}
                                        variant="outline"
                                        size="sm"
                                        className="mt-4 gap-2"
                                        disabled={connecting}
                                    >
                                        {connecting ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="h-4 w-4" />
                                        )}
                                        Refresh QR Code
                                    </Button>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                        How to connect:
                                    </h4>
                                    <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                                        <li>Open WhatsApp on your phone</li>
                                        <li>Tap Menu or Settings and select Linked Devices</li>
                                        <li>Tap on Link a Device</li>
                                        <li>Point your phone at this screen to scan the QR code</li>
                                    </ol>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Smartphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="font-semibold mb-2">Connect Your WhatsApp</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Click the button below to generate a QR code and connect your WhatsApp account
                                </p>
                                <Button onClick={handleConnect} disabled={connecting} className="gap-2">
                                    {connecting && <Loader2 className="h-4 w-4 animate-spin" />}
                                    <QrCode className="h-4 w-4" />
                                    Generate QR Code
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
