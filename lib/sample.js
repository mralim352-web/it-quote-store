// DEMO DATA - only used when SUPABASE_SERVICE_ROLE_KEY is not set (so the design can be previewed offline).
const img = [
  "https://cdn.microless.com/products/d79f3aacd5b6b6548436510b91788360-hi.jpg",
  "https://cdn.microless.com/products/b5b2caeb989e1f8d7fd401cc29f082a9-hi.jpg",
  "https://cdn.microless.com/products/bba8e9758d5f95c5db7ff5f92346e4fb-hi.jpg",
  "https://cdn.microless.com/products/0cb5791cc6cc179f81799176be82a8b3-hi.jpg",
];
const rows = [
  ["ASUS Dual GeForce RTX 5070 12GB OC Graphics Card, GDDR7 192-Bit", "ASUS", "Video - Graphic Cards", 3990, true],
  ["ASUS Dual GeForce RTX 5060 OC Edition Graphics Card, 8GB GDDR7", "ASUS", "Video - Graphic Cards", 1942.5, true],
  ["ZOTAC GAMING GeForce RTX 5080 AMP Extreme INFINITY, 16GB GDDR7", "ZOTAC", "Video - Graphic Cards", 6699, true],
  ["MSI GeForce RTX 5070 VANGUARD SOC Graphics Card, 12GB GDDR7", "MSI", "Video - Graphic Cards", 3800, true],
  ["Sapphire PULSE AMD Radeon RX 9070 XT Graphics Card, 16GB GDDR6", "Sapphire", "Video - Graphic Cards", 3596.25, false],
  ["AMD Ryzen 7 9800X3D AM5 Desktop Processor, 8 Cores 16 Threads", "AMD", "Processors", 1890, true],
  ["Dell PowerEdge R760 Rack Server, Xeon Silver 4410Y, 32GB, 2x 960GB SSD", "Dell", "Servers", 21500, true],
  ["Cisco Catalyst C1300-24T-4G 24-Port Gigabit Managed Switch", "Cisco", "Network Switches", 2140, true],
  ["Samsung 990 PRO 2TB NVMe M.2 PCIe 4.0 Internal SSD", "Samsung", "Internal SSD", 780, true],
  ["Lenovo ThinkPad E14 Gen 6, Core Ultra 5, 16GB RAM, 512GB SSD, 14\"", "Lenovo", "Laptops", 3150, true],
  ["Dell UltraSharp U2725QE 27\" 4K USB-C Hub Monitor", "Dell", "Monitors", 2290, false],
  ["TP-Link Omada EAP670 AX5400 Ceiling Mount WiFi 6 Access Point", "TP-Link", "Access Points", 640, true],
  ["APC Smart-UPS 1500VA LCD 230V Tower UPS", "APC", "UPS", 2480, true],
  ["HP LaserJet Pro M404dn Monochrome Laser Printer", "HP", "Laser Printers", 1120, true],
];
export const SAMPLE = rows.map(([name, brand, category, price, stock], i) => ({
  id: i + 1, slug: `demo-${i + 1}`, name, brand, mpn: `DEMO-${1000 + i}`, category, image: img[i % img.length],
  in_stock: stock, supplier_price: price, price_override: null,
}));
