import type {
  CartItemPriceUpdate,
  CartRepository,
} from '../../domain/repositories/cart.repository';
import type { DB_CartWithItems } from '../../infrastructure/prisma/cart.select';
import { calculateDiscount, isCouponValid } from '../../mappers/cart.mapper';

function sameMoney(left: number, right: number): boolean {
  return Math.round(left * 100) === Math.round(right * 100);
}

/** Rewrites cart lines that still store a price from before the course changed. */
export async function persistLiveItemPrices(
  cart: DB_CartWithItems,
  repository: CartRepository,
): Promise<void> {
  const updates: CartItemPriceUpdate[] = cart.items.flatMap((item) => {
    const livePrice = Number(item.course.price);
    const snapshotPrice = Number(item.price);
    const priceChanged = !sameMoney(snapshotPrice, livePrice);
    const currencyChanged = item.currency !== item.course.currency;

    if (!priceChanged && !currencyChanged) return [];

    return [
      {
        courseId: item.courseId,
        price: livePrice,
        currency: item.course.currency,
      },
    ];
  });

  if (updates.length === 0) return;

  await repository.syncItemPrices(cart.id, updates);

  const liveCurrency = cart.items[0]?.course.currency;
  const singleCurrency = cart.items.every(
    (item) => item.course.currency === liveCurrency,
  );

  if (liveCurrency && singleCurrency && cart.currency !== liveCurrency) {
    await repository.updateCurrency(cart.id, liveCurrency);
  }
}

function liveSubtotal(cart: DB_CartWithItems): number {
  return parseFloat(
    cart.items
      .reduce((acc, item) => acc + Number(item.course.price), 0)
      .toFixed(2),
  );
}

export type CartTotalsResult = {
  subtotal: number;
  discount: number;
  total: number;
  couponCleared: boolean;
};

/** Recalculates and persists cart subtotal, discount, and total from current course prices. */
export async function recalculateCartTotals(
  cart: DB_CartWithItems,
  repository: CartRepository,
): Promise<CartTotalsResult> {
  await persistLiveItemPrices(cart, repository);

  const subtotal = liveSubtotal(cart);

  let discount = 0;
  let couponCleared = false;
  const coupon = cart.coupon;

  if (coupon) {
    if (isCouponValid(coupon, subtotal)) {
      discount = calculateDiscount(subtotal, coupon);
    } else {
      await repository.clearCoupon(cart.id);
      couponCleared = true;
    }
  }

  const total = parseFloat(Math.max(subtotal - discount, 0).toFixed(2));

  const storedSubtotal = Number(cart.subtotal);
  const storedDiscount = Number(cart.discount);
  const storedTotal = Number(cart.total);

  if (
    storedSubtotal !== subtotal ||
    storedDiscount !== discount ||
    storedTotal !== total
  ) {
    await repository.updateTotals(cart.id, { subtotal, discount, total });
  }

  return { subtotal, discount, total, couponCleared };
}
