export const runtime = "edge";

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "https://caua-vosc.github.io",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(request) {
  try {
    const { siteId, state } = await request.json();

    if (!siteId || !state) {
      return new Response(
        JSON.stringify({ error: "Dados inválidos" }),
        {
          status: 400,
          headers: { "Access-Control-Allow-Origin": "https://caua-vosc.github.io" },
        }
      );
    }

    const NC_URL = process.env.NEXTCLOUD_URL;
    const USER = process.env.NEXTCLOUD_USER;
    const PASS = process.env.NEXTCLOUD_PASS;

    const auth = btoa(`${USER}:${PASS}`);

    for (const secao of Object.keys(state)) {
      const pasta = `${NC_URL}/remote.php/dav/files/${USER}/Checklist/${siteId}/${secao}`;

      await fetch(pasta, {
        method: "MKCOL",
        headers: { Authorization: `Basic ${auth}` },
      }).catch(() => {});

      for (let i = 0; i < state[secao].length; i++) {
        const base64 = state[secao][i].split(",")[1];
        const buffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

        await fetch(`${pasta}/foto${i + 1}.jpg`, {
          method: "PUT",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "image/jpeg",
          },
          body: buffer,
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "https://caua-vosc.github.io",
        },
      }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Erro interno" }),
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "https://caua-vosc.github.io",
        },
      }
    );
  }
}
