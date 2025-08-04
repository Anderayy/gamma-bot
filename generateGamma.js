const puppeteer = require("puppeteer");
const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

app.post("/generate", async (req, res) => {
  const { judul, slides } = req.body;
  const prompt = `Buatkan presentasi berjudul "${judul}" dengan poin-poin:\n- ${slides.join("\n- ")}`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // 🔐 Load session (jika ada)
  const cookiesPath = "./gamma-session.json";
  if (fs.existsSync(cookiesPath)) {
    const cookies = JSON.parse(fs.readFileSync(cookiesPath, "utf-8"));
    await page.setCookie(...cookies);
  }

  await page.goto("https://gamma.app", { waitUntil: "networkidle2" });

  // 🔐 Simpan session baru kalau belum ada
  if (!fs.existsSync(cookiesPath)) {
    const cookies = await page.cookies();
    fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
    return res.status(200).json({ message: "Login dulu di Railway browser, session disimpan" });
  }

  // 🚀 Lanjutkan ke proses pembuatan presentasi
  await page.waitForSelector('button:has-text("Create a deck")', { timeout: 10000 }).catch(() => {
    return res.status(400).json({ error: "Tombol 'Create a deck' tidak ditemukan. Mungkin perlu login manual dulu." });
  });

  await page.click('button:has-text("Create a deck")');
  await page.waitForSelector("textarea");
  await page.type("textarea", prompt);
  await page.keyboard.press("Enter");

  await page.waitForNavigation({ waitUntil: "networkidle2" });
  const currentUrl = page.url();

  await browser.close();
  res.json({ url: currentUrl });
});

// ✅ PORT untuk Railway
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Gamma bot ready on port ${port}`));
