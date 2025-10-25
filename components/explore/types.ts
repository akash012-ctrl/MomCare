export interface Article {
    id: string;
    title: string;
    description: string;
    category: string;
    date: string;
    read_time: number;
    image_url?: string;
    url?: string;
    tags: string[];
    is_trending?: boolean;
}
