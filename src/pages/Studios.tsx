import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { mockStudios } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Clock, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const Studios = () => {
  return (
    <div className="min-h-screen bg-muted/20">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Pilih Studio</h1>
              <p className="text-muted-foreground">
                Pilih studio yang sesuai dengan keperluan anda dari lokasi strategik di Kuala Lumpur
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockStudios.map((studio) => (
                <Card key={studio.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted relative">
                    <img
                      src={studio.image}
                      alt={studio.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                      <span>{studio.name}</span>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {studio.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {studio.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Clock className="h-4 w-4" />
                      <span>{studio.layouts.length} jenis Layout tersedia</span>
                    </div>
                    <Button asChild className="w-full">
                      <Link to={`/studios/${studio.id}/slots`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Lihat Slot
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Studios;
