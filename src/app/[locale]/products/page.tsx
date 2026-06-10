import type { Metadata } from "next";
import { getProductsFromDB } from "@/lib/products";
import { getMinerstatRevenue } from "@/lib/minerstat";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ProductsCatalog from "@/components/products/ProductsCatalog";
import JsonLd from "@/components/seo/JsonLd";

export const revalidate = 60;

const SITE_URL = "https://trade-mua.vercel.app";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "products" });
  const localePrefix = locale === "uk" ? "" : `/${locale}`;
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      // self-referential canonical per locale — keeps faceted ?query URLs out of the index
      canonical: `${localePrefix}/products`,
      languages: {
        uk: "/products",
        en: "/en/products",
        ru: "/ru/products",
        "x-default": "/products",
      },
    },
  };
}

export default async function ProductsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [products, revenueMap, t] = await Promise.all([
    getProductsFromDB(),
    getMinerstatRevenue(),
    getTranslations("products"),
  ]);

  // Flatten to algorithm → revenuePerTH for lightweight per-card profit estimates
  const revenueByAlgo: Record<string, number> = Object.fromEntries(
    Object.entries(revenueMap).map(([algo, data]) => [algo, data.revenuePerTH]),
  );

  const localePrefix = locale === "uk" ? "" : `/${locale}`;
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t("breadcrumbHome"), item: `${SITE_URL}${localePrefix}/` },
      { "@type": "ListItem", position: 2, name: t("breadcrumbProducts"), item: `${SITE_URL}${localePrefix}/products` },
    ],
  };

  return (
    <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-16 pb-section-gap">
      <JsonLd data={breadcrumbLd} />
      <ProductsCatalog products={products} revenueByAlgo={revenueByAlgo} />
    </div>
  );
}
