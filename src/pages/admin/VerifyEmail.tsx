import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useIsMobile } from '@/hooks/use-mobile';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Get email from navigation state or fallback
  const email = location.state?.email || '';
  const [isResending, setIsResending] = useState(false);

  // Redirect if no email provided
  if (!email) {
    setTimeout(() => navigate('/admin/register'), 100);
    return null;
  }

  const handleResendEmail = async () => {
    setIsResending(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        toast({
          title: 'Ralat',
          description: 'Gagal menghantar semula emel. Sila cuba lagi.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Emel Dihantar!',
          description: 'Emel pengesahan telah dihantar semula. Sila semak peti masuk anda.',
        });
      }
    } catch (error) {
      console.error('Resend email error:', error);
      toast({
        title: 'Ralat',
        description: 'Ralat tidak dijangka berlaku.',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Logo & Header */}
        <div className={`text-center ${isMobile ? 'mb-6' : 'mb-8'}`}>
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <img
              src="/tempahstudiologo.png"
              alt="Raya Studio Logo"
              style={{ width: isMobile ? '65px' : '77px', height: isMobile ? '37px' : '44px' }}
            />
          </Link>
        </div>

        <Card className="shadow-lg">
          <CardContent className="pt-8 pb-8 px-6">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 flex items-center justify-center">
                <img
                  src="/icons8-done.gif"
                  alt="Success"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-center mb-3">
              Sahkan Emel Anda
            </h1>

            {/* Email Address */}
            <p className="text-center text-muted-foreground mb-2">
              Kami telah menghantar emel pengesahan ke:
            </p>
            <p className="text-center text-green-600 font-semibold text-lg mb-6">
              {email}
            </p>

            {/* Instructions */}
            <p className="text-center text-sm text-muted-foreground mb-6">
              Sila semak peti masuk anda dan klik pautan pengesahan untuk melengkapkan pendaftaran anda.
            </p>

            {/* Spam Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900 text-sm mb-1">
                    Tidak jumpa emel? Semak folder spam atau junk!
                  </p>
                  <p className="text-xs text-amber-800">
                    Emel pengesahan kami kadangkala masuk ke dalam spam. Sila tandakan sebagai "Not Spam" jika anda menjumpainya di sana.
                  </p>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-muted/50 rounded-lg p-5 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-base">Langkah Seterusnya:</h3>
              </div>
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 text-sm font-semibold flex items-center justify-center">
                    1
                  </span>
                  <span className="text-sm pt-0.5">Buka peti masuk emel anda</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 text-sm font-semibold flex items-center justify-center">
                    2
                  </span>
                  <span className="text-sm pt-0.5">
                    Cari emel daripada Raya Studio (semak folder spam/junk jika tidak jumpa)
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 text-sm font-semibold flex items-center justify-center">
                    3
                  </span>
                  <span className="text-sm pt-0.5">Klik pautan pengesahan</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 text-sm font-semibold flex items-center justify-center">
                    4
                  </span>
                  <span className="text-sm pt-0.5">Anda akan log masuk secara automatik</span>
                </li>
              </ol>
            </div>

            {/* Resend Button */}
            <Button
              variant="outline"
              className="w-full border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700 mb-4"
              onClick={handleResendEmail}
              disabled={isResending}
            >
              {isResending ? 'Menghantar...' : 'Tidak terima emel? Hantar Semula'}
            </Button>

            {/* Back to Login */}
            <Link to="/admin/login">
              <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Log Masuk
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Support Message */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Jika anda terus menghadapi masalah, sila hubungi sokongan.
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
