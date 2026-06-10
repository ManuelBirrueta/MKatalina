import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // tus configuraciones existentes (mantén lo que tengas)
};

export default withNextIntl(nextConfig);