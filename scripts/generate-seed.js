const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('data/synthetic_coffee_health_10000.csv');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let isFirst = true;
  // Start the INSERT statement
  let sql = '\n\n-- Carga de datos de coffee_health\nINSERT INTO public.coffee_health (id, age, gender, country, coffee_intake, caffeine_mg, sleep_hours, sleep_quality, bmi, heart_rate, stress_level, physical_activity_hours, health_issues, occupation, smoking, alcohol_consumption) VALUES\n';

  let firstValue = true;
  for await (const line of rl) {
    if (isFirst) {
      isFirst = false;
      continue;
    }
    const cols = line.split(',');
    if (cols.length < 16) continue;
    
    // Mapeo de valores
    const id = cols[0];
    const age = cols[1];
    const gender = cols[2];
    const country = cols[3].replace(/'/g, "''"); // Escapar comillas simples si las hay
    const coffee_intake = cols[4];
    const caffeine_mg = cols[5];
    const sleep_hours = cols[6];
    const sleep_quality = cols[7];
    const bmi = cols[8];
    const heart_rate = cols[9];
    const stress_level = cols[10];
    const physical_activity_hours = cols[11];
    const health_issues = cols[12];
    const occupation = cols[13];
    // Mapeo de 0/1 a booleanos
    const smoking = cols[14] === '1' ? 'true' : 'false';
    const alcohol = cols[15] === '1' ? 'true' : 'false';
    
    const valueStr = `(${id}, ${age}, '${gender}', '${country}', ${coffee_intake}, ${caffeine_mg}, ${sleep_hours}, '${sleep_quality}', ${bmi}, ${heart_rate}, '${stress_level}', ${physical_activity_hours}, '${health_issues}', '${occupation}', ${smoking}, ${alcohol})`;
    
    if (!firstValue) {
      sql += ',\n';
    }
    sql += valueStr;
    firstValue = false;
  }
  sql += ';\n';
  
  fs.appendFileSync('supabase/seed.sql', sql);
  console.log('Datos agregados exitosamente a supabase/seed.sql');
}

processLineByLine();
