import json
import os
import time
import urllib.error
import urllib.request

BASE_URL = os.environ.get("UMAMI_INTERNAL_URL", "http://umami:3000").rstrip("/")
USERNAME = os.environ.get("UMAMI_USERNAME", "admin")
PASSWORD = os.environ["UMAMI_PASSWORD"]
WEBSITE_ID = os.environ["UMAMI_WEBSITE_ID"]
WEBSITE_DOMAIN = os.environ.get("UMAMI_WEBSITE_DOMAIN", "porprov.depok.go.id")


def request(path: str, method: str = "GET", payload=None, token: str = ""):
    data = json.dumps(payload).encode() if payload is not None else None
    headers = {"Accept": "application/json"}
    if data is not None:
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{BASE_URL}{path}", data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=15) as response:
        body = response.read()
        return json.loads(body) if body else {}


def login(password: str):
    return request("/api/auth/login", "POST", {"username": USERNAME, "password": password})


for attempt in range(60):
    try:
        request("/api/heartbeat")
        break
    except Exception:
        if attempt == 59:
            raise RuntimeError("Umami tidak sehat setelah 120 detik")
        time.sleep(2)

try:
    session = login(PASSWORD)
except urllib.error.HTTPError as configured_error:
    if configured_error.code not in (400, 401, 403):
        raise
    # SECURITY: Default hanya dipakai saat bootstrap pertama, lalu segera diganti.
    session = login("umami")
    user_id = session["user"]["id"]
    request(f"/api/users/{user_id}", "POST", {"username": USERNAME, "password": PASSWORD, "role": "admin"}, session["token"])
    session = login(PASSWORD)

token = session["token"]
try:
    website = request(f"/api/websites/{WEBSITE_ID}", token=token)
except urllib.error.HTTPError as website_error:
    if website_error.code != 404:
        raise
    request("/api/websites", "POST", {"id": WEBSITE_ID, "name": "Portal PORPROV Depok", "domain": WEBSITE_DOMAIN}, token)
    # INFO: Umami 3 dapat mengembalikan body JSON null setelah create sukses.
    # Ambil ulang record agar bootstrap tetap idempoten dan dapat diverifikasi.
    website = request(f"/api/websites/{WEBSITE_ID}", token=token)

if not isinstance(website, dict):
    raise RuntimeError("Website Umami tidak dapat diverifikasi setelah bootstrap")

if website.get("domain") != WEBSITE_DOMAIN:
    request(f"/api/websites/{WEBSITE_ID}", "POST", {"name": "Portal PORPROV Depok", "domain": WEBSITE_DOMAIN}, token)

print(f"Bootstrap Umami siap untuk website {WEBSITE_ID}")
