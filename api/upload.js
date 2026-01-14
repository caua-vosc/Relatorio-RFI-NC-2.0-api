export default async function handler(req, res) {

    // ===== CORS (ANTES DE QUALQUER COISA) =====
    res.setHeader("Access-Control-Allow-Origin", "https://caua-vosc.github.io");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", "86400");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }
    // ========================================

    try {
        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method not allowed" });
        }

        const { siteId, state } = req.body;
        if (!siteId || !state) {
            return res.status(400).json({ error: "Dados inválidos" });
        }

        const NEXTCLOUD_URL = process.env.NEXTCLOUD_URL;
        const USER = process.env.NEXTCLOUD_USER;
        const PASS = process.env.NEXTCLOUD_PASS;

        if (!NEXTCLOUD_URL || !USER || !PASS) {
            return res.status(500).json({ error: "Variáveis de ambiente ausentes" });
        }

        const auth = Buffer.from(`${USER}:${PASS}`).toString("base64");

        for (const secao of Object.keys(state)) {
            const pasta = `${NEXTCLOUD_URL}/remote.php/dav/files/${USER}/Checklist/${siteId}/${secao}`;

            await fetch(pasta, {
                method: "MKCOL",
                headers: { Authorization: `Basic ${auth}` }
            }).catch(() => {});

            for (let i = 0; i < state[secao].length; i++) {
                const base64 = state[secao][i].split(",")[1];
                const buffer = Buffer.from(base64, "base64");

                await fetch(`${pasta}/foto${i + 1}.jpg`, {
                    method: "PUT",
                    headers: {
                        Authorization: `Basic ${auth}`,
                        "Content-Type": "image/jpeg"
                    },
                    body: buffer
                });
            }
        }

        return res.status(200).json({ success: true });

    } catch (err) {
        console.error("ERRO BACKEND:", err);
        return res.status(500).json({ error: "Erro interno" });
    }
}
