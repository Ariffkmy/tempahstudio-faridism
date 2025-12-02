import { Calendar, Shield, Zap, Headphones } from 'lucide-react';

const features = [
  {
    icon: Calendar,
    title: 'Instant Booking',
    description: 'See real-time availability and secure your slot in seconds. No back-and-forth emails.',
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    description: 'Industry-standard encryption protects your payment details. Multiple payment options available.',
  },
  {
    icon: Zap,
    title: 'Premium Equipment',
    description: 'Professional-grade lighting, cameras, and accessories included with every booking.',
  },
  {
    icon: Headphones,
    title: 'Dedicated Support',
    description: 'Our team is here to help before, during, and after your session. Just ask.',
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
