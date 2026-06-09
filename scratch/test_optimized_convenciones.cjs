async function test() {
  try {
    console.log("Fetching optimized API from https://panel.ambrizydavalos.com/api/daniela/datos...");
    const res = await fetch('https://panel.ambrizydavalos.com/api/daniela/datos');
    const data = await res.json();
    console.log("Status:", res.status);
    if (data.campaigns && data.campaigns.convenciones) {
        console.log("Convenciones count:", data.campaigns.convenciones.length);
        const monica = data.campaigns.convenciones.find(c => c.asesor.includes("MONICA"));
        console.log("Monica convenciones entry:", monica);
    } else {
        console.log("No convenciones data found in campaigns!");
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
