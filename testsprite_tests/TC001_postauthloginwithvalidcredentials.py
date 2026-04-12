import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_post_auth_login_with_valid_credentials():
    url = f"{BASE_URL}/auth/login"
    # Provide valid credentials for the test user
    payload = {
        "email": "validuser@example.com",
        "password": "ValidPassword123!"
    }
    headers = {
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {str(e)}"
    
    # Assert status code 200
    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    # Assert response is JSON
    try:
        body = response.json()
    except Exception:
        assert False, "Response is not JSON"

    # Assert presence of JWT token in response
    # Common key is 'access_token' or 'token'; check typical keys and JWT format
    token = None
    if "access_token" in body:
        token = body["access_token"]
    elif "token" in body:
        token = body["token"]
    elif "jwt" in body:
        token = body["jwt"]
    else:
        # Sometimes token might be in 'data' or 'result'
        for key in ["data", "result", "auth"]:
            if key in body and isinstance(body[key], dict):
                subbody = body[key]
                for tkey in ["access_token", "token", "jwt"]:
                    if tkey in subbody:
                        token = subbody[tkey]
                        break
                if token:
                    break
        
    assert token is not None, "JWT token not found in response"

    # Basic JWT structure validation (3 parts separated by '.')
    parts = token.split('.')
    assert len(parts) == 3, "Returned token does not appear to be a valid JWT"

    # Decode the middle payload part (payload) - base64url decode
    import base64
    import json
    try:
        padded = parts[1] + '=' * (-len(parts[1]) % 4)  # Padding for base64 decoding
        decoded_payload_bytes = base64.urlsafe_b64decode(padded)
        decoded_payload = json.loads(decoded_payload_bytes)
    except Exception:
        assert False, "JWT payload is not decodable JSON"

    # Assert that tenant_id is NOT present initially in app_metadata in payload
    app_metadata = decoded_payload.get("app_metadata")
    # app_metadata could be None or not contain tenant_id key initially
    if app_metadata is not None:
        assert "tenant_id" not in app_metadata, "tenant_id should not be present in JWT initially"

test_post_auth_login_with_valid_credentials()