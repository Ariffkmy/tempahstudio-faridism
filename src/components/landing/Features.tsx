import { Calendar, Shield, Mail, Headphones } from 'lucide-react';

const features = [
  {
    icon: Calendar,
    title: 'Pengurusan Tempahan',
    description: 'Kami mengurus semua tempahan pelanggan anda dalam satu platform yang mudah digunakan',
  },
  {
    icon: Shield,
    title: 'Pembayaran Selamat',
    description: 'Pelanggan anda boleh membuat pembayaran terus ke akaun bank anda melalui platform kami',
  },
  {
    icon: Calendar,
    title: 'Tempahan terus ke Google Calendar anda',
    description: 'Jangan risau dengan urusan tempahan pelanggan. Kami bantu untuk isi di Google Calendar anda secara automatik',
  },
  {
    icon: Mail,
    title: 'Notifikasi Email',
    description: 'Semua tempahan akan dimaklumkan kepada anda dan pelanggan anda melalui notifikasi email',
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
