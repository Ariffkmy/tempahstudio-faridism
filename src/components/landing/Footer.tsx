import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/20">
      <div className="container py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src="/studiorayalogo.png" alt="Raya Studio Logo" style={{ width: '48px', height: '28px' }} />
              <span className="font-semibold">Studio Raya</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Studio fotografi profesional di Kuala Lumpur. Tempah ruang kreatif anda hari ini.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Studio</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground transition-colors">Studio Klasik</Link></li>
              <li><Link to="/" className="hover:text-foreground transition-colors">Studio Minimalist</Link></li>
              <li><Link to="/" className="hover:text-foreground transition-colors">Studio Moden</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Syarikat</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground transition-colors">Tentang Kami</Link></li>
              <li><Link to="/" className="hover:text-foreground transition-colors">Hubungi</Link></li>
              <li><Link to="/" className="hover:text-foreground transition-colors">Kerjaya</Link></li>
            </ul>
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
