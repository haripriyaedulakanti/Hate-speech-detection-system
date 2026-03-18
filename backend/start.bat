@echo off
echo ============================================
echo  Hate Speech Detection System - Backend
echo ============================================

:: Check if virtual environment exists
IF NOT EXIST "venv\" (
    echo Creating virtual environment...
    python -m venv venv
)

:: Activate virtual environment
call venv\Scripts\activate

:: Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

:: Start the FastAPI server
echo.
echo Starting FastAPI server on http://localhost:8000
echo Press Ctrl+C to stop the server.
echo.
uvicorn main:app --reload --port 8000
