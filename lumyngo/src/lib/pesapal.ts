const PESAPAL_BASE_URL =
  process.env.PESAPAL_ENV === "production"
    ? "https://pay.pesapal.com/v3"
    : "https://cybqa.pesapal.com/pesapalv3";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error("PesaPal credentials not configured");
  }

  const res = await fetch(`${PESAPAL_BASE_URL}/api/Auth/RequestToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      consumer_key: consumerKey,
      consumer_secret: consumerSecret,
    }),
  });

  const data = await res.json();
  if (!data.token) throw new Error("Failed to get PesaPal token");

  cachedToken = {
    token: data.token,
    expiresAt: Date.now() + 4 * 60 * 60 * 1000,
  };

  return data.token;
}

export interface PesapalOrderRequest {
  orderId: string;
  amount: number;
  currency?: string;
  description: string;
  customerEmail: string;
  customerPhone?: string;
  customerName: string;
  callbackUrl: string;
}

export async function submitPesapalOrder(req: PesapalOrderRequest) {
  const token = await getAccessToken();

  const ipnId = process.env.PESAPAL_IPN_ID;
  if (!ipnId) throw new Error("PESAPAL_IPN_ID not configured");

  const payload = {
    id: req.orderId,
    currency: req.currency ?? "KES",
    amount: req.amount,
    description: req.description,
    callback_url: req.callbackUrl,
    notification_id: ipnId,
    billing_address: {
      email_address: req.customerEmail,
      phone_number: req.customerPhone ?? "",
      first_name: req.customerName.split(" ")[0] ?? req.customerName,
      last_name: req.customerName.split(" ").slice(1).join(" ") ?? "",
    },
  };

  const res = await fetch(
    `${PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await res.json();
  return data as { order_tracking_id: string; redirect_url: string };
}

export async function checkTransactionStatus(orderTrackingId: string) {
  const token = await getAccessToken();

  const res = await fetch(
    `${PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );

  return res.json();
}
