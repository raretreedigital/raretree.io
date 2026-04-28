// File: api/send-email.ts
// Vercel Edge Function using ZeptoMail API

export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405 }
    );
  }

  try {
    const { subject, html, name } = await req.json();

    if (!subject || !html) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    const apiKey = process.env.ZEPTO_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Server misconfiguration: missing ZEPTO_API_KEY" }),
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://api.zeptomail.com/v1.1/email",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: apiKey,
        },
        body: JSON.stringify({
          from: {
            address: "sales-quote@raretree.io",
            name: "RareTree",
          },
          to: [
            {
              email_address: {
                address: "cto@raretree.io",
                name: "CTO – RareTree",
              },
            },
            {
              email_address: {
                address: "sales@raretree.io",
                name: "Sales – RareTree",
              },
            },
          ],
          subject,
          htmlbody: html,
        }),
      }
    );

    // ZeptoMail may return plain text on auth/validation errors
    const rawText = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { message: rawText };
    }

    if (!response.ok) {
      console.error("[send-email] ZeptoMail rejected request", {
        status: response.status,
        response: data,
        subject,
        name,
      });
      return new Response(
        JSON.stringify({ error: "ZeptoMail API error", details: data, status: response.status }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("[send-email] Email sent successfully", { subject, name });

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("[send-email] Unexpected error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return new Response(
      JSON.stringify({
        error: "Failed to send email",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500 }
    );
  }
}
