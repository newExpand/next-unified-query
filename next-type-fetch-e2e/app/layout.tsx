// import { Providers } from "./providers";
// import { QueryClient } from "next-type-fetch";

// const client = new QueryClient();
// const dehydratedState = client.dehydrate();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* <Providers client={client} dehydratedState={dehydratedState}> */}
        {children}
        {/* </Providers> */}
      </body>
    </html>
  );
}
