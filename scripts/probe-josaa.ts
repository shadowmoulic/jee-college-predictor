import { chromium, Page } from "playwright";

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

async function chosenSet(page: Page, name: string, val: string) {
  try {
    await page.evaluate(({ n, v }) => {
      const el = document.querySelector<HTMLSelectElement>(`select[name="${n}"]`);
      if (!el) throw new Error(`Select not found: ${n}`);
      el.value = v;
      const dpb = (window as any).__doPostBack as ((t: string, a: string) => void) | undefined;
      if (dpb) dpb(n, ""); else el.dispatchEvent(new Event("change", { bubbles: true }));
    }, { n: name, v: val });
  } catch (e: any) {
    if (!e.message?.includes("context")) throw e;
  }
  await page.waitForLoadState("load", { timeout: 90000 }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 90000 }).catch(() => {});
  await sleep(800);
}

async function getOpts(page: Page, name: string) {
  return page.evaluate(n => {
    const el = document.querySelector<HTMLSelectElement>(`select[name="${n}"]`);
    return Array.from(el?.options ?? []).map(o => ({ v: (o as HTMLOptionElement).value, t: o.text.trim() }));
  }, name).catch(() => [] as {v:string,t:string}[]);
}

async function waitPop(page: Page, name: string) {
  await page.waitForFunction(n => {
    const el = document.querySelector(`select[name="${n}"]`) as HTMLSelectElement;
    return el && el.options.length > 1;
  }, name, { timeout: 15000 }).catch(() => {});
}

async function main() {
  const browser = await chromium.launch({ headless: false }); // visible so we can see what happens
  const page = await browser.newPage({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
  });

  const URL = "https://josaa.admissions.nic.in/applicant/SeatAllotmentResult/CurrentORCR.aspx";
  console.log("Loading", URL);
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  await sleep(2000);

  // Step 1: Round
  const rounds = await getOpts(page, "ctl00$ContentPlaceHolder1$ddlroundno");
  console.log("Rounds:", rounds.map(o => o.t).join(", "));

  console.log("\nSelecting Round 6...");
  await chosenSet(page, "ctl00$ContentPlaceHolder1$ddlroundno", "6");
  await waitPop(page, "ctl00$ContentPlaceHolder1$ddlInstype");

  // Step 2: InstType
  const instTypes = await getOpts(page, "ctl00$ContentPlaceHolder1$ddlInstype");
  console.log("InstTypes after round select:", instTypes.map(o => `${o.v}=${o.t}`).join(", "));

  const allInst = instTypes.find(o => o.t === "ALL" || o.v === "ALL") ?? instTypes[1];
  if (!allInst) { console.log("No inst type!"); await browser.close(); return; }

  console.log(`\nSelecting InstType: ${allInst.t} (${allInst.v})...`);
  await chosenSet(page, "ctl00$ContentPlaceHolder1$ddlInstype", allInst.v);
  await waitPop(page, "ctl00$ContentPlaceHolder1$ddlInstitute");

  // Step 3: Institute → ALL
  const insts = await getOpts(page, "ctl00$ContentPlaceHolder1$ddlInstitute");
  const allInstName = insts.find(o => o.t === "ALL" || o.v === "ALL") ?? insts[1];
  console.log(`\nInstitutes available: ${insts.length}. Picking: ${allInstName?.t}`);
  if (!allInstName) { console.log("No institute!"); await browser.close(); return; }

  await chosenSet(page, "ctl00$ContentPlaceHolder1$ddlInstitute", allInstName.v);
  await waitPop(page, "ctl00$ContentPlaceHolder1$ddlBranch");

  // Step 4: Branch → ALL
  const branches = await getOpts(page, "ctl00$ContentPlaceHolder1$ddlBranch");
  const allBranch = branches.find(o => o.t === "ALL" || o.v === "ALL") ?? branches[1];
  console.log(`Branches available: ${branches.length}. Picking: ${allBranch?.t}`);
  if (!allBranch) { console.log("No branch!"); await browser.close(); return; }

  await chosenSet(page, "ctl00$ContentPlaceHolder1$ddlBranch", allBranch.v);
  await waitPop(page, "ctl00$ContentPlaceHolder1$ddlSeatType");

  // Step 5: SeatType → ALL
  const seats = await getOpts(page, "ctl00$ContentPlaceHolder1$ddlSeatType");
  const allSeat = seats.find(o => o.t === "ALL" || o.v === "ALL") ?? seats[1];
  console.log(`SeatTypes: ${seats.map(o=>o.t).join(", ")}. Picking: ${allSeat?.t}`);
  if (allSeat) {
    await page.evaluate(v => {
      const el = document.querySelector<HTMLSelectElement>('select[name="ctl00$ContentPlaceHolder1$ddlSeatType"]');
      if (el) el.value = v;
    }, allSeat.v).catch(() => {});
    await sleep(300);
  }

  // Step 6: Submit
  console.log("\nSubmitting form...");
  await Promise.all([
    page.waitForLoadState("load", { timeout: 90000 }).catch(() => {}),
    page.click('input[name="ctl00$ContentPlaceHolder1$btnSubmit"]').catch(() =>
      page.click("#ctl00_ContentPlaceHolder1_btnSubmit")
    ),
  ]);
  await page.waitForLoadState("networkidle", { timeout: 90000 }).catch(() => {});
  await sleep(2000);

  // Check result
  const pnlText = await page.evaluate(() => {
    const pnl = document.querySelector("#ctl00_ContentPlaceHolder1_pnlDisplayDetails") ?? document;
    return (pnl as HTMLElement).innerText?.substring(0, 500);
  });
  console.log("\nResult panel text:\n", pnlText);

  const rowCount = await page.evaluate(() => {
    const pnl = document.querySelector("#ctl00_ContentPlaceHolder1_pnlDisplayDetails") ?? document;
    return pnl.querySelectorAll("table tr").length;
  });
  console.log(`\nTable rows found: ${rowCount}`);

  // Get all select names on page (to find if there are renamed fields)
  const selectNames = await page.evaluate(() =>
    Array.from(document.querySelectorAll("select")).map(s => s.getAttribute("name"))
  );
  console.log("\nAll select names on page:", selectNames);

  console.log("\nKeeping browser open for 30s for manual inspection...");
  await sleep(30000);
  await browser.close();
}

main().catch(console.error);
