const P = {
  bolt: "M13 2 4 14h7l-1 8 9-12h-7l1-8Z",
  search: "m21 21-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  truck: "M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  shield: "M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6l-8-3Zm-3 9 2 2 4-4",
  chat: "M4 5h16v11H9l-5 4V5Z",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 4h6",
  check: "m5 12 5 5 9-10",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z",
  mail: "M3 6h18v12H3V6Zm0 0 9 7 9-7",
  cpu: "M7 7h10v10H7zM9 3v4m6-4v4M9 17v4m6-4v4M3 9h4m10 0h4M3 15h4m10 0h4M10 10h4v4h-4z",
  gpu: "M3 8h18v8H3zM7 16v3m10-3v3M8 12a1.8 1.8 0 1 0 0 .01M15 12a1.8 1.8 0 1 0 0 .01",
  laptop: "M5 6h14v9H5V6Zm-2 11h18l-1.5 2h-15L3 17Z",
  monitor: "M3 5h18v11H3V5Zm6 14h6m-3-3v3",
  network: "M12 4v4m0 0a3 3 0 1 0 0 .01M6 20v-3a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3M12 11v4M4 20h4m8 0h4",
  server: "M4 4h16v6H4V4Zm0 10h16v6H4v-6Zm3-7h.01M7 17h.01M11 7h6M11 17h6",
  storage: "M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Zm0 0v10c0 1.7 3.6 3 8 3s8-1.3 8-3V7M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
  printer: "M7 8V3h10v5M7 17H4v-7h16v7h-3M7 14h10v7H7v-7Z",
  power: "M12 3v8m5.7-5.2a8 8 0 1 1-11.4 0",
  camera: "M4 8h3l2-3h6l2 3h3v11H4V8Zm8 8.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
  box: "M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Zm0 0 9 4.5 9-4.5M12 12v9",
};

export default function Icon({ name = "box", size }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name] || P.box} />
    </svg>
  );
}

// Pick an icon from a category name.
export function catIcon(name = "") {
  const n = name.toLowerCase();
  const map = [
    [/graphic|video card|gpu/, "gpu"], [/cpu|processor|motherboard/, "cpu"], [/laptop|notebook|tablet|all-in-one/, "laptop"],
    [/monitor|display|projector/, "monitor"], [/rout|switch|access|network|wireless|kvm/, "network"], [/server|rack|cabinet/, "server"],
    [/ssd|drive|storage|memory|ram|nas|flash/, "storage"], [/print|scan|toner|ink/, "printer"], [/power|ups|battery|case|cooling|fan/, "power"],
    [/camera|webcam|security|surveillance/, "camera"],
  ];
  for (const [re, ic] of map) if (re.test(n)) return ic;
  return "box";
}
