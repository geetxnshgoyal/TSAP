import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "TSAP - Turing Society of Algorithmic Programmers",
    description: "Competitive Programming Club at NST Bangalore - Track your progress, compete with peers, and level up your coding skills",
    keywords: ["competitive programming", "coding", "algorithms", "TSAP", "NST Bangalore"],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body suppressHydrationWarning>{children}</body>
        </html>
    );
}
