import type { Metadata } from "next";
import { getProductsFromDB } from "@/lib/products";
import ProductsCatalog from "@/components/products/ProductsCatalog";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Каталог ASIC-майнерів | Trade M",
  description: "Весь асортимент Antminer, Whatsminer та інших ASIC-майнерів з актуальними цінами. В наявності та під замовлення.",
};

export default async function ProductsPage() {
  const products = await getProductsFromDB();

  return (
    <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-16 pb-section-gap">
      <ProductsCatalog products={products} />
    </div>
  );
}
