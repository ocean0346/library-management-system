export type DashboardStats = {
    totalbooks: number;
    borrowedbooks: number;
    overduebooks: number;
}

export type BorrowedBook = {
    id: string;
    title: string;
    author: string;
    due_date: string;
    cover_image: string | null;
}
