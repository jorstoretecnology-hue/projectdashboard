import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

// 🔹 cargar agente migration
const system = fs.readFileSync(".agents/migration/system.md", "utf-8");
const schema = fs.readFileSync(".agents/migration/schema.json", "utf-8");

// 🔹 Función para limpiar JSON de bloques markdown
function cleanJSON(text) {
  return text.replace(/```json\n?|```/g, "").trim();
}

// 🔹 función Gemini con Fallback de Modelos
async function askGemini(prompt) {
  const models = ["gemini-2.0-flash", "gemini-flash-latest"];
  
  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      if (res.ok) {
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      }

      const errorData = await res.json().catch(() => ({}));
      if (res.status === 404) {
        console.warn(`⚠️ Modelo ${model} no encontrado, intentando el siguiente...`);
        continue;
      }
      
      console.error(`❌ API Error (${res.status}):`, errorData.error?.message || res.statusText);
      return null;
    } catch (err) {
      console.error(`❌ Error con modelo ${model}:`, err.message);
      continue;
    }
  }
  
  console.error("❌ Ninguno de los modelos disponibles funcionó.");
  return null;
}

// 🔍 buscar archivos SOLO en scripts (seguro)
function getFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).flatMap(file => {
    const full = path.join(dir, file);

    if (fs.statSync(full).isDirectory()) {
      return getFiles(full);
    }

    return full.endsWith(".js") ? [full] : [];
  });
}

const files = getFiles("./scripts");

// 🚀 ejecución
async function run() {
  if (!API_KEY) {
    console.error("❌ GEMINI_API_KEY no encontrada en .env");
    return;
  }

  console.log(`🚀 Iniciando migración de ${files.length} archivos...`);

  for (const file of files) {
    const code = fs.readFileSync(file, "utf-8");

    const prompt = `
${system}

SCHEMA:
${schema}

REGLAS:
- NO CAMBIAR LOGICA
- SOLO require → import
- SOLO module.exports → export
- SI NO ESTAS SEGURO, NO CAMBIES

RESPONDE SOLO EL JSON SEGUN EL SCHEMA, SIN TEXTO ADICIONAL.

CODIGO:
${code}
`;

    const rawRes = await askGemini(prompt);
    if (!rawRes) {
      console.log(`⏭️ Saltando ${file} por error en API`);
      continue;
    }

    const res = cleanJSON(rawRes);

    try {
      const parsed = JSON.parse(res);
      // Validar que sea un array y tenga el formato esperado
      const newCode = Array.isArray(parsed) ? parsed[0]?.after : parsed.after;

      if (!newCode) {
        throw new Error("El JSON no contiene el campo 'after'");
      }

      // 🛑 backup
      fs.writeFileSync(file + ".bak", code);

      // ✍️ escribir nuevo
      fs.writeFileSync(file, newCode);

      console.log(`✅ Migrado: ${file}`);

    } catch (err) {
      console.log(`❌ Error al parsear JSON en ${file}: ${err.message}`);
      console.log(`📄 Respuesta recibida (primeros 100 chars): ${res.substring(0, 100)}...`);
    }
  }
}

run();