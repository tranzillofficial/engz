import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Engz — منصة توصيل لكل حاجة",
  description:
    "اطلب أي حاجة من أي مكان. فاكهة، خبز، سوبر ماركت — طلب واحد وسائق يوصلك.",
  keywords: ["توصيل", "delivery", "طلبات", "مصر", "engz"],
  authors: [{ name: "Engz" }],
  icons: {
    icon: "/assets/images/engz-logo.svg",
    shortcut: "/assets/images/engz-logo.svg",
    apple: "/assets/images/engz-logo.svg",
  },
  openGraph: {
    title: "Engz — منصة توصيل لكل حاجة",
    description: "اطلب أي حاجة من أي مكان. طلب واحد وسائق يوصلك.",
    type: "website",
    images: ["/assets/images/engz-logo.svg"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
