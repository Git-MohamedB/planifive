export interface LeFiveCenter {
    name: string;
    city: string;
    slug: string;
    url: string;
    aliases: string[];
}

export const LE_FIVE_CENTERS: LeFiveCenter[] = [
    {
        name: "LE FIVE Marville - La Courneuve",
        city: "La Courneuve",
        slug: "marville",
        url: "https://www.lefive.fr/nos-centres/65/marville",
        aliases: ["marville", "la courneuve", "courneuve", "le five marville", "le five la courneuve"]
    },
    {
        name: "LE FIVE Bobigny",
        city: "Bobigny",
        slug: "bobigny",
        url: "https://www.lefive.fr/nos-centres/19/bobigny",
        aliases: ["bobigny", "le five bobigny"]
    },
    {
        name: "LE FIVE Bezons",
        city: "Bezons",
        slug: "bezons",
        url: "https://www.lefive.fr/nos-centres/18/bezons",
        aliases: ["bezons", "le five bezons"]
    },
    {
        name: "LE FIVE Paris 17",
        city: "Paris 17",
        slug: "paris_17",
        url: "https://www.lefive.fr/nos-centres/63/paris_17",
        aliases: ["paris 17", "paris_17", "paris17", "le five paris 17", "le five 17"]
    },
    {
        name: "LE FIVE Paris 18",
        city: "Paris 18",
        slug: "paris_18",
        url: "https://www.lefive.fr/nos-centres/69/paris_18",
        aliases: ["paris 18", "paris_18", "paris18", "le five paris 18", "le five 18"]
    },
    {
        name: "LE FIVE Créteil",
        city: "Créteil",
        slug: "creteil",
        url: "https://www.lefive.fr/nos-centres/25/creteil",
        aliases: ["creteil", "créteil", "le five creteil", "le five créteil"]
    },
    {
        name: "LE FIVE Champigny",
        city: "Champigny",
        slug: "champigny",
        url: "https://www.lefive.fr/nos-centres/20/champigny",
        aliases: ["champigny", "le five champigny"]
    },
    {
        name: "LE FIVE Morangis",
        city: "Morangis",
        slug: "morangis",
        url: "https://www.lefive.fr/nos-centres/21/morangis",
        aliases: ["morangis", "le five morangis"]
    },
    {
        name: "LE FIVE Villette",
        city: "Paris 19 (Villette)",
        slug: "villette",
        url: "https://www.lefive.fr/nos-centres/64/villette",
        aliases: ["villette", "paris 19", "paris_19", "le five villette"]
    }
];

export function getLeFiveBookingInfo(locationName?: string) {
    if (!locationName) {
        return {
            centerName: "LE FIVE",
            url: "https://www.lefive.fr/nos-centres",
            isKnownCenter: false,
        };
    }

    const normalized = locationName.toLowerCase().trim();

    // Check specific known centers by aliases, name, slug or city
    const matched = LE_FIVE_CENTERS.find(c => {
        if (c.aliases.some(alias => normalized.includes(alias) || alias.includes(normalized))) {
            return true;
        }
        const normName = c.name.toLowerCase();
        const normCity = c.city.toLowerCase();
        const normSlug = c.slug.toLowerCase();
        return (
            normalized.includes(normSlug) ||
            normalized.includes(normCity) ||
            normName.includes(normalized)
        );
    });

    if (matched) {
        return {
            centerName: matched.name,
            url: matched.url,
            isKnownCenter: true,
        };
    }

    // Default fallback to all centers page
    return {
        centerName: locationName,
        url: "https://www.lefive.fr/nos-centres",
        isKnownCenter: false,
    };
}
