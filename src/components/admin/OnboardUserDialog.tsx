import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { UserPlus } from 'lucide-react';

interface OnboardUserDialogProps {
    onSuccess?: () => void;
}

export function OnboardUserDialog({ onSuccess }: OnboardUserDialogProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        role: 'admin' as 'admin' | 'staff' | 'super_admin',
        studioName: '',
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Call the Edge Function to create the user
            const { data, error } = await supabase.functions.invoke('onboard-user', {
                body: {
                    email: formData.email,
                    password: formData.password,
                    fullName: formData.fullName,
                    phone: formData.phone,
                    role: formData.role,
                    studioName: formData.studioName,
                },
            });

            if (error) {
                throw new Error(error.message);
            }

            if (!data.success) {
                throw new Error(data.error || 'Failed to create user');
            }

            toast({
                title: 'Success!',
                description: `User ${formData.email} has been created and is ready to login.`,
            });

            // Reset form and close dialog
            setFormData({
                email: '',
                password: '',
                fullName: '',
                phone: '',
                role: 'admin',
                studioName: '',
            });
            setOpen(false);

            // Call success callback
            if (onSuccess) {
                onSuccess();
            }
        } catch (error: any) {
            console.error('Error onboarding user:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to onboard user',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Onboard New User
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Onboard New User</DialogTitle>
                        <DialogDescription>
                            Create a new user account without email verification. User can login immediately.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Email */}
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="user@example.com"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                required
                            />
                        </div>

                        {/* Password */}
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password *</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Minimum 6 characters"
                                value={formData.password}
                                onChange={(e) => handleChange('password', e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        {/* Full Name */}
                        <div className="grid gap-2">
                            <Label htmlFor="fullName">Full Name *</Label>
                            <Input
                                id="fullName"
                                type="text"
                                placeholder="John Doe"
                                value={formData.fullName}
                                onChange={(e) => handleChange('fullName', e.target.value)}
                                required
                            />
                        </div>

                        {/* Phone */}
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="0123456789"
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                            />
                        </div>

                        {/* Role */}
                        <div className="grid gap-2">
                            <Label htmlFor="role">Role *</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value) => handleChange('role', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="staff">Staff</SelectItem>
                                    <SelectItem value="super_admin">Super Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Studio Name (only for admin/staff) */}
                        {formData.role !== 'super_admin' && (
                            <div className="grid gap-2">
                                <Label htmlFor="studioName">Studio Name *</Label>
                                <Input
                                    id="studioName"
                                    type="text"
                                    placeholder="My Studio"
                                    value={formData.studioName}
                                    onChange={(e) => handleChange('studioName', e.target.value)}
                                    required={formData.role !== 'super_admin'}
                                />
                                <p className="text-xs text-muted-foreground">
                                    A new studio will be created for this user
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create User'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
