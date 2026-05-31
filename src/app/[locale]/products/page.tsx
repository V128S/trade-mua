import type { Metadata } from "next";
import { getProductsFromDB } from "@/lib/products";
import { getMinerstatRevenue } from "@/lib/minerstat";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ProductsCatalog from "@/components/products/ProductsCatalog";

export const revalidate = 60;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "products" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      languages: {
        uk: "/products",
        ru: "/ru/products",
        "x-default": "/products",
      },
    },
  };
}

export default async function ProductsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [products, revenueMap] = await Promise.all([
    getProductsFromDB(),
    getMinerstatRevenue(),
  ]);

  // Flatten to algorithm → revenuePerTH for lightweight per-card profit estimates
  const revenueByAlgo: Record<string, number> = Object.fromEntries(
    Object.entries(revenueMap).map(([algo, data]) => [algo, data.revenuePerTH]),
  );

  return (
    <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-16 pb-section-gap">
      <ProductsCatalog products={products} revenueByAlgo={revenueByAlgo} />
    </div>
  );
}
