# FuseRemit - Backend Architecture & Technical Documentation

## 1. Executive Summary

**FuseRemit** is a modern fintech mobile application designed for international money remittance services. The platform enables users to send money across borders with competitive exchange rates, AI-powered insights, and robust security measures. This document outlines the backend architecture approach, API design principles, and technical specifications required to support the mobile application.

---

## 2. Application Overview

### 2.1 Core Business Functionality

| Feature | Description |
|---------|-------------|
| **International Money Transfer** | Cross-border remittance to multiple countries (e.g., Nigeria - NGN) |
| **FUSE Smart Remittance** | AI-optimized transfer routing for best rates and lowest fees |
| **Multi-Currency Support** | USD, NGN, and expandable currency support |
| **Real-Time Analytics** | Spending analytics, FUSE Smart Score, trend analysis |
| **Maya AI Assistant** | Intelligent financial insights and recommendations |

### 2.2 User Journey Modules

1. **Authentication & Onboarding**
   - User Registration (First Name, Last Name, Email, Password, DOB, Gender)
   - Phone Number Verification with OTP
   - PIN Creation (4-digit security PIN)
   - Device Management & Change Detection

2. **KYC (Know Your Customer) Verification**
   - Personal Information Collection
   - Background Information
   - Document Upload (Passport/ID Card)
   - Liveness Check (Biometric Verification)
   - Verification Progress Tracking

3. **Account Tiers**
   - **Classic Tier**: Standard transfer limits
   - **Premium Tier**: Enhanced limits and features

4. **Money Transfer Flow**
   - Recipient Management
   - Amount Entry with Real-Time FX Rates
   - Review & Confirmation
   - OTP/PIN Verification
   - Transaction Completion

---

## 3. Backend Architecture Approach

### 3.1 Recommended Architecture: Microservices

Given the fintech nature of FuseRemit, we recommend a **microservices architecture** for the following reasons:

- **Regulatory Compliance**: Isolated services for KYC, AML, and transaction processing
- **Scalability**: Independent scaling of high-traffic services (e.g., FX rates, transactions)
- **Security**: Service isolation minimizes blast radius of security incidents
- **Maintainability**: Easier updates to individual services without system-wide deployments

### 3.2 Core Microservices

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY                                      │
│                    (Authentication, Rate Limiting, Routing)                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
        ┌─────────────┬───────────────┼───────────────┬─────────────┐
        ▼             ▼               ▼               ▼             ▼
┌───────────┐ ┌───────────────┐ ┌───────────────┐ ┌─────────┐ ┌───────────┐
│   Auth    │ │    User       │ │  Transaction  │ │   KYC   │ │ Notification│
│  Service  │ │   Service     │ │   Service     │ │ Service │ │   Service  │
└───────────┘ └───────────────┘ └───────────────┘ └─────────┘ └───────────┘
        │             │               │               │             │
        └─────────────┴───────────────┼───────────────┴─────────────┘
                                      │
                          ┌───────────┴───────────┐
                          ▼                       ▼
                   ┌─────────────┐        ┌─────────────┐
                   │  FX Rate    │        │   Maya AI   │
                   │  Service    │        │   Service   │
                   └─────────────┘        └─────────────┘
```

### 3.3 Service Responsibilities

#### 3.3.1 Authentication Service
- **Responsibilities**: User login, registration, JWT token management, refresh tokens
- **Features**:
  - Phone number + password authentication
  - OTP generation and validation
  - PIN management (creation, validation, change)
  - Device fingerprinting and change detection
  - Session management
- **Security**: bcrypt for password hashing, RS256 for JWT signing

#### 3.3.2 User Service
- **Responsibilities**: User profile management, preferences, account tiers
- **Features**:
  - Profile CRUD operations
  - Account tier management (Classic/Premium)
  - Security settings (2FA, biometric preferences)
  - Security questions management
- **Data**: User profiles, preferences, settings

#### 3.3.3 KYC Service
- **Responsibilities**: Identity verification, document processing, compliance
- **Features**:
  - Personal information collection
  - Background information (occupation, income source)
  - Document upload and OCR processing
  - Liveness detection integration
  - Verification status tracking
  - Compliance reporting
- **Integrations**: Third-party KYC providers (Jumio, Onfido, etc.)

#### 3.3.4 Transaction Service
- **Responsibilities**: Money transfers, transaction history, status tracking
- **Features**:
  - Initiate transfers
  - Transaction status updates
  - Fee calculation
  - ETA estimation
  - Transaction history and details
  - Recipient management
- **Integrations**: Payment rails (SWIFT, local payment networks)

#### 3.3.5 FX Rate Service
- **Responsibilities**: Exchange rates, currency conversion
- **Features**:
  - Real-time FX rate fetching
  - Rate caching and updates
  - Historical rates for analytics
  - FUSE optimization algorithm (best rate selection)
- **Integrations**: FX providers (XE, Open Exchange Rates, etc.)

#### 3.3.6 Notification Service
- **Responsibilities**: Push notifications, SMS, email
- **Features**:
  - OTP delivery (SMS)
  - Transaction alerts
  - Marketing communications (opt-in)
  - In-app notifications (Alerts screen)
- **Integrations**: Twilio, SendGrid, Firebase Cloud Messaging

#### 3.3.7 Maya AI Service
- **Responsibilities**: AI-powered insights and recommendations
- **Features**:
  - Financial pattern analysis
  - Fee optimization suggestions
  - Suspicious activity detection
  - Personalized insights
  - FUSE Smart Score calculation
- **Technology**: ML models, analytics engine

---

## 4. API Design Specifications

### 4.1 API Standards

| Aspect | Standard |
|--------|----------|
| **Protocol** | REST over HTTPS (TLS 1.3) |
| **Authentication** | JWT Bearer Tokens |
| **Versioning** | URL path versioning (`/api/v1/`) |
| **Format** | JSON request/response |
| **Error Handling** | RFC 7807 Problem Details |

### 4.2 Core API Endpoints

#### Authentication APIs

```
POST   /api/v1/auth/register          # User registration
POST   /api/v1/auth/login             # User login
POST   /api/v1/auth/logout            # User logout
POST   /api/v1/auth/refresh           # Refresh access token
POST   /api/v1/auth/otp/send          # Send OTP
POST   /api/v1/auth/otp/verify        # Verify OTP
POST   /api/v1/auth/pin/create        # Create PIN
POST   /api/v1/auth/pin/verify        # Verify PIN
POST   /api/v1/auth/pin/change        # Change PIN
POST   /api/v1/auth/device/register   # Register new device
POST   /api/v1/auth/device/change     # Change device flow
POST   /api/v1/auth/password/change   # Change password
POST   /api/v1/auth/password/reset    # Reset password
```

#### User APIs

```
GET    /api/v1/users/me               # Get current user profile
PUT    /api/v1/users/me               # Update user profile
GET    /api/v1/users/me/balance       # Get account balance
GET    /api/v1/users/me/tier          # Get account tier info
POST   /api/v1/users/me/tier/upgrade  # Request tier upgrade
GET    /api/v1/users/me/settings      # Get user settings
PUT    /api/v1/users/me/settings      # Update user settings
POST   /api/v1/users/me/2fa/enable    # Enable 2FA
POST   /api/v1/users/me/2fa/disable   # Disable 2FA
POST   /api/v1/users/me/biometric     # Configure biometric auth
GET    /api/v1/users/me/security-questions
POST   /api/v1/users/me/security-questions
```

#### KYC APIs

```
GET    /api/v1/kyc/status             # Get KYC verification status
POST   /api/v1/kyc/personal-info      # Submit personal information
POST   /api/v1/kyc/background-info    # Submit background information
POST   /api/v1/kyc/documents          # Upload identity documents
GET    /api/v1/kyc/documents/types    # Get supported document types
POST   /api/v1/kyc/liveness           # Initiate liveness check
POST   /api/v1/kyc/submit             # Submit KYC for review
GET    /api/v1/kyc/progress           # Get verification progress
```

#### Transaction APIs

```
GET    /api/v1/transactions           # List transactions (paginated)
GET    /api/v1/transactions/:id       # Get transaction details
POST   /api/v1/transactions           # Initiate new transaction
POST   /api/v1/transactions/:id/confirm # Confirm transaction (with PIN/OTP)
GET    /api/v1/transactions/:id/status # Get transaction status
GET    /api/v1/transactions/analytics  # Get spending analytics
```

#### Recipient APIs

```
GET    /api/v1/recipients             # List recipients
POST   /api/v1/recipients             # Add new recipient
GET    /api/v1/recipients/:id         # Get recipient details
PUT    /api/v1/recipients/:id         # Update recipient
DELETE /api/v1/recipients/:id         # Delete recipient
GET    /api/v1/recipients/recent      # Get recent recipients
```

#### FX Rate APIs

```
GET    /api/v1/fx/rates               # Get all available rates
GET    /api/v1/fx/rates/:pair         # Get specific pair (e.g., USD-NGN)
POST   /api/v1/fx/quote               # Get transfer quote with fees
GET    /api/v1/fx/countries           # Get supported countries
GET    /api/v1/fx/banks/:country      # Get banks for country
```

#### Notification APIs

```
GET    /api/v1/notifications          # Get user notifications
PUT    /api/v1/notifications/:id/read # Mark notification as read
PUT    /api/v1/notifications/read-all # Mark all as read
GET    /api/v1/notifications/settings # Get notification preferences
PUT    /api/v1/notifications/settings # Update notification preferences
```

#### Maya AI APIs

```
GET    /api/v1/maya/insights          # Get AI insights
GET    /api/v1/maya/score             # Get FUSE Smart Score
POST   /api/v1/maya/chat              # Chat with Maya AI
GET    /api/v1/maya/recommendations   # Get recommendations
```

---

## 5. Data Models

### 5.1 User Model

```typescript
interface User {
  id: string;                    // UUID
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  countryCode: string;           // e.g., "+1"
  dateOfBirth: Date;
  gender: 'Male' | 'Female' | 'Other';
  accountTier: 'Classic' | 'Premium';
  kycStatus: 'pending' | 'in_progress' | 'verified' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}
```

### 5.2 Transaction Model

```typescript
interface Transaction {
  id: string;                    // UUID
  userId: string;
  recipientId: string;
  sendAmount: number;
  sendCurrency: string;          // e.g., "USD"
  receiveAmount: number;
  receiveCurrency: string;       // e.g., "NGN"
  exchangeRate: number;
  fees: number;
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  transactionType: 'transfer' | 'deposit' | 'withdrawal';
  eta: string;                   // e.g., "01 - 02 Days"
  createdAt: Date;
  updatedAt: Date;
}
```

### 5.3 Recipient Model

```typescript
interface Recipient {
  id: string;                    // UUID
  userId: string;
  name: string;
  country: string;
  bankName: string;
  bankAccountNumber: string;
  bankCode?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 5.4 KYC Document Model

```typescript
interface KYCDocument {
  id: string;                    // UUID
  userId: string;
  documentType: 'passport' | 'national_id' | 'drivers_license';
  documentNumber: string;
  frontImageUrl: string;
  backImageUrl?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedAt?: Date;
  createdAt: Date;
}
```

---

## 6. Security Architecture

### 6.1 Authentication & Authorization

| Layer | Implementation |
|-------|----------------|
| **Password Storage** | bcrypt with cost factor 12 |
| **JWT Tokens** | RS256 algorithm, 15-minute access token expiry |
| **Refresh Tokens** | Secure HTTP-only cookies, 7-day expiry |
| **PIN Storage** | Argon2id hashing |
| **Device Binding** | Device fingerprint stored and validated |

### 6.2 Security Features

1. **Two-Factor Authentication (2FA)**
   - TOTP-based (Google Authenticator compatible)
   - SMS OTP fallback

2. **Biometric Authentication**
   - Device-level biometric (fingerprint/Face ID)
   - Server validates device attestation

3. **Device Change Detection**
   - New device triggers verification flow
   - SMS OTP + PIN verification required

4. **Security Questions**
   - Additional identity verification layer
   - Used for account recovery

### 6.3 Compliance Requirements

| Requirement | Implementation |
|-------------|----------------|
| **KYC/AML** | Third-party KYC provider integration |
| **PCI-DSS** | Payment data handled by compliant providers |
| **GDPR** | Data encryption, user consent, right to deletion |
| **Data Residency** | Region-specific data storage options |

---

## 7. Technology Stack Recommendations

### 7.1 Backend Stack

| Component | Recommended Technology |
|-----------|----------------------|
| **Runtime** | Node.js 20 LTS / Go 1.21+ |
| **Framework** | NestJS (Node.js) / Gin (Go) |
| **API Gateway** | Kong / AWS API Gateway |
| **Database** | PostgreSQL 16 (primary), Redis (caching) |
| **Message Queue** | RabbitMQ / AWS SQS |
| **Search** | Elasticsearch (for transaction search) |
| **Object Storage** | AWS S3 / MinIO (for KYC documents) |

### 7.2 Infrastructure

| Component | Recommended Technology |
|-----------|----------------------|
| **Container Orchestration** | Kubernetes (EKS/GKE/AKS) |
| **Service Mesh** | Istio / Linkerd |
| **Monitoring** | Prometheus + Grafana |
| **Logging** | ELK Stack / Loki |
| **Tracing** | Jaeger / AWS X-Ray |
| **CI/CD** | GitHub Actions / GitLab CI |

### 7.3 Third-Party Integrations

| Service Type | Providers to Consider |
|-------------|----------------------|
| **KYC/Identity** | Jumio, Onfido, Sumsub |
| **FX Rates** | XE, Open Exchange Rates, Currencylayer |
| **Payment Rails** | SWIFT, Wise Business API, Flutterwave |
| **SMS/OTP** | Twilio, MessageBird |
| **Email** | SendGrid, AWS SES |
| **Push Notifications** | Firebase Cloud Messaging |

---

## 8. Performance Requirements

### 8.1 SLA Targets

| Metric | Target |
|--------|--------|
| **API Response Time (P95)** | < 200ms |
| **API Response Time (P99)** | < 500ms |
| **Uptime** | 99.9% |
| **Transaction Processing** | < 5 seconds for domestic |
| **FX Rate Updates** | Every 30 seconds |

### 8.2 Scalability Considerations

- Horizontal scaling for stateless services
- Read replicas for database scaling
- Redis cluster for session management
- CDN for static assets and document delivery

---

## 9. Mobile App Integration Points

### 9.1 Current Mobile App Features (React Native / Expo)

The mobile application is built with:
- **React Native 0.81.5** with **Expo SDK 54**
- **React Navigation** (Native Stack + Bottom Tabs)
- **TypeScript** for type safety

### 9.2 API Integration Requirements

1. **Real-time Updates**
   - WebSocket connection for transaction status
   - Push notifications for alerts

2. **Offline Support**
   - Cache recent transactions locally
   - Queue failed requests for retry

3. **Error Handling**
   - Standardized error responses
   - User-friendly error messages

---

## 10. Appendix

### 10.1 Glossary

| Term | Definition |
|------|------------|
| **FUSE** | FuseRemit's smart remittance optimization algorithm |
| **Maya AI** | AI-powered financial assistant |
| **KYC** | Know Your Customer - identity verification process |
| **AML** | Anti-Money Laundering compliance |
| **FX** | Foreign Exchange |
| **OTP** | One-Time Password |

### 10.2 Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-04 | Architecture Team | Initial document |

---

## 11. Document Status

**Status**: Draft  
**Classification**: Internal - Technical  
**Review Required**: Yes  
**Next Review Date**: TBD

---

*This document serves as the foundational backend architecture specification for FuseRemit. All implementations should adhere to the standards and approaches outlined herein.*
