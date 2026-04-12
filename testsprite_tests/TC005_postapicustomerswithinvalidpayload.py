import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_post_api_customers_with_invalid_payload():
    login_url = f"{BASE_URL}/auth/login"
    customers_url = f"{BASE_URL}/api/customers"

    # Use some known invalid customer payload that violates Zod schema
    invalid_payload = {
        "name": 12345,  # expecting string, invalid type
        "email": "not-an-email",  # invalid format
        "phone": None,  # assuming phone required and must be string
        "address": 78910  # assuming address must be string
    }

    # Valid credentials to get JWT token (replace with suitable test user)
    auth_payload = {
        "email": "testuser@example.com",
        "password": "TestPassword123!"
    }

    try:
        # Authenticate and get JWT token
        login_response = requests.post(login_url, json=auth_payload, timeout=TIMEOUT)
        assert login_response.status_code == 200, f"Login failed with status {login_response.status_code}"
        token = login_response.json().get("access_token")
        assert token, "JWT token not found in login response"

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        # Attempt POST /api/customers with invalid payload - expecting 422
        response = requests.post(customers_url, json=invalid_payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 422, f"Expected 422 Validation Error, got {response.status_code}"

        # Try to parse response JSON only if content is not empty
        if response.text.strip():
            resp_json = response.json()
            # Zod validation errors typically have structured detail; check presence
            assert ("error" in resp_json or "errors" in resp_json or "message" in resp_json), \
                "Response does not contain validation error details"
        else:
            # Empty body is acceptable but we expect some error message; fail if empty
            assert False, "Response body is empty but expected validation error details"

    except requests.RequestException as e:
        assert False, f"HTTP request failed: {e}"


test_post_api_customers_with_invalid_payload()
