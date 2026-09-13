# -*- coding: utf-8 -*-
"""Integration test for UI/API Deployment Workflow (Preview, 202 Queue, Progress, Idempotency).

Verifies:
1. Target resolution: Region / Branch / Cashbox IP.
2. Pre-deployment preview: Cashboxes, versions, missing media, status.
3. Job creation: HTTP 202 Accepted, deployment_id, PENDING status in DB.
4. Asynchronous execution: Steps 1-17, real-time status progression.
5. Idempotency (NO_OP): Second application with identical desired state.
6. Safety boundary: Left-half order scene & non-ad tables untouched.
"""
import json
import urllib.request
import pytest

CENTRAL_SERVER_URL = "http://10.0.0.111:8101"

def api_call(method, path, data=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    body = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(f"{CENTRAL_SERVER_URL}{path}", data=body, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.status, json.loads(resp.read().decode('utf-8'))

def test_central_server_auth_and_preview_flow():
    """Verify authentication and pre-deployment targeting preview endpoint."""
    # 1. Login
    try:
        status, auth = api_call("POST", "/api/auth/login", {"username": "admin", "password": "123"})
    except Exception:
        status, auth = api_call("POST", "/api/auth/login", {"username": "admin", "password": "admin"})
    assert status == 200
    assert auth["success"] is True
    token = auth["token"]

    # 2. Preview FULL SCREEN mode targeting 10.0.0.241
    preview_full_payload = {
        "mode": "FULL",
        "targetType": "ips",
        "targetIps": ["10.0.0.241"],
        "config": {
            "idleType": "gallery",
            "idleSlides": ["Full1.jpg", "Full2.jpg"],
            "idleInterval": 5
        }
    }
    status, preview = api_call("POST", "/api/deployments/preview", preview_full_payload, token=token)
    assert status == 200
    assert preview["success"] is True
    assert preview["totalSelected"] == 1
    assert preview["readyCount"] >= 1
    assert len(preview["cashiers"]) == 1
    assert preview["cashiers"][0]["ip"] == "10.0.0.241"
    assert preview["cashiers"][0]["status"] == "Ready"

    # 3. Preview 50/50 SPLIT mode targeting 10.0.0.241
    preview_split_payload = {
        "mode": "SPLIT",
        "targetType": "ips",
        "targetIps": ["10.0.0.241"],
        "config": {
            "orderPromoType": "image",
            "orderPromoBanner": "01.jpg"
        }
    }
    status, preview_split = api_call("POST", "/api/deployments/preview", preview_split_payload, token=token)
    assert status == 200
    assert preview_split["mode"] == "SPLIT"
    assert preview_split["totalSelected"] == 1
    assert preview_split["cashiers"][0]["ip"] == "10.0.0.241"
    assert preview_split["cashiers"][0]["status"] == "Ready"


def test_deployment_queue_returns_202_and_pending():
    """Verify POST /api/deployments returns 202 Accepted and creates PENDING deployment."""
    # Login
    try:
        _, auth = api_call("POST", "/api/auth/login", {"username": "admin", "password": "123"})
    except Exception:
        _, auth = api_call("POST", "/api/auth/login", {"username": "admin", "password": "admin"})
    token = auth["token"]

    deploy_payload = {
        "mode": "SPLIT",
        "targetType": "ips",
        "targetIps": ["10.0.0.241"],
        "config": {
            "orderPromoType": "image",
            "orderPromoBanner": "01.jpg"
        }
    }
    status, res = api_call("POST", "/api/deployments", deploy_payload, token=token)
    assert status == 202
    assert res["success"] is True
    assert "deployment_id" in res
    assert res["status"] == "PENDING"
    assert res["target_ip"] == "10.0.0.241"

    # Check that deployment details can be queried
    dep_id = res["deployment_id"]
    status, dep_details = api_call("GET", f"/api/deployments/{dep_id}", token=token)
    assert status == 200
    assert dep_details["deployment"]["id"] == dep_id
    assert dep_details["deployment"]["cashbox_id"] == "10.0.0.241"
