import json
import re
import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

def scrape_clothing_materials(product_url):
    session = requests.Session()
    retry = Retry(
        total=2,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"],
    )
    session.mount("https://", HTTPAdapter(max_retries=retry))
    session.mount("http://", HTTPAdapter(max_retries=retry))

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
        "Referer": "https://www.celio.com/",
    }

    r = session.get(product_url, headers=headers, timeout=20, allow_redirects=True)
    print("Status:", r.status_code, "Final URL:", r.url)

    if r.status_code == 403:
        return {
            "composition": None,
            "eco_conception": None,
            "error": "403: accès refusé (protection anti-bot).",
        }

    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")
    page_text = soup.get_text(" ", strip=True)

    def extract_first(selectors):
        node = soup.select_one(selectors)
        if not node:
            return None
        txt = node.get_text(" ", strip=True)
        return txt if txt else None

    # Composition (comme avant, mais un peu élargi)
    composition = extract_first(
        ".product-composition, .composition, [data-testid*='composition'], [class*='composition']"
    )
    if not composition:
        m = re.search(
            r"(composition|mati[eè]re)s?\s*[:\-]?\s*(.{0,220}?)(?=(entretien|livraison|retour|$))",
            page_text,
            re.IGNORECASE,
        )
        if m:
            composition = m.group(0).strip()

    # Améliore la gestion d'encodage pour éviter "produit?est"
    r.encoding = r.apparent_encoding

    # Eco-conception (ciblé + borne de fin réaliste)
    eco_conception = None
    text_with_breaks = soup.get_text("\n", strip=True)
    text_with_breaks = re.sub(r"\n{2,}", "\n", text_with_breaks)

    # Stops observés dans ton résultat réel (après la section eco)
    stop_markers = (
        "Complétez votre look",
        "Avis clients",
        "Retrait GRATUIT",
        "Livraison OFFERTE",
        "Inscrivez-vous à la newsletter",
        "Nos catégories",
    )

    eco_pattern = re.compile(
        r"(?:Éco[- ]?conception|Eco[- ]?conception)\s*(.+?)(?=\n(?:"
        + "|".join(re.escape(s) for s in stop_markers)
        + r")\b|\Z)",
        re.IGNORECASE | re.DOTALL,
    )

    m = eco_pattern.search(text_with_breaks)
    if m:
        eco_conception = m.group(1).strip()

    # Fallback sur le titre du bloc contenu
    if not eco_conception:
        fallback = re.compile(
            r"(Normal de s'engager\s*:.*?)(?=\n(?:"
            + "|".join(re.escape(s) for s in stop_markers)
            + r")\b|\Z)",
            re.IGNORECASE | re.DOTALL,
        )
        m2 = fallback.search(text_with_breaks)
        if m2:
            eco_conception = m2.group(1).strip()

    if eco_conception:
        eco_conception = re.sub(r"\s+\n", "\n", eco_conception)
        eco_conception = re.sub(r"\n\s+", "\n", eco_conception)
        eco_conception = re.sub(r"[ \t]{2,}", " ", eco_conception).strip()
    return {
        "composition": composition or "Introuvable",
        "eco_conception": eco_conception or "Introuvable",
        "error": None,
    }

mock_url="https://www.celio.com/fr-fr/p/t-shirt-regular-col-rond-100-coton---blanc/1100208.html"

result = scrape_clothing_materials(mock_url)

if not isinstance(result, dict):
    print("Erreur: la fonction n'a pas renvoyé un dictionnaire.")
else:
    print("\n--- Scraping Result ---")
    print("Composition:", result["composition"])
    print("Eco-conception:", result["eco_conception"])
    if result["error"]:
        print("Erreur:", result["error"])
