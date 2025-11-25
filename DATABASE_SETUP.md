# PostgreSQL Database Setup

## Installation Complete

| Component | Status |
|-----------|--------|
| PostgreSQL 17 | ✓ Installed |
| Service | ✓ Running (auto-starts on login) |
| Database | ✓ Created (`project_web`) |
| Schema | ✓ Initialized with 8 tables |

## Database Details

- **Database name**: `project_web`
- **Tables**: users, projects, project_members, tasks, gantt_timeline, monthly_financials, monthly_hours, project_reports
- **Views**: 3 views for project summaries, gantt charts, and financial reports
- **Sample data**: Pre-loaded with test users and project data

## Connection Info

```
Host: localhost
Port: 5432 (default)
Database: project_web
User: chunwencheng (your system user)
```

## Useful Commands

### Connect to database

```bash
/opt/homebrew/opt/postgresql@17/bin/psql -d project_web
```

### Add PostgreSQL to PATH (recommended)

```bash
echo 'export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
psql -d project_web
```

### Service management

```bash
brew services stop postgresql@17
brew services start postgresql@17
brew services restart postgresql@17
```
