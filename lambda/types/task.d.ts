interface Task {
    id: string;
    title: string;
    description: string;
    complete: boolean;
    attachmentIds?: string[];
}