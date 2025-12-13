// Done Delivery Column Component for Desktop View  
// Add this after the Ready for Delivery column (around line 795)
// This should be added in the grid-cols-3 to make it grid-cols-4

{/* Done Delivery Column */ }
<div
    className="bg-muted/30 rounded-lg p-4 min-h-[500px]"
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

    {/* With Add-on Package Sub-section */}
    <div className="mb-6">
        <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            ✨ With Add-on Package
            <Badge variant="outline" className="text-xs">
                {bookingsData['done-delivery'].filter(b => b.totalPrice > 200).length}
            </Badge>
        </h4>
        <div className="space-y-3">
            {bookingsData['done-delivery'].filter(b => b.totalPrice > 200).map((booking) => {
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
            {bookingsData['done-delivery'].filter(b => b.totalPrice > 200).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No bookings</p>
            )}
        </div>
    </div>

    {/* Without Add-on Package Sub-section */}
    <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            📦 Without Add-on Package
            <Badge variant="outline" className="text-xs">
                {bookingsData['done-delivery'].filter(b => b.totalPrice <= 200).length}
            </Badge>
        </h4>
        <div className="space-y-3">
            {bookingsData['done-delivery'].filter(b => b.totalPrice <= 200).map((booking) => {
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
            {bookingsData['done-delivery'].filter(b => b.totalPrice <= 200).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No bookings</p>
            )}
        </div>
    </div>
</div>

// IMPORTANT: Also change the grid class from "grid-cols-1 md:grid-cols-3" to "grid-cols-1 md:grid-cols-4"
// This is around line 579
