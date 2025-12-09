import { useState } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { StudioSelector } from '@/components/admin/StudioSelector';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Calendar, Clock, User, Phone, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link } from 'react-router-dom';

// Dummy booking data for Kanban board
const dummyBookings = {
  'complete-photoshoot': [
    {
      id: '1',
      reference: 'RAYA-001',
      customerName: 'Ahmad Abdullah',
      customerPhone: '+60123456789',
      customerEmail: 'ahmad@email.com',
      date: '2025-12-15',
      startTime: '10:00',
      endTime: '12:00',
      layoutName: 'Studio Room A',
      package: 'Photography Set A',
      photographer: 'Siti Nur',
      status: 'completed'
    },
    {
      id: '2',
      reference: 'RAYA-002',
      customerName: 'Fatimah Hassan',
      customerPhone: '+60198765432',
      customerEmail: 'fatimah@email.com',
      date: '2025-12-12',
      startTime: '14:00',
      endTime: '16:00',
      layoutName: 'Outdoor Set',
      package: 'Outdoor Photography',
      photographer: 'Ahmad Razak',
      status: 'completed'
    }
  ],
  'editing-in-progress': [
    {
      id: '3',
      reference: 'RAYA-003',
      customerName: 'Mohammad Ali',
      customerPhone: '+60145678901',
      customerEmail: 'ali@email.com',
      date: '2025-12-10',
      startTime: '16:00',
      endTime: '18:00',
      layoutName: 'Studio Room B',
      package: 'Portrait Session',
      editor: 'Nur Maya',
      editingProgress: 75
    },
    {
      id: '4',
      reference: 'RAYA-004',
      customerName: 'Zara Ibrahim',
      customerPhone: '+60156789012',
      customerEmail: 'zara@email.com',
      date: '2025-12-13',
      startTime: '11:00',
      endTime: '13:00',
      layoutName: 'Family Studio',
      package: 'Family Photoshoot',
      editor: 'Syarif Rahman',
      editingProgress: 90
    }
  ],
  'ready-for-delivery': [
    {
      id: '5',
      reference: 'RAYA-005',
      customerName: 'Sarah Wong',
      customerPhone: '+60167890123',
      customerEmail: 'sarah@email.com',
      date: '2025-12-08',
      startTime: '09:00',
      endTime: '11:00',
      layoutName: 'Studio Room A',
      package: 'Wedding Photography',
      photographer: 'Lin Chen',
      editor: 'Maya Sari',
      status: 'ready'
    },
    {
      id: '6',
      reference: 'RAYA-006',
      customerName: 'David Tan',
      customerPhone: '+60178901234',
      customerEmail: 'david@email.com',
      date: '2025-12-11',
      startTime: '13:00',
      endTime: '15:00',
      layoutName: 'Outdoor Set',
      package: 'Graduation Shoot',
      photographer: 'Aminah Fauzi',
      editor: 'Rizal Hashim',
      status: 'ready'
    },
    {
      id: '7',
      reference: 'RAYA-007',
      customerName: 'Puteri Azizan',
      customerPhone: '+60189012345',
      customerEmail: 'puteri@email.com',
      date: '2025-12-14',
      startTime: '15:00',
      endTime: '17:00',
      layoutName: 'Studio Room C',
      package: 'Maternity Shoot',
      photographer: 'Farah Nadia',
      editor: 'Wan Ahmad',
      status: 'ready'
    }
  ]
};

const AdminWhatsappBlaster = () => {
  const { isSuperAdmin } = useAuth();
  const isMobile = useIsMobile();
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [bookingsData, setBookingsData] = useState(dummyBookings);
  const [draggedBooking, setDraggedBooking] = useState<any>(null);

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
    console.log('Send WhatsApp message to all ready for delivery bookings');
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
            <h1 className="text-xl font-bold">Whatsapp Blaster</h1>
            <p className="text-muted-foreground text-sm">Urus proses kerja dan hantar mesej WhatsApp</p>
          </div>

          {/* Super Admin Studio Selector */}
          {isSuperAdmin && (
            <div className="mb-4">
              <StudioSelector />
            </div>
          )}

          {/* Kanban Board */}
          <div className="space-y-4">
            {/* Complete Photoshoot */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                Complete Photoshoot
                <Badge variant="secondary" className="text-xs">{dummyBookings['complete-photoshoot'].length}</Badge>
              </h3>
              <div className="space-y-3">
                {dummyBookings['complete-photoshoot'].map((booking) => (
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
                            <Calendar className="w-3 h-3" />
                            {new Date(booking.date).toLocaleDateString('ms-MY')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {booking.startTime} - {booking.endTime}
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
                <Badge variant="secondary" className="text-xs">{dummyBookings['editing-in-progress'].length}</Badge>
              </h3>
              <div className="space-y-3">
                {dummyBookings['editing-in-progress'].map((booking) => (
                  <Card key={booking.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="font-medium text-sm">{booking.reference}</span>
                          <Badge variant="outline" className="text-xs">{booking.editingProgress}%</Badge>
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
                  <Badge variant="secondary" className="text-xs">{dummyBookings['ready-for-delivery'].length}</Badge>
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
                {dummyBookings['ready-for-delivery'].map((booking) => (
                  <Card key={booking.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="font-medium text-sm">{booking.reference}</span>
                          <Badge variant="default" className="text-xs">Ready</Badge>
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
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
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
              <h1 className="text-2xl font-bold">Whatsapp Blaster</h1>
              <p className="text-muted-foreground">Urus proses kerja dan hantar mesej WhatsApp</p>
            </div>

            {/* Super Admin Studio Selector */}
            {isSuperAdmin && (
              <div className="mb-6">
                <StudioSelector />
              </div>
            )}

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Complete Photoshoot Column */}
              <div
                className="bg-muted/30 rounded-lg p-4 min-h-[500px]"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'complete-photoshoot')}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <h3 className="font-semibold">Complete Photoshoot</h3>
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
                                <Badge variant="default" className="text-xs">Completed</Badge>
                                {isExpanded ?
                                  <ChevronUp className="w-4 h-4 text-muted-foreground" /> :
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                }
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="space-y-1 text-xs text-muted-foreground border-t pt-2 mt-2">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(booking.date).toLocaleDateString('ms-MY')}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {booking.startTime} - {booking.endTime}
                                </div>
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {booking.photographer}
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
                                <Badge variant="outline" className="text-xs">{booking.editingProgress}%</Badge>
                                {isExpanded ?
                                  <ChevronUp className="w-4 h-4 text-muted-foreground" /> :
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                }
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="space-y-1 text-xs text-muted-foreground border-t pt-2 mt-2">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(booking.date).toLocaleDateString('ms-MY')}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {booking.startTime} - {booking.endTime}
                                </div>
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {booking.editor}
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
                                <Badge variant="default" className="text-xs">Ready</Badge>
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
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
};

export default AdminWhatsappBlaster;
