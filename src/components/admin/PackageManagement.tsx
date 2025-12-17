import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Star, MoveUp, MoveDown, Package as PackageIcon } from 'lucide-react';
import { getPackages, createPackage, updatePackage, deletePackage, setPackageAsPopular, togglePackageActive } from '@/services/packageService';
import type { Package } from '@/types/database';

export function PackageManagement() {
    const { toast } = useToast();
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [editingPackage, setEditingPackage] = useState<Package | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        price: 0,
        period: 'tahun',
        minute_package: 0,
        is_popular: false,
        features: [''],
        is_active: true,
        display_order: 0,
    });

    useEffect(() => {
        loadPackages();
    }, []);

    const loadPackages = async () => {
        setLoading(true);
        try {
            const data = await getPackages(true); // Include inactive packages for admin
            setPackages(data);
        } catch (error) {
            console.error('Error loading packages:', error);
            toast({
                title: 'Error',
                description: 'Failed to load packages',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            slug: '',
            price: 0,
            period: 'tahun',
            minute_package: 0,
            is_popular: false,
            features: [''],
            is_active: true,
            display_order: packages.length + 1,
        });
        setEditingPackage(null);
    };

    const handleOpenCreate = () => {
        resetForm();
        setShowCreateDialog(true);
    };

    const handleOpenEdit = (pkg: Package) => {
        setEditingPackage(pkg);
        setFormData({
            name: pkg.name,
            slug: pkg.slug,
            price: pkg.price,
            period: pkg.period,
            minute_package: pkg.minute_package || 0,
            is_popular: pkg.is_popular,
            features: pkg.features.length > 0 ? pkg.features : [''],
            is_active: pkg.is_active,
            display_order: pkg.display_order,
        });
        setShowCreateDialog(true);
    };

    const handleCloseDialog = () => {
        setShowCreateDialog(false);
        resetForm();
    };

    const handleAddFeature = () => {
        setFormData(prev => ({
            ...prev,
            features: [...prev.features, ''],
        }));
    };

    const handleRemoveFeature = (index: number) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.filter((_, i) => i !== index),
        }));
    };

    const handleFeatureChange = (index: number, value: string) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.map((f, i) => i === index ? value : f),
        }));
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.name || !formData.slug || formData.price <= 0) {
            toast({
                title: 'Validation Error',
                description: 'Please fill in all required fields',
                variant: 'destructive',
            });
            return;
        }

        // Filter out empty features
        const filteredFeatures = formData.features.filter(f => f.trim() !== '');
        if (filteredFeatures.length === 0) {
            toast({
                title: 'Validation Error',
                description: 'Please add at least one feature',
                variant: 'destructive',
            });
            return;
        }

        try {
            const packageData = {
                ...formData,
                features: filteredFeatures,
            };

            let result;
            if (editingPackage) {
                result = await updatePackage({ id: editingPackage.id, ...packageData });
            } else {
                result = await createPackage(packageData);
            }

            if (result.success) {
                toast({
                    title: 'Success',
                    description: `Package ${editingPackage ? 'updated' : 'created'} successfully`,
                });
                handleCloseDialog();
                loadPackages();
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to save package',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to save package',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this package?')) return;

        try {
            const result = await deletePackage(id);
            if (result.success) {
                toast({
                    title: 'Success',
                    description: 'Package deleted successfully',
                });
                loadPackages();
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to delete package',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete package',
                variant: 'destructive',
            });
        }
    };

    const handleToggleActive = async (id: string, isActive: boolean) => {
        try {
            const result = await togglePackageActive(id, isActive);
            if (result.success) {
                toast({
                    title: 'Success',
                    description: `Package ${isActive ? 'activated' : 'deactivated'} successfully`,
                });
                loadPackages();
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to update package status',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update package status',
                variant: 'destructive',
            });
        }
    };

    const handleSetPopular = async (id: string) => {
        try {
            const result = await setPackageAsPopular(id);
            if (result.success) {
                toast({
                    title: 'Success',
                    description: 'Popular package updated successfully',
                });
                loadPackages();
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to set popular package',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to set popular package',
                variant: 'destructive',
            });
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
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <PackageIcon className="h-5 w-5" />
                                Package Management
                            </CardTitle>
                            <CardDescription>
                                Manage subscription packages displayed on the landing page
                            </CardDescription>
                        </div>
                        <Button onClick={handleOpenCreate}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Package
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {packages.map((pkg) => (
                            <Card key={pkg.id} className={pkg.is_popular ? 'border-2 border-primary' : ''}>
                                <CardContent className="pt-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-lg font-semibold">{pkg.name}</h3>
                                                {pkg.is_popular && (
                                                    <Badge className="bg-primary">
                                                        <Star className="h-3 w-3 mr-1" />
                                                        Pilihan Berbaloi
                                                    </Badge>
                                                )}
                                                {!pkg.is_active && (
                                                    <Badge variant="secondary">Inactive</Badge>
                                                )}
                                            </div>
                                            <p className="text-2xl font-bold text-primary">
                                                RM {pkg.price.toFixed(2)} <span className="text-sm text-muted-foreground">/{pkg.period}</span>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleOpenEdit(pkg)}
                                                title="Edit"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(pkg.id)}
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-4">
                                        <h4 className="text-sm font-medium">Features:</h4>
                                        <ul className="space-y-2">
                                            {pkg.features.map((feature, index) => (
                                                <li key={index} className="text-sm flex items-start gap-2">
                                                    <span className="text-green-500 mt-0.5">✓</span>
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="flex items-center gap-4 pt-4 border-t">
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor={`active-${pkg.id}`} className="text-sm">Active</Label>
                                            <Switch
                                                id={`active-${pkg.id}`}
                                                checked={pkg.is_active}
                                                onCheckedChange={(checked) => handleToggleActive(pkg.id, checked)}
                                            />
                                        </div>
                                        {!pkg.is_popular && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleSetPopular(pkg.id)}
                                            >
                                                <Star className="h-4 w-4 mr-2" />
                                                Set as Popular
                                            </Button>
                                        )}
                                        <div className="ml-auto text-sm text-muted-foreground">
                                            Order: {pkg.display_order}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {packages.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <PackageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No packages found. Create your first package to get started.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={handleCloseDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingPackage ? 'Edit Package' : 'Create New Package'}</DialogTitle>
                        <DialogDescription>
                            {editingPackage ? 'Update package details' : 'Add a new subscription package'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Package Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g., Silver, Gold, Platinum"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug *</Label>
                                <Input
                                    id="slug"
                                    value={formData.slug}
                                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                                    placeholder="e.g., silver, gold, platinum"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Price (RM) *</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                    placeholder="300.00"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="period">Period</Label>
                                <Input
                                    id="period"
                                    value={formData.period}
                                    onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value }))}
                                    placeholder="tahun"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="minute_package">Duration (Minutes)</Label>
                            <Input
                                id="minute_package"
                                type="number"
                                min="0"
                                value={formData.minute_package}
                                onChange={(e) => setFormData(prev => ({ ...prev, minute_package: parseInt(e.target.value) || 0 }))}
                                placeholder="e.g., 60, 120, 180"
                            />
                            <p className="text-xs text-muted-foreground">Package duration in minutes (e.g., 60 = 1 hour)</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="display_order">Display Order</Label>
                            <Input
                                id="display_order"
                                type="number"
                                min="0"
                                value={formData.display_order}
                                onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                                placeholder="1"
                            />
                            <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Features * (supports emojis)</Label>
                                <Button type="button" variant="outline" size="sm" onClick={handleAddFeature}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Feature
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {formData.features.map((feature, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            value={feature}
                                            onChange={(e) => handleFeatureChange(index, e.target.value)}
                                            placeholder="e.g., ✨ Tempahan atas talian"
                                        />
                                        {formData.features.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemoveFeature(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-4 pt-4 border-t">
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                                />
                                <Label htmlFor="is_active">Active</Label>
                            </div>

                            <div className="flex items-center gap-2">
                                <Switch
                                    id="is_popular"
                                    checked={formData.is_popular}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_popular: checked }))}
                                />
                                <Label htmlFor="is_popular">Popular (Pilihan Berbaloi)</Label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseDialog}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit}>
                            {editingPackage ? 'Update Package' : 'Create Package'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
