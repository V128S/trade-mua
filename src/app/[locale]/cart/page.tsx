import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import CartView from "@/components/cart/CartView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cart" });
  return { title: t("pageTitle") };
}

export default async function CartPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-16 pb-section-gap">
      <CartView />
    </div>
  );
}
