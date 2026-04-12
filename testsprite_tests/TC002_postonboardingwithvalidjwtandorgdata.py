import requests
import base64
import json

BASE_URL = "http://localhost:3001"
LOGIN_PATH = "/auth/login"
ONBOARDING_PATH = "/onboarding"
TIMEOUT = 30

# Use valid credentials for login (must be replaced with actual test credentials)
VALID_CREDENTIALS = {
    "email": "testuser@example.com",
    "password": "TestPassword123!"
}

# Example organization data payload for onboarding (adapt fields as needed)
ORG_DATA = {
    "organization_name": "Test Organization",
    "industry": "technology",
    "size": 50,
    "address": "123 Test St, Test City",
    "phone": "+1234567890"
}

def decode_jwt_payload(token):
    # JWT format: header.payload.signature, decode payload (2nd part)
    try:
        payload_part = token.split('.')[1]
        # Add padding if missing
        rem = len(payload_part) % 4
        if rem > 0:
            payload_part += '=' * (4 - rem)
        decoded_bytes = base64.urlsafe_b64decode(payload_part)
        return json.loads(decoded_bytes)
    except Exception:
        return {}

def test_post_onboarding_with_valid_jwt_and_org_data():
    try:
        # Step 1: Login to get initial JWT without tenant_id
        login_resp = requests.post(
            f"{BASE_URL}{LOGIN_PATH}",
            json=VALID_CREDENTIALS,
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_json = login_resp.json()
        assert "access_token" in login_json, "No access_token in login response"
        initial_jwt = login_json["access_token"]

        # Decode JWT payload to check absence of tenant_id initially
        decoded_initial_jwt = decode_jwt_payload(initial_jwt)
        app_metadata = decoded_initial_jwt.get("app_metadata", {})
        assert "tenant_id" not in app_metadata or app_metadata["tenant_id"] is None, "tenant_id should not be present initially"

        headers = {
            "Authorization": f"Bearer {initial_jwt}",
            "Content-Type": "application/json"
        }

        # Step 2: POST /onboarding with org data and valid JWT
        onboard_resp = requests.post(
            f"{BASE_URL}{ONBOARDING_PATH}",
            json=ORG_DATA,
            headers=headers,
            timeout=TIMEOUT
        )
        assert onboard_resp.status_code == 200, f"Onboarding failed with status {onboard_resp.status_code}"
        # Verify response content-type is JSON and content is not empty
        content_type = onboard_resp.headers.get('Content-Type', '')
        assert 'application/json' in content_type.lower(), f"Onboarding response content type not JSON: {content_type}"
        assert onboard_resp.text.strip() != '', "Onboarding response body is empty"

        onboard_json = onboard_resp.json()
        assert "access_token" in onboard_json, "Onboarding response missing updated JWT token"

        updated_jwt = onboard_json["access_token"]

        # Decode updated JWT and verify it contains app_metadata.tenant_id
        decoded_updated_jwt = decode_jwt_payload(updated_jwt)
        updated_app_metadata = decoded_updated_jwt.get("app_metadata", {})
        assert "tenant_id" in updated_app_metadata and updated_app_metadata["tenant_id"], "tenant_id not found in updated JWT app_metadata"

    except requests.RequestException as re:
        raise AssertionError(f"HTTP request failed: {re}")
    except AssertionError as ae:
        raise ae

test_post_onboarding_with_valid_jwt_and_org_data()
