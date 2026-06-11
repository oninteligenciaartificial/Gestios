import { test, expect } from "@playwright/test";

/**
 * E2E: flujo de checkout de la tienda publica.
 * Mapea a evals/critical-flows.json -> checkout-price-tamper, checkout-stock-race.
 *
 * Requiere una tienda sembrada. Configurar:
 *   STORE_SLUG=<slug-publico>   (tienda con al menos 1 producto en stock)
 * Sin STORE_SLUG los tests se omiten (no fallan en CI sin datos).
 */

const STORE_SLUG = process.env.STORE_SLUG;
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
// La creacion de pedidos reales solo corre con permiso explicito (jamas en CI/produccion
// por defecto, para no ensuciar tiendas con ordenes falsas).
const ALLOW_ORDERS = process.env.E2E_CREATE_ORDERS === "true";
const ALLOW_PRODUCTION_ORDER = process.env.E2E_ALLOW_PRODUCTION_ORDER === "true";
const IS_PRODUCTION_HOST = /https:\/\/(gesti-os\.vercel\.app|gestioshq\.app)\/?$/i.test(BASE_URL);

test.describe("Tienda - checkout publico", () => {
  test.skip(!STORE_SLUG, "Define STORE_SLUG para correr el flujo de checkout");

  test("carga la tienda y muestra productos", async ({ page }) => {
    await page.goto(`/${STORE_SLUG}/tienda`);
    await expect(page.getByTestId("cart-button")).toBeVisible();
    await expect(page.getByTestId("product-card").first()).toBeVisible({ timeout: 15_000 });
  });

  test("agrega al carrito y completa el pedido", async ({ page }) => {
    test.skip(!ALLOW_ORDERS, "Define E2E_CREATE_ORDERS=true para crear pedidos reales");
    test.skip(
      IS_PRODUCTION_HOST && !ALLOW_PRODUCTION_ORDER,
      "Pedido real bloqueado en produccion sin E2E_ALLOW_PRODUCTION_ORDER=true",
    );
    await page.goto(`/${STORE_SLUG}/tienda`);
    await page.getByTestId("add-to-cart").first().click();

    await page.getByTestId("cart-button").click();
    await page.getByTestId("open-checkout").click();

    await page.getByTestId("checkout-name").fill("Cliente E2E");
    await page.getByTestId("checkout-email").fill("e2e@test.bo");

    await page.getByTestId("confirm-order").click();

    await expect(page.getByTestId("order-success")).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Tienda - invariantes de checkout (API)", () => {
  test.skip(!STORE_SLUG, "Define STORE_SLUG para correr invariantes de API");

  test("rechaza precio manipulado con 400", async ({ request }) => {
    // Tomar un producto real de la tienda.
    const store = await request.get(`/api/tienda/${STORE_SLUG}`);
    expect(store.ok()).toBeTruthy();
    const data = await store.json();
    const product = (data.products ?? []).find((p: { hasVariants: boolean }) => !p.hasVariants);
    test.skip(!product, "La tienda no tiene un producto sin variantes para probar");

    const res = await request.post(`/api/tienda/checkout`, {
      data: {
        slug: STORE_SLUG,
        customerName: "Tamper E2E",
        items: [{ productId: product.id, quantity: 1, unitPrice: 0.01 }],
      },
    });
    // Precio recalculado server-side: no se confia en el cliente.
    expect(res.status()).toBe(400);
  });

  test("rechaza body invalido con 400", async ({ request }) => {
    const res = await request.post(`/api/tienda/checkout`, {
      data: { slug: STORE_SLUG, items: [] },
    });
    expect(res.status()).toBe(400);
  });
});
