# Workings – Documentation Index

This folder contains all project documentation, organized by purpose. Use this index to find what you need quickly.

---

## Quick links (top level)

| Document | Audience | Description |
|----------|----------|-------------|
| [RECENT_UPDATES_SUMMARY.md](RECENT_UPDATES_SUMMARY.md) | Stakeholders, non-technical | Plain-language summary of the last 30 days of updates |
| [README.md](README.md) | Everyone | This index |

---

## 1. Progress & status

*Reports, milestones, and current state.*

| Document | Description |
|----------|-------------|
| [progress/EXECUTIVE_SUMMARY.md](progress/EXECUTIVE_SUMMARY.md) | High-level project overview and completion status |
| [progress/PROJECT_PROGRESS_REPORT.md](progress/PROJECT_PROGRESS_REPORT.md) | Full project progress report (features, tech stack) |
| [progress/DECEMBER_2024_PROGRESS_REPORT.md](progress/DECEMBER_2024_PROGRESS_REPORT.md) | December 2024 weekly development summary |
| [progress/CURRENT_STATUS_AND_NEXT_STEPS.md](progress/CURRENT_STATUS_AND_NEXT_STEPS.md) | Current state and next steps |
| [progress/PROJECT_REVIEW.md](progress/PROJECT_REVIEW.md) | Project review |
| [progress/PROJECT_MILESTONES.md](progress/PROJECT_MILESTONES.md) | Project milestones |
| [progress/CODEBASE_REVIEW_SUMMARY.md](progress/CODEBASE_REVIEW_SUMMARY.md) | Codebase review summary |
| [progress/RESTRUCTURING_COMPLETE.md](progress/RESTRUCTURING_COMPLETE.md) | Restructuring completion notes |
| [progress/AI_REMOVAL_SUMMARY.md](progress/AI_REMOVAL_SUMMARY.md) | AI removal summary |

---

## 2. Backend & API

*Backend integration instructions, API responses, and fixes for the server side.*

| Document | Description |
|----------|-------------|
| [backend/MATERIAL_AND_GLAZING_ELEMENTS_API_RESPONSE.md](backend/MATERIAL_AND_GLAZING_ELEMENTS_API_RESPONSE.md) | Material and glazing elements API response format |
| [backend/TEMPLATES_MODULE_BACKEND_RESPONSE.md](backend/TEMPLATES_MODULE_BACKEND_RESPONSE.md) | Templates module API response |
| [backend/TEMPLATES_MODULE_BACKEND_FINAL_INTEGRATION.md](backend/TEMPLATES_MODULE_BACKEND_FINAL_INTEGRATION.md) | Final templates module backend integration |
| [backend/BACKEND_EXPORT_SETTINGS_AND_SAVED_TEMPLATES.md](backend/BACKEND_EXPORT_SETTINGS_AND_SAVED_TEMPLATES.md) | Export settings and saved templates (backend) |
| [backend/PREBUILT_TEMPLATES_BACKEND_API_INSTRUCTIONS.md](backend/PREBUILT_TEMPLATES_BACKEND_API_INSTRUCTIONS.md) | Pre-built templates API instructions |
| [backend/PREBUILT_TEMPLATES_BACKEND_INTEGRATION.md](backend/PREBUILT_TEMPLATES_BACKEND_INTEGRATION.md) | Pre-built templates backend integration guide |
| [backend/BACKEND_QUOTE_PROJECTID_VALIDATION_FIX.md](backend/BACKEND_QUOTE_PROJECTID_VALIDATION_FIX.md) | Quote/project ID validation fix for backend |
| [backend/BACKEND_COOKIE_FIX_INSTRUCTIONS.md](backend/BACKEND_COOKIE_FIX_INSTRUCTIONS.md) | Backend cookie fix instructions |

---

## 3. Frontend implementation

*How features are implemented on the frontend: validation, payment, session, templates.*

| Document | Description |
|----------|-------------|
| [frontend/FRONTEND_ZOD_VALIDATION_ERROR_LIST.md](frontend/FRONTEND_ZOD_VALIDATION_ERROR_LIST.md) | Zod validation errors – reference for showing user-friendly messages |
| [frontend/FRONTEND-PAYMENT-SUBSCRIPTION-INTEGRATION.md](frontend/FRONTEND-PAYMENT-SUBSCRIPTION-INTEGRATION.md) | Payment and subscription integration (frontend) |
| [frontend/SESSION_EXPIRATION_IMPLEMENTATION.md](frontend/SESSION_EXPIRATION_IMPLEMENTATION.md) | Session expiration implementation |
| [frontend/PREBUILT_TEMPLATES_IMPLEMENTATION_PLAN.md](frontend/PREBUILT_TEMPLATES_IMPLEMENTATION_PLAN.md) | Pre-built templates implementation plan |
| [frontend/STATE_MANAGEMENT_IMPLEMENTATION.md](frontend/STATE_MANAGEMENT_IMPLEMENTATION.md) | State management implementation |

---

## 4. Features & product

*Feature specs, calculation modules, subscription behaviour.*

| Document | Description |
|----------|-------------|
| [features/CALCULATION-MODULES-PARAMETERS.md](features/CALCULATION-MODULES-PARAMETERS.md) | Calculation modules and parameters |
| [features/SUBSCRIPTION_MANUAL_VERIFY_FALLBACK.md](features/SUBSCRIPTION_MANUAL_VERIFY_FALLBACK.md) | Subscription manual verification fallback |

---

## 5. Troubleshooting & fixes

*Bug analyses, incident-style docs, and fix documentation.*

| Document | Description |
|----------|-------------|
| [troubleshooting/DUPLICATE_PROJECT_ANALYSIS.md](troubleshooting/DUPLICATE_PROJECT_ANALYSIS.md) | Duplicate project creation – analysis |
| [troubleshooting/DUPLICATE_PROJECT_FIX_IMPLEMENTED.md](troubleshooting/DUPLICATE_PROJECT_FIX_IMPLEMENTED.md) | Duplicate project fix – implemented |
| [troubleshooting/DUPLICATE_PROJECT_FIX.md](troubleshooting/DUPLICATE_PROJECT_FIX.md) | Duplicate project fix – overview |
| [troubleshooting/DUPLICATE_REQUESTS_ANALYSIS.md](troubleshooting/DUPLICATE_REQUESTS_ANALYSIS.md) | Duplicate requests analysis |
| [troubleshooting/COOKIE_ISSUE_ANALYSIS.md](troubleshooting/COOKIE_ISSUE_ANALYSIS.md) | Cookie issue analysis |
| [troubleshooting/AUTHENTICATION_ISSUE_ANALYSIS.md](troubleshooting/AUTHENTICATION_ISSUE_ANALYSIS.md) | Authentication issue analysis |
| [troubleshooting/CORS_FIX_DOCUMENTATION.md](troubleshooting/CORS_FIX_DOCUMENTATION.md) | CORS fix documentation |

---

## 6. Architecture & system design

*Architecture, logging, and high-level design.*

| Document | Description |
|----------|-------------|
| [architecture/WORKINGS-ARCHITECTURE-PLAN.md](architecture/WORKINGS-ARCHITECTURE-PLAN.md) | Full architecture and implementation plan |
| [architecture/LOGGING_SYSTEM_DOCUMENTATION.md](architecture/LOGGING_SYSTEM_DOCUMENTATION.md) | Logging system documentation |

---

## Folder layout (summary)

```
docs/
├── README.md                    ← You are here (index)
├── RECENT_UPDATES_SUMMARY.md    ← Stakeholder-friendly recent updates
├── progress/                    ← Progress reports & status
├── backend/                     ← Backend API & integration
├── frontend/                    ← Frontend implementation
├── features/                    ← Feature specs
├── troubleshooting/             ← Bug analyses & fixes
└── architecture/                ← Architecture & logging
```

---

*Last updated: February 2025*
