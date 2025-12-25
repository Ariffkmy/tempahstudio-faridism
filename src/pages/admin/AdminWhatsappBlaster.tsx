import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveStudioId } from '@/contexts/StudioContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2, Lock, ExternalLink, Smartphone, Users, MessageSquare } from 'lucide-react';
import { getStudioBookingsWithDetails } from '@/services/bookingService';
import { sendWhatsAppMessage } from '@/services/twilioService';
import { usePackageAccess } from '@/hooks/usePackageAccess';
import { FEATURES } from '@/config/packageFeatures';
import { UpgradePrompt } from '@/components/access/UpgradePrompt';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';
import { WhatsAppConnectionCard } from '@/components/admin/whatsapp/WhatsAppConnectionCard';
import { ContactManagementCard } from '@/components/admin/whatsapp/ContactManagementCard';
import { CustomBlastCard } from '@/components/admin/whatsapp/CustomBlastCard';
import { getConnectionStatus } from '@/services/whatsappBaileysService';

/**
 * WhatsApp Blaster - Complete WhatsApp messaging solution
 * Features:
 * 1. Ready for Delivery - Send Google Drive links (Twilio)
 * 2. WhatsApp Connection - Connect via QR code (Baileys)
 * 3. Contact Management - Import contacts from WhatsApp
 * 4. Custom Blast - Send personalized messages
 */
const AdminWhatsappBlaster = () => {
  const { studio } = useAuth();
  const effectiveStudioId = useEffectiveStudioId();
  const { toast } = useToast();
  const { isCollapsed } = useSidebar();

  // Package access control
  const { hasFeature, getRequiredTier } = usePackageAccess();
  const canBlast = hasFeature(FEATURES.WHATSAPP_BLAST);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const requiredTier = getRequiredTier(FEATURES.WHATSAPP_BLAST);

  // Ready for Delivery state
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [blasting, setBlasting] = useState(false);
  const [bookingLinks, setBookingLinks] = useState<Record<string, string>>({});

  // WhatsApp connection state
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [activeTab, setActiveTab] = useState('connection'); // Start with connection tab
  const [importedContacts, setImportedContacts] = useState<Array<{ name: string; phone: string }>>([]);
  const [importTrigger, setImportTrigger] = useState(0); // Counter to force re-render

  // Lift recipients state to parent to persist across tab switches
  const [recipients, setRecipients] = useState<Array<{ name: string; phone: string }>>([]);

  // Handler for importing contacts from Contact Management
  const handleImportContacts = (contacts: Array<{ name: string; phone: string }>) => {
    console.log('🟢 [AdminWhatsappBlaster] handleImportContacts called');
    console.log('  - Received contacts count:', contacts.length);
    console.log('  - Received contacts:', contacts);
    console.log('  - Current activeTab:', activeTab);

    // Directly add to recipients state (with duplicate filtering)
    // Using functional update to ensure we always get the latest state
    setRecipients(prev => {
      console.log('  - Inside setRecipients callback');
      console.log('  - Previous recipients (from state):', prev);
      console.log('  - Previous recipients count:', prev.length);

      const existingPhones = new Set(prev.map(r => r.phone));
      console.log('  - Existing phones:', Array.from(existingPhones));

      const uniqueNew = contacts.filter(c => !existingPhones.has(c.phone));
      console.log('  - Unique new contacts (after filtering):', uniqueNew.length);
      console.log('  - Unique new contacts:', uniqueNew);

      const updated = [...prev, ...uniqueNew];
      console.log('  - Updated recipients (total):', updated.length);
      console.log('  - Updated recipients array:', updated);

      return updated;
    });

    setActiveTab('blast');
    console.log('  - setActiveTab called with: blast');

    toast({
      title: 'Contacts Imported',
      description: `${contacts.length} contacts added to Custom Blast recipients`,
    });
    console.log('🟢 [AdminWhatsappBlaster] handleImportContacts finished');
  };

  // Check WhatsApp connection status
  useEffect(() => {
    const checkConnection = async () => {
      if (!effectiveStudioId) return;

      try {
        setCheckingConnection(true);
        const status = await getConnectionStatus(effectiveStudioId);
        setIsWhatsAppConnected(status.isConnected);
      } catch (error) {
        console.error('Error checking WhatsApp connection:', error);
        setIsWhatsAppConnected(false);
      } finally {
        setCheckingConnection(false);
      }
    };

    checkConnection();

    // Poll connection status every 10 seconds
    const interval = setInterval(checkConnection, 10000);

    return () => clearInterval(interval);
  }, [effectiveStudioId]);

  // Fetch ready-for-delivery bookings
  useEffect(() => {
    const fetchBookings = async () => {
      if (!effectiveStudioId) return;

      try {
        setLoading(true);
        const result = await getStudioBookingsWithDetails(effectiveStudioId);

        if (result) {
          // Filter only ready-for-delivery bookings
          const readyBookings = result.filter(
            (booking: any) => booking.status === 'ready-for-delivery'
          );

          // Map to expected format
          const mappedBookings = readyBookings.map((b: any) => ({
            id: b.id,
            reference_number: b.reference,
            name: b.customer?.name || 'Unknown',
            phone: b.customer?.phone || '',
            package_name: b.studio_layout?.name || '',
            status: b.status,
          }));

          setBookings(mappedBookings);
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load bookings',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [effectiveStudioId, toast]);

  const handleLinkChange = (bookingId: string, link: string) => {
    setBookingLinks((prev) => ({
      ...prev,
      [bookingId]: link,
    }));
  };

  const handleWhatsAppBlast = async () => {
    if (!canBlast) {
      setShowUpgradePrompt(true);
      return;
    }

    if (!studio) {
      toast({
        title: 'Error',
        description: 'Studio information not found',
        variant: 'destructive',
      });
      return;
    }

    // Filter bookings that have links
    const bookingsWithLinks = bookings.filter((booking) => bookingLinks[booking.id]);

    if (bookingsWithLinks.length === 0) {
      toast({
        title: 'No Links Provided',
        description: 'Please add Google Drive links for at least one booking',
        variant: 'destructive',
      });
      return;
    }

    setBlasting(true);

    try {
      let successCount = 0;
      let failCount = 0;

      for (const booking of bookingsWithLinks) {
        const link = bookingLinks[booking.id];

        try {
          await sendWhatsAppMessage({
            to: booking.phone,
            studioId: studio.id,
            bookingId: booking.id,
            customerName: booking.name,
            link: link,
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to send WhatsApp to ${booking.phone}:`, error);
          failCount++;
        }
      }

      toast({
        title: 'WhatsApp Blast Complete',
        description: `Successfully sent ${successCount} message(s). ${failCount > 0 ? `Failed: ${failCount}` : ''}`,
        variant: successCount > 0 ? 'default' : 'destructive',
      });

      // Clear links after successful blast
      setBookingLinks({});
    } catch (error) {
      console.error('Error during WhatsApp blast:', error);
      toast({
        title: 'Error',
        description: 'Failed to send WhatsApp messages',
        variant: 'destructive',
      });
    } finally {
      setBlasting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />

      <main className={cn("transition-all duration-300", isCollapsed ? "pl-16" : "pl-64")}>
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">WhatsApp Blaster</h1>
              <p className="text-muted-foreground">
                Send WhatsApp messages to customers using Twilio or your own WhatsApp account
              </p>
            </div>
            <div className="flex items-center gap-2">
              {checkingConnection ? (
                <Badge variant="outline" className="gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Checking...
                </Badge>
              ) : (
                <Badge variant={isWhatsAppConnected ? 'default' : 'secondary'} className="gap-1">
                  <Smartphone className="h-3 w-3" />
                  {isWhatsAppConnected ? 'Connected' : 'Not Connected'}
                </Badge>
              )}
              {loading && (
                <Badge variant="outline" className="text-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </Badge>
              )}
            </div>
          </div>

          {/* Upgrade Banner for Silver Users */}
          {!canBlast && (
            <Card className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <Lock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-amber-900 dark:text-amber-100 mb-2">
                      🔒 WhatsApp Blast - Premium Feature
                    </h3>
                    <p className="text-amber-800 dark:text-amber-200 mb-4">
                      WhatsApp Blast is available for <strong>Gold</strong> and <strong>Platinum</strong> tier users only.
                      Upgrade your plan to unlock this powerful feature and send personalized messages to your customers.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => setShowUpgradePrompt(true)}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        Upgrade to {requiredTier?.toUpperCase()}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => window.open('/#pricing-section', '_blank')}
                        className="border-amber-600 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                      >
                        View Pricing
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="connection" className="gap-2">
                <Smartphone className="h-4 w-4" />
                WhatsApp Connection
              </TabsTrigger>
              <TabsTrigger value="contacts" className="gap-2" disabled={!isWhatsAppConnected}>
                <Users className="h-4 w-4" />
                Contact Management
              </TabsTrigger>
              <TabsTrigger value="blast" className="gap-2" disabled={!isWhatsAppConnected}>
                <MessageSquare className="h-4 w-4" />
                Marketing Blast
              </TabsTrigger>
              <TabsTrigger value="delivery" className="gap-2">
                <Send className="h-4 w-4" />
                Ready for Delivery
              </TabsTrigger>
            </TabsList>


            {/* Tab 1: WhatsApp Connection */}
            <TabsContent value="connection">
              {effectiveStudioId && <WhatsAppConnectionCard studioId={effectiveStudioId} />}
            </TabsContent>

            {/* Tab 2: Contact Management */}
            <TabsContent value="contacts">
              {checkingConnection ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                      <p className="text-lg font-medium mb-2">Checking WhatsApp Connection...</p>
                      <p className="text-sm text-muted-foreground">
                        Please wait while we verify your WhatsApp connection status
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : effectiveStudioId && (
                <ContactManagementCard
                  studioId={effectiveStudioId}
                  isConnected={isWhatsAppConnected} onImportContacts={handleImportContacts} />
              )}
            </TabsContent>

            {/* Tab 3: Marketing Blast */}
            <TabsContent value="blast">
              {checkingConnection ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                      <p className="text-lg font-medium mb-2">Checking WhatsApp Connection...</p>
                      <p className="text-sm text-muted-foreground">
                        Please wait while we verify your WhatsApp connection status
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : effectiveStudioId && (() => {
                console.log('🟣 [AdminWhatsappBlaster] Rendering CustomBlastCard');
                console.log('  - studioId:', effectiveStudioId);
                console.log('  - isConnected:', isWhatsAppConnected);
                console.log('  - recipients to pass:', recipients);
                return (
                  <CustomBlastCard
                    studioId={effectiveStudioId}
                    isConnected={isWhatsAppConnected}
                    recipients={recipients}
                    setRecipients={setRecipients}
                  />
                );
              })()}
            </TabsContent>

            {/* Tab 4: Ready for Delivery */}
            <TabsContent value="delivery">
              <Card>
                <CardHeader>
                  <CardTitle>Ready for Delivery Bookings</CardTitle>
                  <CardDescription>
                    Add Google Drive links and blast WhatsApp messages to customers via Twilio
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin" />
                      <p>Loading bookings...</p>
                    </div>
                  ) : bookings.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No bookings ready for delivery</p>
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Reference</TableHead>
                            <TableHead>Customer Name</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Package</TableHead>
                            <TableHead>Google Drive Link</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bookings.map((booking) => (
                            <TableRow key={booking.id}>
                              <TableCell className="font-medium">
                                {booking.reference_number}
                              </TableCell>
                              <TableCell>{booking.name}</TableCell>
                              <TableCell>{booking.phone}</TableCell>
                              <TableCell>{booking.package_name || '-'}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Input
                                    placeholder="https://drive.google.com/..."
                                    value={bookingLinks[booking.id] || ''}
                                    onChange={(e) => handleLinkChange(booking.id, e.target.value)}
                                    className="max-w-md"
                                    disabled={!canBlast}
                                  />
                                  {!canBlast && (
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  {bookingLinks[booking.id] && canBlast && (
                                    <a
                                      href={bookingLinks[booking.id]}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:text-primary/80"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                {bookingLinks[booking.id] ? (
                                  <Badge variant="default" className="bg-green-500">
                                    Ready
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">Pending</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      <div className="mt-6 flex justify-end">
                        <Button
                          onClick={handleWhatsAppBlast}
                          disabled={blasting || !canBlast}
                          size="lg"
                          className="gap-2"
                        >
                          {!canBlast && <Lock className="h-5 w-5" />}
                          {blasting && <Loader2 className="h-5 w-5 animate-spin" />}
                          {!blasting && canBlast && <Send className="h-5 w-5" />}
                          {!canBlast ? 'Upgrade to Unlock' : blasting ? 'Sending...' : 'Blast WhatsApp'}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Upgrade Prompt */}
          {requiredTier && (
            <UpgradePrompt
              open={showUpgradePrompt}
              onClose={() => setShowUpgradePrompt(false)}
              requiredTier={requiredTier}
              feature={FEATURES.WHATSAPP_BLAST}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminWhatsappBlaster;
