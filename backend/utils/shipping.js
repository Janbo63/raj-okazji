/**
 * Shipping pricing for InPost Paczkomaty (Standard 2024 rates)
 */
const SHIPPING_PRICES = {
    S: 16.99, // Box A
    M: 18.99, // Box B
    L: 20.99, // Box C
};

/**
 * Calculates the shipping cost for a set of items based on their shipping classes.
 * Logic: The final shipping cost is determined by the largest (highest tier) item in the cart.
 */
export function calculateShippingCost(items) {
    let highestTier = 'S';

    items.forEach(item => {
        const tier = item.cf_shipping_class || 'S';
        if (tier === 'L') {
            highestTier = 'L';
        } else if (tier === 'M' && highestTier !== 'L') {
            highestTier = 'M';
        }
    });

    return SHIPPING_PRICES[highestTier];
}

/**
 * Returns the box size name based on the tier.
 */
export function getBoxSize(tier) {
    const mapping = {
        S: 'Small (Size A)',
        M: 'Medium (Size B)',
        L: 'Large (Size C)',
    };
    return mapping[tier] || mapping.S;
}
