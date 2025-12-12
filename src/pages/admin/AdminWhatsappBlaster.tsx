import { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { StudioSelector } from '@/components/admin/StudioSelector';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Calendar, Clock, User, Phone, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveStudioId } from '@/contexts/StudioContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link } from 'react-router-dom';
import { getStudioBookingsWithDetails } from '@/services/bookingService';
import { Booking } from '@/types/booking';

const AdminWhatsappBlaster = () => {
  const { isSuperAdmin } = useAuth();
  const effectiveStudioId = useEffectiveStudioId();
  const isMobile = useIsMobile();
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [bookingsData, setBookingsData] = useState<{
    'complete-photoshoot': Booking[];
    'editing-in-progress': Booking[];
    'ready-for-delivery': Booking[];
  }>({
    'complete-photoshoot': [],
    'editing-in-progress': [],
    'ready-for-delivery': []
  });
  const [draggedBooking, setDraggedBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize booking links
  const initialLinks: Record<string, string> = {};
  const [bookingLinks, setBookingLinks] = useState<Record<string, string>>(initialLinks);

  const [isBlastDialogOpen, setIsBlastDialogOpen] = useState(false);
  const defaultMessage = "Assalammualaikum {{name}} , ini adalah link gambar raya ye. Terima kasih kerana memilih Raya Studio. Selamat Hari Raya, Maaf Zahir Batin";
  const [blastMessage, setBlastMessage] = useState(defaultMessage);

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
          createdAt: b.created_at,
          updatedAt: b.updated_at,
        }));

        // Filter bookings by status
        const donePhotoshoot = bookings.filter(b => b.status === 'done-photoshoot');
        const startEditing = bookings.filter(b => b.status === 'start-editing');
        const readyForDelivery = bookings.filter(b => b.status === 'ready-for-delivery');

        setBookingsData({
          'complete-photoshoot': donePhotoshoot,
          'editing-in-progress': startEditing,
          'ready-for-delivery': readyForDelivery
        });
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [effectiveStudioId]);

  const readyWithLinks = bookingsData['ready-for-delivery'].filter(b => bookingLinks[b.id]);

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

  const handleDrop = (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault();
    if (!draggedBooking || draggedBooking.sourceColumn === targetColumn) return;

    const { booking, sourceColumn } = draggedBooking;
    setBookingsData(prev => {
      const newData = { ...prev };
      // Remove from source column
      newData[sourceColumn] = newData[sourceColumn].filter(b => b.id !== booking.id);
      // Add to target column
      newData[targetColumn] = [...newData[targetColumn], booking];
      return newData;
    });
    setDraggedBooking(null);
  };

  const handleWhatsAppBlast = () => {
    setIsBlastDialogOpen(true);
  };

  const handleSend = async () => {
    try {
      const { sendWhatsAppMessage } = await import('@/services/twilioService');

      for (const b of readyWithLinks) {
        const personalizedMessage = blastMessage.replace('{{name}}', b.customerName).replace('{{studioname}}', 'Raya Studio');
        const result = await sendWhatsAppMessage(b.customerPhone, personalizedMessage);

        if (!result.success) {
          console.error(`Failed to send WhatsApp to ${b.customerName}: ${result.error}`);
          // Continue with other recipients even if one fails
        } else {
          console.log(`WhatsApp sent to ${b.customerName}, SID: ${result.sid}`);
        }
      }

      setBlastMessage(defaultMessage);
      setIsBlastDialogOpen(false);
    } catch (error) {
      console.error('Error sending WhatsApp messages:', error);
      // Still close the dialog and reset
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

  const updateBookingLink = (bookingId: string, link: string) => {
    setBookingLinks(prev => ({ ...prev, [bookingId]: link }));
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
                <h1 className="text-xl font-bold">Whatsapp Blaster</h1>
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
                          <Badge variant="default" className="text-xs">Completed</Badge>
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
                          <Badge variant="outline" className="text-xs">Editing</Badge>
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
                <Button
                  onClick={handleWhatsAppBlast}
                  size="sm"
                  className="text-xs"
                >
                  <Send className="w-3 h-3 mr-1" />
                  Blast WhatsApp
                </Button>
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
                    <Textarea value={blastMessage} onChange={(e) => setBlastMessage(e.target.value)} />
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

        <main className="pl-64">
          <div className="p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold">Whatsapp Blaster</h1>
                  <p className="text-muted-foreground">Urus proses kerja dan hantar mesej WhatsApp</p>
                </div>
                <Button
                  onClick={handleTestSend}
                  variant="outline"
                  className="text-sm"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Test WhatsApp API
                </Button>
              </div>
            </div>

            {/* Super Admin Studio Selector */}
            {isSuperAdmin && (
              <div className="mb-6">
                <StudioSelector />
              </div>
            )}

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Ready for Editing Column */}
              <div
                className="bg-muted/30 rounded-lg p-4 min-h-[500px]"
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
                <div className="space-y-3">
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
                                <Badge variant="default" className="text-xs">Done</Badge>
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
                className="bg-muted/30 rounded-lg p-4 min-h-[500px]"
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
                <div className="space-y-3">
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
                                <Badge variant="outline" className="text-xs">Editing</Badge>
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
                className="bg-muted/30 rounded-lg p-4 min-h-[500px]"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'ready-for-delivery')}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <h3 className="font-semibold">Ready for Delivery</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleWhatsAppBlast}
                      size="sm"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Blast WhatsApp
                    </Button>
                    <Badge variant="secondary">{bookingsData['ready-for-delivery'].length}</Badge>
                  </div>
                </div>
                <div className="space-y-3">
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
                    <Textarea value={blastMessage} onChange={(e) => setBlastMessage(e.target.value)} />
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
  }
};

export default AdminWhatsappBlaster;
