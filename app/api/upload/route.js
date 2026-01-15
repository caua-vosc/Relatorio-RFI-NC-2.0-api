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
  const cors = {
    "Access-Control-Allow-Origin": "https://caua-vosc.github.io"
  };

  try {
    const { siteId, state } = await request.json();

    if (!siteId || !state) {
      return new Response(
        JSON.stringify({ error: "Dados inválidos" }),
        { status: 400, headers: cors }
      );
    }

    // ===== CONFIG CORRETA =====
    const NC_URL = "https://gio.it.tab.digital/remote.php/dav";
    const USER = "caua";
    const PASS = "mTykL-rTXiG-84J6d-s7toE-QiAXz";

    const auth =
      Buffer.from(`${USER}:${PASS}`).toString("base64");

    for (const secao of Object.keys(state)) {

      const pasta =
        `${NC_URL}/files/${USER}/Checklist/${siteId}/${secao}`;

      console.log("Criando pasta:", pasta);

      await fetch(pasta, {
        method: "MKCOL",
        headers: {
          Authorization: `Basic ${auth}`
        }
      });

      for (let i = 0; i < state[secao].length; i++) {

        const base64 =
          state[secao][i].split(",")[1];

        const buffer =
          Buffer.from(base64, "base64");

        const destino =
          `${pasta}/foto${i + 1}.jpg`;

        console.log("Enviando:", destino);

        const up = await fetch(destino, {
          method: "PUT",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "image/jpeg"
          },
          body: buffer
        });

        if (!up.ok) {
          throw new Error(
            `Nextcloud respondeu: ${up.status}`
          );
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: cors }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err.message
      }),
      { status: 500, headers: cors }
    );
  }
}

