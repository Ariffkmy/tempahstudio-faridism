import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Studios from "./pages/Studios";
import StudioSlots from "./pages/StudioSlots";
import Book from "./pages/Book";
import NewBooking from "./pages/NewBooking";
import BookingConfirmation from "./pages/BookingConfirmation";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminRegister from "./pages/admin/AdminRegister";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/studios" element={<Studios />} />
            <Route path="/studios/:studioId/slots" element={<StudioSlots />} />
            <Route path="/book" element={<Book />} />
            <Route path="/new-booking" element={<NewBooking />} />
            <Route path="/booking/confirmation" element={<BookingConfirmation />} />
            
            {/* Admin Auth Routes (Public) */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/register" element={<AdminRegister />} />
            
            {/* Protected Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/bookings" 
              element={
                <ProtectedRoute>
                  <AdminBookings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/reports" 
              element={
                <ProtectedRoute>
                  <AdminReports />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/settings" 
              element={
                <ProtectedRoute>
                  <AdminSettings />
                </ProtectedRoute>
              } 
            />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
