const express = require('express');
const { parsePhoneNumber } = require('libphonenumber-js');

const app = express();
app.use(express.json());

/**
 * GET /resolve/user/input
 * Query params:
 * input=WhatsApp number
 * validkeys=pk,us,ae
 * defaultkey=garbage
 */
app.get('/resolve/user/input', (req, res) => {
  let { input, validkeys, defaultkey } = req.query;
  defaultkey = defaultkey?.toLowerCase() || 'garbage';

  if (!input || !validkeys) {
    return res.status(400).json({
      code: "400",
      result: [
        {
          type: "text",
          message: "Missing required fields: input or validkeys"
        }
      ]
    });
  }

  // Normalize WhatsApp number
  let rawNumber = input.replace('whatsapp:', '').trim();
  if (!rawNumber.startsWith('+')) rawNumber = `+${rawNumber}`;

  // Parse phone number to get country
  let country;
  try {
    const phone = parsePhoneNumber(rawNumber);
    if (!phone.isValid()) throw new Error();
    country = phone.country?.toLowerCase(); // pk, us, ae
  } catch {
    country = null;
  }

  // Convert validkeys string to array
  const validKeysArray = validkeys.split(',').map(k => k.toLowerCase());

  // Resolve
  const resolvedKey = country && validKeysArray.includes(country)
    ? country
    : defaultkey;

  return res.status(200).json({
    code: "200",
    result: [
      {
        message: resolvedKey
      }
    ]
  });
});

// Health check
app.get('/status', (req, res) => {
  res.status(200).json({
    code: "200",
    result: [
      {
        type: "text",
        message: "Service is running"
      }
    ]
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    code: "200",
    result: [
      {
        message: "Country Service API"
      }
    ]
  });
});

module.exports = app;
