import type { AppProps } from "next/app";
import { HeroUIProvider } from "@heroui/system";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useRouter } from "next/router";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
    const router = useRouter();

    return (
        <HeroUIProvider navigate={router.push}>
        <NextThemesProvider attribute="class" defaultTheme="dark">
            <Component {...pageProps} />
        </NextThemesProvider>
        </HeroUIProvider>
    );
}