export declare const registerUser: (data: any) => Promise<{
    token: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        businessId: string;
    };
    business: {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        gstin: string | null;
        address: string | null;
        logoUrl: string | null;
        currency: string;
        timezone: string;
        taxConfig: import("@prisma/client/runtime/client").JsonValue | null;
    };
}>;
export declare const loginUser: (data: any) => Promise<{
    token: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        businessId: string;
    };
    business: {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        gstin: string | null;
        address: string | null;
        logoUrl: string | null;
        currency: string;
        timezone: string;
        taxConfig: import("@prisma/client/runtime/client").JsonValue | null;
    };
}>;
export declare const getUserProfile: (userId: string) => Promise<{
    id: string;
    name: string;
    email: string;
    role: import("@prisma/client").$Enums.Role;
    business: {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        gstin: string | null;
        address: string | null;
        logoUrl: string | null;
        currency: string;
        timezone: string;
        taxConfig: import("@prisma/client/runtime/client").JsonValue | null;
    };
}>;
//# sourceMappingURL=auth.service.d.ts.map