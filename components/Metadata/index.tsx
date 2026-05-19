import NextHead from "next/head";
import { FunctionComponent } from "react";

const APP_NAME = "SG Election Explorer";
const DEFAULT_DESCRIPTION =
  "Run customised Singapore election data queries directly in your browser.";

interface MetadataProps {
  title?: string | null;
  description?: string | null;
  keywords?: string;
}

const Metadata: FunctionComponent<MetadataProps> = ({
  title,
  description,
  keywords = "",
}) => {
  const metaTitle = title ? `${title} | ${APP_NAME}` : APP_NAME;
  const metaDescription = description || DEFAULT_DESCRIPTION;

  return (
    <NextHead>
      <title>{metaTitle}</title>
      <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      <meta name="description" content={metaDescription} />
      <meta name="author" content="SG Election Explorer" />
      <meta name="theme-color" content="#276df1" />
      <meta name="keywords" content={keywords} />
      <meta property="og:site_name" content={APP_NAME} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
    </NextHead>
  );
};

export default Metadata;
