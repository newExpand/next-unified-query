export interface Post {
  id: string | number;
  userId: string;
  title: string;
  body: string;
  category?: string;
}

const globalForDb = global as unknown as {
  posts: Post[];
};

if (!globalForDb.posts) {
  globalForDb.posts = [
    { id: "1", userId: "1", title: "First Post", body: "Hello world" },
    { id: "2", userId: "1", title: "Second Post", body: "Another post" },
    { id: "3", userId: "1", title: "Tech Post 1", body: "Technical content", category: "tech" },
    { id: "4", userId: "1", title: "Tech Post 2", body: "More tech content", category: "tech" },
    { id: "5", userId: "1", title: "Life Post 1", body: "Life story", category: "life" },
  ];
}

export const db = globalForDb;
