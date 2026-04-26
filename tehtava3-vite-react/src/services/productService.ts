import type { Product } from '../types/Product';

/**
 * 5.4 – Fetch a random product from DummyJSON.
 * Only selects the fields we need to avoid over-fetching.
 */
export async function fetchRandomProduct(): Promise<Product> {
  const res = await fetch(
    'https://dummyjson.com/products?limit=100&select=id,title,price,thumbnail,description',
  );
  if (!res.ok) throw new Error(`DummyJSON fetch failed: ${res.status}`);

  const data = await res.json();
  const products: Product[] = data.products;
  if (!products || products.length === 0) throw new Error('No products returned');

  const randomIndex = Math.floor(Math.random() * products.length);
  return products[randomIndex];
}
