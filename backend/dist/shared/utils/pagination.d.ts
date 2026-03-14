export interface PaginationParams {
    page: number;
    limit: number;
    skip: number;
}
export interface PaginatedResult<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export declare function getPaginationParams(query: {
    page?: string;
    limit?: string;
}): PaginationParams;
export declare function buildPaginatedResult<T>(data: T[], total: number, { page, limit }: PaginationParams): PaginatedResult<T>;
//# sourceMappingURL=pagination.d.ts.map