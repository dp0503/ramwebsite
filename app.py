from __future__ import annotations

import json
import math
import os
from pathlib import Path

import requests
from dotenv import load_dotenv
from flask import Flask, abort, jsonify, request, send_from_directory

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "data" / "sample_data.json"
LEGACY_DATA_FILE = BASE_DIR / "data" / "ram_data.json"

PARSE_MOTHERBOARDS_URL = (
    "https://api.parse.bot/scraper/"
    "65ff43d0-7294-4868-891b-57e8031827c3/get_motherboards"
)
PARSE_PAGE_SIZE = 30
PARSE_TIMEOUT_SECONDS = 25

app = Flask(__name__, static_folder="static", template_folder="templates")


def load_data() -> dict:
    path = DATA_FILE if DATA_FILE.exists() else LEGACY_DATA_FILE
    try:
        with path.open(encoding="utf-8") as handle:
            return json.load(handle)
    except FileNotFoundError:
        abort(500, description="Sample data file was not found.")
    except json.JSONDecodeError:
        abort(500, description="Sample data file is not valid JSON.")


def sample_envelope(payload: dict) -> dict:
    data = load_data()
    meta = data.get("meta", {})
    body = {"data_type": "sample", "notice": meta.get("notice", "Sample data only.")}
    body.update(payload)
    return body


def map_prices(rows: list) -> list:
    mapped = []
    for row in rows:
        mapped.append(
            {
                "memory": row.get("memory_type"),
                "memory_type": row.get("memory_type"),
                "capacity": row.get("capacity"),
                "previous": row.get("previous_price"),
                "previous_price": row.get("previous_price"),
                "current": row.get("current_price"),
                "current_price": row.get("current_price"),
                "change": row.get("change_percentage"),
                "change_percentage": row.get("change_percentage"),
                "status": row.get("status"),
            }
        )
    return mapped


def map_manufacturers(rows: list) -> list:
    mapped = []
    for row in rows:
        mapped.append(
            {
                "id": row.get("id"),
                "name": row.get("name"),
                "country": row.get("country"),
                "memoryTypes": row.get("memory_types"),
                "memory_types": row.get("memory_types"),
                "mainProducts": row.get("products"),
                "products": row.get("products"),
                "description": row.get("description"),
            }
        )
    return mapped


def map_timeline(rows: list) -> list:
    mapped = []
    for row in rows:
        year = row.get("year")
        mapped.append(
            {
                "id": str(year).lower(),
                "year": year,
                "title": row.get("title"),
                "summary": row.get("title"),
                "description": row.get("description"),
                "details": row.get("description"),
            }
        )
    return mapped


def fetch_external_ram_price_api() -> None:
    return None


def public_api_error(http_status: int = 502) -> tuple:
    body = {
        "ok": False,
        "error": "Unable to load motherboard data. Please try again later.",
        "products": [],
        "page": 1,
        "count": 0,
        "total_pages": 0,
        "available_fields": [],
    }
    return jsonify(body), http_status


def extract_motherboard_payload(payload):
    if isinstance(payload, list):
        products = [item for item in payload if isinstance(item, dict)]
        return {
            "page": 1,
            "count": len(products),
            "products": products,
        }

    if not isinstance(payload, dict):
        return {"page": 1, "count": 0, "products": []}

    data = payload.get("data") if isinstance(payload.get("data"), dict) else payload
    products = data.get("products")
    if not isinstance(products, list):
        products = []
    products = [item for item in products if isinstance(item, dict)]

    page = data.get("page", payload.get("page", 1))
    count = data.get("count", payload.get("count", len(products)))
    try:
        page = int(page)
    except (TypeError, ValueError):
        page = 1
    try:
        count = int(count)
    except (TypeError, ValueError):
        count = len(products)

    return {"page": page, "count": count, "products": products}


def collect_available_fields(products: list) -> list:
    keys = []
    seen = set()
    for item in products:
        for key in item.keys():
            if key not in seen:
                seen.add(key)
                keys.append(key)
    return keys


def fetch_motherboards_from_parse(search: str, page: int) -> tuple[dict | None, int | None]:
    api_key = os.environ.get("PARSE_API_KEY", "").strip()
    if not api_key or api_key == "your_api_key_here":
        return None, 503

    try:
        response = requests.get(
            PARSE_MOTHERBOARDS_URL,
            headers={"X-API-Key": api_key},
            params={"page": str(page), "search": search},
            timeout=PARSE_TIMEOUT_SECONDS,
        )
    except requests.Timeout:
        return None, 504
    except requests.RequestException:
        return None, 502

    if response.status_code in (401, 403):
        return None, 502
    if response.status_code == 429:
        return None, 429
    if response.status_code >= 400:
        return None, 502

    try:
        payload = response.json()
    except ValueError:
        return None, 502

    parsed = extract_motherboard_payload(payload)
    parsed["search"] = search
    parsed["available_fields"] = collect_available_fields(parsed["products"])
    parsed["columns"] = [
        key
        for key in parsed["available_fields"]
        if key != "specs"
        and not any(isinstance(item.get(key), (dict, list)) for item in parsed["products"])
    ]
    page_size = PARSE_PAGE_SIZE
    if parsed["products"] and parsed["page"] == 1:
        page_size = max(len(parsed["products"]), 1)
    total_pages = 1
    if parsed["count"] > page_size:
        total_pages = max(1, math.ceil(parsed["count"] / page_size))
    parsed["page_size"] = page_size
    parsed["total_pages"] = total_pages
    parsed["ok"] = True
    parsed["notice"] = (
        "Motherboard catalog data from Parse. This is not a RAM price index."
    )
    return parsed, None


@app.route("/")
def home():
    return send_from_directory(app.template_folder, "index.html")


@app.route("/api/ram")
def api_ram():
    data = load_data()
    fetch_external_ram_price_api()
    return jsonify(
        sample_envelope(
            {
                "status": data.get("status", {}),
                "statusCards": data.get("status", {}).get("cards", []),
                "prices": map_prices(data.get("prices", [])),
                "manufacturers": map_manufacturers(data.get("manufacturers", [])),
                "timeline": map_timeline(data.get("timeline", [])),
                "timelineItems": map_timeline(data.get("timeline", [])),
                "ramTypes": data.get("ram_types", []),
                "flowSteps": data.get("flow_steps", []),
                "crisisStates": data.get("crisis_states", []),
                "charts": data.get("charts", {}),
            }
        )
    )


@app.route("/api/prices")
def api_prices():
    data = load_data()
    return jsonify(sample_envelope({"prices": map_prices(data.get("prices", []))}))


@app.route("/api/manufacturers")
def api_manufacturers():
    data = load_data()
    return jsonify(
        sample_envelope({"manufacturers": map_manufacturers(data.get("manufacturers", []))})
    )


@app.route("/api/timeline")
def api_timeline():
    data = load_data()
    return jsonify(sample_envelope({"timeline": map_timeline(data.get("timeline", []))}))


@app.route("/api/status")
def api_status():
    data = load_data()
    status = data.get("status", {})
    return jsonify(
        sample_envelope(
            {
                "status": status.get("status"),
                "level": status.get("level"),
                "description": status.get("description"),
                "last_updated": status.get("last_updated"),
                "cards": status.get("cards", []),
            }
        )
    )


@app.route("/api/charts")
def api_charts():
    data = load_data()
    charts = data.get("charts", {})
    return jsonify(sample_envelope(charts))


@app.route("/api/motherboards")
def api_motherboards():
    """
    Proxy to Parse get_motherboards.

    Query: /api/motherboards?search=B650&page=1
    """
    search = (request.args.get("search") or "").strip()
    if not search:
        search = "B650"
    try:
        page = int(request.args.get("page") or 1)
    except (TypeError, ValueError):
        page = 1
    if page < 1:
        page = 1

    parsed, error_status = fetch_motherboards_from_parse(search, page)
    if error_status:
        return public_api_error(error_status)
    return jsonify(parsed)


@app.errorhandler(404)
def handle_404(_error):
    if request.path.startswith("/api/"):
        return jsonify({"ok": False, "error": "Not found"}), 404
    return "Page not found", 404


@app.errorhandler(500)
def handle_500(error):
    if request.path.startswith("/api/"):
        return public_api_error(500)
    message = getattr(error, "description", "Server error")
    return message, 500


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
