export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://caua-vosc.github.io",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { siteId, state } = body;

    if (!siteId || !state) {
      return new Response(
        JSON.stringify({ error: "Dados inválidos" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // ===== CONFIG NEXTCLOUD =====
    const NC_URL = "https://gio.it.tab.digital/remote.php/dav";
    const USER = "caua";
    const PASS = "mTykL-rTXiG-84J6d-s7toE-QiAXz";

    const auth =
      btoa(`${USER}:${PASS}`);

    for (const secao of Object.keys(state)) {

      const pasta =
        `${NC_URL}/files/${USER}/Checklist/${siteId}/${secao}`;

      await fetch(pasta, {
        method: "MKCOL",
        headers: {
          Authorization: `Basic ${auth}`
        }
      }).catch(() => {});

      for (let i = 0; i < state[secao].length; i++) {

        const base64 =
          state[secao][i].split(",")[1];

        const bin = Uint8Array.from(
          atob(base64),
          c => c.charCodeAt(0)
        );

        const destino =
          `${pasta}/foto${i + 1}.jpg`;

        const up = await fetch(destino, {
          method: "PUT",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "image/jpeg"
          },
          body: bin
        });

        if (!up.ok) {
          throw new Error(
            `Nextcloud: ${up.status}`
          );
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {

    return new Response(
      JSON.stringify({
        error: err.message
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}

