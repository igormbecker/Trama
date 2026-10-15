import Head from "next/head";
import localFont from "next/font/local";

const inter = localFont({
  src: "../public/fonts/inter/InterVariable.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
});

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" href="/favicon.png" />
      </Head>
      <style jsx global>{`
        body {
          font-family: ${inter.style.fontFamily};
        }
        button,
        input,
        select,
        textarea {
          font-family: inherit;
        }
      `}</style>
      <Component {...pageProps} />
    </>
  );
}
