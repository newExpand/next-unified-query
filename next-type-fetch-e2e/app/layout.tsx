import { setDefaultQueryClientOptions } from "next-type-fetch";
import { ClientProvider } from "./client-provider";
import { setupAllInterceptors } from "./register-interceptors";

// 서버와 클라이언트 모두에서 QueryClient 설정
setDefaultQueryClientOptions({
  baseURL: "http://localhost:3001",
  queryCache: {
    maxQueries: 1000,
  },
  setupInterceptors: setupAllInterceptors, // 복원
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClientProvider>{children}</ClientProvider>
      </body>
    </html>
  );
}
