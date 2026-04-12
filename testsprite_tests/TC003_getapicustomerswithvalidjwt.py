import requests
import json

BASE_URL = "http://localhost:3001"
LOGIN_ENDPOINT = "/auth/login"
CUSTOMERS_ENDPOINT = "/api/customers"
TIMEOUT = 30

def test_get_api_customers_with_valid_jwt():
    # Step 1: Login with valid credentials to obtain JWT token with tenant_id
    login_payload = {
        "email": "validuser@example.com",
        "password": "validpassword"
    }
    try:
        login_resp = requests.post(
            BASE_URL + LOGIN_ENDPOINT,
            json=login_payload,
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        # Relax Content-Type check to handle possible variations
        content_type = login_resp.headers.get('Content-Type', '')
        assert any(ct in content_type for ct in ['application/json', 'application/json; charset=utf-8']), f"Login response not JSON, got Content-Type: {content_type}"
        login_data = login_resp.json()
        token = login_data.get("access_token")
        assert token, "JWT token 'access_token' not found in login response"

        # Step 2: GET /api/customers with Authorization header
        headers = {
            "Authorization": f"Bearer {token}"
        }
        customers_resp = requests.get(
            BASE_URL + CUSTOMERS_ENDPOINT,
            headers=headers,
            timeout=TIMEOUT
        )
        assert customers_resp.status_code == 200, f"GET /api/customers returned status {customers_resp.status_code}"

        customers_data = customers_resp.json()
        # Assert that the response is a list
        assert isinstance(customers_data, list), "Customers response is not a list"

        # Further validation: Each customer dict has expected keys (minimal check)
        if customers_data:
            for customer in customers_data:
                assert isinstance(customer, dict), "Customer entry is not a dictionary"
                # Typical fields: id, name, tenant_id, email etc. Validate presence of id and tenant scoped data
                assert "id" in customer, "Customer missing 'id' field"
                # tenant_id should be scoped and not empty (if tenant_id present)
                if "tenant_id" in customer:
                    assert customer["tenant_id"], "Customer tenant_id is empty"

    except json.JSONDecodeError as e:
        assert False, f"Failed to decode JSON response: {e}"
    except requests.RequestException as e:
        assert False, f"HTTP request failed: {e}"


test_get_api_customers_with_valid_jwt()
