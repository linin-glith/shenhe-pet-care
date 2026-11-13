# -*- coding: utf-8 -*-
"""Put one real-looking buyer in the local back office, so the portal can be
looked at with something in it.

The desk and the portal are only convincing with rows in them. Every inquiry
the automated tests created is addressed to a throwaway address that no human
will ever type, so the portal opens onto an empty list and the buyer concludes
the thing does not work.

So: one customer, one account, two inquiries at two different stages — one
still new, one already quoted — and one chat message, so every panel on the
account screen has something in it.

Local only. Nothing here is published.
"""
import json
import os
import time
import urllib.error
import urllib.request

API = os.environ.get("SHENHE_API", "http://127.0.0.1:4000")
EMAIL = "demo@example.com"
PASSWORD = "shenhe-demo-2026"
COMPANY = "Demo Pet Brands B.V."


def call(method, path, body=None, token=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(API + path, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    req.add_header("Sec-Fetch-Site", "same-origin")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, json.loads(r.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw or "{}")
        except Exception:
            return e.code, {"raw": raw}


print("registering the demo buyer")
st, d = call("POST", "/api/auth/register", {
    "email": EMAIL, "password": PASSWORD, "company": COMPANY,
    "name": "Demo Buyer", "country": "Netherlands",
})
if st == 409:
    print("  the account already exists")
    st, d = call("POST", "/api/auth/login", {"email": EMAIL, "password": PASSWORD})
token = d.get("token", "")
print(f"  status={st} token={'yes' if token else 'no'}")

print("filing two inquiries")
first = call("POST", "/api/inquiries", {
    "products": ["Power Odor Eliminator (Extra Strength) — 350 mL"],
    "quantity": 3000, "moq": 2000,
    "annualVolume": "200,000 – 500,000 units",
    "message": "We would like our own label on the 350 ml deodorizing spray, "
               "shipped to Rotterdam. Please quote EXW and the earliest production slot.",
    "company": COMPANY, "name": "Demo Buyer", "email": EMAIL, "country": "Netherlands",
    "source": "contact_form",
})
print(f"  inquiry 1 -> {first[0]} {first[1].get('reference', '')}")

second = call("POST", "/api/inquiries", {
    "products": ["Probiotic Pet Tooth Cleaner — 150 mL"],
    "quantity": 5000, "moq": 2000,
    "annualVolume": "500,000 – 1,000,000 units",
    "message": "Second line: the probiotic tooth cleaner in 150 ml for our "
               "retail chain. Same label artwork as the first enquiry.",
    "company": COMPANY, "name": "Demo Buyer", "email": EMAIL, "country": "Netherlands",
    "source": "contact_form",
})
print(f"  inquiry 2 -> {second[0]} {second[1].get('reference', '')}")

print("leaving a chat message")
st, d = call("POST", "/api/chat/messages", {
    "sku": "P010", "name": "Probiotic Pet Tooth Cleaner", "spec": "150 mL",
    "moq": 2000, "message": "Could you also confirm the shelf life at 150 ml?",
    "page": "http://127.0.0.1:8099/products/probiotic-pet-tooth-cleaner.html",
}, token=token)
print(f"  chat -> {st}")

print("\nThe demo buyer is ready:")
print(f"  email:    {EMAIL}")
print(f"  password: {PASSWORD}")
print(f"  sign in:  http://127.0.0.1:8099/portal/login.html")
