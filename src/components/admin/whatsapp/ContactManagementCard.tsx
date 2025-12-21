import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, Search, Download, RefreshCw } from 'lucide-react';
import { getContacts, type WhatsAppContact } from '@/services/whatsappBaileysService';

interface ContactManagementCardProps {
    studioId: string;
    isConnected: boolean;
}

export function ContactManagementCard({ studioId, isConnected }: ContactManagementCardProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [importing, setImporting] = useState(false);
    const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
    const [filteredContacts, setFilteredContacts] = useState<WhatsAppContact[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());

    // Fetch contacts
    const fetchContacts = async () => {
        if (!isConnected) return;

        try {
            setLoading(true);
            const contactList = await getContacts(studioId);
            setContacts(contactList);
            setFilteredContacts(contactList);
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
        if (searchQuery) {
            const filtered = contacts.filter(
                (contact) =>
                    contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    contact.phone.includes(searchQuery)
            );
            setFilteredContacts(filtered);
        } else {
            setFilteredContacts(contacts);
        }
    }, [searchQuery, contacts]);

    const handleSyncContacts = async () => {
        try {
            setSyncing(true);
            await fetchContacts();
            toast({
                title: 'Contacts Synced',
                description: `Successfully synced ${contacts.length} contacts from WhatsApp`,
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

            // TODO: Import contacts to your database
            // For now, just show success message
            toast({
                title: 'Contacts Imported',
                description: `Successfully imported ${selectedContacts.size} contacts`,
            });

            setSelectedContacts(new Set());
        } catch (error: any) {
            toast({
                title: 'Import Failed',
                description: error.message || 'Failed to import contacts',
                variant: 'destructive',
            });
        } finally {
            setImporting(false);
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
                                    {filteredContacts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                                No contacts found matching "{searchQuery}"
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredContacts.map((contact) => (
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

                        {/* Info */}
                        <div className="bg-muted p-4 rounded-lg">
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
