from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Enums
class UserRole(str, Enum):
    WORKER = "worker"
    EMPLOYER = "employer"
    ADMIN = "admin"

class PhoneType(str, Enum):
    SMARTPHONE = "smartphone"
    FEATURE = "feature"
    NONE = "none"

class JobStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class AssignmentStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    COMPLETED = "completed"

# Models
class UserRegister(BaseModel):
    name: str
    phone: str
    password: str
    role: UserRole
    phone_type: Optional[PhoneType] = PhoneType.SMARTPHONE

class UserLogin(BaseModel):
    phone: str
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    role: UserRole
    phone_type: Optional[PhoneType] = PhoneType.SMARTPHONE
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WorkerProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    skills: List[str] = []
    experience_years: int = 0
    rating: float = 0.0
    total_jobs: int = 0
    available: bool = True
    location: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WorkerProfileCreate(BaseModel):
    skills: List[str]
    experience_years: int = 0
    location: str

class EmployerProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    company_name: str
    company_address: str
    rating: float = 0.0
    total_jobs_posted: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmployerProfileCreate(BaseModel):
    company_name: str
    company_address: str

class Job(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employer_id: str
    title: str
    description: str
    skill_required: str
    workers_needed: int
    wage_per_day: float
    location: str
    date: str  # Job date
    status: JobStatus = JobStatus.OPEN
    workers_assigned: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class JobCreate(BaseModel):
    title: str
    description: str
    skill_required: str
    workers_needed: int
    wage_per_day: float
    location: str
    date: str

class Assignment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    job_id: str
    worker_id: str
    status: AssignmentStatus = AssignmentStatus.PENDING
    notification_sent: bool = False
    notification_type: str = ""  # app, sms, admin
    accepted_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    worker_rating: Optional[float] = None
    employer_rating: Optional[float] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AssignmentUpdate(BaseModel):
    status: AssignmentStatus

class RatingCreate(BaseModel):
    rating: float
    assignment_id: str

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    worker_id: str
    job_id: str
    message: str
    notification_type: str  # app, sms, ivr
    sent: bool = False
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Helper Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Mock SMS/IVR Function
async def send_notification(worker: dict, job: dict, notification_type: str):
    """Mock function to send notifications via SMS/IVR"""
    message = f"New job: {job['title']} at {job['location']}. Wage: Rs.{job['wage_per_day']}/day"
    
    notification = Notification(
        worker_id=worker['id'],
        job_id=job['id'],
        message=message,
        notification_type=notification_type,
        sent=True
    )
    
    doc = notification.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.notifications.insert_one(doc)
    
    # In production, integrate with Twilio/Textlocal here
    logging.info(f"Mock {notification_type} sent to worker {worker['phone']}: {message}")
    return notification

# Auth Routes
@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if user exists
    existing = await db.users.find_one({"phone": user_data.phone})
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    # Create user
    hashed_pwd = hash_password(user_data.password)
    user = User(
        name=user_data.name,
        phone=user_data.phone,
        role=user_data.role,
        phone_type=user_data.phone_type
    )
    
    user_doc = user.model_dump()
    user_doc['password'] = hashed_pwd
    user_doc['created_at'] = user_doc['created_at'].isoformat()
    
    await db.users.insert_one(user_doc)
    
    # Create token
    token = create_access_token({"sub": user.id, "role": user.role})
    
    return {
        "user": user.model_dump(),
        "token": token,
        "message": "Registration successful"
    }

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    user = await db.users.find_one({"phone": login_data.phone}, {"_id": 0})
    if not user or not verify_password(login_data.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid phone or password")
    
    token = create_access_token({"sub": user['id'], "role": user['role']})
    
    del user['password']
    return {
        "user": user,
        "token": token,
        "message": "Login successful"
    }

# Worker Routes
@api_router.post("/workers/profile")
async def create_worker_profile(profile_data: WorkerProfileCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != UserRole.WORKER:
        raise HTTPException(status_code=403, detail="Only workers can create worker profile")
    
    # Check if profile exists
    existing = await db.worker_profiles.find_one({"user_id": current_user['id']})
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")
    
    profile = WorkerProfile(
        user_id=current_user['id'],
        skills=profile_data.skills,
        experience_years=profile_data.experience_years,
        location=profile_data.location
    )
    
    doc = profile.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.worker_profiles.insert_one(doc)
    
    return profile

@api_router.get("/workers/profile")
async def get_worker_profile(current_user: dict = Depends(get_current_user)):
    profile = await db.worker_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@api_router.put("/workers/availability")
async def update_availability(available: bool, current_user: dict = Depends(get_current_user)):
    result = await db.worker_profiles.update_one(
        {"user_id": current_user['id']},
        {"$set": {"available": available}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"message": "Availability updated", "available": available}

@api_router.get("/workers/jobs")
async def get_worker_jobs(current_user: dict = Depends(get_current_user)):
    """Get jobs assigned to worker"""
    assignments = await db.assignments.find({"worker_id": current_user['id']}, {"_id": 0}).to_list(100)
    
    # Fetch job details for each assignment
    result = []
    for assignment in assignments:
        job = await db.jobs.find_one({"id": assignment['job_id']}, {"_id": 0})
        if job:
            result.append({"assignment": assignment, "job": job})
    
    return result

# Employer Routes
@api_router.post("/employers/profile")
async def create_employer_profile(profile_data: EmployerProfileCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != UserRole.EMPLOYER:
        raise HTTPException(status_code=403, detail="Only employers can create employer profile")
    
    existing = await db.employer_profiles.find_one({"user_id": current_user['id']})
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")
    
    profile = EmployerProfile(
        user_id=current_user['id'],
        company_name=profile_data.company_name,
        company_address=profile_data.company_address
    )
    
    doc = profile.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.employer_profiles.insert_one(doc)
    
    return profile

@api_router.get("/employers/profile")
async def get_employer_profile(current_user: dict = Depends(get_current_user)):
    profile = await db.employer_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

# Job Routes
@api_router.post("/jobs")
async def create_job(job_data: JobCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != UserRole.EMPLOYER:
        raise HTTPException(status_code=403, detail="Only employers can create jobs")
    
    job = Job(
        employer_id=current_user['id'],
        title=job_data.title,
        description=job_data.description,
        skill_required=job_data.skill_required,
        workers_needed=job_data.workers_needed,
        wage_per_day=job_data.wage_per_day,
        location=job_data.location,
        date=job_data.date
    )
    
    doc = job.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.jobs.insert_one(doc)
    
    # Update employer stats
    await db.employer_profiles.update_one(
        {"user_id": current_user['id']},
        {"$inc": {"total_jobs_posted": 1}}
    )
    
    # Trigger matching algorithm
    await match_workers_to_job(job)
    
    return job

@api_router.get("/jobs")
async def get_jobs(status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if current_user['role'] == UserRole.EMPLOYER:
        query['employer_id'] = current_user['id']
    if status:
        query['status'] = status
    
    jobs = await db.jobs.find(query, {"_id": 0}).to_list(100)
    return jobs

@api_router.get("/jobs/{job_id}")
async def get_job(job_id: str, current_user: dict = Depends(get_current_user)):
    job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@api_router.get("/jobs/{job_id}/assignments")
async def get_job_assignments(job_id: str, current_user: dict = Depends(get_current_user)):
    """Get all workers assigned to a job"""
    assignments = await db.assignments.find({"job_id": job_id}, {"_id": 0}).to_list(100)
    
    result = []
    for assignment in assignments:
        worker_profile = await db.worker_profiles.find_one({"user_id": assignment['worker_id']}, {"_id": 0})
        user = await db.users.find_one({"id": assignment['worker_id']}, {"_id": 0, "password": 0})
        if worker_profile and user:
            result.append({
                "assignment": assignment,
                "worker": user,
                "profile": worker_profile
            })
    
    return result

# Assignment Routes
@api_router.put("/assignments/{assignment_id}")
async def update_assignment(assignment_id: str, update_data: AssignmentUpdate, current_user: dict = Depends(get_current_user)):
    assignment = await db.assignments.find_one({"id": assignment_id}, {"_id": 0})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Workers can accept/reject
    if current_user['role'] == UserRole.WORKER and assignment['worker_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_fields = {"status": update_data.status}
    
    if update_data.status == AssignmentStatus.ACCEPTED:
        update_fields['accepted_at'] = datetime.now(timezone.utc).isoformat()
        # Update job workers_assigned count
        await db.jobs.update_one(
            {"id": assignment['job_id']},
            {"$inc": {"workers_assigned": 1}}
        )
    elif update_data.status == AssignmentStatus.COMPLETED:
        update_fields['completed_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.assignments.update_one({"id": assignment_id}, {"$set": update_fields})
    
    return {"message": "Assignment updated", "status": update_data.status}

@api_router.post("/assignments/{assignment_id}/rate")
async def rate_assignment(assignment_id: str, rating_data: RatingCreate, current_user: dict = Depends(get_current_user)):
    assignment = await db.assignments.find_one({"id": assignment_id}, {"_id": 0})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    job = await db.jobs.find_one({"id": assignment['job_id']}, {"_id": 0})
    
    # Employer rates worker
    if current_user['role'] == UserRole.EMPLOYER and job['employer_id'] == current_user['id']:
        await db.assignments.update_one(
            {"id": assignment_id},
            {"$set": {"worker_rating": rating_data.rating}}
        )
        # Update worker rating
        worker_profile = await db.worker_profiles.find_one({"user_id": assignment['worker_id']}, {"_id": 0})
        if worker_profile:
            total_jobs = worker_profile['total_jobs'] + 1
            new_rating = ((worker_profile['rating'] * worker_profile['total_jobs']) + rating_data.rating) / total_jobs
            await db.worker_profiles.update_one(
                {"user_id": assignment['worker_id']},
                {"$set": {"rating": new_rating, "total_jobs": total_jobs}}
            )
    
    # Worker rates employer
    elif current_user['role'] == UserRole.WORKER and assignment['worker_id'] == current_user['id']:
        await db.assignments.update_one(
            {"id": assignment_id},
            {"$set": {"employer_rating": rating_data.rating}}
        )
        # Update employer rating
        employer_profile = await db.employer_profiles.find_one({"user_id": job['employer_id']}, {"_id": 0})
        if employer_profile:
            total_jobs = employer_profile.get('total_jobs_posted', 1)
            current_rating = employer_profile.get('rating', 0)
            new_rating = ((current_rating * (total_jobs - 1)) + rating_data.rating) / total_jobs
            await db.employer_profiles.update_one(
                {"user_id": job['employer_id']},
                {"$set": {"rating": new_rating}}
            )
    else:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return {"message": "Rating submitted successfully"}

# Admin Routes
@api_router.get("/admin/workers")
async def get_all_workers(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    workers = await db.users.find({"role": UserRole.WORKER}, {"_id": 0, "password": 0}).to_list(1000)
    
    result = []
    for worker in workers:
        profile = await db.worker_profiles.find_one({"user_id": worker['id']}, {"_id": 0})
        result.append({"user": worker, "profile": profile})
    
    return result

@api_router.post("/admin/assign-job")
async def admin_assign_job(job_id: str, worker_id: str, current_user: dict = Depends(get_current_user)):
    """Admin manually assigns job to no-phone worker"""
    if current_user['role'] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    worker = await db.users.find_one({"id": worker_id}, {"_id": 0})
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    
    assignment = Assignment(
        job_id=job_id,
        worker_id=worker_id,
        status=AssignmentStatus.ACCEPTED,
        notification_sent=True,
        notification_type="admin",
        accepted_at=datetime.now(timezone.utc)
    )
    
    doc = assignment.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['accepted_at'] = doc['accepted_at'].isoformat()
    await db.assignments.insert_one(doc)
    
    await db.jobs.update_one({"id": job_id}, {"$inc": {"workers_assigned": 1}})
    
    return {"message": "Job assigned successfully", "assignment": assignment}

@api_router.get("/admin/dashboard")
async def get_admin_dashboard(current_user: dict = Depends(get_current_user)):
    """Get dashboard stats for admin"""
    if current_user['role'] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    total_workers = await db.users.count_documents({"role": UserRole.WORKER})
    total_employers = await db.users.count_documents({"role": UserRole.EMPLOYER})
    total_jobs = await db.jobs.count_documents({})
    active_jobs = await db.jobs.count_documents({"status": JobStatus.OPEN})
    
    # Workers by phone type
    smartphone_workers = await db.users.count_documents({"role": UserRole.WORKER, "phone_type": PhoneType.SMARTPHONE})
    feature_workers = await db.users.count_documents({"role": UserRole.WORKER, "phone_type": PhoneType.FEATURE})
    no_phone_workers = await db.users.count_documents({"role": UserRole.WORKER, "phone_type": PhoneType.NONE})
    
    return {
        "total_workers": total_workers,
        "total_employers": total_employers,
        "total_jobs": total_jobs,
        "active_jobs": active_jobs,
        "workers_by_type": {
            "smartphone": smartphone_workers,
            "feature": feature_workers,
            "no_phone": no_phone_workers
        }
    }

# Matching Algorithm
async def match_workers_to_job(job: Job):
    """Smart matching algorithm that considers skills, availability, and fair rotation"""
    
    # Find available workers with matching skills
    worker_profiles = await db.worker_profiles.find(
        {
            "available": True,
            "skills": job.skill_required,
            "location": job.location
        },
        {"_id": 0}
    ).to_list(1000)
    
    # Sort by rating and total_jobs (fair rotation - workers with fewer jobs get priority)
    sorted_workers = sorted(
        worker_profiles,
        key=lambda w: (w['total_jobs'], -w['rating'])  # Fewer jobs first, then by rating
    )
    
    # Create assignments for matched workers
    for worker_profile in sorted_workers[:job.workers_needed]:
        user = await db.users.find_one({"id": worker_profile['user_id']}, {"_id": 0})
        
        # Determine notification type based on phone type
        notification_type = "app"
        if user['phone_type'] == PhoneType.FEATURE:
            notification_type = "sms"
        elif user['phone_type'] == PhoneType.NONE:
            notification_type = "admin"
        
        # Create assignment
        assignment = Assignment(
            job_id=job.id,
            worker_id=worker_profile['user_id'],
            notification_type=notification_type
        )
        
        doc = assignment.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.assignments.insert_one(doc)
        
        # Send notification
        if notification_type != "admin":
            await send_notification(user, job.model_dump(), notification_type)
        
        assignment.notification_sent = True
        await db.assignments.update_one({"id": assignment.id}, {"$set": {"notification_sent": True}})

# Notifications
@api_router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find(
        {"worker_id": current_user['id']},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return notifications

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    await db.notifications.update_one(
        {"id": notification_id, "worker_id": current_user['id']},
        {"$set": {"read": True}}
    )
    return {"message": "Notification marked as read"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()