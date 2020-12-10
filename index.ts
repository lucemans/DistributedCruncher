import { sha1 } from "https://denopkg.com/chiefbiiko/sha1/mod.ts";
import { MongoClient } from "https://deno.land/x/mongo@v0.7.0/mod.ts";
import { config } from "https://deno.land/x/dotenv/mod.ts";
import { signal } from "https://deno.land/std/signal/mod.ts";
import { Client } from 'https://deno.land/x/mqtt/deno/mod.ts';
console.log(config());
const conf = config();
Object.keys(conf).forEach((k) => {
    Deno.env.set(k, conf[k]);
});

let i = +(Deno.env.get('FROM') || '') || 0;
if (isNaN(i)) {
    console.log('From value was not a number');
    Deno.exit(0);
}
let starting = i;
let b = +(Deno.env.get('TO') || '');
if (isNaN(b)) {
    console.log('To value was not a number');
    Deno.exit(0);
}

if (b < i) {
    console.log('Numbers in wrong order');
    Deno.exit(0);
}

console.log('Connecting... ' + Deno.env.get('MONGO_URL') || '');
const client = new MongoClient();
client.connectWithUri(Deno.env.get('MONGO_URL') || '');
console.log('f');
const db = client.database("crypto");
const hashes = db.collection("sha1");

console.log('Connected to MongoDB');

console.log('Connecting to MQTT ' + Deno.env.get('MQTT_URL'))
const mqttclient = new Client({url: Deno.env.get('MQTT_URL') || '', username: Deno.env.get('MQTT_USERNAME'), password: Deno.env.get("MQTT_PASSWORD")});
await mqttclient.connect();

console.log('Connected to MQTT');

console.log("From: " + i);
console.log("To: " + b);

function numToLet(num: number) {
    return num.toString(36);
}

async function onSignal(sign: any, callback: () => void) {
    for await (const _ of sign) {
        callback();
    }
}
let canRun = true;

onSignal(Deno.signals.terminate(), () => {
    canRun = false;
    console.log('TERMINATED');
    mqttclient.publish((Deno.env.get('TOPIC') || '').toString().replace('$', Deno.env.get('RUN_ID') || ''), 'TERMINATED');
});


while (i <= b && canRun) {
    const v = numToLet(i);
    mqttclient.publish((Deno.env.get('TOPIC') || '').toString().replace('$', Deno.env.get('RUN_ID') || ''), ((i - starting)/(b - starting) * 100) + "");
    if (await hashes.count({b: v}) > 0) {
        console.log('Exists ' + i + " " + v + " " + ((i - starting)/(b - starting) * 100) + "%");
        i++;
        continue;
    }
    const s = sha1(v, "utf8", "hex");
    console.log('Round: ' + i + ": " + v + " " + s);
    await hashes.insertOne({
        b: v,
        h: s
    });
    i++;
}


await mqttclient.disconnect();