/**
 * Shipping pricing for various methods (Standard 2024 rates)
 */
const PRICING = {
    locker: {
        S: 16.99, // Box A
        M: 18.99, // Box B
        L: 20.99, // Box C
    },
    courier: {
        S: 19.99,
        M: 22.99,
        L: 26.99,
    }
};

/**
 * Calculates the shipping cost.
 * @param {Array} items - Cart items
 * @param {String} method - 'locker' or 'courier'
 */
export function calculateShippingCost(items, method = 'locker') {
    let highestTier = 'S';

    items.forEach(item => {
        // Check custom field for tier, fallback to M for safety
        const tier = item.cf_shipping_class || 'M';
        if (tier === 'L') {
            highestTier = 'L';
        } else if (tier === 'M' && highestTier !== 'L') {
            highestTier = 'M';
        }
    });

    const methodPricing = PRICING[method] || PRICING.locker;
    return methodPricing[highestTier];
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
    return mapping[tier] || mapping.M;
}
