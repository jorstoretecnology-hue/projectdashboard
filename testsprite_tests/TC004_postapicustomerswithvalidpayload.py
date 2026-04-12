import requests

BASE_URL = "http://localhost:3001"
LOGIN_ENDPOINT = "/auth/login"
CUSTOMERS_ENDPOINT = "/api/customers"
TIMEOUT = 30

def test_post_api_customers_with_valid_payload():
    # Step 1: Authenticate to get JWT token
    login_payload = {
        "email": "validuser@example.com",
        "password": "ValidPassword123!"
    }

    try:
        login_resp = requests.post(
            BASE_URL + LOGIN_ENDPOINT, json=login_payload, timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        content_type = login_resp.headers.get('Content-Type', '')
        assert 'application/json' in content_type.lower(), f"Expected JSON response but got {content_type}"
        login_json = login_resp.json()
        token = login_json.get("access_token")
        assert token and isinstance(token, str), f"JWT token not found in login response or not a string: {login_json}"

        # Prepare valid customer payload according to CRM schema
        customer_payload = {
            "name": "Test Customer",
            "email": "test.customer@example.com",
            "phone": "+1234567890",
            "address": "123 Test Street",
            "company": "Test Company Ltd",
            "notes": "Created by automated test TC004"
        }

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        # Step 2: POST /api/customers with valid payload
        post_resp = requests.post(
            BASE_URL + CUSTOMERS_ENDPOINT, 
            json=customer_payload, 
            headers=headers, 
            timeout=TIMEOUT
        )
        assert post_resp.status_code == 201, f"Expected 201 Created but got {post_resp.status_code}: {post_resp.text}"

        resp_json = post_resp.json()
        new_customer_id = resp_json.get("id") or resp_json.get("customer_id")
        assert new_customer_id is not None, f"Response does not contain new customer id: {resp_json}"

    finally:
        # Cleanup: Delete the created customer if created
        if 'new_customer_id' in locals() and new_customer_id is not None:
            try:
                del_resp = requests.delete(
                    f"{BASE_URL}{CUSTOMERS_ENDPOINT}/{new_customer_id}",
                    headers=headers,
                    timeout=TIMEOUT
                )
                # Not asserting delete response to not fail test on cleanup
            except Exception:
                pass

test_post_api_customers_with_valid_payload()
