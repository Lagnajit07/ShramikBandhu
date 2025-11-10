import requests
import sys
import json
from datetime import datetime

class LaborHiringAPITester:
    def __init__(self, base_url="https://laborsync-3.preview.emergentagent.com"):
        self.base_url = base_url
        self.worker_token = None
        self.employer_token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data
        self.test_worker = {
            "name": "Test Worker",
            "phone": "9999999999",
            "password": "testpass123",
            "role": "worker",
            "phone_type": "smartphone"
        }
        
        self.test_employer = {
            "name": "Test Employer",
            "phone": "8888888888", 
            "password": "testpass123",
            "role": "employer",
            "phone_type": "smartphone"
        }
        
        self.test_admin = {
            "name": "Test Admin",
            "phone": "7777777777",
            "password": "testpass123", 
            "role": "admin",
            "phone_type": "smartphone"
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, params=params)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                self.test_results.append({"test": name, "status": "PASS", "details": f"Status: {response.status_code}"})
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                    self.test_results.append({"test": name, "status": "FAIL", "details": f"Expected {expected_status}, got {response.status_code}. Error: {error_detail}"})
                except:
                    self.test_results.append({"test": name, "status": "FAIL", "details": f"Expected {expected_status}, got {response.status_code}"})

            return success, response.json() if response.content else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({"test": name, "status": "FAIL", "details": f"Exception: {str(e)}"})
            return False, {}

    def test_user_registration_and_login(self):
        """Test user registration and login for all roles"""
        print("\n" + "="*50)
        print("TESTING USER REGISTRATION & LOGIN")
        print("="*50)
        
        # Test Worker Registration
        success, response = self.run_test(
            "Worker Registration",
            "POST", 
            "auth/register",
            200,
            data=self.test_worker
        )
        if success and 'token' in response:
            self.worker_token = response['token']
            print(f"   Worker token obtained: {self.worker_token[:20]}...")
        
        # Test Employer Registration  
        success, response = self.run_test(
            "Employer Registration",
            "POST",
            "auth/register", 
            200,
            data=self.test_employer
        )
        if success and 'token' in response:
            self.employer_token = response['token']
            print(f"   Employer token obtained: {self.employer_token[:20]}...")
            
        # Test Admin Registration
        success, response = self.run_test(
            "Admin Registration",
            "POST",
            "auth/register",
            200, 
            data=self.test_admin
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            print(f"   Admin token obtained: {self.admin_token[:20]}...")

        # Test Login with existing users (from context)
        existing_users = [
            {"phone": "9876543210", "password": "worker123"},
            {"phone": "9876543211", "password": "employer123"}, 
            {"phone": "9876543212", "password": "admin123"}
        ]
        
        for i, user in enumerate(existing_users):
            role = ["Worker", "Employer", "Admin"][i]
            success, response = self.run_test(
                f"Existing {role} Login",
                "POST",
                "auth/login",
                200,
                data=user
            )
            if success and 'token' in response:
                if i == 0:
                    self.worker_token = response['token']
                elif i == 1:
                    self.employer_token = response['token'] 
                elif i == 2:
                    self.admin_token = response['token']

    def test_worker_profile_apis(self):
        """Test worker profile creation and management"""
        print("\n" + "="*50)
        print("TESTING WORKER PROFILE APIs")
        print("="*50)
        
        if not self.worker_token:
            print("❌ Skipping worker tests - no worker token")
            return
            
        # Create worker profile
        profile_data = {
            "skills": ["Construction", "Plumbing"],
            "experience_years": 5,
            "location": "Mumbai"
        }
        
        success, response = self.run_test(
            "Create Worker Profile",
            "POST",
            "workers/profile",
            200,
            data=profile_data,
            token=self.worker_token
        )
        
        # Get worker profile
        self.run_test(
            "Get Worker Profile", 
            "GET",
            "workers/profile",
            200,
            token=self.worker_token
        )
        
        # Update availability
        self.run_test(
            "Update Worker Availability",
            "PUT", 
            "workers/availability",
            200,
            params={"available": False},
            token=self.worker_token
        )
        
        # Get worker jobs
        self.run_test(
            "Get Worker Jobs",
            "GET",
            "workers/jobs", 
            200,
            token=self.worker_token
        )

    def test_employer_profile_apis(self):
        """Test employer profile creation and management"""
        print("\n" + "="*50)
        print("TESTING EMPLOYER PROFILE APIs")
        print("="*50)
        
        if not self.employer_token:
            print("❌ Skipping employer tests - no employer token")
            return
            
        # Create employer profile
        profile_data = {
            "company_name": "Test Construction Co",
            "company_address": "123 Test Street, Mumbai"
        }
        
        success, response = self.run_test(
            "Create Employer Profile",
            "POST",
            "employers/profile",
            200,
            data=profile_data,
            token=self.employer_token
        )
        
        # Get employer profile
        self.run_test(
            "Get Employer Profile",
            "GET", 
            "employers/profile",
            200,
            token=self.employer_token
        )

    def test_job_management_apis(self):
        """Test job creation and management"""
        print("\n" + "="*50)
        print("TESTING JOB MANAGEMENT APIs")
        print("="*50)
        
        if not self.employer_token:
            print("❌ Skipping job tests - no employer token")
            return
            
        # Create job
        job_data = {
            "title": "Construction Worker Needed",
            "description": "Need experienced construction workers",
            "skill_required": "Construction",
            "workers_needed": 2,
            "wage_per_day": 500.0,
            "location": "Mumbai",
            "date": "2024-12-25"
        }
        
        success, response = self.run_test(
            "Create Job",
            "POST",
            "jobs",
            200,
            data=job_data,
            token=self.employer_token
        )
        
        job_id = None
        if success and 'id' in response:
            job_id = response['id']
            print(f"   Job created with ID: {job_id}")
        
        # Get all jobs
        self.run_test(
            "Get All Jobs",
            "GET",
            "jobs",
            200,
            token=self.employer_token
        )
        
        # Get specific job
        if job_id:
            self.run_test(
                "Get Specific Job",
                "GET", 
                f"jobs/{job_id}",
                200,
                token=self.employer_token
            )
            
            # Get job assignments
            self.run_test(
                "Get Job Assignments",
                "GET",
                f"jobs/{job_id}/assignments", 
                200,
                token=self.employer_token
            )

    def test_admin_apis(self):
        """Test admin dashboard and management APIs"""
        print("\n" + "="*50)
        print("TESTING ADMIN APIs")
        print("="*50)
        
        if not self.admin_token:
            print("❌ Skipping admin tests - no admin token")
            return
            
        # Get admin dashboard
        self.run_test(
            "Get Admin Dashboard",
            "GET",
            "admin/dashboard",
            200,
            token=self.admin_token
        )
        
        # Get all workers
        self.run_test(
            "Get All Workers",
            "GET", 
            "admin/workers",
            200,
            token=self.admin_token
        )

    def test_notification_apis(self):
        """Test notification APIs"""
        print("\n" + "="*50)
        print("TESTING NOTIFICATION APIs")
        print("="*50)
        
        if not self.worker_token:
            print("❌ Skipping notification tests - no worker token")
            return
            
        # Get notifications
        self.run_test(
            "Get Notifications",
            "GET",
            "notifications",
            200,
            token=self.worker_token
        )

    def test_authentication_edge_cases(self):
        """Test authentication edge cases"""
        print("\n" + "="*50)
        print("TESTING AUTHENTICATION EDGE CASES")
        print("="*50)
        
        # Test invalid login
        self.run_test(
            "Invalid Login",
            "POST",
            "auth/login",
            401,
            data={"phone": "0000000000", "password": "wrongpass"}
        )
        
        # Test duplicate registration
        self.run_test(
            "Duplicate Registration",
            "POST",
            "auth/register", 
            400,
            data=self.test_worker
        )
        
        # Test unauthorized access
        self.run_test(
            "Unauthorized Profile Access",
            "GET",
            "workers/profile",
            401
        )

def main():
    print("🚀 Starting Labor Hiring System API Tests")
    print("=" * 60)
    
    tester = LaborHiringAPITester()
    
    # Run all test suites
    tester.test_user_registration_and_login()
    tester.test_worker_profile_apis()
    tester.test_employer_profile_apis() 
    tester.test_job_management_apis()
    tester.test_admin_apis()
    tester.test_notification_apis()
    tester.test_authentication_edge_cases()
    
    # Print final results
    print("\n" + "="*60)
    print("📊 FINAL TEST RESULTS")
    print("="*60)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    # Print detailed results
    print("\n📋 Detailed Results:")
    for result in tester.test_results:
        status_icon = "✅" if result["status"] == "PASS" else "❌"
        print(f"{status_icon} {result['test']}: {result['status']}")
        if result["status"] == "FAIL":
            print(f"   Details: {result['details']}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())