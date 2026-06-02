import { createClient } from '@/lib/supabase/server'
import { getProductImage } from '@/lib/product-images'
import ProductPhotos, { type PhotoProduct } from '@/components/admin/ProductPhotos'

export default async function AdminPhotosPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('id, name, brand, image_url, image_url_admin')
    .order('name', { ascending: true })

  const products: PhotoProduct[] = (data ?? []).map(p => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    adminUrl: p.image_url_admin ?? null,
    // What shows when there's no admin upload: Sheet URL, else name→file mapping.
    baseUrl: getProductImage(p.name, p.image_url),
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest text-base">
          Фото товарів ({products.length})
        </h2>
      </div>
      <p className="font-body-md text-body-md text-on-surface-variant mb-6 text-sm">
        Завантажене тут фото має пріоритет над посиланням із таблиці та автопідбором за назвою.
        Синхронізація каталогу його не перезаписує.
      </p>
      <ProductPhotos products={products} />
    </div>
  )
}
