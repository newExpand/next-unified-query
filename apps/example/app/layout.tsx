import type { ReactNode } from "react";
import { configureQueryClient } from "next-unified-query";
import { Providers } from "./providers";
import { queryConfig } from "./query-config";
import "./globals.css";

// SSR과 클라이언트 모두에서 사용할 전역 설정
configureQueryClient(queryConfig);

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
