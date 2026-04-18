import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

// 🔹 cargar agente migration
const system = fs.readFileSync(".agents/migration/system.md", "utf-8");
const schema = fs.readFileSync(".agents/migration/schema.json", "utf-8");

// 🔹 función Gemini
async function askGemini(prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
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

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// 🔍 buscar archivos SOLO en scripts (seguro)
function getFiles(dir) {
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

RESPONDE SOLO JSON VALIDO

CODIGO:
${code}
`;

    const res = await askGemini(prompt);

    try {
      const parsed = JSON.parse(res);
      const newCode = parsed[0].after;

      // 🛑 backup
      fs.writeFileSync(file + ".bak", code);

      // ✍️ escribir nuevo
      fs.writeFileSync(file, newCode);

      console.log(`✅ Migrado: ${file}`);

    } catch (err) {
      console.log(`❌ Error en ${file}`);
    }
  }
}

run();