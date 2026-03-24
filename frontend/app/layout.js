import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import Providers from "@/components/providers";

export const metadata = {
  title: "Voxora",
  description: "AI-powered transcription",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
