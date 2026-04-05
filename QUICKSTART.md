# 🚀 Quick Start Guide

## 5 Minutes to Running the Application

### Windows Users

1. **Install PostgreSQL**
   - Download from https://www.postgresql.org/download/windows/
   - Remember your password during installation

2. **Setup Database**
   ```bash
   # Open Command Prompt as Administrator
   cd "C:\Program Files\PostgreSQL\16\bin"
   psql -U postgres -f "C:\path\to\ad-agency-platform\database-setup.sql"