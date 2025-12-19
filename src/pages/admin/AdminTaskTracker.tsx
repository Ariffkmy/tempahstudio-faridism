import { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { StudioSelector } from '@/components/admin/StudioSelector';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Calendar, Clock, User, Phone, Mail, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveStudioId } from '@/contexts/StudioContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { getStudioBookingsWithDetails, updateBookingStatus, updateBookingDeliveryLink } from '@/services/bookingService';
import { Booking } from '@/types/booking';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { usePackageAccess } from '@/hooks/usePackageAccess';
import { FEATURES } from '@/config/packageFeatures';
import { UpgradePrompt } from '@/components/access/UpgradePrompt';

/**
 * Task Tracker - Kanban board for managing booking workflow
 * Displays bookings across different status columns with drag-and-drop
 * Includes WhatsApp blast functionality for ready-for-delivery bookings
 */
const AdminTaskTracker = () => {
  const { user, studio, isSuperAdmin } = useAuth();
  const { isCollapsed } = useSidebar();
  const effectiveStudioId = useEffectiveStudioId();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [bookingsData, setBookingsData] = useState<{
    'complete-photoshoot': Booking[];
    'editing-in-progress': Booking[];
    'ready-for-delivery': Booking[];
    'done-delivery': Booking[];
  }>({
    'complete-photoshoot': [],
    'editing-in-progress': [],
    'ready-for-delivery': [],
    'done-delivery': []
  });
  const [draggedBooking, setDraggedBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize booking links
  const initialLinks: Record<string, string> = {};
  const [bookingLinks, setBookingLinks] = useState<Record<string, string>>(initialLinks);

  const [isBlastDialogOpen, setIsBlastDialogOpen] = useState(false);
  const defaultMessage = "Assalammualaikum {{name}}, ini adalah link gambar raya ye: {{link}}\n\nTerima kasih kerana memilih Raya Studio. Selamat Hari Raya, Maaf Zahir Batin";
  const [blastMessage, setBlastMessage] = useState(defaultMessage);

  // Package access control
  const { hasFeature, getRequiredTier } = usePackageAccess();
  const canUseWhatsAppBlast = hasFeature(FEATURES.WHATSAPP_BLAST);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const requiredTier = getRequiredTier(FEATURES.WHATSAPP_BLAST);

  // Fetch bookings from database
  useEffect(() => {
    const fetchBookings = async () => {
      if (!effectiveStudioId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const bookingsData = await getStudioBookingsWithDetails(effectiveStudioId);

        // Convert database bookings to the format expected by the component
        const bookings: Booking[] = bookingsData.map((b: any) => ({
          id: b.id,
          reference: b.reference,
          customerId: b.customer_id,
          customerName: b.customer?.name || 'Unknown',
          customerEmail: b.customer?.email || '',
          customerPhone: b.customer?.phone || '',
          companyId: b.company_id,
          studioId: b.studio_id,
          layoutId: b.layout_id,
          layoutName: b.studio_layout?.name || 'Unknown Layout',
          date: b.date,
          startTime: b.start_time,
          endTime: b.end_time,
          duration: b.duration,
          totalPrice: Number(b.total_price),
          status: b.status,
          notes: b.notes || undefined,
          internalNotes: b.internal_notes || undefined,
          deliveryLink: b.delivery_link || undefined,
          addonPackageId: b.addon_package_id || undefined,
          createdAt: b.created_at,
          updatedAt: b.updated_at,
        }));

        // Filter bookings by status
        const donePhotoshoot = bookings.filter(b => b.status === 'done-photoshoot');
        const startEditing = bookings.filter(b => b.status === 'start-editing');
        const readyForDelivery = bookings.filter(b => b.status === 'ready-for-delivery');
        const doneDelivery = bookings.filter(b => b.status === 'completed');

        setBookingsData({
          'complete-photoshoot': donePhotoshoot,
          'editing-in-progress': startEditing,
          'ready-for-delivery': readyForDelivery,
          'done-delivery': doneDelivery
        });

        // Load delivery links from bookings
        const links: Record<string, string> = {};
        readyForDelivery.forEach(booking => {
          if (booking.deliveryLink) {
            links[booking.id] = booking.deliveryLink;
          }
        });
        setBookingLinks(links);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [effectiveStudioId]);

  const readyWithLinks = bookingsData['ready-for-delivery'].filter(b => b.deliveryLink || bookingLinks[b.id]);

  const toggleCardExpansion = (bookingId: string) => {
    setExpandedCards(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(bookingId)) {
        newExpanded.delete(bookingId);
      } else {
        newExpanded.add(bookingId);
      }
      return newExpanded;
    });
  };

  const handleDragStart = (e: React.DragEvent, booking: any, column: string) => {
    setDraggedBooking({ booking, sourceColumn: column });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault();
    if (!draggedBooking || draggedBooking.sourceColumn === targetColumn) return;

    const { booking, sourceColumn } = draggedBooking;

    // Map column names to booking statuses
    const columnToStatus: Record<string, Booking['status']> = {
      'complete-photoshoot': 'done-photoshoot',
      'editing-in-progress': 'start-editing',
      'ready-for-delivery': 'ready-for-delivery',
      'done-delivery': 'completed'
    };

    const newStatus = columnToStatus[targetColumn];

    // Update status in database
    try {
      const result = await updateBookingStatus(booking.id, newStatus);

      if (result.success) {
        // Update local state only if database update succeeds
        setBookingsData(prev => {
          const newData = { ...prev };
          // Remove from source column
          newData[sourceColumn] = newData[sourceColumn].filter(b => b.id !== booking.id);
          // Add to target column with updated status
          const updatedBooking = { ...booking, status: newStatus };
          newData[targetColumn] = [...newData[targetColumn], updatedBooking];
          return newData;
        });

        toast({
          title: 'Status Dikemaskini',
          description: 'Status tempahan berjaya dikemaskini',
        });
      } else {
        toast({
          title: 'Ralat',
          description: result.error || 'Gagal mengemaskini status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast({
        title: 'Ralat',
        description: 'Gagal mengemaskini status tempahan',
        variant: 'destructive',
      });
    }

    setDraggedBooking(null);
  };

  const handleWhatsAppBlast = () => {
    if (!canUseWhatsAppBlast) {
      setShowUpgradePrompt(true);
      return;
    }
    setIsBlastDialogOpen(true);
  };

  const handleSend = async () => {
    try {
      // Import both functions
      const { sendWhatsAppTemplate, getTwilioSettings } = await import('@/services/twilioService');

      // Get Twilio settings to check for template configuration
      const twilioResult = await getTwilioSettings();

      if (!twilioResult.success || !twilioResult.settings) {
        toast({
          title: 'Ralat',
          description: 'Gagal mendapatkan tetapan Twilio',
          variant: 'destructive',
        });
        return;
      }

      const { delivery_template_sid } = twilioResult.settings;

      if (!delivery_template_sid) {
        toast({
          title: 'Ralat',
          description: 'Template SID tidak dikonfigurasi. Sila tetapkan di Super Settings.',
          variant: 'destructive',
        });
        return;
      }

      // Get studio information for admin phone and studio name
      if (!effectiveStudioId) {
        toast({
          title: 'Ralat',
          description: 'Studio ID tidak dijumpai',
          variant: 'destructive',
        });
        return;
      }

      // Fetch studio details to get admin phone and studio name
      const { data: studioData, error: studioError } = await supabase
        .from('studios')
        .select('name, phone')
        .eq('id', effectiveStudioId)
        .single();

      if (studioError || !studioData) {
        toast({
          title: 'Ralat',
          description: 'Gagal mendapatkan maklumat studio',
          variant: 'destructive',
        });
        return;
      }

      const studioPhone = studioData.phone || '+60123456789'; // Fallback phone
      const studioName = studioData.name || 'Raya Studio';

      let successCount = 0;
      let failCount = 0;

      for (const b of readyWithLinks) {
        const deliveryLink = b.deliveryLink || bookingLinks[b.id] || '[Link tidak tersedia]';

        // Prepare template variables matching the new template structure
        const templateVariables = {
          '1': b.customerName,      // {{1}} = customer name
          '2': deliveryLink,        // {{2}} = delivery link
          '3': studioPhone,         // {{3}} = studio admin phone number
          '4': studioName           // {{4}} = studio name
        };

        const result = await sendWhatsAppTemplate(
          b.customerPhone,
          delivery_template_sid,
          templateVariables
        );

        if (!result.success) {
          console.error(`Failed to send WhatsApp to ${b.customerName}: ${result.error}`);
          failCount++;
        } else {
          console.log(`WhatsApp sent to ${b.customerName}, SID: ${result.sid}`);
          successCount++;
        }
      }

      // Show summary toast
      toast({
        title: 'WhatsApp Blast Selesai',
        description: `Berjaya: ${successCount}, Gagal: ${failCount}`,
        variant: successCount > 0 ? 'default' : 'destructive',
      });

      setBlastMessage(defaultMessage);
      setIsBlastDialogOpen(false);
    } catch (error) {
      console.error('Error sending WhatsApp messages:', error);
      toast({
        title: 'Ralat',
        description: 'Gagal menghantar mesej WhatsApp',
        variant: 'destructive',
      });
      setBlastMessage(defaultMessage);
      setIsBlastDialogOpen(false);
    }
  };

  // Test function for hardcoded WhatsApp numbers
  const handleTestSend = async () => {
    try {
      const { sendWhatsAppMessage } = await import('@/services/twilioService');

      // Hardcoded test numbers (use format: whatsapp:+1234567890)
      const testNumbers = [
        'whatsapp:+601129947089', // John's number from dummy data
        'whatsapp:+60189797496', // Puteri's number from dummy data
        // Add more test numbers here if needed
      ];

      const testMessage = "Hello! This is a test WhatsApp message from Raya Studio Twilio integration. If you received this, the integration is working! 🎉";

      console.log('Starting WhatsApp API test with hardcoded numbers...');

      for (const number of testNumbers) {
        console.log(`Sending test message to ${number}...`);
        const result = await sendWhatsAppMessage(number, testMessage);

        if (!result.success) {
          console.error(`❌ Failed to send to ${number}: ${result.error}`);
        } else {
          console.log(`✅ Successfully sent to ${number}, SID: ${result.sid}`);
        }

        // Small delay between messages
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log('WhatsApp test completed!');
      alert('Test completed! Check console for results.');
    } catch (error) {
      console.error('Error testing WhatsApp API:', error);
      alert('Test failed! Check console for details.');
    }
  };

  const updateBookingLink = async (bookingId: string, link: string) => {
    // Update local state immediately for responsive UI
    setBookingLinks(prev => ({ ...prev, [bookingId]: link }));

    // Debounce database update to avoid excessive calls
    // Clear any existing timeout for this booking
    if ((window as any)[`linkTimeout_${bookingId}`]) {
      clearTimeout((window as any)[`linkTimeout_${bookingId}`]);
    }

    // Set new timeout to save after user stops typing
    (window as any)[`linkTimeout_${bookingId}`] = setTimeout(async () => {
      try {
        const result = await updateBookingDeliveryLink(bookingId, link);

        if (!result.success) {
          toast({
            title: 'Ralat',
            description: result.error || 'Gagal menyimpan pautan',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error saving delivery link:', error);
      }
    }, 1000); // Wait 1 second after user stops typing
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        {/* Mobile Header */}
        <header className="sticky top-0 z-50 bg-background border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <Link to="/admin" className="flex items-center gap-2">
              <img src="/studiorayalogo.png" alt="Raya Studio Logo" style={{ width: '32px', height: '19px' }} />
              <span className="font-semibold text-sm">Raya Studio</span>
            </Link>
          </div>
        </header>

        <main className="p-4">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold">Status tugasan</h1>
                <p className="text-muted-foreground text-sm">Urus proses kerja dan hantar mesej WhatsApp</p>
              </div>
              <Button
                onClick={handleTestSend}
                variant="outline"
                size="sm"
              >
                <Send className="w-3 h-3 mr-1" />
                Test API
              </Button>
            </div>
          </div>

          {/* Super Admin Studio Selector */}
          {isSuperAdmin && (
            <div className="mb-4">
              <StudioSelector />
            </div>
          )}

          {/* Kanban Board */}
          <div className="space-y-4">
            {/* Ready for Editing */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                Done photoshoot
                <Badge variant="secondary" className="text-xs">{bookingsData['complete-photoshoot'].length}</Badge>
              </h3>
              <div className="space-y-3">
                {bookingsData['complete-photoshoot'].map((booking) => (
                  <Card key={booking.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="font-medium text-sm">{booking.reference}</span>
                          <Badge className="text-xs bg-orange-500 text-white hover:bg-orange-600">📷 Done</Badge>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {booking.customerName}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {booking.customerPhone || 'N/A'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{booking.customerEmail || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(booking.date).toLocaleDateString('ms-MY')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {booking.startTime} - {booking.endTime}
                          </div>
                          <div className="text-xs font-medium mt-1">
                            Layout: {booking.layoutName}
                          </div>
                          <div className="text-xs font-medium text-green-600">
                            RM {booking.totalPrice.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Editing in Progress */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                Editing in Progress
                <Badge variant="secondary" className="text-xs">{bookingsData['editing-in-progress'].length}</Badge>
              </h3>
              <div className="space-y-3">
                {bookingsData['editing-in-progress'].map((booking) => (
                  <Card key={booking.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="font-medium text-sm">{booking.reference}</span>
                          <Badge variant="outline" className="text-xs">⏳ Editing</Badge>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {booking.customerName}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {booking.customerPhone || 'N/A'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{booking.customerEmail || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(booking.date).toLocaleDateString('ms-MY')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {booking.startTime} - {booking.endTime}
                          </div>
                          <div className="text-xs font-medium mt-1">
                            Layout: {booking.layoutName}
                          </div>
                          <div className="text-xs font-medium text-green-600">
                            RM {booking.totalPrice.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Ready for Delivery */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  Ready for Delivery
                  <Badge variant="secondary" className="text-xs">{bookingsData['ready-for-delivery'].length}</Badge>
                </h3>
              </div>
              <div className="space-y-3">
                {bookingsData['ready-for-delivery'].map((booking) => (
                  <Card key={booking.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="font-medium text-sm">{booking.reference}</span>
                          <div className="flex items-center gap-1">
                            <Badge className={`text-xs ${bookingLinks[booking.id] ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>{bookingLinks[booking.id] ? 'Ready' : 'Pending'}</Badge>
                            <Badge variant="outline" className="text-xs">{bookingLinks[booking.id] ? 'Link Added ✔️' : 'Link Not Added ⏳'}</Badge>
                          </div>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {booking.customerName}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {booking.customerPhone}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(booking.date).toLocaleDateString('ms-MY')}
                          </div>
                        </div>
                        <div className="border-t pt-2 mt-2">
                          <label className="text-xs text-muted-foreground block mb-1">Link:</label>
                          <input type="url" value={bookingLinks[booking.id] || ''} onChange={(e) => updateBookingLink(booking.id, e.target.value)} className="w-full p-1 text-xs border rounded" placeholder="Enter link" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Footer with Blast WhatsApp Button */}
              <div className="mt-4">
                <Button
                  onClick={handleWhatsAppBlast}
                  size="sm"
                  className="w-full text-xs"
                  disabled={!canUseWhatsAppBlast}
                  variant={canUseWhatsAppBlast ? 'default' : 'outline'}
                >
                  <Send className="w-3 h-3 mr-1" />
                  Blast WhatsApp
                  {!canUseWhatsAppBlast && <Lock className="w-3 h-3 ml-1" />}
                </Button>
              </div>
            </div>
            {/* Done Delivery */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                Done Delivery
                <Badge variant="secondary" className="text-xs">{bookingsData['done-delivery'].length}</Badge>
              </h3>

              {/* With Add-on Package Sub-section */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-2 pl-5">
                  ✨ With Add-on Package
                  <Badge variant="outline" className="text-xs ml-2">
                    {bookingsData['done-delivery'].filter(b => !!b.addonPackageId).length}
                  </Badge>
                </h4>
                <div className="space-y-3">
                  {bookingsData['done-delivery'].filter(b => !!b.addonPackageId).map((booking) => (
                    <Card key={booking.id} className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-purple-500">
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="font-medium text-sm">{booking.reference}</span>
                            <Badge className="text-xs bg-purple-500 text-white">✨ Add-on</Badge>
                          </div>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {booking.customerName}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(booking.date).toLocaleDateString('ms-MY')}
                            </div>
                            <div className="text-xs font-medium text-purple-600">
                              RM {booking.totalPrice.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {bookingsData['done-delivery'].filter(b => !!b.addonPackageId).length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No bookings</p>
                  )}
                </div>
              </div>

              {/* Without Add-on Package Sub-section */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 pl-5">
                  📦 Without Add-on Package
                  <Badge variant="outline" className="text-xs ml-2">
                    {bookingsData['done-delivery'].filter(b => !b.hasAddon).length}
                  </Badge>
                </h4>
                <div className="space-y-3">
                  {bookingsData['done-delivery'].filter(b => !b.addonPackageId).map((booking) => (
                    <Card key={booking.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="font-medium text-sm">{booking.reference}</span>
                            <Badge variant="secondary" className="text-xs">Standard</Badge>
                          </div>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {booking.customerName}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(booking.date).toLocaleDateString('ms-MY')}
                            </div>
                            <div className="text-xs font-medium text-green-600">
                              RM {booking.totalPrice.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {bookingsData['done-delivery'].filter(b => !b.addonPackageId).length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No bookings</p>
                  )}
                </div>
              </div>

            </div>


            {/* WhatsApp Blast Dialog */}
            <Dialog open={isBlastDialogOpen} onOpenChange={setIsBlastDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Hantar WhatsApp Blast</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="font-medium">Mesej:</label>
                    <Textarea value={blastMessage} onChange={(e) => setBlastMessage(e.target.value)} className="min-h-[120px]" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Gunakan: <code className="bg-muted px-1 rounded">{`{{name}}`}</code>, <code className="bg-muted px-1 rounded">{`{{link}}`}</code>, <code className="bg-muted px-1 rounded">{`{{studioname}}`}</code>
                    </p>
                  </div>
                  <div>
                    <label className="font-medium">Penerima:</label>
                    <div className="max-h-40 overflow-y-auto border rounded p-2">
                      {readyWithLinks.length > 0 ? readyWithLinks.map(b => (
                        <div key={b.id} className="flex justify-between text-sm py-1">
                          <span>{b.customerName}</span>
                          <span>{b.customerPhone}</span>
                          <a href={bookingLinks[b.id]} target="_blank" className="text-blue-500 underline text-xs">Link</a>
                        </div>
                      )) : <p>Tidak ada penerima (semua booking tidak ada link)</p>}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSend} disabled={readyWithLinks.length === 0}>Hantar Sekarang</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    );
  } else {
    return (
      <div className="min-h-screen bg-background">
        <AdminSidebar />

        <main className={cn("transition-all duration-300", isCollapsed ? "pl-16" : "pl-64")}>
          <div className="p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold">Status tugasan</h1>
                  <p className="text-muted-foreground">Urus proses kerja dan hantar mesej WhatsApp</p>
                </div>

              </div>
            </div>

            {/* Super Admin Studio Selector */}
            {isSuperAdmin && (
              <div className="mb-6">
                <StudioSelector />
              </div>
            )}

            {/* Kanban Board */}
            <div className="flex gap-6 overflow-x-auto pb-4">
              {/* Ready for Editing Column */}
              <div
                className="bg-muted/30 rounded-lg p-4 h-[calc(100vh-12rem)] min-w-[400px] flex-shrink-0 flex flex-col"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'complete-photoshoot')}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <h3 className="font-semibold">Done photoshoot</h3>
                  </div>
                  <Badge variant="secondary">{bookingsData['complete-photoshoot'].length}</Badge>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {bookingsData['complete-photoshoot'].map((booking) => {
                    const isExpanded = expandedCards.has(booking.id);
                    return (
                      <Card
                        key={booking.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, booking, 'complete-photoshoot')}
                        className="cursor-move hover:shadow-lg transition-shadow"
                      >
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            <div
                              className="flex justify-between items-center cursor-pointer"
                              onClick={() => toggleCardExpansion(booking.id)}
                            >
                              <div>
                                <span className="font-medium text-sm">{booking.reference}</span>
                                <div className="text-xs text-muted-foreground">{booking.customerName}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className="text-xs bg-orange-500 text-white hover:bg-orange-600">📷 Done</Badge>
                                {isExpanded ?
                                  <ChevronUp className="w-4 h-4 text-muted-foreground" /> :
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                }
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="space-y-1 text-xs text-muted-foreground border-t pt-2 mt-2">
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {booking.customerPhone || 'N/A'}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  <span className="truncate">{booking.customerEmail || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(booking.date).toLocaleDateString('ms-MY')}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {booking.startTime} - {booking.endTime}
                                </div>
                                <div className="text-xs font-medium mt-1">
                                  Layout: {booking.layoutName}
                                </div>
                                <div className="text-xs font-medium text-green-600">
                                  RM {booking.totalPrice.toFixed(2)}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Editing in Progress Column */}
              <div
                className="bg-muted/30 rounded-lg p-4 h-[calc(100vh-12rem)] min-w-[400px] flex-shrink-0 flex flex-col"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'editing-in-progress')}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <h3 className="font-semibold">Editing in Progress</h3>
                  </div>
                  <Badge variant="secondary">{bookingsData['editing-in-progress'].length}</Badge>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {bookingsData['editing-in-progress'].map((booking) => {
                    const isExpanded = expandedCards.has(booking.id);
                    return (
                      <Card
                        key={booking.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, booking, 'editing-in-progress')}
                        className="cursor-move hover:shadow-lg transition-shadow"
                      >
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            <div
                              className="flex justify-between items-center cursor-pointer"
                              onClick={() => toggleCardExpansion(booking.id)}
                            >
                              <div>
                                <span className="font-medium text-sm">{booking.reference}</span>
                                <div className="text-xs text-muted-foreground">{booking.customerName}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">⏳ Editing</Badge>
                                {isExpanded ?
                                  <ChevronUp className="w-4 h-4 text-muted-foreground" /> :
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                }
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="space-y-1 text-xs text-muted-foreground border-t pt-2 mt-2">
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {booking.customerPhone || 'N/A'}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  <span className="truncate">{booking.customerEmail || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(booking.date).toLocaleDateString('ms-MY')}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {booking.startTime} - {booking.endTime}
                                </div>
                                <div className="text-xs font-medium mt-1">
                                  Layout: {booking.layoutName}
                                </div>
                                <div className="text-xs font-medium text-green-600">
                                  RM {booking.totalPrice.toFixed(2)}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Ready for Delivery Column */}
              <div
                className="bg-muted/30 rounded-lg p-4 h-[calc(100vh-12rem)] min-w-[400px] flex-shrink-0 flex flex-col"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'ready-for-delivery')}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <h3 className="font-semibold">Ready for Delivery</h3>
                  </div>
                  <Badge variant="secondary">{bookingsData['ready-for-delivery'].length}</Badge>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {bookingsData['ready-for-delivery'].map((booking) => {
                    const isExpanded = expandedCards.has(booking.id);
                    return (
                      <Card
                        key={booking.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, booking, 'ready-for-delivery')}
                        className="cursor-move hover:shadow-lg transition-shadow"
                      >
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            <div
                              className="flex justify-between items-center cursor-pointer"
                              onClick={() => toggleCardExpansion(booking.id)}
                            >
                              <div>
                                <span className="font-medium text-sm">{booking.reference}</span>
                                <div className="text-xs text-muted-foreground">{booking.customerName}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs ${bookingLinks[booking.id] ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>{bookingLinks[booking.id] ? 'Ready' : 'Pending'}</Badge>
                                <Badge variant="outline" className="text-xs">{bookingLinks[booking.id] ? 'Link Added ✔️' : 'Link Not Added ⏳'}</Badge>
                                {isExpanded ?
                                  <ChevronUp className="w-4 h-4 text-muted-foreground" /> :
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                }
                              </div>
                            </div>

                            {isExpanded && (
                              <div>
                                <div className="space-y-1 text-xs text-muted-foreground border-t pt-2 mt-2">
                                  <div className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {booking.customerPhone}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    <span className="truncate">{booking.customerEmail}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(booking.date).toLocaleDateString('ms-MY')}
                                  </div>
                                </div>
                                <div className="border-t pt-2 mt-2">
                                  <label className="text-xs text-muted-foreground block mb-1">Link:</label>
                                  <input type="url" value={bookingLinks[booking.id] || ''} onChange={(e) => updateBookingLink(booking.id, e.target.value)} className="w-full p-1 text-xs border rounded" placeholder="Enter link" />
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>


              </div>

              {/* Done Delivery Column */}
              <div
                className="bg-muted/30 rounded-lg p-4 h-[calc(100vh-12rem)] min-w-[400px] flex-shrink-0 flex flex-col"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'done-delivery')}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <h3 className="font-semibold">Done Delivery</h3>
                  </div>
                  <Badge variant="secondary">{bookingsData['done-delivery'].length}</Badge>
                </div>

                {/* Scrollable content area */}
                <div className="flex-1 overflow-y-auto">
                  {/* With Add-on Package Sub-section */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      ✨ With Add-on Package
                      <Badge variant="outline" className="text-xs">
                        {bookingsData['done-delivery'].filter(b => !!b.addonPackageId).length}
                      </Badge>
                    </h4>
                    <div className="space-y-3">
                      {bookingsData['done-delivery'].filter(b => !!b.addonPackageId).map((booking) => {
                        const isExpanded = expandedCards.has(booking.id);
                        return (
                          <Card
                            key={booking.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, booking, 'done-delivery')}
                            className="cursor-move hover:shadow-lg transition-shadow border-l-4 border-l-purple-500"
                          >
                            <CardContent className="p-3">
                              <div className="space-y-2">
                                <div
                                  className="flex justify-between items-center cursor-pointer"
                                  onClick={() => toggleCardExpansion(booking.id)}
                                >
                                  <div>
                                    <span className="font-medium text-sm">{booking.reference}</span>
                                    <div className="text-xs text-muted-foreground">{booking.customerName}</div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge className="text-xs bg-purple-500 text-white">✨ Add-on</Badge>
                                    {isExpanded ?
                                      <ChevronUp className="w-4 h-4 text-muted-foreground" /> :
                                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    }
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className="space-y-1 text-xs text-muted-foreground border-t pt-2 mt-2">
                                    <div className="flex items-center gap-1">
                                      <Phone className="w-3 h-3" />
                                      {booking.customerPhone || 'N/A'}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Mail className="w-3 h-3" />
                                      <span className="truncate">{booking.customerEmail || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(booking.date).toLocaleDateString('ms-MY')}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {booking.startTime} - {booking.endTime}
                                    </div>
                                    <div className="text-xs font-medium mt-1">
                                      Layout: {booking.layoutName}
                                    </div>
                                    <div className="text-xs font-medium text-purple-600">
                                      RM {booking.totalPrice.toFixed(2)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                      {bookingsData['done-delivery'].filter(b => !!b.addonPackageId).length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">No bookings</p>
                      )}
                    </div>
                  </div>

                  {/* Without Add-on Package Sub-section */}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      📦 Without Add-on Package
                      <Badge variant="outline" className="text-xs">
                        {bookingsData['done-delivery'].filter(b => !b.addonPackageId).length}
                      </Badge>
                    </h4>
                    <div className="space-y-3">
                      {bookingsData['done-delivery'].filter(b => !b.addonPackageId).map((booking) => {
                        const isExpanded = expandedCards.has(booking.id);
                        return (
                          <Card
                            key={booking.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, booking, 'done-delivery')}
                            className="cursor-move hover:shadow-lg transition-shadow"
                          >
                            <CardContent className="p-3">
                              <div className="space-y-2">
                                <div
                                  className="flex justify-between items-center cursor-pointer"
                                  onClick={() => toggleCardExpansion(booking.id)}
                                >
                                  <div>
                                    <span className="font-medium text-sm">{booking.reference}</span>
                                    <div className="text-xs text-muted-foreground">{booking.customerName}</div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">Standard</Badge>
                                    {isExpanded ?
                                      <ChevronUp className="w-4 h-4 text-muted-foreground" /> :
                                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    }
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className="space-y-1 text-xs text-muted-foreground border-t pt-2 mt-2">
                                    <div className="flex items-center gap-1">
                                      <Phone className="w-3 h-3" />
                                      {booking.customerPhone || 'N/A'}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Mail className="w-3 h-3" />
                                      <span className="truncate">{booking.customerEmail || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(booking.date).toLocaleDateString('ms-MY')}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-4" />
                                      {booking.startTime} - {booking.endTime}
                                    </div>
                                    <div className="text-xs font-medium mt-1">
                                      Layout: {booking.layoutName}
                                    </div>
                                    <div className="text-xs font-medium text-green-600">
                                      RM {booking.totalPrice.toFixed(2)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                      {bookingsData['done-delivery'].filter(b => !b.addonPackageId).length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">No bookings</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* WhatsApp Blast Dialog */}
            <Dialog open={isBlastDialogOpen} onOpenChange={setIsBlastDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Hantar WhatsApp Blast</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="font-medium">Template:</label>
                    <div className="p-3 bg-muted rounded-md text-sm text-balance">
                      <p className="font-medium mb-1">Menggunakan Twilio Content Template</p>
                      <p className="text-muted-foreground">Mesej akan dihantar menggunakan template yang telah dikonfigurasi di Super Settings.</p>
                      <ul className="list-disc list-inside mt-2 text-xs text-muted-foreground">
                        <li>Nama Pelanggan (Automatic)</li>
                        <li>Link Gambar (Dari input)</li>
                        <li>No. Telefon Admin (Automatic)</li>
                        <li>Nama Studio (Automatic)</li>
                      </ul>
                    </div>
                  </div>
                  <div>
                    <label className="font-medium">Penerima:</label>
                    <div className="max-h-40 overflow-y-auto border rounded p-2">
                      {readyWithLinks.length > 0 ? readyWithLinks.map(b => (
                        <div key={b.id} className="flex justify-between text-sm py-1">
                          <span>{b.customerName}</span>
                          <span>{b.customerPhone}</span>
                          <a href={bookingLinks[b.id]} target="_blank" className="text-blue-500 underline text-xs">Link</a>
                        </div>
                      )) : <p>Tidak ada penerima (semua booking tidak ada link)</p>}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSend} disabled={readyWithLinks.length === 0}>Hantar Sekarang</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

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
  }
};

export default AdminTaskTracker;
