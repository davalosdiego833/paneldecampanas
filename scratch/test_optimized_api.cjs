async function test() {
  try {
    console.log("Fetching optimized API from https://panel.ambrizydavalos.com/api/daniela/datos...");
    const res = await fetch('https://panel.ambrizydavalos.com/api/daniela/datos');
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Root Keys:", Object.keys(data));
    if (data.resumen_general) {
        console.log("resumen_general Keys:", Object.keys(data.resumen_general));
        const activos = data.resumen_general.proactivos_activos || [];
        const inactivos = data.resumen_general.proactivos_inactivos || [];
        console.log("proactivos_activos Count:", activos.length);
        console.log("proactivos_activos Names:", activos.map(p => p.asesor));
        console.log("proactivos_inactivos Count:", inactivos.length);
    }
    if (data.campaigns) {
        console.log("campaigns Keys:", Object.keys(data.campaigns));
        console.log("fanfest winners count:", data.campaigns.fanfest?.filter(c => c.premio === 'GANADO').length);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
