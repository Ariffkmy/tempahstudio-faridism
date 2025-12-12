// =============================================
// BOOKING TITLE CUSTOMIZATION SECTION
// =============================================
// Admin UI for customizing booking form title and subtitle

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Type, AlignCenter } from 'lucide-react';

interface BookingTitleCustomizationProps {
    settings: {
        bookingTitleText: string;
        bookingSubtitleText: string;
        bookingTitleFont: string;
        bookingTitleSize: string;
        bookingSubtitleFont: string;
        bookingSubtitleSize: string;
    };
    onSettingChange: (field: string, value: string) => void;
}

const fontOptions = [
    { value: 'default', label: 'Default (System Font)' },
    { value: 'sans', label: 'Sans-serif' },
    { value: 'serif', label: 'Serif' },
    { value: 'mono', label: 'Monospace' }
];

const sizeOptions = [
    { value: 'xs', label: 'Extra Small (xs)' },
    { value: 'sm', label: 'Small (sm)' },
    { value: 'base', label: 'Base' },
    { value: 'lg', label: 'Large (lg)' },
    { value: 'xl', label: 'Extra Large (xl)' },
    { value: '2xl', label: '2X Large (2xl)' },
    { value: '3xl', label: '3X Large (3xl)' },
    { value: '4xl', label: '4X Large (4xl)' }
];

export const BookingTitleCustomization = ({ settings, onSettingChange }: BookingTitleCustomizationProps) => {
    return (
        <Card className="p-6">
            <div className="space-y-6">
                {/* Section Header */}
                <div className="flex items-center gap-2 pb-4 border-b">
                    <AlignCenter className="h-5 w-5 text-primary" />
                    <div>
                        <h3 className="text-lg font-semibold">Tajuk Borang Tempahan</h3>
                        <p className="text-sm text-muted-foreground">
                            Sesuaikan tajuk dan subtajuk yang dipaparkan di borang tempahan (center-aligned)
                        </p>
                    </div>
                </div>

                {/* Title Section */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Type className="h-4 w-4" />
                        <h4 className="font-medium">Tajuk Utama</h4>
                    </div>

                    {/* Title Text */}
                    <div className="space-y-2">
                        <Label htmlFor="bookingTitleText">Teks Tajuk</Label>
                        <Input
                            id="bookingTitleText"
                            value={settings.bookingTitleText}
                            onChange={(e) => onSettingChange('bookingTitleText', e.target.value)}
                            placeholder="Tempahan Studio"
                        />
                        <p className="text-xs text-muted-foreground">
                            Teks yang akan dipaparkan sebagai tajuk utama
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Title Font */}
                        <div className="space-y-2">
                            <Label htmlFor="bookingTitleFont">Font Tajuk</Label>
                            <Select
                                value={settings.bookingTitleFont}
                                onValueChange={(value) => onSettingChange('bookingTitleFont', value)}
                            >
                                <SelectTrigger id="bookingTitleFont">
                                    <SelectValue placeholder="Pilih font" />
                                </SelectTrigger>
                                <SelectContent>
                                    {fontOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Title Size */}
                        <div className="space-y-2">
                            <Label htmlFor="bookingTitleSize">Saiz Tajuk</Label>
                            <Select
                                value={settings.bookingTitleSize}
                                onValueChange={(value) => onSettingChange('bookingTitleSize', value)}
                            >
                                <SelectTrigger id="bookingTitleSize">
                                    <SelectValue placeholder="Pilih saiz" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sizeOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Subtitle Section */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Type className="h-4 w-4" />
                        <h4 className="font-medium">Subtajuk</h4>
                    </div>

                    {/* Subtitle Text */}
                    <div className="space-y-2">
                        <Label htmlFor="bookingSubtitleText">Teks Subtajuk</Label>
                        <Textarea
                            id="bookingSubtitleText"
                            value={settings.bookingSubtitleText}
                            onChange={(e) => onSettingChange('bookingSubtitleText', e.target.value)}
                            placeholder="Isi maklumat dan buat pembayaran untuk tempahan slot anda."
                            rows={2}
                        />
                        <p className="text-xs text-muted-foreground">
                            Teks penerangan yang akan dipaparkan di bawah tajuk
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Subtitle Font */}
                        <div className="space-y-2">
                            <Label htmlFor="bookingSubtitleFont">Font Subtajuk</Label>
                            <Select
                                value={settings.bookingSubtitleFont}
                                onValueChange={(value) => onSettingChange('bookingSubtitleFont', value)}
                            >
                                <SelectTrigger id="bookingSubtitleFont">
                                    <SelectValue placeholder="Pilih font" />
                                </SelectTrigger>
                                <SelectContent>
                                    {fontOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Subtitle Size */}
                        <div className="space-y-2">
                            <Label htmlFor="bookingSubtitleSize">Saiz Subtajuk</Label>
                            <Select
                                value={settings.bookingSubtitleSize}
                                onValueChange={(value) => onSettingChange('bookingSubtitleSize', value)}
                            >
                                <SelectTrigger id="bookingSubtitleSize">
                                    <SelectValue placeholder="Pilih saiz" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sizeOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div className="p-6 border-2 border-dashed rounded-lg bg-white">
                    <p className="text-xs text-muted-foreground mb-4 text-center">Preview (Center-aligned)</p>
                    <div className="text-center space-y-2">
                        <h1
                            className={`font-bold ${getSizeClass(settings.bookingTitleSize)} ${getFontClass(settings.bookingTitleFont)}`}
                        >
                            {settings.bookingTitleText || 'Tempahan Studio'}
                        </h1>
                        <p
                            className={`text-muted-foreground ${getSizeClass(settings.bookingSubtitleSize)} ${getFontClass(settings.bookingSubtitleFont)}`}
                        >
                            {settings.bookingSubtitleText || 'Isi maklumat dan buat pembayaran untuk tempahan slot anda.'}
                        </p>
                    </div>
                </div>
            </div>
        </Card>
    );
};

// Helper functions
const getSizeClass = (size: string): string => {
    const map: Record<string, string> = {
        'xs': 'text-xs',
        'sm': 'text-sm',
        'base': 'text-base',
        'lg': 'text-lg',
        'xl': 'text-xl',
        '2xl': 'text-2xl',
        '3xl': 'text-3xl',
        '4xl': 'text-4xl'
    };
    return map[size] || 'text-xl';
};

const getFontClass = (font: string): string => {
    const map: Record<string, string> = {
        'default': '',
        'sans': 'font-sans',
        'serif': 'font-serif',
        'mono': 'font-mono'
    };
    return map[font] || '';
};
