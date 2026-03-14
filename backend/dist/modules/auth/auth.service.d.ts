export declare const authService: {
    login(email: string, password: string): Promise<{
        token: string;
        user: {
            id: string;
            email: string;
            name: string;
            role: import(".prisma/client").$Enums.Role;
        };
    }>;
    getMe(userId: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        role: import(".prisma/client").$Enums.Role;
        email: string;
    }>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
};
//# sourceMappingURL=auth.service.d.ts.map