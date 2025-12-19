import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveStudioId } from '@/contexts/StudioContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2, Lock, ExternalLink } from 'lucide-react';
import { getStudioBookingsWithDetails } from '@/services/bookingService';
import { sendWhatsAppMessage } from '@/services/twilioService';
import { usePackageAccess } from '@/hooks/usePackageAccess';
import { FEATURES } from '@/config/packageFeatures';
import { UpgradePrompt } from '@/components/access/UpgradePrompt';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

/**
 * WhatsApp Blaster - Simplified page for sending WhatsApp messages to ready-for-delivery bookings
 * Shows only bookings with status 'ready-for-delivery' in a table format
 * Includes package gating (Gold+ required)
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

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [blasting, setBlasting] = useState(false);
  const [bookingLinks, setBookingLinks] = useState<Record<string, string>>({});

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />

      <main className={cn("transition-all duration-300", isCollapsed ? "pl-16" : "pl-64")}>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">WhatsApp Blaster</h1>
              <p className="text-muted-foreground mt-1">
                Send Google Drive links to customers with ready-for-delivery bookings
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {bookings.length} Ready for Delivery
            </Badge>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ready for Delivery Bookings</CardTitle>
              <CardDescription>
                Add Google Drive links and blast WhatsApp messages to customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
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
                              />
                              {bookingLinks[booking.id] && (
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
                      {blasting ? 'Sending...' : 'Blast WhatsApp'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

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
