const express = require("express");
const { parsePhoneNumberFromString } = require("libphonenumber-js");

const app = express();
app.use(express.json());

/**
 * GET /resolve/user/input
 * Query params:
 * - input: WhatsApp number (required)
 * - validkeys: comma-separated allowed country codes (e.g., pk,us,ae)
 * - notallowedkeys: comma-separated blocked country codes (e.g., in,cn)
 * - defaultkey: fallback key when no match (defaults to "garbage")
 *
 * Logic:
 * 1. If country is in notallowedkeys → return "not_@llowed"
 * 2. If country is in validkeys → return the country code
 * 3. Otherwise → return defaultkey
 */
app.get("/resolve/user/input", (req, res) => {
    let { input, validkeys, notallowedkeys, defaultkey } = req.query;

    // Normalize defaultkey
    defaultkey = defaultkey?.trim().toLowerCase() || "garbage";

    // Validate required input
    if (!input || typeof input !== "string" || !input.trim()) {
        return res.status(400).json({
            code: "400",
            result: [
                {
                    type: "text",
                    message: "Missing required field: input",
                },
            ],
        });
    }

    // At least one of validkeys or notallowedkeys should be provided
    if (!validkeys && !notallowedkeys) {
        return res.status(400).json({
            code: "400",
            result: [
                {
                    type: "text",
                    message: "At least one of validkeys or notallowedkeys is required",
                },
            ],
        });
    }

    let rawNumber = input.trim();
    if (!rawNumber) {
        return res.status(400).json({
            code: "400",
            result: [
                {
                    type: "text",
                    message: "Invalid input: empty after normalization",
                },
            ],
        });
    }
    if (!rawNumber.startsWith("+")) rawNumber = `+${rawNumber}`;

    // Parse phone number to get country
    let country = null;
    try {
        const phone = parsePhoneNumberFromString(rawNumber);
        if (phone?.isValid()) {
            country = phone.country?.toLowerCase() || null;
        }
    } catch {
        country = null;
    }

    // Helper to parse comma-separated keys into array
    const parseKeys = (keys) => {
        if (!keys || typeof keys !== "string") return [];
        return keys
            .split(",")
            .map((k) => k.trim().toLowerCase())
            .filter((k) => k.length > 0);
    };

    const notAllowedArray = parseKeys(notallowedkeys);
    const validKeysArray = parseKeys(validkeys);

    // Resolve the key based on priority
    let resolvedKey;

    if (country && notAllowedArray.includes(country)) {
        // Country is blocked
        resolvedKey = "not_@llowed";
    } else if (country && validKeysArray.includes(country)) {
        // Country is in allowed list
        resolvedKey = country;
    } else {
        // No match - return default key
        resolvedKey = defaultkey;
    }

    return res.status(200).json({
        code: "200",
        result: [
            {
                message: resolvedKey,
            },
        ],
    });
});

/**
 * GET /resolve/number/whitelist
 * Query params:
 * - input: WhatsApp number to check (required)
 * - allowednumbers: comma-separated list of allowed phone numbers (required)
 * - defaultkey: what to return if number is not in whitelist (defaults to "not_allowed")
 *
 * Logic:
 * - If input number matches any in allowednumbers → return "allowed"
 * - Otherwise → return defaultkey
 */
app.get("/resolve/number/whitelist", (req, res) => {
    let { input, allowednumbers, defaultkey } = req.query;

    // Normalize defaultkey
    defaultkey = defaultkey?.trim().toLowerCase() || "not_@llowed";

    // Validate required input
    if (!input || typeof input !== "string" || !input.trim()) {
        return res.status(400).json({
            code: "400",
            result: [
                {
                    type: "text",
                    message: "Missing required field: input",
                },
            ],
        });
    }

    // Validate allowednumbers
    if (!allowednumbers || typeof allowednumbers !== "string" || !allowednumbers.trim()) {
        return res.status(400).json({
            code: "400",
            result: [
                {
                    type: "text",
                    message: "Missing required field: allowednumbers",
                },
            ],
        });
    }

    // Helper to normalize a phone number for comparison
    const normalizeNumber = (num) => {
        if (!num || typeof num !== "string") return null;
        // Remove whatsapp:, spaces, dashes, parentheses
        let normalized = num
            .replaceAll(/[\s\-\\()]/g, "")
            .trim();
        if (!normalized) return null;
        // Ensure it starts with +
        if (!normalized.startsWith("+")) normalized = `+${normalized}`;
        return normalized;
    };

    // Normalize input number
    const inputNormalized = normalizeNumber(input);
    if (!inputNormalized) {
        return res.status(400).json({
            code: "400",
            result: [
                {
                    type: "text",
                    message: "Invalid input: empty after normalization",
                },
            ],
        });
    }

    // Parse allowed numbers into array and normalize each
    const allowedArray = allowednumbers
        .split(",")
        .map((n) => normalizeNumber(n))
        .filter((n) => n !== null);

    if (allowedArray.length === 0) {
        return res.status(400).json({
            code: "400",
            result: [
                {
                    type: "text",
                    message: "No valid numbers in allowednumbers",
                },
            ],
        });
    }

    // Check if input is in the whitelist
    const isAllowed = allowedArray.includes(inputNormalized);

    return res.status(200).json({
        code: "200",
        result: [
            {
                message: isAllowed ? "@llowed" : defaultkey,
            },
        ],
    });
});

// Health check
app.get("/health", (req, res) => {
    res.status(200).json({
        code: "200",
        result: [
            {
                type: "text",
                message: "Service is running",
            },
        ],
    });
});

// Root endpoint
app.get("/", (req, res) => {
    res.status(200).json({
        code: "200",
        result: [
            {
                message: "Country Service API",
            },
        ],
    });
});

module.exports = app;
