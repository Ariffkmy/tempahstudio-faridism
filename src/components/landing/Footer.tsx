import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-[#0F977C] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Tempah Studio</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Sistem pengurusan tempahan studio yang mudah dan pantas untuk pemilik studio raya di Malaysia.
              Uruskan tempahan, pembayaran dan pelanggan dengan lebih efisien.
            </p>
          </div>

          {/* Product Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Tentang Tempah Studio</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/getting-started"
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Bermula
                </Link>
              </li>
              <li>
                <Link
                  to="/use-cases"
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Kegunaan
                </Link>
              </li>
              <li>
                <Link
                  to="/pricing"
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Harga
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Sumber</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/blog"
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  to="/contact-support"
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Sokongan Pelanggan
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Undang-undang</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/privacy-policy"
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Dasar Privasi
                </Link>
              </li>
              <li>
                <Link
                  to="/terms-of-service"
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Terma Perkhidmatan
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 pt-8 border-t border-white-700">
          <p className="text-xs leading-relaxed text-center max-w-4xl mx-auto mb-6">
            Tempah Studio adalah sistem pengurusan tempahan studio yang direka untuk memudahkan pemilik studio raya di Malaysia.
            Platform ini tidak berafiliasi dengan, disahkan oleh, atau ditaja oleh WhatsApp atau Meta Platforms, Inc.
            Baca lebih lanjut dalam{' '}
            <Link to="/terms-of-service" className="underline hover:text-white">
              Terma & Syarat
            </Link>
            .
          </p>

          {/* Copyright */}
          <div className="text-center space-y-2">
            <p className="text-sm">
              © 2025 Tempah Studio. Hak cipta terpelihara.
            </p>
            <p className="text-xs">
              SSM: 003795517-T
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
