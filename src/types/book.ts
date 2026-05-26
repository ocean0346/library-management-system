export type Book = {
    book_id: string;
    title: string;
    author: string;
    isbn: string;
    publisher: string;
    publish_date: string;
    description: string;
    cover_image_url: string;
    file_url?: string;
    file_size_bytes?: number;
    file_type?: string;
    category_name?: string;
    categories?: {
        name: string;
    };
    tags?: string[];
    chapters?: any[];
    coin_price?: number;
    views_count?: number;
}
