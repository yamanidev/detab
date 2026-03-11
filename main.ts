interface Platform {
  name: string;
  test: (url: URL) => boolean;
}

type Groups = Record<string, chrome.tabs.Tab[]>;

const ARTICLE_PATH_RE = /\/(blogs?|articles?|posts?|news|stories?)(\/|$)/i;

function matchesDomain(hostname: string, domain: string): boolean {
  const domainParts = domain.split(".");

  return hostname.split(".").slice(-domainParts.length).join(".") === domain;
}

const PLATFORMS: Platform[] = [
  { name: "YouTube", test: (url) => matchesDomain(url.hostname, "youtube.com") },
  {
    name: "Twitter",
    test: (url) =>
      matchesDomain(url.hostname, "twitter.com") || matchesDomain(url.hostname, "x.com"),
  },
  { name: "Facebook", test: (url) => matchesDomain(url.hostname, "facebook.com") },
  { name: "LinkedIn", test: (url) => matchesDomain(url.hostname, "linkedin.com") },
  { name: "Reddit", test: (url) => matchesDomain(url.hostname, "reddit.com") },
  { name: "Instagram", test: (url) => matchesDomain(url.hostname, "instagram.com") },
  { name: "Hacker News", test: (url) => url.hostname === "news.ycombinator.com" },
  {
    name: "Email",
    test: (url) =>
      url.hostname === "mail.google.com" ||
      matchesDomain(url.hostname, "hotmail.com") ||
      url.hostname.startsWith("outlook.") ||
      url.hostname === "mail.zoho.com" ||
      url.hostname === "mail.yahoo.com" ||
      url.hostname === "mail.aol.com" ||
      matchesDomain(url.hostname, "protonmail.com") ||
      url.hostname === "mail.proton.me" ||
      url.hostname === "app.fastmail.com" ||
      url.hostname === "app.hey.com" ||
      url.hostname === "app.tuta.com" ||
      (matchesDomain(url.hostname, "icloud.com") && url.pathname.startsWith("/mail")),
  },
  {
    name: "Search",
    test: (url) =>
      (url.hostname.includes("google.") && url.pathname === "/search") ||
      (matchesDomain(url.hostname, "bing.com") && url.pathname.startsWith("/search")) ||
      (matchesDomain(url.hostname, "duckduckgo.com") && url.searchParams.has("q")) ||
      url.hostname === "search.yahoo.com" ||
      (matchesDomain(url.hostname, "ecosia.org") && url.searchParams.has("q")) ||
      url.hostname === "search.brave.com" ||
      (matchesDomain(url.hostname, "startpage.com") && url.pathname.includes("/search")) ||
      (matchesDomain(url.hostname, "yandex.com") && url.pathname.startsWith("/search")),
  },
  { name: "Articles", test: (url) => ARTICLE_PATH_RE.test(url.pathname) },
];

const CATEGORY_ORDER = [
  "YouTube",
  "Twitter",
  "Facebook",
  "LinkedIn",
  "Reddit",
  "Instagram",
  "Hacker News",
  "Email",
  "Search",
  "Articles",
  "Other",
];

function classify(tab: chrome.tabs.Tab): string | null {
  let url: URL;
  try {
    url = new URL(tab.url ?? "");
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  for (const platform of PLATFORMS) {
    if (platform.test(url)) return platform.name;
  }

  return "Other";
}

function groupTabs(tabs: chrome.tabs.Tab[]): Groups {
  const groups: Groups = {};

  for (const tab of tabs) {
    const category = classify(tab);
    if (category === null) continue;

    if (!groups[category]) groups[category] = [];
    groups[category].push(tab);
  }

  return groups;
}

function toMarkdown(groups: Groups): string {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const lines: string[] = [`# Tabs — ${date}`, ""];

  for (const category of CATEGORY_ORDER) {
    if (!groups[category]?.length) continue;

    lines.push(`## ${category}`);

    for (const tab of groups[category]) {
      let title: string;
      let suffix = "";

      if (tab.discarded) {
        try {
          const parsed = new URL(tab.url ?? "");
          const path = parsed.pathname === "/" ? "" : parsed.pathname;
          title = parsed.hostname + path;
        } catch {
          title = tab.url ?? "Untitled";
        }
        suffix = " *(title unavailable — the browser discarded it from memory)*";
      } else {
        title = tab.title ?? tab.url ?? "Untitled";
      }

      lines.push(`- [${title.replace(/[[\]]/g, "\\$&")}](${tab.url})${suffix}`);
    }

    lines.push("");
  }

  return lines.join("\n");
}

function download(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function renderGroups(groups: Groups): void {
  const list = document.getElementById("group-list")!;

  for (const category of CATEGORY_ORDER) {
    const tabs = groups[category];
    if (!tabs?.length) continue;

    const li = document.createElement("li");
    li.innerHTML = `
      <span class="category-name">${category}</span>
      <span class="category-count">${tabs.length}</span>
    `;
    list.appendChild(li);
  }
}

const BROWSERS: { name: string; test: (ua: string) => boolean }[] = [
  { name: "brave", test: () => "brave" in navigator },
  { name: "arc", test: (ua) => ua.includes("Arc/") },
  { name: "vivaldi", test: (ua) => ua.includes("Vivaldi/") },
  { name: "edge", test: (ua) => ua.includes("Edg/") },
  { name: "opera", test: (ua) => ua.includes("OPR/") || ua.includes("Opera/") },
  { name: "firefox", test: (ua) => ua.includes("Firefox/") },
  { name: "safari", test: (ua) => ua.includes("Safari/") && !ua.includes("Chrome/") },
  { name: "chrome", test: (ua) => ua.includes("Chrome/") },
];

function getBrowserName(): string {
  const ua = navigator.userAgent;

  return BROWSERS.find(({ test }) => test(ua))?.name ?? "browser";
}

async function init(): Promise<void> {
  const tabs = await chrome.tabs.query({});
  const groups = groupTabs(tabs);
  const total = Object.values(groups).reduce((sum, t) => sum + t.length, 0);

  document.getElementById("total-count")!.textContent = `${total} tab${total !== 1 ? "s" : ""}`;
  renderGroups(groups);

  document.getElementById("export-button")!.addEventListener("click", () => {
    const md = toMarkdown(groups);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const time = `${pad(now.getHours())}-${pad(now.getMinutes())}`;
    const browser = getBrowserName();
    download(md, `tabs-${browser}-${date}-${time}.md`);

    const closeTabs = (document.getElementById("close-tabs") as HTMLInputElement).checked;
    if (closeTabs) {
      const ids = Object.values(groups)
        .flat()
        .map((tab) => tab.id)
        .filter((id): id is number => id !== undefined);

      chrome.tabs.remove(ids);
    }
  });
}

init();
