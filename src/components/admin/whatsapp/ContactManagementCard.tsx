import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, Search, Download, RefreshCw, Trash2 } from 'lucide-react';
import { getContacts, syncContacts, type WhatsAppContact } from '@/services/whatsappBaileysService';
import { supabase } from '@/lib/supabase';

interface ContactManagementCardProps {`r`n    studioId: string;`r`n    isConnected: boolean;`r`n    onImportContacts?: (contacts: Array<{ name: string; phone: string }>) => void;
}

export function ContactManagementCard({ studioId, isConnected, onImportContacts }: ContactManagementCardProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [importing, setImporting] = useState(false);
    const [csvImporting, setCsvImporting] = useState(false);
    const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
    const [filteredContacts, setFilteredContacts] = useState<WhatsAppContact[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const contactsPerPage = 50;

    // Pagination calculations
    const totalPages = Math.ceil(filteredContacts.length / contactsPerPage);
    const startIndex = (currentPage - 1) * contactsPerPage;
    const endIndex = startIndex + contactsPerPage;
    const paginatedContacts = filteredContacts.slice(startIndex, endIndex);

    // Fetch contacts
    const fetchContacts = async () => {
        if (!isConnected) return;

        try {
            setLoading(true);
            const contactList = await getContacts(studioId);
            setContacts(contactList);
            setFilteredContacts(contactList);
            setCurrentPage(1); // Reset to first page
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to fetch contacts',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isConnected) {
            fetchContacts();
        }
    }, [isConnected, studioId]);

    // Filter contacts based on search
    useEffect(() => {
        console.log(' Filter useEffect triggered:', { searchQuery, contactsCount: contacts.length });
        
        if (searchQuery) {
            const filtered = contacts.filter(
                (contact) =>
                    contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    contact.phone.includes(searchQuery)
            );
            console.log(' Filtered results:', filtered.length);
            setFilteredContacts(filtered);
        } else {
            console.log(' No filter, showing all contacts');
            setFilteredContacts(contacts);
        }
        setCurrentPage(1);
    }, [searchQuery, contacts]);

    const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setCsvImporting(true);
            const text = await file.text();
            const lines = text.split('\n').filter(line => line.trim());

            // Skip header row
            const dataLines = lines.slice(1);

            const newContacts: WhatsAppContact[] = [];

            for (const line of dataLines) {
                const [name, phone] = line.split(',').map(s => s.trim());
                if (phone) {
                    newContacts.push({
                        id: phone,
                        name: name || phone,
                        phone: phone,
                        isGroup: false,
                    });
                }
            }

            // Merge with existing contacts
            const existingPhones = new Set(contacts.map(c => c.phone));
            const uniqueNewContacts = newContacts.filter(c => !existingPhones.has(c.phone));

            const updatedContacts = [...contacts, ...uniqueNewContacts];
            setContacts(updatedContacts);
            setFilteredContacts(updatedContacts);

            toast({
                title: 'CSV Imported',
                description: `Successfully imported ${uniqueNewContacts.length} new contacts`,
            });

            // Reset file input
            event.target.value = '';
        } catch (error: any) {
            toast({
                title: 'Import Failed',
                description: error.message || 'Failed to parse CSV file',
                variant: 'destructive',
            });
        } finally {
            setCsvImporting(false);
        }
    };

    const handleSyncContacts = async () => {
        try {
            setSyncing(true);
            console.log('Triggering manual contact sync from device...');

            // Use syncContacts to trigger device sync
            const contactList = await syncContacts(studioId);
            setContacts(contactList);
            setFilteredContacts(contactList);

            toast({
                title: 'Contacts Synced',
                description: `Successfully synced ${contactList.length} contacts from your WhatsApp device`,
            });
        } catch (error: any) {
            toast({
                title: 'Sync Failed',
                description: error.message || 'Failed to sync contacts',
                variant: 'destructive',
            });
        } finally {
            setSyncing(false);
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = filteredContacts.map((c) => c.id);
            setSelectedContacts(new Set(allIds));
        } else {
            setSelectedContacts(new Set());
        }
    };

    const handleSelectContact = (contactId: string, checked: boolean) => {
        const newSelected = new Set(selectedContacts);
        if (checked) {
            newSelected.add(contactId);
        } else {
            newSelected.delete(contactId);
        }
        setSelectedContacts(newSelected);
    };

    const handleImportSelected = async () => {
        if (selectedContacts.size === 0) {
            toast({
                title: 'No Contacts Selected',
                description: 'Please select at least one contact to import',
                variant: 'destructive',
            });
            return;
        }

        try {
            setImporting(true);

            const selectedContactList = contacts.filter((c) => selectedContacts.has(c.id));

            // Call parent handler to import contacts to Custom Blast
            if (onImportContacts) {
                const formattedContacts = selectedContactList.map(c => ({
                    name: c.name || 'Unknown',
                    phone: c.phone
                }));
                onImportContacts(formattedContacts);
            }

            setSelectedContacts(new Set());
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'An error occurred',
                variant: 'destructive',
            });
        } finally {
            setImporting(false);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedContacts.size === 0) {
            toast({
                title: 'No Contacts Selected',
                description: 'Please select at least one contact to delete',
                variant: 'destructive',
            });
            return;
        }

        if (!confirm(`Are you sure you want to delete ${selectedContacts.size} selected contact(s)?`)) {
            return;
        }

        try {
            const updatedContacts = contacts.filter(c => !selectedContacts.has(c.id));
            setContacts(updatedContacts);
            setFilteredContacts(updatedContacts);

            // Update database
            await supabase
                .from('whatsapp_sessions')
                .update({ contacts: updatedContacts })
                .eq('studio_id', studioId);

            toast({
                title: 'Contacts Deleted',
                description: `Successfully deleted ${selectedContacts.size} contact(s)`,
            });

            setSelectedContacts(new Set());
        } catch (error: any) {
            toast({
                title: 'Delete Failed',
                description: error.message || 'Failed to delete contacts',
                variant: 'destructive',
            });
        }
    };

    const handleDeleteAll = async () => {
        if (contacts.length === 0) {
            toast({
                title: 'No Contacts',
                description: 'There are no contacts to delete',
                variant: 'destructive',
            });
            return;
        }

        if (!confirm(`Are you sure you want to delete ALL ${contacts.length} contact(s)? This action cannot be undone.`)) {
            return;
        }

        try {
            setContacts([]);
            setFilteredContacts([]);

            // Update database
            await supabase
                .from('whatsapp_sessions')
                .update({ contacts: [] })
                .eq('studio_id', studioId);

            toast({
                title: 'All Contacts Deleted',
                description: `Successfully deleted all ${contacts.length} contacts`,
            });

            setSelectedContacts(new Set());
        } catch (error: any) {
            toast({
                title: 'Delete Failed',
                description: error.message || 'Failed to delete contacts',
                variant: 'destructive',
            });
        }
    };

    if (!isConnected) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Contact Management
                    </CardTitle>
                    <CardDescription>Import contacts from your connected WhatsApp account</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Please connect your WhatsApp account first to manage contacts</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Contact Management
                        </CardTitle>
                        <CardDescription>
                            {contacts.length > 0
                                ? `${contacts.length} contacts available • ${selectedContacts.size} selected`
                                : 'No contacts synced yet'}
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        {/* CSV Import */}
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => document.getElementById('csv-upload')?.click()}
                            disabled={csvImporting}
                        >
                            {csvImporting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="h-4 w-4" />
                            )}
                            Import CSV
                        </Button>
                        <input
                            id="csv-upload"
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={handleCSVImport}
                        />

                        <Button
                            onClick={handleSyncContacts}
                            disabled={syncing || loading}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                        >
                            {syncing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4" />
                            )}
                            Sync Contacts
                        </Button>
                        {selectedContacts.size > 0 && (
                            <>
                                <Button
                                    onClick={handleImportSelected}
                                    disabled={importing}
                                    size="sm"
                                    className="gap-2"
                                >
                                    {importing && <Loader2 className="h-4 w-4 animate-spin" />}
                                    <Download className="h-4 w-4" />
                                    Import Selected ({selectedContacts.size})
                                </Button>
                                <Button
                                    onClick={handleDeleteSelected}
                                    variant="destructive"
                                    size="sm"
                                    className="gap-2"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete Selected ({selectedContacts.size})
                                </Button>
                            </>
                        )}
                        {contacts.length > 0 && (
                            <Button
                                onClick={handleDeleteAll}
                                variant="outline"
                                size="sm"
                                className="gap-2 text-destructive hover:text-destructive"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete All
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-12">
                        <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
                        <p className="text-muted-foreground">Loading contacts...</p>
                    </div>
                ) : contacts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="mb-4">No contacts found</p>
                        <Button onClick={handleSyncContacts} variant="outline" className="gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Sync Contacts from WhatsApp
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search contacts by name or phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Contacts Table */}
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <Checkbox
                                                checked={
                                                    filteredContacts.length > 0 &&
                                                    selectedContacts.size === filteredContacts.length
                                                }
                                                onCheckedChange={handleSelectAll}
                                            />
                                        </TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Phone Number</TableHead>
                                        <TableHead>Type</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedContacts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                                {filteredContacts.length === 0
                                                    ? `No contacts found matching "${searchQuery}"`
                                                    : 'No contacts on this page'}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedContacts.map((contact) => (
                                            <TableRow key={contact.id}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedContacts.has(contact.id)}
                                                        onCheckedChange={(checked) =>
                                                            handleSelectContact(contact.id, checked as boolean)
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {contact.name || 'Unknown'}
                                                </TableCell>
                                                <TableCell>{contact.phone}</TableCell>
                                                <TableCell>
                                                    <span className="text-xs px-2 py-1 bg-muted rounded">
                                                        {contact.isGroup ? 'Group' : 'Individual'}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing {startIndex + 1}-{Math.min(endIndex, filteredContacts.length)} of {filteredContacts.length} contacts
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </Button>

                                    {/* Page Numbers */}
                                    <div className="flex gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }

                                            return (
                                                <Button
                                                    key={pageNum}
                                                    variant={currentPage === pageNum ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className="w-10"
                                                >
                                                    {pageNum}
                                                </Button>
                                            );
                                        })}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Info */}
                        <div className="bg-muted p-4 rounded-lg mt-4">
                            <p className="text-sm text-muted-foreground">
                                <strong>Note:</strong> Contacts are synced from your WhatsApp account. Select the
                                contacts you want to import to your customer database for easy message blasting.
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}




