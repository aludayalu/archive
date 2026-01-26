import { Html, Head, Main, NextScript } from "next/document";
import clsx from "clsx";
import { Inter_Font } from "../config/font"

export default function Document() {
    return (
        <Html lang="en">
            <Head />
            <body
                className={clsx(
                "min-h-screen bg-background font-sans antialiased dark",
                Inter_Font.className,
                )}
            >
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
