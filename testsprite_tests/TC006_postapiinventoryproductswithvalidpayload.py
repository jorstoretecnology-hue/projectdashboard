import requests

BASE_URL = "http://localhost:3001"
LOGIN_ENDPOINT = "/auth/login"
PRODUCTS_ENDPOINT = "/api/inventory/products"
TIMEOUT = 30

# Replace these credentials with valid test user credentials
TEST_USER_CREDENTIALS = {
    "email": "testuser@example.com",
    "password": "TestPassword123!"
}

def test_post_api_inventory_products_with_valid_payload():
    token = None
    product_id = None

    # Example valid product payload based on typical inventory product structure
    valid_product_payload = {
        "name": "Test Product",
        "description": "A valid test product",
        "price": 1999,           # price in cents or smallest currency unit, integer
        "barcode": "1234567890123",
        "sku": "TP-001",
        "category": "test-category"
    }

    try:
        # Step 1: Authenticate user to get JWT token
        login_resp = requests.post(
            BASE_URL + LOGIN_ENDPOINT,
            json=TEST_USER_CREDENTIALS,
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_json = login_resp.json()
        token = login_json.get("access_token")
        assert token and isinstance(token, str), "JWT token not found in login response"

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        # Step 2: POST valid product payload to /api/inventory/products
        post_resp = requests.post(
            BASE_URL + PRODUCTS_ENDPOINT,
            headers=headers,
            json=valid_product_payload,
            timeout=TIMEOUT
        )

        # Validate response status code 201 Created
        assert post_resp.status_code == 201, f"Expected 201 Created, got {post_resp.status_code}"

        # Validate response body is JSON and parse
        try:
            post_json = post_resp.json()
        except Exception:
            assert False, f"Response is not valid JSON. Status code: {post_resp.status_code}"

        # Validate response includes product id (non-empty, string or int)
        product_id = post_json.get("id") or post_json.get("product_id")
        assert product_id is not None, "Response missing product id"
        assert isinstance(product_id, (int, str)) and str(product_id).strip() != "", "Invalid product id format"

        # Additional: Validate response fields match input or expected schema (optional)
        # For example, name and price
        assert post_json.get("name") == valid_product_payload["name"], "Product name mismatch in response"
        assert post_json.get("price") == valid_product_payload["price"], "Product price mismatch in response"

    finally:
        # Cleanup: Delete the created product if product_id and token are present
        if product_id and token:
            try:
                delete_resp = requests.delete(
                    f"{BASE_URL}{PRODUCTS_ENDPOINT}/{product_id}",
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=TIMEOUT
                )
                # Accept 200 OK or 204 No Content as success for deletion
                assert delete_resp.status_code in (200, 204), f"Failed to delete product id {product_id}. Status: {delete_resp.status_code}"
            except Exception:
                # Silently pass cleanup exceptions to not mask original test failure
                pass

test_post_api_inventory_products_with_valid_payload()
