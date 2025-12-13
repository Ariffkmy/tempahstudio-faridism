// Done Delivery Column Component for Mobile View
// Add this after the Ready for Delivery section (around line 488)

{/* Done Delivery */ }
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
                {bookingsData['done-delivery'].filter(b => b.totalPrice > 200).length}
            </Badge>
        </h4>
        <div className="space-y-3">
            {bookingsData['done-delivery'].filter(b => b.totalPrice > 200).map((booking) => (
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
            {bookingsData['done-delivery'].filter(b => b.totalPrice > 200).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No bookings</p>
            )}
        </div>
    </div>

    {/* Without Add-on Package Sub-section */}
    <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2 pl-5">
            📦 Without Add-on Package
            <Badge variant="outline" className="text-xs ml-2">
                {bookingsData['done-delivery'].filter(b => b.totalPrice <= 200).length}
            </Badge>
        </h4>
        <div className="space-y-3">
            {bookingsData['done-delivery'].filter(b => b.totalPrice <= 200).map((booking) => (
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
            {bookingsData['done-delivery'].filter(b => b.totalPrice <= 200).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No bookings</p>
            )}
        </div>
    </div>
</div>
