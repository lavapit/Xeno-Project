# Velara CRM

AI-Native Mini CRM built for the Xeno Engineering Internship Assignment.

Velara CRM helps marketers identify customer segments, generate personalized campaign content, launch campaigns, and track campaign performance through a realistic asynchronous messaging workflow.

---

## Demo Overview

The product is designed around a simple marketer workflow:

1. Manage customer data
2. Create audience segments using AI
3. Generate campaign content using AI
4. Launch campaigns
5. Track delivery and engagement metrics
6. Receive AI-generated campaign insights

---

## Features

### Customer Management

* Browse customer records
* Search customers
* View spend, order count, activity history, and preferred channel

### AI-Powered Segmentation

Marketers can describe audiences in plain English.

Example:

> Customers who spent more than 2000 rupees but haven't purchased in the last 60 days

Claude converts this into structured filtering rules that directly drive database queries.

### AI Campaign Drafting

Generate campaign messages automatically based on audience characteristics.

### Campaign Delivery Tracking

Track message lifecycle events:

* Pending
* Delivered
* Opened
* Clicked
* Read
* Failed

### AI Insights

Campaign performance is summarized in natural language using Claude.

---

## Architecture

The system consists of two independent services.

### CRM Service

Responsible for:

* Customer management
* Segment management
* Campaign creation
* AI integrations
* Analytics

### Channel Service

Responsible for:

* Simulating message delivery
* Generating realistic delivery outcomes
* Sending asynchronous callbacks

The CRM never waits for delivery results synchronously.

Instead:

1. CRM sends messages to Channel Service
2. Channel Service immediately acknowledges
3. Channel Service processes asynchronously
4. Callback webhook updates message status

This mirrors real-world messaging platforms such as Twilio and Gupshup.

---

## Tech Stack

| Layer           | Technology              |
| --------------- | ----------------------- |
| Frontend        | Next.js 14 (App Router) |
| Backend         | Next.js API Routes      |
| Channel Service | Node.js + Express       |
| Database        | PostgreSQL              |
| ORM             | Prisma                  |
| AI              | Anthropic Claude        |
| Styling         | Tailwind CSS            |
| Deployment      | Railway                 |

---

## Database Model

Core entities:

* Customer
* Order
* Segment
* Campaign
* Message

The Message table stores one record per campaign recipient, allowing individual status tracking.

---

## AI Features

### AI Segmentation

Natural language → Structured Filter JSON → Prisma Query

### AI Campaign Drafting

Audience Context → Claude → Personalized Campaign Message

### AI Insights

Campaign Metrics → Claude → Human-readable Recommendations

---

## Message Delivery Simulation

The Channel Service generates weighted outcomes:

| Status    | Weight |
| --------- | ------ |
| Delivered | 40%    |
| Opened    | 25%    |
| Clicked   | 15%    |
| Read      | 10%    |
| Failed    | 10%    |

To simulate realistic event ordering:

* Delivered occurs before Opened
* Delivered occurs before Clicked
* Random delay of 1–6 seconds before callbacks

---

## Local Setup

### Clone Repository

```bash
git clone <repository-url>
cd velara-crm
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file:

```env
DATABASE_URL=
ANTHROPIC_API_KEY=
CHANNEL_SERVICE_URL=
CRM_CALLBACK_URL=
```

### Prisma

```bash
npx prisma generate
npx prisma migrate dev
```

### Seed Database

```bash
npm run seed
```

### Start CRM

```bash
npm run dev
```

### Start Channel Service

```bash
cd channel-service
npm install
npm start
```

---

## Design Decisions

### Why Separate Channel Service?

A dedicated service better represents real-world messaging providers where delivery status arrives asynchronously through callbacks rather than immediate API responses.

### Why Next.js API Routes?

Keeps frontend and backend in a single repository, reducing complexity and improving development speed.

### Why No Authentication?

Authentication was intentionally excluded to focus on the core assignment requirements and demonstrate depth in campaign management and AI workflows.

---

## Future Improvements

* Authentication & Role Management
* Scheduled Campaigns
* Drip Campaign Workflows
* Queue-based Callback Processing
* Advanced Analytics Dashboard
* Multi-channel Campaign Automation

---

## Author

Ayush Pathak

Built as part of the Xeno Engineering Internship Assignment.
