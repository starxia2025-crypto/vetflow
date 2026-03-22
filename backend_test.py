#!/usr/bin/env python3
"""
VetFlow CRM Backend API Testing Suite
Tests all API endpoints for the veterinary clinic management system
"""

import requests
import sys
import json
from datetime import datetime, timedelta
import uuid

class VetFlowAPITester:
    def __init__(self, base_url="https://clinic-pet-dash.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data storage
        self.test_client_id = None
        self.test_pet_id = None
        self.test_doctor_id = None
        self.test_species_id = None
        self.test_breed_id = None

    def log_result(self, test_name, success, details="", endpoint=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}")
        else:
            print(f"❌ {test_name} - {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "endpoint": endpoint
        })

    def make_request(self, method, endpoint, data=None, expected_status=200):
        """Make HTTP request with authentication"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.session_token:
            headers['Authorization'] = f'Bearer {self.session_token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            
            success = response.status_code == expected_status
            return success, response.json() if response.content else {}, response.status_code
            
        except Exception as e:
            return False, {"error": str(e)}, 0

    def test_root_endpoint(self):
        """Test API root endpoint"""
        success, data, status = self.make_request('GET', '')
        self.log_result("API Root Endpoint", success and data.get("status") == "running", 
                       f"Status: {status}, Data: {data}", "/api/")

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication...")
        
        # Test /auth/me without authentication (should fail)
        success, data, status = self.make_request('GET', 'auth/me', expected_status=401)
        self.log_result("Auth Me (Unauthenticated)", success, 
                       f"Expected 401, got {status}", "/api/auth/me")
        
        # Note: We can't test actual Google Auth flow in automated tests
        # but we can test the session endpoint structure
        print("ℹ️  Note: Google Auth flow requires manual testing")

    def test_dashboard_endpoints(self):
        """Test dashboard endpoints (requires auth)"""
        print("\n📊 Testing Dashboard...")
        
        # These will fail without auth, but we can test the endpoint structure
        success, data, status = self.make_request('GET', 'dashboard/stats', expected_status=401)
        self.log_result("Dashboard Stats (No Auth)", success, 
                       f"Expected 401, got {status}", "/api/dashboard/stats")
        
        success, data, status = self.make_request('GET', 'dashboard/upcoming-vaccines', expected_status=401)
        self.log_result("Upcoming Vaccines (No Auth)", success, 
                       f"Expected 401, got {status}", "/api/dashboard/upcoming-vaccines")

    def test_clients_endpoints(self):
        """Test clients CRUD endpoints"""
        print("\n👥 Testing Clients...")
        
        # Test GET clients (should require auth)
        success, data, status = self.make_request('GET', 'clients', expected_status=401)
        self.log_result("Get Clients (No Auth)", success, 
                       f"Expected 401, got {status}", "/api/clients")
        
        # Test POST client (should require auth)
        client_data = {
            "name": "Test Client",
            "phone": "555-0123",
            "email": "test@example.com"
        }
        success, data, status = self.make_request('POST', 'clients', client_data, expected_status=401)
        self.log_result("Create Client (No Auth)", success, 
                       f"Expected 401, got {status}", "/api/clients")

    def test_pets_endpoints(self):
        """Test pets CRUD endpoints"""
        print("\n🐾 Testing Pets...")
        
        success, data, status = self.make_request('GET', 'pets', expected_status=401)
        self.log_result("Get Pets (No Auth)", success, 
                       f"Expected 401, got {status}", "/api/pets")

    def test_doctors_endpoints(self):
        """Test doctors CRUD endpoints"""
        print("\n👨‍⚕️ Testing Doctors...")
        
        success, data, status = self.make_request('GET', 'doctors', expected_status=401)
        self.log_result("Get Doctors (No Auth)", success, 
                       f"Expected 401, got {status}", "/api/doctors")

    def test_cabinets_endpoints(self):
        """Test cabinets CRUD endpoints"""
        print("\n🏥 Testing Cabinets...")
        
        success, data, status = self.make_request('GET', 'cabinets', expected_status=401)
        self.log_result("Get Cabinets (No Auth)", success, 
                       f"Expected 401, got {status}", "/api/cabinets")

    def test_species_breeds_endpoints(self):
        """Test species and breeds endpoints"""
        print("\n🦮 Testing Species & Breeds...")
        
        success, data, status = self.make_request('GET', 'species', expected_status=401)
        self.log_result("Get Species (No Auth)", success, 
                       f"Expected 401, got {status}", "/api/species")
        
        success, data, status = self.make_request('GET', 'breeds', expected_status=401)
        self.log_result("Get Breeds (No Auth)", success, 
                       f"Expected 401, got {status}", "/api/breeds")

    def test_inventory_endpoints(self):
        """Test inventory endpoints"""
        print("\n📦 Testing Inventory...")
        
        success, data, status = self.make_request('GET', 'inventory', expected_status=401)
        self.log_result("Get Inventory (No Auth)", success, 
                       f"Expected 401, got {status}", "/api/inventory")

    def test_invoices_endpoints(self):
        """Test invoices endpoints"""
        print("\n💰 Testing Invoices...")
        
        success, data, status = self.make_request('GET', 'invoices', expected_status=401)
        self.log_result("Get Invoices (No Auth)", success, 
                       f"Expected 401, got {status}", "/api/invoices")

    def test_ai_endpoints(self):
        """Test AI assistant endpoints"""
        print("\n🤖 Testing AI Assistant...")
        
        chat_data = {
            "message": "Hello, how many pets are registered?",
            "session_id": f"test_{uuid.uuid4().hex[:8]}"
        }
        success, data, status = self.make_request('POST', 'ai/chat', chat_data, expected_status=401)
        self.log_result("AI Chat (No Auth)", success, 
                       f"Expected 401, got {status}", "/api/ai/chat")

    def test_seed_endpoint(self):
        """Test seed data endpoint"""
        print("\n🌱 Testing Seed Data...")
        
        success, data, status = self.make_request('POST', 'seed', expected_status=401)
        self.log_result("Seed Data (No Auth)", success, 
                       f"Expected 401, got {status}", "/api/seed")

    def test_api_structure(self):
        """Test API endpoint structure and responses"""
        print("\n🔍 Testing API Structure...")
        
        # Test non-existent endpoint
        success, data, status = self.make_request('GET', 'nonexistent', expected_status=404)
        self.log_result("Non-existent Endpoint", success, 
                       f"Expected 404, got {status}", "/api/nonexistent")

    def run_all_tests(self):
        """Run all test suites"""
        print("🧪 Starting VetFlow CRM API Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Run test suites
        self.test_root_endpoint()
        self.test_auth_endpoints()
        self.test_dashboard_endpoints()
        self.test_clients_endpoints()
        self.test_pets_endpoints()
        self.test_doctors_endpoints()
        self.test_cabinets_endpoints()
        self.test_species_breeds_endpoints()
        self.test_inventory_endpoints()
        self.test_invoices_endpoints()
        self.test_ai_endpoints()
        self.test_seed_endpoint()
        self.test_api_structure()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        print(f"✅ Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Print failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print(f"\n❌ Failed Tests ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"  • {test['test']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = VetFlowAPITester()
    success = tester.run_all_tests()
    
    # Save results to file
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'total_tests': tester.tests_run,
            'passed_tests': tester.tests_passed,
            'success_rate': (tester.tests_passed/tester.tests_run)*100,
            'results': tester.test_results
        }, f, indent=2)
    
    print(f"\n📄 Results saved to: /app/backend_test_results.json")
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())