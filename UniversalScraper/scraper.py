"""
Ethi-Clo – Universal Clothing Ecological Impact Scraper
========================================================
Free strategies (in order of priority):

  1. Direct product JSON API   — Zara & H&M expose internal APIs their
                                  mobile apps use. No key, no browser.
  2. HTML scraping             — For simple sites (Celio) with no bot protection.
  3. Wayback Machine           — archive.org has cached snapshots of most
                                  product pages, bypassing Akamai entirely.
                                  Free, no key needed.
  4. Good On You brand score   — goodonyou.eco rates 5000+ brands on
                                  environment/labour/animals. Free to scrape.
                                  Used as fallback/enrichment for all brands.

Requirements:
    pip install requests beautifulsoup4
"""

import re
import json
import time
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from typing import Optional


# ─────────────────────────────────────────────────────────────
#  Shared HTTP session
# ─────────────────────────────────────────────────────────────

def _session(referer: str = "https://www.google.com/") -> requests.Session:
    s = requests.Session()
    s.headers.update({
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept":           "application/json, text/html, */*",
        "Accept-Language":  "fr-FR,fr;q=0.9,en;q=0.8",
        "Referer":          referer,
    })
    return s


def _detect_brand(url: str) -> str:
    host = urlparse(url).netloc.lower()
    host = re.sub(r"^(www[0-9]*|m)\.", "", host)
    return host.split(".")[0].capitalize()


SUSTAINABILITY_KEYWORDS = [
    "oeko-tex", "made in green", "gots", "fairtrade", "bci cotton", "better cotton",
    "organic", "recyclé", "recycled", "coton biologique", "organic cotton",
    "join life", "conscious", "fibres recyclées", "polyester recyclé",
    "recycled polyester", "agriculture organique", "certifié ocs", "certifié rcs",
    "bluesign",
]

def _labels(text: str) -> list[str]:
    found, lower = [], text.lower()
    for kw in SUSTAINABILITY_KEYWORDS:
        if kw in lower and kw not in found:
            found.append(kw)
    return found


# ─────────────────────────────────────────────────────────────
#  BRAND SUSTAINABILITY SCORE — Good On You
#  goodonyou.eco rates brands on environment, labour, animals
# ─────────────────────────────────────────────────────────────

GOOD_ON_YOU_SCORES = {
    # Scores: 1=We Avoid · 2=Not Good Enough · 3=It's a Start · 4=Good · 5=Great
    # Source: goodonyou.eco (cached 2024-2025)
    # Keys match the domain first label (e.g. 'zara' for zara.com)

    # ── Inditex group ───────────────────────────────────────────────────────
    "zara":          {"env": 2, "labour": 2, "animal": 2, "overall": "Not Good Enough"},
    "pullandbear":   {"env": 2, "labour": 2, "animal": 2, "overall": "Not Good Enough"},
    "bershka":       {"env": 2, "labour": 2, "animal": 2, "overall": "Not Good Enough"},
    "massimodutti":  {"env": 2, "labour": 2, "animal": 2, "overall": "Not Good Enough"},
    "stradivarius":  {"env": 2, "labour": 2, "animal": 2, "overall": "Not Good Enough"},
    "oysho":         {"env": 2, "labour": 2, "animal": 2, "overall": "Not Good Enough"},

    # ── H&M Group ───────────────────────────────────────────────────────────
    "hm":            {"env": 3, "labour": 2, "animal": 2, "overall": "It's a Start"},
    "arket":         {"env": 4, "labour": 3, "animal": 3, "overall": "Good"},
    "monki":         {"env": 3, "labour": 2, "animal": 2, "overall": "It's a Start"},
    "weekday":       {"env": 3, "labour": 2, "animal": 2, "overall": "It's a Start"},

    # ── Ultra fast fashion ──────────────────────────────────────────────────
    "shein":         {"env": 1, "labour": 1, "animal": 1, "overall": "We Avoid"},
    "boohoo":        {"env": 1, "labour": 1, "animal": 1, "overall": "We Avoid"},
    "fashionnova":   {"env": 1, "labour": 1, "animal": 1, "overall": "We Avoid"},
    "prettylittlething": {"env": 1, "labour": 1, "animal": 1, "overall": "We Avoid"},

    # ── Mid-market ──────────────────────────────────────────────────────────
    "primark":       {"env": 2, "labour": 2, "animal": 2, "overall": "Not Good Enough"},
    "mango":         {"env": 3, "labour": 2, "animal": 2, "overall": "It's a Start"},
    "uniqlo":        {"env": 2, "labour": 2, "animal": 2, "overall": "Not Good Enough"},
    "gap":           {"env": 3, "labour": 2, "animal": 2, "overall": "It's a Start"},
    "celio":         {"env": 2, "labour": 2, "animal": None, "overall": "Not Good Enough"},
    "kiabi":         {"env": 2, "labour": 2, "animal": 2, "overall": "Not Good Enough"},
    "jules":         {"env": 2, "labour": 2, "animal": None, "overall": "Not Good Enough"},
    "laredoute":     {"env": 2, "labour": 2, "animal": None, "overall": "Not Good Enough"},
    "asos":          {"env": 3, "labour": 2, "animal": 2, "overall": "It's a Start"},
    "zalando":       {"env": 3, "labour": 2, "animal": 2, "overall": "It's a Start"},
    "lacoste":       {"env": 2, "labour": 2, "animal": 2, "overall": "Not Good Enough"},
    "tommy":         {"env": 2, "labour": 2, "animal": 2, "overall": "Not Good Enough"},
    "calvinklein":   {"env": 2, "labour": 2, "animal": 2, "overall": "Not Good Enough"},
    "ralphlauren":   {"env": 2, "labour": 2, "animal": 2, "overall": "Not Good Enough"},

    # ── Sports & outdoor ────────────────────────────────────────────────────
    "nike":          {"env": 3, "labour": 2, "animal": 3, "overall": "It's a Start"},
    "adidas":        {"env": 3, "labour": 2, "animal": 3, "overall": "It's a Start"},
    "puma":          {"env": 3, "labour": 2, "animal": 2, "overall": "It's a Start"},
    "newbalance":    {"env": 2, "labour": 2, "animal": 2, "overall": "Not Good Enough"},
    "underarmour":   {"env": 2, "labour": 2, "animal": 2, "overall": "Not Good Enough"},
    "decathlon":     {"env": 2, "labour": 2, "animal": 2, "overall": "Not Good Enough"},
    "columbia":      {"env": 3, "labour": 2, "animal": 2, "overall": "It's a Start"},
    "thenorthface":  {"env": 3, "labour": 2, "animal": 2, "overall": "It's a Start"},

    # ── Sustainable / ethical ─────────────────────────────────────────────
    "sezane":        {"env": 3, "labour": 3, "animal": 3, "overall": "It's a Start"},
    "levis":         {"env": 3, "labour": 3, "animal": 3, "overall": "It's a Start"},
    "patagonia":     {"env": 5, "labour": 4, "animal": 5, "overall": "Great"},
    "veja":          {"env": 5, "labour": 5, "animal": 5, "overall": "Great"},
    "armedangels":   {"env": 5, "labour": 5, "animal": 5, "overall": "Great"},
    "nudie":         {"env": 4, "labour": 4, "animal": 4, "overall": "Good"},
    "eileen":        {"env": 4, "labour": 3, "animal": 4, "overall": "Good"},  # Eileen Fisher
    "tentree":       {"env": 4, "labour": 3, "animal": 4, "overall": "Good"},
}

def get_brand_sustainability(brand_key: str) -> Optional[dict]:
    """
    Returns a Good On You-style sustainability score for a brand.
    First tries live lookup on goodonyou.eco, falls back to cached data.
    """
    # ── Try live scrape of Good On You (simple site, no bot blocker) ──
    try:
        brand_slug = brand_key.lower().replace(" ", "-")
        url = f"https://goodonyou.eco/how-ethical-is-{brand_slug}/"
        r = requests.get(url, headers={
            "User-Agent": "Mozilla/5.0 (compatible; EthiClo/1.0)",
        }, timeout=10)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            text = soup.get_text(" ", strip=True)
            # Try to find score text like "It's a Start", "Good", "Great" etc.
            score_match = re.search(
                r"(We Avoid|Not Good Enough|It.s a Start|Good|Great)",
                text, re.IGNORECASE,
            )
            if score_match:
                return {
                    "source": "Good On You (live)",
                    "overall": score_match.group(1),
                    "url": url,
                }
    except Exception:
        pass

    # ── Fallback: cached scores ──
    cached = GOOD_ON_YOU_SCORES.get(brand_key.lower())
    if cached:
        return {"source": "Good On You (cached 2024)", **cached}
    return None


# ─────────────────────────────────────────────────────────────
#  ZARA — Internal product API
#  Product ID is embedded in the URL: p00526310 → 526310
#  API: zara.com/fr/fr/product?productId=...
# ─────────────────────────────────────────────────────────────

def scrape_zara(url: str) -> dict:
    # Extract product ID — keep leading zeros, the API needs the full ID
    m = re.search(r"-p(\d+)(?:\.html)?(?:\?|$)", url)
    if not m:
        return _err("Zara", f"Could not extract product ID from URL: {url}")

    product_id = m.group(1)   # e.g. "00526310" — keep as-is
    product_id_stripped = product_id.lstrip("0") or product_id  # "526310"
    print(f"[Zara] Product ID: {product_id}")

    s = _session("https://www.zara.com/")
    s.headers["Accept"] = "application/json"

    # Try several known Zara API endpoint formats
    api_candidates = [
        f"https://www.zara.com/fr/fr/product?productId={product_id_stripped}&sectionId=&screen=mobile",
        f"https://www.zara.com/fr/fr/product?productId={product_id}&sectionId=&screen=mobile",
        f"https://www.zara.com/api/user/v1/catalog/product?productId={product_id_stripped}&sectionId=&languageId=1",
    ]
    for api_url in api_candidates:
        try:
            r = s.get(api_url, timeout=15)
            print(f"[Zara] API {r.status_code} — {api_url[:80]}")
            if r.status_code == 200:
                try:
                    return _parse_zara_json(r.json())
                except Exception:
                    pass
        except Exception as e:
            print(f"[Zara] API error: {e}")

    # Free fallback: Wayback Machine cached snapshot
    wb = get_wayback_text(url)
    if wb:
        print(f"[Zara] Using Wayback Machine snapshot ({len(wb)} chars)")
        return _parse_html_generic("Zara", wb, get_brand_sustainability("zara"))

    # Last resort: brand sustainability score only
    score = get_brand_sustainability("zara")
    return {
        "brand": "Zara", "composition": "Introuvable",
        "eco": _format_score(score), "sustainability_labels": [],
        "brand_score": score, "error": None,
    }


def _parse_zara_json(data: dict) -> dict:
    """Parse Zara product JSON for composition and eco data."""
    flat = json.dumps(data, ensure_ascii=False)

    # Composition: look for percentage-based material description
    composition = None
    for field in ["description", "composition", "material", "detail"]:
        m = re.search(
            rf'"{field}"\s*:\s*"([^"]*?\d+\s*%[^"]*)"',
            flat, re.IGNORECASE,
        )
        if m:
            composition = m.group(1)
            break

    # Eco: look for JOIN LIFE, organic, recycled mentions
    eco = None
    eco_match = re.search(
        r'"([^"]*(?:join\s+life|recycl|organique|organic|certifi)[^"]*)"',
        flat, re.IGNORECASE,
    )
    if eco_match:
        eco = eco_match.group(1)

    score = get_brand_sustainability("zara")
    return {
        "brand":                 "Zara",
        "composition":           composition or "Introuvable",
        "eco":                   eco or _format_score(score) or "Introuvable",
        "sustainability_labels": _labels(flat),
        "brand_score":           score,
        "error":                 None,
    }


# ─────────────────────────────────────────────────────────────
#  H&M — Internal product API
#  Product ID is in the URL: productpage.0685816002.html → 0685816002
# ─────────────────────────────────────────────────────────────

def scrape_hm(url: str) -> dict:
    # Extract product ID
    m = re.search(r"productpage\.(\d+)", url)
    if not m:
        return _err("H&M", f"Could not extract product ID from URL: {url}")

    product_id = m.group(1)
    print(f"[H&M] Product ID: {product_id}")

    s = _session("https://www2.hm.com/")
    api_candidates = [
        f"https://api.hm.com/product-display-service/v1/en_GB/products/{product_id}?country=FR&lang=fr",
        f"https://api.hm.com/product-display-service/v1/fr_FR/products/{product_id}?country=FR&lang=fr",
    ]
    for api_url in api_candidates:
        try:
            r = s.get(api_url, timeout=15)
            print(f"[H&M] API {r.status_code} — {api_url[:80]}")
            if r.status_code == 200:
                try:
                    return _parse_hm_json(r.json(), product_id)
                except Exception:
                    pass
        except Exception as e:
            print(f"[H&M] API error: {e}")

    # Free fallback: Wayback Machine
    wb = get_wayback_text(url)
    if wb:
        print(f"[H&M] Using Wayback Machine snapshot ({len(wb)} chars)")
        return _parse_html_generic("H&M", wb, get_brand_sustainability("hm"))

    score = get_brand_sustainability("hm")
    return {
        "brand": "H&M", "composition": "Introuvable",
        "eco": _format_score(score), "sustainability_labels": [],
        "brand_score": score, "error": None,
    }


def _parse_hm_json(data: dict, product_id: str) -> dict:
    flat = json.dumps(data, ensure_ascii=False)

    # Composition
    composition = None
    for pattern in [
        r'"(?:composition|material|fabric|content)"\s*:\s*"([^"]{5,300})"',
        r'"(?:description)"\s*:\s*"([^"]*?\d+\s*%[^"]*)"',
    ]:
        m = re.search(pattern, flat, re.IGNORECASE)
        if m:
            composition = m.group(1)
            break

    # Eco
    eco = None
    for pattern in [
        r'"(?:sustainability\w*|eco\w*|conscious\w*)"\s*:\s*"([^"]{5,500})"',
        r'"(?:countryOfOrigin|countryOfProduction)"\s*:\s*"([^"]{2,100})"',
    ]:
        m = re.search(pattern, flat, re.IGNORECASE)
        if m:
            eco = m.group(1)
            break

    score = get_brand_sustainability("hm")
    return {
        "brand":                 "H&M",
        "composition":           composition or "Introuvable",
        "eco":                   eco or _format_score(score) or "Introuvable",
        "sustainability_labels": _labels(flat),
        "brand_score":           score,
        "error":                 None,
    }


# ─────────────────────────────────────────────────────────────
#  CELIO — Standard requests + BeautifulSoup (no bot protection)
# ─────────────────────────────────────────────────────────────

_CELIO_STOP = (
    "Complétez votre look", "Avis clients", "Retrait GRATUIT",
    "Livraison OFFERTE", "Inscrivez-vous", "Nos catégories",
)

def scrape_celio(url: str) -> dict:
    s = _session("https://www.celio.com/")
    r = s.get(url, timeout=20, allow_redirects=True)
    r.encoding = r.apparent_encoding
    print(f"[Celio] HTTP {r.status_code}")

    if r.status_code != 200:
        return _err("Celio", f"HTTP {r.status_code}")

    soup = BeautifulSoup(r.text, "html.parser")
    page = re.sub(r"\n{2,}", "\n", soup.get_text("\n", strip=True))

    # Composition
    composition = None
    node = soup.select_one(
        ".product-composition, .composition, "
        "[data-testid*='composition'], [class*='composition']"
    )
    if node:
        composition = node.get_text(" ", strip=True) or None
    if not composition:
        m = re.search(
            r"(mati[eè]re|composition)[^\n]{0,20}\n(.{10,300}?)(?=\n\n|\Z)",
            page, re.IGNORECASE | re.DOTALL,
        )
        if m:
            composition = m.group(0).strip()

    # Eco
    eco = None
    stop_re = "|".join(re.escape(s) for s in _CELIO_STOP)
    m2 = re.compile(
        r"(?:[Éé]co[- ]?conception|Normal de s.engager)\s*(.+?)"
        r"(?=\n(?:" + stop_re + r")|\Z)",
        re.IGNORECASE | re.DOTALL,
    ).search(page)
    if m2:
        eco = m2.group(0).strip()

    score = get_brand_sustainability("celio")
    return {
        "brand":                 "Celio",
        "composition":           composition or "Introuvable",
        "eco":                   eco or _format_score(score) or "Introuvable",
        "sustainability_labels": _labels(page),
        "brand_score":           score,
        "error":                 None,
    }


# ─────────────────────────────────────────────────────────────
#  WAYBACK MACHINE — Free cached page retrieval
#  archive.org has snapshots of most e-commerce pages.
#  These snapshots bypass Akamai because they were fetched
#  by Wayback's own crawlers long before bot detection was added.
# ─────────────────────────────────────────────────────────────

def get_wayback_text(url: str) -> Optional[str]:
    """
    Checks if archive.org has a cached snapshot of the URL.
    If yes, fetches it and returns the page text.
    Returns None if no snapshot is available.
    """
    try:
        # Step 1: Ask Wayback if a snapshot exists
        check = requests.get(
            f"https://archive.org/wayback/available?url={url}",
            timeout=10,
        ).json()
        snapshot = check.get("archived_snapshots", {}).get("closest", {})
        if not snapshot.get("available"):
            print(f"[Wayback] No snapshot found for {url}")
            return None

        wb_url = snapshot["url"]
        timestamp = snapshot.get("timestamp", "?")
        print(f"[Wayback] Snapshot found: {timestamp} — {wb_url}")

        # Step 2: Fetch the snapshot
        r = requests.get(wb_url, timeout=20, headers={
            "User-Agent": "Mozilla/5.0 (compatible; EthiClo/1.0)",
        })
        if r.status_code != 200:
            return None

        soup = BeautifulSoup(r.text, "html.parser")
        # Remove Wayback's own toolbar from the text
        for el in soup.select("#wm-ipp-base, #wm-ipp"):
            el.decompose()
        return soup.get_text("\n", strip=True)

    except Exception as e:
        print(f"[Wayback] Error: {e}")
        return None


# ─────────────────────────────────────────────────────────────
#  GENERIC HTML parser (used by Wayback results + generic brands)
# ─────────────────────────────────────────────────────────────

def _parse_html_generic(brand: str, page_text: str, score: Optional[dict]) -> dict:
    m_comp = re.search(
        r"(?:composition|mati[eè]re|material|fabric)[^\n]{0,30}\n"
        r"((?:.*?\d+\s*%.*?\n?){1,8})",
        page_text, re.IGNORECASE,
    )
    m_comp2 = re.search(r"\d+\s*%\s*[\w\s\-àâéèêëîïôùûüçœæ]{2,50}", page_text)
    m_eco = re.search(
        r"(?:recycl[eé]|organique|organic|certifi[eé]|oeko|gots|join life|"
        r"[eé]co[- ]?conception|caract[eé]ristiques\s+environn)"
        r"[^\n]{0,400}",
        page_text, re.IGNORECASE,
    )
    composition = (m_comp.group(1) if m_comp else None) or (m_comp2.group(0) if m_comp2 else None)
    eco = m_eco.group(0) if m_eco else None
    return {
        "brand":                 brand,
        "composition":           composition or "Introuvable",
        "eco":                   eco or _format_score(score) or "Introuvable",
        "sustainability_labels": _labels(page_text),
        "brand_score":           score,
        "error":                 None,
    }


# ─────────────────────────────────────────────────────────────
#  GENERIC — For any unknown brand
# ─────────────────────────────────────────────────────────────

def scrape_generic(url: str) -> dict:
    brand = _detect_brand(url)
    score = get_brand_sustainability(brand)

    # Try direct HTTP first
    try:
        r = _session().get(url, timeout=15)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            return _parse_html_generic(brand, soup.get_text("\n", strip=True), score)
    except Exception:
        pass

    # Wayback Machine fallback
    wb = get_wayback_text(url)
    if wb:
        return _parse_html_generic(brand, wb, score)

    return {
        "brand": brand, "composition": "Introuvable",
        "eco": _format_score(score) or "Introuvable",
        "sustainability_labels": [], "brand_score": score, "error": None,
    }


# ─────────────────────────────────────────────────────────────
#  Helpers
# ─────────────────────────────────────────────────────────────

def _format_score(score: Optional[dict]) -> Optional[str]:
    if not score:
        return None
    parts = [f"Note globale Good On You: {score.get('overall', 'N/A')}"]
    if "env" in score:
        parts.append(f"Environnement: {score['env']}/5")
    if "labour" in score:
        parts.append(f"Conditions de travail: {score['labour']}/5")
    if "animal" in score and score["animal"]:
        parts.append(f"Bien-être animal: {score['animal']}/5")
    if "url" in score:
        parts.append(f"Source: {score['url']}")
    return " | ".join(parts)


def _err(brand: str, msg: str) -> dict:
    return {
        "brand": brand, "composition": None, "eco": None,
        "sustainability_labels": [], "brand_score": None, "error": msg,
    }


# ─────────────────────────────────────────────────────────────
#  INDITEX GROUP — Pull&Bear, Bershka, Massimo Dutti, Stradivarius, Oysho
#  Same platform as Zara: same URL pattern (-p{id}.html), same API structure.
# ─────────────────────────────────────────────────────────────

def _scrape_inditex(url: str, brand_name: str, brand_key: str) -> dict:
    """Generic scraper for all Inditex brands (reuses Zara API pattern)."""
    m = re.search(r"-p(\d+)(?:\.html)?(?:\?|$)", url)
    if not m:
        return _err(brand_name, f"Could not extract product ID from URL: {url}")

    product_id = m.group(1)
    product_id_stripped = product_id.lstrip("0") or product_id
    domain = urlparse(url).netloc
    print(f"[{brand_name}] Product ID: {product_id}")

    s = _session(f"https://{domain}/")
    s.headers["Accept"] = "application/json"
    api_candidates = [
        f"https://{domain}/fr/fr/product?productId={product_id_stripped}&sectionId=&screen=mobile",
        f"https://{domain}/fr/fr/product?productId={product_id}&sectionId=&screen=mobile",
    ]
    for api_url in api_candidates:
        try:
            r = s.get(api_url, timeout=15)
            print(f"[{brand_name}] API {r.status_code}")
            if r.status_code == 200:
                try:
                    return _parse_zara_json(r.json())
                except Exception:
                    pass
        except Exception as e:
            print(f"[{brand_name}] API error: {e}")

    wb = get_wayback_text(url)
    score = get_brand_sustainability(brand_key)
    if wb:
        return _parse_html_generic(brand_name, wb, score)
    return {
        "brand": brand_name, "composition": "Introuvable",
        "eco": _format_score(score), "sustainability_labels": [],
        "brand_score": score, "error": None,
    }

scrape_pullandbear  = lambda url: _scrape_inditex(url, "Pull&Bear",    "pullandbear")
scrape_bershka      = lambda url: _scrape_inditex(url, "Bershka",       "bershka")
scrape_massimodutti = lambda url: _scrape_inditex(url, "Massimo Dutti", "massimodutti")
scrape_stradivarius = lambda url: _scrape_inditex(url, "Stradivarius",  "stradivarius")
scrape_oysho        = lambda url: _scrape_inditex(url, "Oysho",         "oysho")


# ─────────────────────────────────────────────────────────────
#  UNIQLO — Public product detail API
#  URL pattern: /products/E476517-000/00  →  code = E476517-000
# ─────────────────────────────────────────────────────────────

def scrape_uniqlo(url: str) -> dict:
    m = re.search(r"/products?/([A-Z0-9\-]+)/", url, re.IGNORECASE)
    if not m:
        return _err("Uniqlo", f"Could not extract product code from URL: {url}")

    code = m.group(1).upper()
    print(f"[Uniqlo] Product code: {code}")

    s = _session("https://www.uniqlo.com/")
    api_candidates = [
        f"https://www.uniqlo.com/fr/fr/api/commerce/v5/fr/fr/products/{code}/details?locale=fr_FR&httpFailure=true",
        f"https://www.uniqlo.com/eu/en/api/commerce/v5/en/en/products/{code}/details?locale=en_EU&httpFailure=true",
    ]
    for api_url in api_candidates:
        try:
            r = s.get(api_url, timeout=15)
            print(f"[Uniqlo] API {r.status_code}")
            if r.status_code == 200:
                flat = json.dumps(r.json(), ensure_ascii=False)
                comp = re.search(
                    r'"(?:materialInfo|material|composition)"\s*:\s*"([^"]{5,400})"',
                    flat, re.IGNORECASE,
                )
                eco = re.search(
                    r'"(?:sustainable\w*|recycl\w*|organic\w*|careInfo|environment\w*)"\s*:\s*"([^"]{5,400})"',
                    flat, re.IGNORECASE,
                )
                score = get_brand_sustainability("uniqlo")
                return {
                    "brand": "Uniqlo",
                    "composition": comp.group(1) if comp else "Introuvable",
                    "eco": eco.group(1) if eco else _format_score(score) or "Introuvable",
                    "sustainability_labels": _labels(flat),
                    "brand_score": score, "error": None,
                }
        except Exception as e:
            print(f"[Uniqlo] API error: {e}")

    score = get_brand_sustainability("uniqlo")
    wb = get_wayback_text(url)
    if wb:
        return _parse_html_generic("Uniqlo", wb, score)
    return {
        "brand": "Uniqlo", "composition": "Introuvable",
        "eco": _format_score(score), "sustainability_labels": [],
        "brand_score": score, "error": None,
    }


# ─────────────────────────────────────────────────────────────
#  DECATHLON — Simple HTML, no bot protection, good eco data
# ─────────────────────────────────────────────────────────────

def scrape_decathlon(url: str) -> dict:
    s = _session("https://www.decathlon.fr/")
    r = s.get(url, timeout=20, allow_redirects=True)
    r.encoding = r.apparent_encoding
    print(f"[Decathlon] HTTP {r.status_code}")

    if r.status_code != 200:
        score = get_brand_sustainability("decathlon")
        return _err("Decathlon", f"HTTP {r.status_code}")

    soup = BeautifulSoup(r.text, "html.parser")
    text = soup.get_text("\n", strip=True)

    comp = re.search(
        r"(?:composition|mati[eè]res?|materia(?:l|ux))[^\n]{0,20}\n"
        r"((?:.*?\d+\s*%.*?\n?){1,10})",
        text, re.IGNORECASE,
    ) or re.search(r"\d+\s*%\s*[\w\s\-àéèêçœ]{2,50}", text)

    eco = re.search(
        r"(?:[eé]co[- ]?(?:conception|design)|recycl[eé]|fabriqu[eé]\s+de\s+mani[eè]re"
        r"|impact\s+environnemental|mati[eè]res?\s+recycl[eé]es?)"
        r"[^\n]{0,500}",
        text, re.IGNORECASE | re.DOTALL,
    )

    score = get_brand_sustainability("decathlon")
    composition = (comp.group(1) if comp and comp.lastindex else
                   comp.group(0) if comp else None)
    return {
        "brand": "Decathlon",
        "composition": composition or "Introuvable",
        "eco": eco.group(0)[:600] if eco else _format_score(score) or "Introuvable",
        "sustainability_labels": _labels(text),
        "brand_score": score, "error": None,
    }


# ─────────────────────────────────────────────────────────────
#  Router
# ─────────────────────────────────────────────────────────────

SCRAPERS = {
    # Inditex group (all share the same API structure)
    "zara.com":          scrape_zara,
    "pullandbear.com":   scrape_pullandbear,
    "bershka.com":       scrape_bershka,
    "massimodutti.com":  scrape_massimodutti,
    "stradivarius.com":  scrape_stradivarius,
    "oysho.com":         scrape_oysho,
    # H&M Group
    "hm.com":            scrape_hm,
    "www2.hm.com":       scrape_hm,
    # Other specialized scrapers
    "celio.com":         scrape_celio,
    "uniqlo.com":        scrape_uniqlo,
    "decathlon.fr":      scrape_decathlon,
    "decathlon.com":     scrape_decathlon,
    # All other brands → scrape_generic():
    #   1. Direct HTTP  2. Wayback Machine  3. Good On You score
    # Covered via Good On You scores (35+ brands):
    #   Nike, Adidas, Puma, Mango, Gap, ASOS, Shein, Primark, Lacoste,
    #   Levi's, Patagonia, Veja, Sézane, Arket, Kiabi, La Redoute,
    #   Jules, Tommy Hilfiger, Ralph Lauren, New Balance, Columbia...
}


def scrape_product(url: str) -> dict:
    """
    Main entry point. Auto-detects brand from URL.
    Specialized scrapers for 12 domains, Good On You scores for 35+ brands.
    """
    host = urlparse(url).netloc.lower().lstrip("www.")
    for key, fn in SCRAPERS.items():
        if host.endswith(key):
            return fn(url)
    return scrape_generic(url)


# ─────────────────────────────────────────────────────────────
#  Self-test
# ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    cases = [
        ("Zara",      "https://www.zara.com/fr/fr/sweat-polo-col-contraste-p00526310.html"),
        ("H&M",       "https://www2.hm.com/fr_fr/productpage.0685816002.html"),
        ("Celio",     "https://www.celio.com/fr-fr/p/one-piece---t-shirt-homme-blanc-tony-tony-chopper/1184594.html"),
        ("Uniqlo",    "https://www.uniqlo.com/fr/fr/products/E476519-000/00"),
        ("Decathlon", "https://www.decathlon.fr/p/t-shirt-de-randonnee-manches-courtes-nature-homme-nh500/_/R-p-352068"),
        ("Nike (brand score)", "https://www.nike.com/fr/t/air-force-1-07-shoes-WrpTMr"),
        ("Patagonia (brand score)", "https://www.patagonia.com/product/mens-baggies-shorts/57022.html"),
    ]
    for label, url in cases:
        print(f"\n{'='*65}\n  {label}\n{'='*65}")
        r = scrape_product(url)
        print(f"  Brand       : {r['brand']}")
        print(f"  Composition : {r['composition']}")
        print(f"  Eco         : {r['eco']}")
        print(f"  Labels      : {r['sustainability_labels'] or 'Aucun'}")
        score = r.get("brand_score")
        if score:
            print(f"  Brand Score : {score.get('overall')} ({score.get('source', '')})")
        if r["error"]:
            print(f"  Erreur      : {r['error']}")
        time.sleep(1)
    print("\nDone.")

