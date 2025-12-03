import { mockLayouts } from '@/data/mockData';
import { LayoutCard } from './LayoutCard';

export function Layouts() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-4">Pilih Ruang Anda</h2>
          <p className="text-muted-foreground">
            Dari sesi potret intim hingga pengeluaran berskala besar,
            kami mempunyai persediaan studio yang sempurna untuk visi kreatif anda.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockLayouts.map((layout, index) => (
            <LayoutCard key={layout.id} layout={layout} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
