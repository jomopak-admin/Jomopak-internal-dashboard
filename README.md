# JomoPak Production Dashboard MVP

A simple starter dashboard for JomoPak to digitise:
- job cards
- waste records
- paper usage logs
- basic monthly reporting
- simple FSC-related flags for future expansion

## What this version does

This is a clean phase 1 internal MVP. It is intentionally simple.

It helps you stop losing manual records by storing them digitally in the browser using localStorage.

### Included modules
- Dashboard
- Job Cards
- Waste Log
- Paper Log
- Reports

### Included features
- Auto-generated job numbers, waste numbers, and paper log numbers
- Monthly average waste per job
- FSC-related yes/no tag for future build-out
- Job to waste linking
- Job to paper usage linking
- Simple report table by job

## What this version does not do yet
- Supabase or PostgreSQL backend
- multi-user login
- live sync across devices
- invoice integration
- full FSC reconciliation engine
- AI document reading
- supplier auto-fill

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Suggested next phase
1. Move data from localStorage to Supabase or PostgreSQL
2. Add user roles
3. Add document uploads
4. Add invoice and dispatch linking
5. Add proper FSC claim types like FSC Mix and FSC Recycled
6. Add monthly FSC reconciliation
7. Add AI later for supplier document extraction and FSC support

## Notes for Codex or developer handoff
This project is meant to be the starter shell only. The structure is intentionally simple so it can be extended into a real internal production platform.
