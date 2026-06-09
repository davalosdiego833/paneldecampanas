const fs = require('fs');

async function test() {
  try {
    console.log("Fetching from https://panel.ambrizydavalos.com/api/daniela/datos...");
    const res = await fetch('https://panel.ambrizydavalos.com/api/daniela/datos');
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Has data:", !!data.data);
    if (data.data) {
      console.log("Has resumen_general:", !!data.data.resumen_general);
      if (data.data.resumen_general) {
        console.log("Has proactivos:", Array.isArray(data.data.resumen_general.proactivos));
        console.log("Proactivos length:", data.data.resumen_general.proactivos?.length);
        
        const proactivosS = data.data.resumen_general.proactivos?.filter(p => p.Proactivo_al_mes === 'SÍ');
        console.log("Proactivos con 'SÍ':", proactivosS?.map(p => p.ASESOR));
      }
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
