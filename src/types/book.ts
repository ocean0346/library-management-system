export type Book = {
    book_id: string;
    title: string;
    author: string;
    isbn: string;
    publisher: string;
    publish_date: string;
    description: string;
    cover_image_url: string;
    available_copies: number;
    total_copies: number;
    location: string;
    categories?: {
        name: string;
    };
}
