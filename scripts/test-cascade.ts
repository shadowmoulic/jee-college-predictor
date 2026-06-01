import { chromium } from "playwright";
const URL = "https://josaa.admissions.nic.in/applicant/seatmatrix/openingclosingrankarchieve.aspx";
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function chosenSet(page: any, name: string, val: string) {
  try {
    await page.evaluate(({ n, v }: any) => {
      const el = document.querySelector<HTMLSelectElement>(`select[name="${n}"]`)!;
      el.value = v;
      const dpb = (window as any).__doPostBack;
      if (dpb) dpb(n, ""); else el.dispatchEvent(new Event("change", { bubbles: true }));
    }, { n: name, v: val });
  } catch (e: any) {
    if (!e.message?.includes("context was destroyed") && !e.message?.includes("Execution context")) throw e;
  }
  await page.waitForLoadState("load", { timeout: 60000 }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {});
  await sleep(1000);
}

async function getOpts(page: any, name: string) {
  return page.evaluate((n: string) => {
    const el = document.querySelector<HTMLSelectElement>(`select[name="${n}"]`);
    return Array.from(el?.options ?? []).map((o: any) => ({ v: o.value, t: o.text.trim() }));
  }, name).catch(() => [] as {v:string,t:string}[]);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 Chrome/124.0.0.0" });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await sleep(2000);

  await chosenSet(page, "ctl00$ContentPlaceHolder1$ddlYear", "2024");
  console.log("✓ Year=2024, round opts:", (await getOpts(page, "ctl00$ContentPlaceHolder1$ddlroundno")).map(o => o.t));

  await chosenSet(page, "ctl00$ContentPlaceHolder1$ddlroundno", "5");
  const instTypes = await getOpts(page, "ctl00$ContentPlaceHolder1$ddlInstype");
  console.log("✓ Round=5, insttype opts:", instTypes.map(o => `${o.v}=${o.t}`));

  await chosenSet(page, "ctl00$ContentPlaceHolder1$ddlInstype", "IIT");
  const instNames = await getOpts(page, "ctl00$ContentPlaceHolder1$ddlInstitute");
  console.log("✓ InstType=IIT, institute opts (first 3):", instNames.slice(0,3).map(o => `${o.v}=${o.t}`));

  // Select ALL institute
  const allInst = instNames.find(o => o.t === "ALL") ?? instNames[1];
  await chosenSet(page, "ctl00$ContentPlaceHolder1$ddlInstitute", allInst.v);
  const progs = await getOpts(page, "ctl00$ContentPlaceHolder1$ddlBranch");
  console.log("✓ Institute=ALL, program opts (first 3):", progs.slice(0,3).map(o => `${o.v}=${o.t}`));

  // Select ALL program
  const allProg = progs.find(o => o.t === "ALL") ?? progs[1];
  await chosenSet(page, "ctl00$ContentPlaceHolder1$ddlBranch", allProg.v);
  const seats = await getOpts(page, "ctl00$ContentPlaceHolder1$ddlSeatType");
  console.log("✓ Program=ALL, seat opts:", seats.map(o => `${o.v}=${o.t}`));

  // Set ALL seat type (no postback needed — last field)
  const allSeat = seats.find(o => o.t === "ALL") ?? seats[1];
  await page.evaluate((v: string) => {
    const el = document.querySelector<HTMLSelectElement>('select[name="ctl00$ContentPlaceHolder1$ddlSeatType"]')!;
    if (el) el.value = v;
  }, allSeat.v).catch(() => {});
  await sleep(500);

  await page.screenshot({ path: "/tmp/pre-submit.png" });
  console.log("Clicking Submit...");
  await Promise.all([
    page.waitForLoadState("load", { timeout: 60000 }).catch(() => {}),
    page.click('input[name="ctl00$ContentPlaceHolder1$btnSubmit"]'),
  ]);
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await sleep(3000);
  await page.screenshot({ path: "/tmp/post-submit.png" });

  const tds = await page.evaluate(() =>
    document.querySelector("#ctl00_ContentPlaceHolder1_pnlDisplayDetails")?.querySelectorAll("tr td").length ?? 0
  ).catch(() => 0);
  console.log(`✓ Result tds: ${tds}`);
  if (tds > 0) {
    const rows = await page.evaluate(() =>
      Array.from(document.querySelectorAll("#ctl00_ContentPlaceHolder1_pnlDisplayDetails tr")).slice(0,3)
        .map((tr: any) => Array.from(tr.querySelectorAll("td")).map((td: any) => td.innerText.trim()))
    );
    console.log("Sample rows:", rows);
  }
  await browser.close();
}
main().catch(e => { console.error("FATAL:", e.message); process.exit(1); });
