import { Calendar, Shield, Zap, Headphones } from 'lucide-react';

const features = [
  {
    icon: Calendar,
    title: 'Tempahan Segera',
    description: 'Lihat ketersediaan masa nyata dan jamin slot anda dalam beberapa saat. Tiada emel bolak-balik.',
  },
  {
    icon: Shield,
    title: 'Pembayaran Selamat',
    description: 'Penyulitan standard industri melindungi butiran pembayaran anda. Pelbagai pilihan pembayaran tersedia.',
  },
  {
    icon: Zap,
    title: 'Peralatan Premium',
    description: 'Pencahayaan, kamera dan aksesori gred profesional termasuk dengan setiap tempahan.',
  },
  {
    icon: Headphones,
    title: 'Sokongan Berdedikasi',
    description: 'Pasukan kami di sini untuk membantu sebelum, semasa dan selepas sesi anda. Hanya tanya.',
  },
];

export function Features() {
  return (
    <section className="py-20">
      <div className="container">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={feature.title} 
              className="text-center animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent text-accent-foreground mb-4">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
