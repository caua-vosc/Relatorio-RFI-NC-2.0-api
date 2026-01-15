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

    const NC_URL = process.env.NEXTCLOUD_URL;   // https://gio.it.tab.digital/remote.php/dav/files/caua
    const USER   = process.env.NEXTCLOUD_USER;
    const PASS   = process.env.NEXTCLOUD_PASS;

    if (!NC_URL || !USER || !PASS) {
      return new Response(
        JSON.stringify({ error: "Variáveis de ambiente ausentes" }),
        {
          status: 500,
          headers: {
            "Access-Control-Allow-Origin": "https://caua-vosc.github.io"
          }
        }
      );
    }

    const auth = Buffer.from(`${USER}:${PASS}`).toString("base64");

    // ===== PARA CADA SEÇÃO DO CHECKLIST =====
    for (const secao of Object.keys(state)) {

      // 👉 URL corrigida (sem duplicar /files/caua)
      const pasta = `${NC_URL}/Checklist/${siteId}/${secao}`;

      // ===== CRIAR PASTA =====
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

      // ===== UPLOAD DAS IMAGENS =====
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
        detalhe: err.message
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

