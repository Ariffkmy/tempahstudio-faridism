import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "@/contexts/AuthContext";
import { StudioProvider } from "@/contexts/StudioContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import Index from "./pages/Index";
import Studios from "./pages/Studios";
import StudioSlots from "./pages/StudioSlots";
import Book from "./pages/Book";
import NewBooking from "./pages/NewBooking";
import BrandBooking from "./pages/BrandBooking";
import BookingConfirmation from "./pages/BookingConfirmation";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminRegister from "./pages/admin/AdminRegister";
import VerifyEmail from "./pages/admin/VerifyEmail";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminTaskTracker from "./pages/admin/AdminTaskTracker";
import AdminWhatsappBlaster from "./pages/admin/AdminWhatsappBlaster";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminManagement from "./pages/admin/AdminManagement";
import AdminSuperSettings from "./pages/admin/AdminSuperSettings";
import AdminPackagePayments from "./pages/admin/AdminPackagePayments";
import PackagePayment from "./pages/PackagePayment";
import Onboarding from "./pages/Onboarding";
import CompleteRegistration from "./pages/CompleteRegistration";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <StudioProvider>
            <SidebarProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/studios" element={<Studios />} />
                <Route path="/studios/:studioId/slots" element={<StudioSlots />} />
                <Route path="/book" element={<Book />} />
                {/* All booking routes now use BrandBooking with conditional customizations */}
                <Route path="/book/:studioId" element={<BrandBooking />} />
                <Route path="/brand/:studioId" element={<BrandBooking />} />
                <Route path="/booking/confirmation" element={<BookingConfirmation />} />
                {/* Studio slug-based booking route (e.g., /my-studio-name) */}
                <Route path="/:studioSlug" element={<BrandBooking />} />

                {/* Admin Auth Routes (Public) */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/register" element={<AdminRegister />} />
                <Route path="/admin/verify-email" element={<VerifyEmail />} />

                {/* Package Payment Route (Public) */}
                <Route path="/package-payment" element={<PackagePayment />} />

                {/* Complete Registration Route (Public - after email verification) */}
                <Route path="/complete-registration" element={<CompleteRegistration />} />

                {/* Onboarding Route (Public) */}
                <Route path="/onboarding" element={<Onboarding />} />

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
                  path="/admin/customers"
                  element={
                    <ProtectedRoute>
                      <AdminCustomers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/task-tracker"
                  element={
                    <ProtectedRoute>
                      <AdminTaskTracker />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/whatsapp"
                  element={
                    <ProtectedRoute>
                      <AdminWhatsappBlaster />
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
                <Route
                  path="/admin/management"
                  element={
                    <ProtectedRoute>
                      <AdminManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/super-settings"
                  element={
                    <ProtectedRoute>
                      <AdminSuperSettings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/package-payments"
                  element={
                    <ProtectedRoute>
                      <AdminPackagePayments />
                    </ProtectedRoute>
                  }
                />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </SidebarProvider>
          </StudioProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
