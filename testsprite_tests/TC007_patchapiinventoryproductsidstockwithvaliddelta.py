import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

VALID_USER_CREDENTIALS = {
    "email": "user@example.com",
    "password": "validpassword123"
}

VALID_PRODUCT_PAYLOAD = {
    "name": "Test Product",
    "price": 10,
    "description": "Test product description",
    "sku": "SKU123",
    "category": "Test Category",
    "stock": 10
}

def login_and_get_token():
    login_url = f"{BASE_URL}/auth/login"
    resp = requests.post(login_url, json=VALID_USER_CREDENTIALS, timeout=TIMEOUT)
    assert resp.status_code == 200, f"Login failed with status {resp.status_code}"
    try:
        data = resp.json()
    except Exception:
        assert False, "Login response is not valid JSON"
    token = data.get("access_token")
    assert token, "Token not found in login response"
    return token

def create_product(token):
    url = f"{BASE_URL}/api/inventory/products"
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.post(url, json=VALID_PRODUCT_PAYLOAD, headers=headers, timeout=TIMEOUT)
    assert resp.status_code == 201, f"Create product failed with status {resp.status_code}"
    try:
        data = resp.json()
    except Exception:
        assert False, "Create product response is not valid JSON"
    product_id = data.get("id")
    assert product_id, "Product ID not found in create product response"
    return product_id

def delete_product(token, product_id):
    url = f"{BASE_URL}/api/inventory/products/{product_id}"
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.delete(url, headers=headers, timeout=TIMEOUT)
    if resp.status_code not in (200, 204, 404):
        resp.raise_for_status()

def test_patchapiinventoryproductsidstockwithvaliddelta():
    token = login_and_get_token()
    headers = {"Authorization": f"Bearer {token}"}
    product_id = None
    try:
        product_id = create_product(token)
        stock_update_url = f"{BASE_URL}/api/inventory/products/{product_id}/stock"
        stock_delta_payload = {"stock_delta": 5}
        patch_resp = requests.patch(stock_update_url, json=stock_delta_payload, headers=headers, timeout=TIMEOUT)
        assert patch_resp.status_code == 200, f"Expected status 200, got {patch_resp.status_code}"
        try:
            resp_json = patch_resp.json()
        except Exception:
            assert False, "Patch response is not valid JSON"
        assert "stock" in resp_json, "Response json missing 'stock' key"
        updated_stock = resp_json["stock"]
        expected_stock = VALID_PRODUCT_PAYLOAD["stock"] + stock_delta_payload["stock_delta"]
        assert isinstance(updated_stock, int), "'stock' should be int"
        assert updated_stock == expected_stock, f"Stock expected to be {expected_stock}, but got {updated_stock}"
    finally:
        if product_id:
            delete_product(token, product_id)


test_patchapiinventoryproductsidstockwithvaliddelta()
