import { ensureDir, ensureDirSync } from "https://deno.land/std/fs/mod.ts";




let numTODO = 10000;
const subDivide = 1000;
let i = 1;
let start = 0;
let base = start;

ensureDirSync("./jobs");
const encoder = new TextEncoder();
const decoder = new TextDecoder();

let entry = decoder.decode(await Deno.readFile("./job.yaml") || '');

while (numTODO > 0) {

  await Deno.writeFile("./jobs/job-" + i + ".yaml", encoder.encode(entry.replace("$FROM", "" + (base)).replace("$TO", "" + (base + subDivide)).replace("$RUN_ID", i + "")));  

  base += subDivide;
  numTODO -= subDivide;
  i++;
}