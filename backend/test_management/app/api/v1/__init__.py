"""
API v1 Router
"""

from fastapi import APIRouter

from app.api.v1.endpoints import projects, testcases, testplans

api_router = APIRouter()

# Include sub-routers
api_router.include_router(
    projects.router,
    prefix="/projects",
    tags=["projects"]
)

api_router.include_router(
    testcases.router,
    prefix="/testcases",
    tags=["testcases"]
)

api_router.include_router(
    testplans.router,
    prefix="/testplans",
    tags=["testplans"]
)
