export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "https://caua-vosc.github.io",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
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
          headers: {
            "Access-Control-Allow-Origin": "https://caua-vosc.github.io"
          }
        }
      );
    }

    const NC_URL = process.env.NEXTCLOUD_URL; // DEVE terminar com /remote.php/dav
    const USER = process.env.NEXTCLOUD_USER;
    const PASS = process.env.NEXTCLOUD_PASS;

    if (!NC_URL || !USER || !PASS) {
      return new Response(
        JSON.stringify({ error: "Variáveis de ambiente ausentes" }),
        { status: 500 }
      );
    }

    const auth = Buffer.from(`${USER}:${PASS}`).toString("base64");

    for (const secao of Object.keys(state)) {
      const pasta =
        `${NC_URL}/files/${USER}/Checklist/${siteId}/${secao}`;

      /* ===== CRIA PASTA ===== */
      const mkcol = await fetch(pasta, {
        method: "MKCOL",
        headers: {
          Authorization: `Basic ${auth}`
        }
      });

      if (![201, 405].includes(mkcol.status)) {
        throw new Error(
          `Erro ao criar pasta (${secao}): ${mkcol.status}`
        );
      }

      /* ===== UPLOAD DAS IMAGENS ===== */
      for (let i = 0; i < state[secao].length; i++) {
        const base64 = state[secao][i].split(",")[1];
        const buffer = Buffer.from(base64, "base64");

        const upload = await fetch(
          `${pasta}/foto${i + 1}.jpg`,
          {
            method: "PUT",
            headers: {
              Authorization: `Basic ${auth}`,
              "Content-Type": "image/jpeg"
            },
            body: buffer
          }
        );

        if (!upload.ok) {
          throw new Error(
            `Erro ao enviar imagem (${secao}): ${upload.status}`
          );
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "https://caua-vosc.github.io"
        }
      }
    );

  } catch (err) {
    console.error("UPLOAD ERROR:", err);

    return new Response(
      JSON.stringify({
        error: "Falha no upload",
        detail: err.message
      }),
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "https://caua-vosc.github.io"
        }
      }
    );
  }
}
