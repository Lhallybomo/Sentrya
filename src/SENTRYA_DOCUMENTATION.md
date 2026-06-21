# SENTRYA — Full Application Documentation
> Last updated: June 2026

---

## Table of Contents
1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Database Entities](#database-entities)
4. [Pages & Routes](#pages--routes)
5. [User Flows](#user-flows)
6. [Component Architecture](#component-architecture)
7. [Safety & Notification System](#safety--notification-system)
8. [Recent Changes (Changelog)](#recent-changes-changelog)

---

## Overview

**SENTRYA** is a hybrid personal safety + ride-hailing platform built for Nigeria. It combines:
- **Real-time incident & alert monitoring** across all 36 states
- **App-booked and street-hail ("Along") ride-hailing** with driver dispatch
- **Sentrya Safety Suite** — Guardian Mode timers, Emergency Profiles, SOS alerts, and emergency contact notifications
- **AI-powered travel advisor** for inter-city safety checks and route comparisons
- **Driver management** with leaderboards, ratings, and earnings tracking

The app is mobile-first, React + Tailwind, with Base44 backend-as-a-service.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TailwindCSS |
| Routing | React Router DOM v6 |
| State | React Query (TanStack), useState/useEffect |
| Animations | Framer Motion |
| Maps | React Leaflet (OpenStreetMap) |
| Geocoding | Nominatim (OpenStreetMap API) |
| AI/LLM | Base44 Core → InvokeLLM |
| Email | Base44 Core → SendEmail |
| Real-time | Base44 WebSocket entity subscriptions |
| Auth | Base44 Auth (built-in) |
| Storage | Base44 entities DB + localStorage cache |

---

## Database Entities

### 1. `Ride`
Core trip record for both booking modes.

| Field | Type | Notes |
|---|---|---|
| `passenger_email` | string | Required |
| `driver_email` | string | Assigned on accept |
| `pickup_location` | string | Text address |
| `pickup_lat` / `pickup_lng` | number | Coordinates |
| `destination_location` | string | Text address |
| `dest_lat` / `dest_lng` | number | Coordinates |
| `city` | enum | Lagos, Abuja, Port Harcourt |
| `status` | enum | `pending` → `dispatching` → `accepted` → `in_progress` → `completed` / `cancelled` |
| `ride_mode` | enum | `app_booking` or `along` |
| `fare_estimate` | number | In Naira (₦) |
| `ride_type` | enum | `economy`, `comfort`, `premium` |
| `scheduled_time` | string | ISO datetime for future bookings |
| `driver_lat` / `driver_lng` | number | Live GPS from driver device |
| `driver_name` | string | Snapshot on accept |
| `driver_phone` | string | Snapshot on accept |
| `vehicle_info` | string | e.g. "Toyota Corolla - White - ABC123XY" |
| `declined_drivers` | string | Comma-separated emails |

---

### 2. `Driver`
Driver profile and vehicle registration.

| Field | Type | Notes |
|---|---|---|
| `full_name` | string | Required |
| `email` | string | Must match User email |
| `phone` | string | |
| `city` | enum | Lagos, Abuja, Port Harcourt, Kano, Ibadan, Enugu, Kaduna, Other |
| `vehicle_make` / `vehicle_model` | string | e.g. Toyota Corolla |
| `vehicle_color` | string | |
| `plate_number` | string | Required |
| `vehicle_type` | enum | `economy`, `comfort`, `premium` |
| `status` | enum | `pending` → `approved` / `suspended` |
| `rating` | number | Auto-computed from TripReviews (1–5) |
| `total_trips` | number | Incremented on trip completion |
| `is_online` | boolean | Toggle from DriverDashboard |

---

### 3. `RideOffer`
Fare negotiation (Along mode) between passenger and driver.

| Field | Type | Notes |
|---|---|---|
| `ride_id` | string | FK to Ride |
| `driver_email` | string | |
| `offered_price` | number | Driver's initial offer |
| `counter_price` | number | Passenger's counter |
| `status` | enum | `pending`, `countered`, `accepted`, `rejected` |
| `message` | string | Optional driver message |

---

### 4. `Incident`
Community-reported safety incident (crowd-sourced).

| Field | Type | Notes |
|---|---|---|
| `type` | enum | Accident, Traffic, Bad Road, Security Threat, Kidnapping, Robbery, Protest, Flooding, Fire, Other |
| `description` | string | |
| `latitude` / `longitude` | number | |
| `location_name` | string | Human-readable |
| `state` | string | Nigerian state |
| `severity` | enum | `safe`, `caution`, `danger` |
| `photo_url` | string | Optional image |
| `status` | enum | `active`, `resolved`, `expired` |
| `upvotes` | number | Community confirmations |

---

### 5. `Alert`
Admin/system-generated security or travel alerts.

| Field | Type | Notes |
|---|---|---|
| `title` | string | |
| `description` | string | |
| `type` | enum | incident, traffic, travel_warning, security, weather, general |
| `state` / `city` | string | Geographic scope |
| `severity` | enum | `safe`, `caution`, `danger` |
| `status` | enum | `active`, `resolved` |

---

### 6. `EmergencyContact`
User's personal emergency contact list.

| Field | Type | Notes |
|---|---|---|
| `contact_name` | string | Required |
| `phone` | string | Required |
| `email` | string | Used for automated email alerts |
| `relationship` | string | e.g. Spouse, Parent |
| `owner_email` | string | FK to User |

---

### 7. `EmergencyProfile`
Medical and next-of-kin information for SOS situations.

| Field | Type | Notes |
|---|---|---|
| `owner_email` | string | FK to User |
| `blood_group` | enum | A+, A-, B+, B-, AB+, AB-, O+, O-, Unknown |
| `allergies` | string | |
| `medical_conditions` | string | |
| `medications` | string | |
| `next_of_kin_name` | string | |
| `next_of_kin_phone` | string | |
| `next_of_kin_relationship` | string | |
| `doctor_name` | string | |
| `doctor_phone` | string | |

---

### 8. `GuardianTimer`
Time-bounded safety check-in. Triggers alerts if user misses expected arrival.

| Field | Type | Notes |
|---|---|---|
| `owner_email` | string | FK to User |
| `destination` | string | Where they're going |
| `expected_arrival` | string | ISO datetime |
| `duration_minutes` | number | Timer length |
| `status` | enum | `active`, `arrived`, `missed`, `cancelled` |
| `last_location_lat` / `last_location_lng` | number | GPS on timer start |
| `reminder_sent` | boolean | 5-min pre-alert sent |
| `alert_sent` | boolean | Missed-arrival alert sent |

---

### 9. `TripReview`
Post-trip passenger rating of a driver.

| Field | Type | Notes |
|---|---|---|
| `ride_id` | string | FK to Ride |
| `passenger_email` | string | |
| `driver_email` | string | |
| `rating` | number | 1–5 stars |
| `comment` | string | Optional |

> When a review is submitted, the system fetches all reviews for the driver and recomputes their average rating, then saves it to the `Driver` entity.

---

### 10. `Hotel`
Safety-rated accommodation listings.

| Field | Type | Notes |
|---|---|---|
| `name` | string | |
| `state` / `city` | string | |
| `address` | string | |
| `latitude` / `longitude` | number | |
| `price_range` | enum | budget, mid-range, luxury |
| `price_min` / `price_max` | number | Per night in ₦ |
| `safety_rating` | enum | safe, caution, danger |
| `rating` | number | 1–5 overall |
| `amenities` | string | Comma-separated |

---

## Pages & Routes

| Route | Page | Auth Required | Description |
|---|---|---|---|
| `/` | `Home` | No | Dashboard: incidents map, alerts, rides summary |
| `/incidents` | `Incidents` | No | Browse & upvote crowd-sourced incidents |
| `/incidents/report` | `ReportIncident` | Yes | Submit a new incident |
| `/alerts` | `Alerts` | No | Security & travel alerts with AI generation |
| `/rides` | `Rides` | No | Book app or Along ride |
| `/travel` | `Travel` | No | AI-powered inter-city travel advisor |
| `/hotels` | `Hotels` | No | Browse safety-rated hotels |
| `/safety-check` | `SafetyCheck` | No | AI route safety assessment |
| `/emergency-contacts` | `EmergencyContacts` | Yes | Manage emergency contacts |
| `/guardian-mode` | `GuardianMode` | Yes | Smart safety timer with auto-alerts |
| `/emergency-profile` | `EmergencyProfile` | Yes | Medical info & next of kin |
| `/trip-history` | `TripHistory` | Yes | Past rides, stats, rebook, rate |
| `/emergency-dashboard` | `EmergencyDashboard` | No | Real-time incidents + alerts view |
| `/drivers-leaderboard` | `DriversLeaderboard` | No | Top drivers by rating × trips |
| `/driver-signup` | `DriverSignup` | Yes | Register as a new driver |
| `/driver-dashboard` | `DriverDashboard` | Yes | Driver ride requests, Along, earnings |
| `/profile` | `UserProfile` | Yes | Account, safety features, ride history |

---

## User Flows

### A. Passenger Booking Flow (App Booking)

```
1. Open /rides
2. Select city, enter pickup & destination (LocationSearch with Nominatim autocomplete)
3. Choose ride type (Economy / Comfort / Premium)
4. Tap "Book Ride"
   → Ride created with status = "dispatching"
5. DispatchPanel polls for accepted ride
   → Drivers see request in DriverDashboard → Accept
   → Ride status → "accepted", driver details attached
6. PaymentModal shown to passenger (confirm fare)
7. After payment confirmation → phase = "active"
8. ActiveTripView shows live driver GPS, trip timer
   → Email sent to emergency contacts: "trip started"
9. Driver taps "Complete Trip" → Ride status → "completed"
   → Email sent to contacts: "arrived safely"
10. TripReviewModal appears → Passenger rates 1–5 stars
11. Driver average rating recomputed and saved
```

### B. Along (Street-Hail) Flow — Passenger

```
1. /rides → select "Along" tab
2. AlongMode component: passenger searches for drivers nearby
3. Driver makes RideOffer with price
4. Passenger accepts/counters offer → NegotiationPanel
5. Once accepted → Ride created, status = "in_progress"
6. ActiveTripView activated
```

### C. Along Flow — Driver

```
1. /driver-dashboard → Along tab
2. Driver enters passenger destination
3. Tap "Start Along Trip"
   → Ride created: pickup = "Street Hail", status = "in_progress"
4. GPS tracking starts
5. Driver taps "Complete" in ActiveTripView
```

### D. Guardian Mode Flow

```
1. /guardian-mode
2. Tap "New Timer"
3. Enter destination + duration (15m, 30m, 45m, 1h, 1.5h, 2h or custom)
4. Tap "Start Guardian Timer"
   → GuardianTimer created with expected_arrival computed
   → Current GPS coordinates saved to timer
   → Email sent to all contacts: "X started a trip to Y"
5. Timer polls every 60 seconds:
   - If 5 min before arrival: reminder flag set
   - If 5 min past arrival & not arrived: "missed" alert email sent to contacts with last GPS link
6. User taps "I Arrived Safely"
   → Timer status = "arrived"
   → Email to contacts: "X arrived safely"
```

### E. SOS Flow

```
1. User taps red SOS button (visible on Home, ActiveTripView, EmergencyDashboard)
2. SOSModal opens
3. User confirms trigger
4. Email sent to all emergency contacts with:
   - User identity
   - Emergency profile (blood group, medical info)
   - Last known GPS location (Google Maps link)
   - Nigeria emergency number: 112
```

### F. Driver Onboarding

```
1. /driver-signup → fill vehicle & personal details
2. Driver record created with status = "pending"
3. Admin approves in admin panel → status = "approved"
4. Driver logs into /driver-dashboard
5. Toggle online → start receiving ride requests
```

### G. Trip Review Flow

```
1. After ride completes, TripReviewModal auto-appears
2. Passenger selects 1–5 stars, optional comment
3. TripReview record created
4. All reviews for driver fetched → average computed
5. Driver.rating updated
```

---

## Component Architecture

### Shared Layout
```
Layout.jsx (wraps all main nav pages)
  ├── BottomNav (Home, Incidents, Rides, Travel, Profile)
  ├── TabNavigationTracker
  └── <Outlet /> (page content)
```

### Ride Components (`components/rides/`)
| Component | Purpose |
|---|---|
| `LocationSearch` | Nominatim autocomplete address input with GPS fallback |
| `DispatchPanel` | Polls ride status, shows waiting state, triggers accept |
| `ActiveTripView` | Live trip tracker with driver GPS, safety actions, completion |
| `AlongMode` | Along-mode passenger interface |
| `NegotiationPanel` | Fare negotiation between passenger and driver |
| `PaymentModal` | Fare confirmation before trip starts |
| `TripReviewModal` | 1-5 star post-trip rating with driver score update |

### Home Components (`components/home/`)
| Component | Purpose |
|---|---|
| `HeroSection` | Brand header, CTA buttons, danger counter |
| `IncidentsSection` | Active incidents preview list |
| `AlertsSection` | Active alerts preview |
| `RidesSection` | Recent rides quick-view |
| `TravelSection` | Quick travel check shortcut |
| `MapSection` | Leaflet map with incident markers |

### Safety Components (`components/sos/`)
| Component | Purpose |
|---|---|
| `SOSButton` | Floating red SOS trigger button |
| `SOSModal` | Confirms SOS, sends emails to contacts |

---

## Safety & Notification System

SENTRYA automatically sends **email notifications** to emergency contacts in three scenarios:

### 1. Ride Start (ActiveTripView)
- Triggered when: A ride enters `in_progress` or `accepted` and ActiveTripView mounts
- **Subject**: `🚗 SENTRYA: [Name] started a ride`
- **Content**: Pickup, destination, driver info, fare

### 2. Ride Complete (ActiveTripView)
- Triggered when: Ride status changes to `completed`
- **Subject**: `✅ SENTRYA: [Name] completed their ride`
- **Content**: Route summary, safe arrival confirmation

### 3. Guardian Mode — Timer Start (GuardianMode)
- **Subject**: `📍 SENTRYA: [Name] started a monitored trip`
- **Content**: Destination, expected arrival time

### 4. Guardian Mode — Arrived (GuardianMode)
- **Subject**: `✅ SENTRYA: [Name] arrived safely`
- **Content**: Destination confirmed

### 5. Guardian Mode — Missed Arrival (GuardianMode — auto)
- Triggered by 60-second polling if user is 5+ minutes overdue
- **Subject**: `⚠️ SENTRYA: [Name] missed their expected arrival`
- **Content**: Last GPS location (Google Maps link), emergency number 112

All emails are fire-and-forget (`.catch(() => {})`) to avoid blocking the UI.

---

## Recent Changes (Changelog)

### June 2026 — Sentrya Safety Suite v2.0

**New Pages**
- `/guardian-mode` — Smart safety timer with GPS, auto missed-arrival alerts
- `/emergency-profile` — Medical info (blood group, allergies, next of kin, doctor) stored per user
- `/trip-history` — Full ride history with stats (completed, total spent, cancelled), search, rebook & rate
- `/emergency-dashboard` — Real-time danger-first sorted view of all active incidents + alerts
- `/drivers-leaderboard` — Ranked drivers by composite score (rating × trips), podium display for top 3

**New Entities**
- `GuardianTimer` — Tracks active safety timers with GPS snapshot and alert flags
- `EmergencyProfile` — Stores medical and next-of-kin info per user
- `TripReview` — Post-trip 1–5 star rating with driver average auto-update

**Enhanced Components**
- `ActiveTripView` — Now auto-emails emergency contacts on ride start AND completion
- `TripReviewModal` — New component; auto-recomputes driver average rating on submit
- `HeroSection` — Replaced "Travel Options" CTA with "Guardian Mode" shortcut
- `DriverDashboard` — Added "Top Drivers" tab with link to leaderboard
- `Rides.jsx` — Supports URL params `?pickup=&dest=` for rebook pre-fill from TripHistory

**Bug Fixes**
- Removed unused `Plane` import from `HeroSection` after CTA replacement
- Fixed lazy import paths for `Rides` and `DriverDashboard` in `App.jsx`
- Removed invalid `compact` prop from `SOSButton` in `ActiveTripView`

---

## Emergency Numbers (Nigeria)
- **General Emergency**: 112
- **Police**: 199
- **Fire Service**: 01-7944079
- **Ambulance/NEMA**: 080-9111111