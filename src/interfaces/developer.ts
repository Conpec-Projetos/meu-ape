export interface DeveloperContact {
    id?: string;
    developerId?: string;
    name: string;
    email: string;
    phone: string;
    state: string;
    city: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Developer {
    id?: string;
    name: string;
    logoUrl?: string | null;
    website?: string | null;
    email?: string | null;
    phone?: string | null;
    contacts?: DeveloperContact[];
    createdAt?: string;
    updatedAt?: string;
}
