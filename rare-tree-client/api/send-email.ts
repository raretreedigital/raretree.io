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

    const response = await fetch(
      "https://api.zeptomail.in/v1.1/email",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Zoho-enczapikey ${process.env.ZEPTO_API_KEY}`,
        },
        body: JSON.stringify({
          from: {
            address: "sales-quote@raretree.io",
            name: "RareTree",
          },
          to: [
            {
              email_address: {
                address: "raretree@gmail.com",
                name: name || "RareTree",
              },
            },
          ],
          bcc: [
            {
              email_address: {
                address: "cto@raretree.io",
                name: "CTO",
              },
            },
          ],
          subject,
          htmlbody: html,
        }),
      }
    );

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to send email",
      }),
      { status: 500 }
    );
  }
}
