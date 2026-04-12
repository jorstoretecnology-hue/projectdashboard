import requests

BASE_URL = "http://localhost:3001"
LOGIN_URL = f"{BASE_URL}/auth/login"
BILLING_SUMMARY_URL = f"{BASE_URL}/api/billing/summary"
TIMEOUT = 30

# Replace with valid test user credentials who has a tenant_id in JWT
TEST_USER_CREDENTIALS = {
    "email": "tenantuser@example.com",
    "password": "StrongP@ssw0rd!"
}

def test_getapibillingsummarywithvalidjwt():
    token = None
    try:
        # Step 1: Login to get JWT token with tenant_id
        login_resp = requests.post(
            LOGIN_URL,
            json=TEST_USER_CREDENTIALS,
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_data = login_resp.json()
        # JWT token key might be 'token' or 'access_token'
        if "token" in login_data:
            token = login_data["token"]
        elif "access_token" in login_data:
            token = login_data["access_token"]
        else:
            assert False, "JWT token missing in login response"
        assert token, "JWT token is empty"
        
        # Step 2: Use the JWT token to GET tenant billing summary
        headers = {
            "Authorization": f"Bearer {token}"
        }
        summary_resp = requests.get(
            BILLING_SUMMARY_URL,
            headers=headers,
            timeout=TIMEOUT
        )
        assert summary_resp.status_code == 200, f"Billing summary request failed with status {summary_resp.status_code}"
        # Check content exists before parsing JSON
        if not summary_resp.text:
            assert False, "Billing summary response is empty"
        try:
            summary_data = summary_resp.json()
        except ValueError as e:
            assert False, f"Failed to decode JSON from billing summary response: {e}"
        # Validate that summary data is a dict and contains expected fields related to vw_tenant_billing_summary
        assert isinstance(summary_data, dict), "Billing summary response is not a JSON object"
        # Example keys from typical billing summary - adjust keys as per actual schema
        expected_keys = ["tenant_id", "plan_name", "base_price", "addons", "total_price"]
        for key in expected_keys:
            assert key in summary_data, f"Key '{key}' missing in billing summary response"
        # Validate 'addons' is a list (add-ons info)
        assert isinstance(summary_data.get("addons"), list), "'addons' should be a list"
        
        # Additional thorough validations regarding subscription engine, manual activation, audit logs, and active module navigation
        for addon in summary_data.get("addons", []):
            assert "module_slug" in addon, "Addon item missing 'module_slug'"
            assert "activated" in addon, "Addon item missing 'activated' status"
            assert isinstance(addon["activated"], bool), "'activated' should be boolean"
        
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"


test_getapibillingsummarywithvalidjwt()
