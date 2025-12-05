import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-border" style={{ background: "linear-gradient(to bottom right, rgba(0,126,110,0.3), rgba(115,175,111,0.2), rgba(215,192,151,0.1), rgba(203,243,187,0.3))" }}>
      <div className="container py-12">
        <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src="/studiorayalogo.png" alt="Raya Studio Logo" style={{ width: '48px', height: '28px' }} />
              <span className="font-semibold">Studio Raya</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Platform terbaik untuk mengurus tempahan studio raya anda. Mudah, cepat, dan boleh dipercayai.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Sokongan</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground transition-colors">Pusat Bantuan</Link></li>
              <li><Link to="/" className="hover:text-foreground transition-colors">Syarat Perkhidmatan</Link></li>
              <li><Link to="/" className="hover:text-foreground transition-colors">Dasar Privasi</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Raya Studio. Hak cipta terpelihara.</p>
        </div>
      </div>
    </footer>
  );
}
