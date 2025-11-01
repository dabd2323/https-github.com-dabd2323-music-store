#!/usr/bin/env python3
import requests
import sys
import json
from datetime import datetime

class MusicStoreAPITester:
    def __init__(self, base_url="https://audio-commerce.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.verification_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.session = requests.Session()

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")
        
        if success:
            self.tests_passed += 1
        else:
            self.failed_tests.append({"test": name, "details": details})

    def test_api_call(self, method, endpoint, expected_status, data=None, headers=None):
        """Make API call and test response"""
        url = f"{self.api_url}/{endpoint}"
        
        # Default headers
        req_headers = {'Content-Type': 'application/json'}
        if self.token:
            req_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            req_headers.update(headers)

        try:
            if method == 'GET':
                response = self.session.get(url, headers=req_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=req_headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=req_headers)
            else:
                return False, f"Unsupported method: {method}"

            success = response.status_code == expected_status
            
            if success:
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json()
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text}"
                return False, error_msg

        except Exception as e:
            return False, f"Request failed: {str(e)}"

    def test_seed_products(self):
        """Test seeding products"""
        print("\n🌱 Testing product seeding...")
        success, response = self.test_api_call('POST', 'seed-products', 200)
        self.log_test("Seed products", success, str(response) if not success else "Products seeded successfully")
        return success

    def test_get_products(self):
        """Test getting all products"""
        print("\n📦 Testing product retrieval...")
        success, response = self.test_api_call('GET', 'products', 200)
        
        if success and isinstance(response, list) and len(response) > 0:
            self.log_test("Get products", True, f"Retrieved {len(response)} products")
            return response[0]['id']  # Return first product ID for later tests
        else:
            self.log_test("Get products", False, "No products found or invalid response")
            return None

    def test_get_single_product(self, product_id):
        """Test getting a single product"""
        if not product_id:
            self.log_test("Get single product", False, "No product ID available")
            return False
            
        success, response = self.test_api_call('GET', f'products/{product_id}', 200)
        self.log_test("Get single product", success, str(response) if not success else f"Retrieved product: {response.get('titre', 'Unknown')}")
        return success

    def test_user_registration(self):
        """Test user registration"""
        print("\n👤 Testing user registration...")
        
        # Generate unique email for testing
        timestamp = datetime.now().strftime("%H%M%S")
        test_email = f"test{timestamp}@example.com"
        
        user_data = {
            "prenom": "Jean",
            "nom": "Dupont",
            "email": test_email,
            "adresse": "123 Rue de la Musique, Paris",
            "mot_de_passe": "TestPassword123!"
        }
        
        success, response = self.test_api_call('POST', 'auth/register', 200, user_data)
        
        if success:
            self.user_id = response.get('user_id')
            self.verification_token = response.get('verification_token')
            self.log_test("User registration", True, f"User registered with ID: {self.user_id}")
            return test_email
        else:
            self.log_test("User registration", False, str(response))
            return None

    def test_email_verification(self):
        """Test email verification"""
        if not self.verification_token:
            self.log_test("Email verification", False, "No verification token available")
            return False
            
        success, response = self.test_api_call('GET', f'auth/verify-email/{self.verification_token}', 200)
        self.log_test("Email verification", success, str(response) if not success else "Email verified successfully")
        return success

    def test_user_login(self, email):
        """Test user login"""
        if not email:
            self.log_test("User login", False, "No email available for login")
            return False
            
        login_data = {
            "email": email,
            "mot_de_passe": "TestPassword123!"
        }
        
        success, response = self.test_api_call('POST', 'auth/login', 200, login_data)
        
        if success:
            self.token = response.get('token')
            self.log_test("User login", True, f"Login successful, token received")
            return True
        else:
            self.log_test("User login", False, str(response))
            return False

    def test_get_user_profile(self):
        """Test getting user profile"""
        if not self.token:
            self.log_test("Get user profile", False, "No authentication token")
            return False
            
        success, response = self.test_api_call('GET', 'auth/me', 200)
        self.log_test("Get user profile", success, str(response) if not success else f"Profile retrieved for: {response.get('prenom', 'Unknown')}")
        return success

    def test_cart_operations(self, product_id):
        """Test cart operations"""
        print("\n🛒 Testing cart operations...")
        
        if not self.token:
            self.log_test("Cart operations", False, "No authentication token")
            return False
            
        if not product_id:
            self.log_test("Cart operations", False, "No product ID available")
            return False

        # Test getting empty cart
        success, response = self.test_api_call('GET', 'cart', 200)
        self.log_test("Get empty cart", success, str(response) if not success else "Empty cart retrieved")

        # Test adding to cart
        cart_item = {"product_id": product_id, "quantite": 1}
        success, response = self.test_api_call('POST', 'cart/add', 200, cart_item)
        self.log_test("Add to cart", success, str(response) if not success else "Product added to cart")

        # Test getting cart with items
        success, response = self.test_api_call('GET', 'cart', 200)
        if success and isinstance(response, dict) and len(response.get('items', [])) > 0:
            self.log_test("Get cart with items", True, f"Cart has {len(response['items'])} items")
        else:
            self.log_test("Get cart with items", False, "Cart should have items but doesn't")

        # Test removing from cart
        success, response = self.test_api_call('DELETE', f'cart/remove/{product_id}', 200)
        self.log_test("Remove from cart", success, str(response) if not success else "Product removed from cart")

        # Add back to cart for checkout test
        success, response = self.test_api_call('POST', 'cart/add', 200, cart_item)
        return success

    def test_checkout_session(self):
        """Test creating checkout session"""
        print("\n💳 Testing checkout...")
        
        if not self.token:
            self.log_test("Create checkout session", False, "No authentication token")
            return None
            
        checkout_data = {"origin_url": self.base_url}
        success, response = self.test_api_call('POST', 'checkout/create-session', 200, checkout_data)
        
        if success:
            session_id = response.get('session_id')
            self.log_test("Create checkout session", True, f"Checkout session created: {session_id}")
            return session_id
        else:
            self.log_test("Create checkout session", False, str(response))
            return None

    def test_checkout_status(self, session_id):
        """Test checking checkout status"""
        if not session_id:
            self.log_test("Check checkout status", False, "No session ID available")
            return False
            
        success, response = self.test_api_call('GET', f'checkout/status/{session_id}', 200)
        self.log_test("Check checkout status", success, str(response) if not success else f"Status: {response.get('status', 'Unknown')}")
        return success

    def test_orders(self):
        """Test getting user orders"""
        print("\n📋 Testing orders...")
        
        if not self.token:
            self.log_test("Get orders", False, "No authentication token")
            return False
            
        success, response = self.test_api_call('GET', 'orders', 200)
        self.log_test("Get orders", success, str(response) if not success else f"Retrieved {len(response) if isinstance(response, list) else 0} orders")
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🎵 Starting Music Store API Tests...")
        print(f"Testing against: {self.api_url}")
        print("=" * 50)

        # Test product operations
        if not self.test_seed_products():
            print("❌ Critical: Product seeding failed. Stopping tests.")
            return self.generate_report()
            
        product_id = self.test_get_products()
        if product_id:
            self.test_get_single_product(product_id)

        # Test authentication flow
        email = self.test_user_registration()
        if email:
            if self.test_email_verification():
                if self.test_user_login(email):
                    self.test_get_user_profile()
                    
                    # Test cart and checkout (requires authentication)
                    if product_id:
                        if self.test_cart_operations(product_id):
                            session_id = self.test_checkout_session()
                            if session_id:
                                self.test_checkout_status(session_id)
                    
                    # Test orders
                    self.test_orders()

        return self.generate_report()

    def generate_report(self):
        """Generate test report"""
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        print(f"Total tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.failed_tests)}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in self.failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": len(self.failed_tests),
            "success_rate": (self.tests_passed/self.tests_run*100) if self.tests_run > 0 else 0,
            "failures": self.failed_tests
        }

def main():
    tester = MusicStoreAPITester()
    report = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if len(report["failures"]) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())