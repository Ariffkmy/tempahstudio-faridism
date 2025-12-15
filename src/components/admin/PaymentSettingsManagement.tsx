import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Upload, X } from 'lucide-react';
import { getPaymentSettings, updatePaymentSettings } from '@/services/paymentSettingsService';
import type { PaymentSettings } from '@/services/paymentSettingsService';
import { supabase } from '@/lib/supabase';

export function PaymentSettingsManagement() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingQR, setUploadingQR] = useState(false);
    const [uploadingTerms, setUploadingTerms] = useState(false);
    const [uploadingPrivacy, setUploadingPrivacy] = useState(false);

    const [settings, setSettings] = useState<PaymentSettings | null>(null);
    const [formData, setFormData] = useState({
        bank_name: '',
        account_number: '',
        account_owner_name: '',
        fpx_enabled: false,
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const result = await getPaymentSettings();
            if (result.success && result.settings) {
                setSettings(result.settings);
                setFormData({
                    bank_name: result.settings.bank_name || '',
                    account_number: result.settings.account_number || '',
                    account_owner_name: result.settings.account_owner_name || '',
                    fpx_enabled: result.settings.fpx_enabled || false,
                });
            }
        } catch (error) {
            console.error('Error loading payment settings:', error);
            toast({
                title: 'Error',
                description: 'Failed to load payment settings',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast({
                title: 'Error',
                description: 'Please upload an image file',
                variant: 'destructive',
            });
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast({
                title: 'Error',
                description: 'File size must be less than 2MB',
                variant: 'destructive',
            });
            return;
        }

        setUploadingQR(true);
        try {
            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `qr-code-${Date.now()}.${fileExt}`;
            const filePath = `payment-qr/${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('public-assets')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('public-assets')
                .getPublicUrl(filePath);

            // Update settings with new QR code URL
            const result = await updatePaymentSettings({
                qr_code_image: publicUrl,
            });

            if (result.success) {
                toast({
                    title: 'Success',
                    description: 'QR Code uploaded successfully',
                });
                loadSettings(); // Reload to get updated data
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            console.error('Error uploading QR code:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to upload QR code',
                variant: 'destructive',
            });
        } finally {
            setUploadingQR(false);
        }
    };

    const handleRemoveQR = async () => {
        if (!confirm('Are you sure you want to remove the QR code?')) return;

        try {
            const result = await updatePaymentSettings({
                qr_code_image: null,
            });

            if (result.success) {
                toast({
                    title: 'Success',
                    description: 'QR Code removed successfully',
                });
                loadSettings();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to remove QR code',
                variant: 'destructive',
            });
        }
    };

    const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'terms' | 'privacy') => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (file.type !== 'application/pdf') {
            toast({
                title: 'Error',
                description: 'Please upload a PDF file',
                variant: 'destructive',
            });
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast({
                title: 'Error',
                description: 'File size must be less than 10MB',
                variant: 'destructive',
            });
            return;
        }

        const setUploading = type === 'terms' ? setUploadingTerms : setUploadingPrivacy;
        setUploading(true);

        try {
            // Upload to Supabase Storage
            const fileName = `${type}-${Date.now()}.pdf`;
            const filePath = `payment-docs/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('public-assets')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('public-assets')
                .getPublicUrl(filePath);

            // Update settings with new PDF URL
            const updateData = type === 'terms'
                ? { terms_pdf: publicUrl }
                : { privacy_policy_pdf: publicUrl };

            const result = await updatePaymentSettings(updateData);

            if (result.success) {
                toast({
                    title: 'Success',
                    description: `${type === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'} PDF uploaded successfully`,
                });
                loadSettings();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            console.error(`Error uploading ${type} PDF:`, error);
            toast({
                title: 'Error',
                description: error.message || `Failed to upload ${type === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'} PDF`,
                variant: 'destructive',
            });
        } finally {
            setUploading(false);
        }
    };

    const handleRemovePDF = async (type: 'terms' | 'privacy') => {
        const label = type === 'terms' ? 'Terms & Conditions' : 'Privacy Policy';
        if (!confirm(`Are you sure you want to remove the ${label} PDF?`)) return;

        try {
            const updateData = type === 'terms'
                ? { terms_pdf: null }
                : { privacy_policy_pdf: null };

            const result = await updatePaymentSettings(updateData);

            if (result.success) {
                toast({
                    title: 'Success',
                    description: `${label} PDF removed successfully`,
                });
                loadSettings();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || `Failed to remove ${label} PDF`,
                variant: 'destructive',
            });
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const result = await updatePaymentSettings(formData);

            if (result.success) {
                toast({
                    title: 'Success',
                    description: 'Payment settings updated successfully',
                });
                loadSettings();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            console.error('Error saving payment settings:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to save payment settings',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Payment Settings
                    </CardTitle>
                    <CardDescription>
                        Configure payment methods for package purchases
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* QR Code Upload */}
                    <div className="space-y-4">
                        <div>
                            <Label className="text-base font-semibold">QR Code Payment</Label>
                            <p className="text-sm text-muted-foreground">Upload a QR code for customers to scan and pay</p>
                        </div>

                        {settings?.qr_code_image ? (
                            <div className="space-y-4">
                                <div className="relative inline-block">
                                    <img
                                        src={settings.qr_code_image}
                                        alt="Payment QR Code"
                                        className="w-48 h-48 object-contain border rounded-lg"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute -top-2 -right-2"
                                        onClick={handleRemoveQR}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div>
                                    <Label htmlFor="qr-upload-replace" className="cursor-pointer">
                                        <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                                            <Upload className="h-4 w-4" />
                                            Replace QR Code
                                        </div>
                                    </Label>
                                    <Input
                                        id="qr-upload-replace"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleQRUpload}
                                        className="hidden"
                                        disabled={uploadingQR}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <Label htmlFor="qr-upload" className="cursor-pointer">
                                    <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                                        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                        <p className="text-sm font-medium mb-1">
                                            {uploadingQR ? 'Uploading...' : 'Click to upload QR Code'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            PNG, JPG up to 2MB
                                        </p>
                                    </div>
                                </Label>
                                <Input
                                    id="qr-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleQRUpload}
                                    className="hidden"
                                    disabled={uploadingQR}
                                />
                            </div>
                        )}
                    </div>

                    {/* Bank Transfer Details */}
                    <div className="space-y-4 pt-6 border-t">
                        <div>
                            <Label className="text-base font-semibold">Direct Bank Transfer</Label>
                            <p className="text-sm text-muted-foreground">Bank account details for direct transfer</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="bank_name">Bank Name</Label>
                                <Input
                                    id="bank_name"
                                    value={formData.bank_name}
                                    onChange={(e) => handleInputChange('bank_name', e.target.value)}
                                    placeholder="e.g., Maybank, CIMB, Public Bank"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="account_number">Account Number</Label>
                                <Input
                                    id="account_number"
                                    value={formData.account_number}
                                    onChange={(e) => handleInputChange('account_number', e.target.value)}
                                    placeholder="1234567890"
                                    className="font-mono"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="account_owner_name">Account Owner Name</Label>
                            <Input
                                id="account_owner_name"
                                value={formData.account_owner_name}
                                onChange={(e) => handleInputChange('account_owner_name', e.target.value)}
                                placeholder="Company Name or Individual Name"
                            />
                        </div>
                    </div>

                    {/* FPX Settings */}
                    <div className="space-y-4 pt-6 border-t">
                        <div>
                            <Label className="text-base font-semibold">FPX Payment</Label>
                            <p className="text-sm text-muted-foreground">Enable or disable FPX payment option</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <Switch
                                id="fpx_enabled"
                                checked={formData.fpx_enabled}
                                onCheckedChange={(checked) => handleInputChange('fpx_enabled', checked)}
                            />
                            <Label htmlFor="fpx_enabled" className="cursor-pointer">
                                {formData.fpx_enabled ? 'FPX Enabled' : 'FPX Disabled'}
                            </Label>
                        </div>

                        {formData.fpx_enabled && (
                            <div className="bg-muted/50 p-4 rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                    Note: FPX integration is currently in development. The button will be shown but not functional yet.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Terms & Conditions PDF */}
                    <div className="space-y-4 pt-6 border-t">
                        <div>
                            <Label className="text-base font-semibold">Terms & Conditions PDF</Label>
                            <p className="text-sm text-muted-foreground">Upload PDF document for terms and conditions</p>
                        </div>

                        {settings?.terms_pdf ? (
                            <div className="flex items-center gap-4">
                                <div className="flex-1 bg-muted/50 p-3 rounded-lg flex items-center justify-between">
                                    <span className="text-sm">Terms & Conditions PDF uploaded</span>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(settings.terms_pdf!, '_blank')}
                                        >
                                            View PDF
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleRemovePDF('terms')}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <Label htmlFor="terms-upload" className="cursor-pointer">
                                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                        <p className="text-sm font-medium mb-1">
                                            {uploadingTerms ? 'Uploading...' : 'Click to upload Terms & Conditions PDF'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            PDF up to 10MB
                                        </p>
                                    </div>
                                </Label>
                                <Input
                                    id="terms-upload"
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => handlePDFUpload(e, 'terms')}
                                    className="hidden"
                                    disabled={uploadingTerms}
                                />
                            </div>
                        )}
                    </div>

                    {/* Privacy Policy PDF */}
                    <div className="space-y-4 pt-6 border-t">
                        <div>
                            <Label className="text-base font-semibold">Privacy Policy PDF</Label>
                            <p className="text-sm text-muted-foreground">Upload PDF document for privacy policy</p>
                        </div>

                        {settings?.privacy_policy_pdf ? (
                            <div className="flex items-center gap-4">
                                <div className="flex-1 bg-muted/50 p-3 rounded-lg flex items-center justify-between">
                                    <span className="text-sm">Privacy Policy PDF uploaded</span>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(settings.privacy_policy_pdf!, '_blank')}
                                        >
                                            View PDF
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleRemovePDF('privacy')}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <Label htmlFor="privacy-upload" className="cursor-pointer">
                                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                        <p className="text-sm font-medium mb-1">
                                            {uploadingPrivacy ? 'Uploading...' : 'Click to upload Privacy Policy PDF'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            PDF up to 10MB
                                        </p>
                                    </div>
                                </Label>
                                <Input
                                    id="privacy-upload"
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => handlePDFUpload(e, 'privacy')}
                                    className="hidden"
                                    disabled={uploadingPrivacy}
                                />
                            </div>
                        )}
                    </div>

                    {/* Save Button */}
                    <div className="pt-6 border-t">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full md:w-auto"
                        >
                            {saving ? 'Saving...' : 'Save Payment Settings'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
