import type { Metadata } from "next";
import { getProductsFromDB } from "@/lib/products";
import { getMinerstatRevenue } from "@/lib/minerstat";
import ProductsCatalog from "@/components/products/ProductsCatalog";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Каталог ASIC-майнерів | Trade M",
  description: "Весь асортимент Antminer, Whatsminer та інших ASIC-майнерів з актуальними цінами. В наявності та під замовлення.",
};

export default async function ProductsPage() {
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
