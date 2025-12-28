// =============================================
// STUDIO STAFF TYPES
// =============================================

export type StaffRole = 'Photographer' | 'Editor';

export interface StudioStaff {
    id: string;
    studio_id: string;
    name: string;
    role: StaffRole;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export type StudioStaffInsert = Omit<StudioStaff, 'id' | 'created_at' | 'updated_at' | 'is_active'> & {
    id?: string;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
};

export type StudioStaffUpdate = Partial<Omit<StudioStaffInsert, 'studio_id'>>;
