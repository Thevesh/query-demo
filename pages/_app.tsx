import "../styles/globals.css";
import Layout from "@components/Layout";
import { clx } from "@lib/helpers";
import { AppPropsLayout } from "@lib/types";
import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import { Inter, Poppins } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

function App({ Component, pageProps }: AppPropsLayout) {
  const layout =
    Component.layout || ((page: ReactNode) => <Layout>{page}</Layout>);

  return (
    <main
      className={clx(
        inter.className,
        poppins.variable,
        "box-border flex min-h-screen flex-col bg-bg-white font-body text-body-sm text-txt-black-900",
      )}
    >
      <ThemeProvider attribute="class">
        {layout(<Component {...pageProps} />, pageProps)}
      </ThemeProvider>
    </main>
  );
}

export default App;
