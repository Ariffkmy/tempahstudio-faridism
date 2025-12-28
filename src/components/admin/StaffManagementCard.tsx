import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import type { StudioStaff, StaffRole } from '@/types/studioStaff';

interface StaffManagementCardProps {
    staffMembers: StudioStaff[];
    isLoading: boolean;
    isDialogOpen: boolean;
    editingStaffId: string | null;
    staffForm: {
        name: string;
        role: StaffRole;
    };
    isDeletingStaff: string | null;
    onOpenDialog: () => void;
    onCloseDialog: () => void;
    onSaveStaff: () => void;
    onEditStaff: (staff: StudioStaff) => void;
    onDeleteStaff: (staffId: string, staffName: string) => void;
    onFormChange: (field: 'name' | 'role', value: string) => void;
}

export function StaffManagementCard({
    staffMembers,
    isLoading,
    isDialogOpen,
    editingStaffId,
    staffForm,
    isDeletingStaff,
    onOpenDialog,
    onCloseDialog,
    onSaveStaff,
    onEditStaff,
    onDeleteStaff,
    onFormChange,
}: StaffManagementCardProps) {
    const photographers = staffMembers.filter(s => s.role === 'Photographer');
    const editors = staffMembers.filter(s => s.role === 'Editor');

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Pengurusan Staf Studio
                            </CardTitle>
                            <CardDescription>
                                Urus photographer dan editor untuk tugasan tempahan
                            </CardDescription>
                        </div>
                        <Button onClick={onOpenDialog}>
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Staf
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Loading staff members...
                        </div>
                    ) : staffMembers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>Tiada staf ditambah lagi</p>
                            <p className="text-sm">Klik butang "Tambah Staf" untuk bermula</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Photographers Section */}
                            <div>
                                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <Badge variant="default">Photographer</Badge>
                                    <span className="text-muted-foreground">({photographers.length})</span>
                                </h3>
                                {photographers.length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic">Tiada photographer ditambah</p>
                                ) : (
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Nama</TableHead>
                                                    <TableHead className="w-[100px]">Tindakan</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {photographers.map((staff) => (
                                                    <TableRow key={staff.id}>
                                                        <TableCell className="font-medium">{staff.name}</TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => onEditStaff(staff)}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => onDeleteStaff(staff.id, staff.name)}
                                                                    disabled={isDeletingStaff === staff.id}
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </div>

                            {/* Editors Section */}
                            <div>
                                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <Badge variant="secondary">Editor</Badge>
                                    <span className="text-muted-foreground">({editors.length})</span>
                                </h3>
                                {editors.length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic">Tiada editor ditambah</p>
                                ) : (
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Nama</TableHead>
                                                    <TableHead className="w-[100px]">Tindakan</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {editors.map((staff) => (
                                                    <TableRow key={staff.id}>
                                                        <TableCell className="font-medium">{staff.name}</TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => onEditStaff(staff)}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => onDeleteStaff(staff.id, staff.name)}
                                                                    disabled={isDeletingStaff === staff.id}
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Staff Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={onCloseDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingStaffId ? 'Edit Staf' : 'Tambah Staf Baru'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingStaffId
                                ? 'Kemaskini maklumat staf'
                                : 'Masukkan maklumat staf baru (photographer atau editor)'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="staff-name">Nama *</Label>
                            <Input
                                id="staff-name"
                                placeholder="Masukkan nama"
                                value={staffForm.name}
                                onChange={(e) => onFormChange('name', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="staff-role">Peranan *</Label>
                            <Select
                                value={staffForm.role}
                                onValueChange={(value) => onFormChange('role', value)}
                                disabled={!!editingStaffId} // Can't change role when editing
                            >
                                <SelectTrigger id="staff-role">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Photographer">Photographer</SelectItem>
                                    <SelectItem value="Editor">Editor</SelectItem>
                                </SelectContent>
                            </Select>
                            {editingStaffId && (
                                <p className="text-xs text-muted-foreground">
                                    Peranan tidak boleh diubah semasa mengedit
                                </p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={onCloseDialog}>
                            Batal
                        </Button>
                        <Button onClick={onSaveStaff}>
                            {editingStaffId ? 'Kemaskini' : 'Tambah'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
