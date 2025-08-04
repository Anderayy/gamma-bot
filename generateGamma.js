const puppeteer = require("puppeteer");
const express = require("express");

const app = express();
app.use(express.json());

app.post("/generate", async (req, res) => {
  const { judul, slides } = req.body;
  const prompt = `Buatkan presentasi berjudul "${judul}" dengan poin-poin:\n- ${slides.join("\n- ")}`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"]
  });

  const page = await browser.newPage();
  await page.goto("https://gamma.app", { waitUntil: "networkidle2" });

  // Kalau belum login: stop di sini, login manual dulu, simpan session kalau perlu
  await page.waitForSelector('button:has-text("Create a deck")');
  await page.click('button:has-text("Create a deck")');

  await page.waitForSelector("textarea");
  await page.type("textarea", prompt);
  await page.keyboard.press("Enter");

  await page.waitForNavigation({ waitUntil: "networkidle2" });
  const currentUrl = page.url();

  await browser.close();
  res.json({ url: currentUrl });
});

app.listen(3000, () => console.log("Gamma bot ready on port 3000"));
