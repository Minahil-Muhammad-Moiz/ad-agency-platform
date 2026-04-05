@echo off
echo ========================================
echo   Ad Agency Platform - Setup Script
echo ========================================
echo.

echo 📦 Installing Backend Dependencies...
cd backend
call npm install
echo ✅ Backend installed
cd ..

echo 📦 Installing AI Service Dependencies...
cd ai-service
call npm install
echo ✅ AI Service installed
cd ..

echo 📦 Installing Frontend Dependencies...
cd frontend
call npm install
echo ✅ Frontend installed
cd ..

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Copy .env.example to .env in each folder
echo 2. Update database password in backend/.env
echo 3. Add your Groq API key in ai-service/.env
echo 4. Run: cd backend ^&^& npm run dev
echo 5. Run: cd ai-service ^&^& npm run dev
echo 6. Run: cd frontend ^&^& npm run dev
echo.
pause