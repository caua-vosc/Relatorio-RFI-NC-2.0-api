import fetch from "node-fetch";

const NEXTCLOUD_URL = process.env.NEXTCLOUD_URL;
const USER = process.env.NEXTCLOUD_USER;
const PASS = process.env.NEXTCLOUD_PASS;

export default async function handler(req,res){
    if(req.method!=="POST") return res.status(405).end();

    const { siteId, state } = req.body;
    const auth = Buffer.from(`${USER}:${PASS}`).toString("base64");

    for(const secao in state){
        await fetch(`${NEXTCLOUD_URL}/remote.php/dav/files/${USER}/Checklist/${siteId}/${secao}`,{
            method:"MKCOL",
            headers:{ Authorization:`Basic ${auth}` }
        }).catch(()=>{});

        for(let i=0;i<state[secao].length;i++){
            const buffer = Buffer.from(state[secao][i].split(",")[1],"base64");
            await fetch(`${NEXTCLOUD_URL}/remote.php/dav/files/${USER}/Checklist/${siteId}/${secao}/foto${i+1}.jpg`,{
                method:"PUT",
                headers:{
                    Authorization:`Basic ${auth}`,
                    "Content-Type":"image/jpeg"
                },
                body:buffer
            });
        }
    }

    res.json({ ok:true });
}
