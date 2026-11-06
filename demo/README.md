# RegVault — Regulatory Compliance Platform

A production-quality Regulatory Compliance & Reporting Platform demo built with Vite + React + TypeScript.

## Features

- **Risk Dashboard**: 5×5 risk heat map, KPI tiles, control effectiveness trends, upcoming deadline tracker
- **Obligation Registry**: Full table of 8 regulations across US/EU/UK with filter, sort, detail drawer, and 3-month calendar heatmap
- **Control Workbench**: 42 controls with test runner modal, deficiency tracker with escalation and remediation workflows
- **Report Filing**: 12-filing queue with 5-step filing package (data collection → validation → preview → approval chain → submit)

## Tech Stack

- Vite 5 + React 18 + TypeScript 5
- Tailwind CSS 3 with custom design tokens
- React Router v6
- Recharts for data visualization
- Lucide React icons
- Sonner for toast notifications
- date-fns for date utilities

## Getting Started

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy to Vercel

```bash
vercel deploy
```

The `vercel.json` includes SPA rewrites for client-side routing.

## Design System

Dark theme with deep navy backgrounds:
- Background: `#0C0F1A`
- Surfaces: `#141924` / `#1E2535`
- Purple accent: `#8B5CF6`
- Typography: Inter + JetBrains Mono
