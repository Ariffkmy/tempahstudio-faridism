import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FileText, CheckCircle2, XCircle } from 'lucide-react';

interface TermsAndConditionsProps {
    type: 'none' | 'text' | 'pdf';
    textContent?: string;
    pdfUrl?: string;
    accepted: boolean;
    onAcceptChange: (accepted: boolean) => void;
}

export const TermsAndConditions = ({
    type,
    textContent,
    pdfUrl,
    accepted,
    onAcceptChange
}: TermsAndConditionsProps) => {
    // Don't render anything if type is 'none'
    if (type === 'none') {
        return null;
    }

    return (
        <Card variant="outline" className="p-6 border-2">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Terma & Syarat
            </h3>

            {type === 'text' && textContent && (
                <div className="prose prose-sm max-w-none mb-6">
                    <div className="whitespace-pre-wrap text-sm text-muted-foreground bg-muted/30 p-4 rounded-md border max-h-[400px] overflow-y-auto">
                        {textContent}
                    </div>
                </div>
            )}

            {type === 'pdf' && pdfUrl && (
                <div className="space-y-4 mb-6">
                    <div className="border rounded-lg overflow-hidden bg-white">
                        <iframe
                            src={pdfUrl}
                            className="w-full h-[500px]"
                            title="Terma dan Syarat"
                            style={{ border: 'none' }}
                        />
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Dokumen Terma & Syarat</span>
                        <a
                            href={pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                        >
                            Buka dalam tab baru
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                        </a>
                    </div>
                </div>
            )}

            {/* Acknowledgment Section with Checkboxes */}
            <div className={`border-t pt-6 -mx-6 -mb-6 px-6 pb-6 mt-6 rounded-b-lg transition-all duration-300 ${accepted === true
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50'
                    : accepted === false
                        ? 'bg-gradient-to-br from-red-50 to-rose-50'
                        : 'bg-gradient-to-br from-gray-50 to-slate-50'
                }`}>
                <p className="text-sm font-medium text-gray-900 mb-4">
                    Sila pilih salah satu:
                </p>

                <div className="space-y-3">
                    {/* Accept Checkbox */}
                    <div
                        className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${accepted === true
                                ? 'bg-white border-green-500 shadow-sm'
                                : 'bg-white/50 border-gray-200 hover:border-green-300'
                            }`}
                        onClick={() => onAcceptChange(true)}
                    >
                        <Checkbox
                            id="terms-accept"
                            checked={accepted === true}
                            onCheckedChange={() => onAcceptChange(true)}
                            className="mt-0.5"
                        />
                        <div className="flex-1">
                            <Label
                                htmlFor="terms-accept"
                                className="text-sm font-medium leading-relaxed cursor-pointer flex items-start gap-2"
                            >
                                <CheckCircle2 className={`h-5 w-5 flex-shrink-0 mt-0.5 ${accepted === true ? 'text-green-600' : 'text-gray-400'
                                    }`} />
                                <span className={accepted === true ? 'text-green-900' : 'text-gray-700'}>
                                    Saya telah membaca dan <strong>bersetuju</strong> dengan Terma & Syarat yang dinyatakan di atas.
                                </span>
                            </Label>
                        </div>
                    </div>

                    {/* Reject Checkbox */}
                    <div
                        className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${accepted === false
                                ? 'bg-white border-red-500 shadow-sm'
                                : 'bg-white/50 border-gray-200 hover:border-red-300'
                            }`}
                        onClick={() => onAcceptChange(false)}
                    >
                        <Checkbox
                            id="terms-reject"
                            checked={accepted === false}
                            onCheckedChange={() => onAcceptChange(false)}
                            className="mt-0.5"
                        />
                        <div className="flex-1">
                            <Label
                                htmlFor="terms-reject"
                                className="text-sm font-medium leading-relaxed cursor-pointer flex items-start gap-2"
                            >
                                <XCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${accepted === false ? 'text-red-600' : 'text-gray-400'
                                    }`} />
                                <span className={accepted === false ? 'text-red-900' : 'text-gray-700'}>
                                    Saya <strong>tidak bersetuju</strong> dengan Terma & Syarat yang dinyatakan di atas.
                                </span>
                            </Label>
                        </div>
                    </div>
                </div>

                {/* Helper Text */}
                {accepted !== true && (
                    <p className="text-xs text-muted-foreground mt-4 text-center">
                        * Anda perlu bersetuju dengan Terma & Syarat untuk meneruskan tempahan
                    </p>
                )}
            </div>
        </Card>
    );
};
