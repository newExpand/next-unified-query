export interface Post {
  id: string;
  userId: string;
  title: string;
  body: string;
}

const globalForDb = global as unknown as {
  posts: Post[];
};

if (!globalForDb.posts) {
  globalForDb.posts = [
    { id: "1", userId: "1", title: "First Post", body: "Hello world" },
    { id: "2", userId: "1", title: "Second Post", body: "Another post" },
  ];
}

export const db = globalForDb;
