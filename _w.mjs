import { chromium } from "@playwright/test";
const S = process.env.S;
try {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:900,height:700}, deviceScaleFactor:2 });
  await p.goto("http://localhost:3001/", { waitUntil:"domcontentloaded", timeout:60000 });
  await p.waitForTimeout(1800);
  const pill = p.locator(".resume-pill");
  const box = await pill.boundingBox();
  await pill.hover();
  await p.waitForTimeout(280);
  await p.screenshot({ path: S+"/wave-mid.png", clip:{x:box.x-6,y:box.y-6,width:box.width+12,height:box.height+12} });
  await p.waitForTimeout(500);
  await p.screenshot({ path: S+"/wave-full.png", clip:{x:box.x-6,y:box.y-6,width:box.width+12,height:box.height+12} });
  console.log("ok box", JSON.stringify(box));
  await b.close();
} catch (e) { console.log("ERR", e.message); }
