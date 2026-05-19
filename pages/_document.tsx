import Document, { Head, Html, Main, NextScript } from "next/document";

class HTMLDocument extends Document {
  render() {
    return (
      <Html lang="en-GB">
        <Head>
          <link rel="shortcut icon" href="/favicon.ico" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default HTMLDocument;
