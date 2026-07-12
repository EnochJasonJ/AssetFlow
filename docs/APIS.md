# AssetFlow API Documentation

This document outlines the REST API endpoints required for the AssetFlow platform based on the core product modules. All APIs should reside under the `/api/v1` prefix and use JSON for payloads and responses.

---

## 1. Authentication & Users

### 1.1. Signup
- **Endpoint**: `POST /api/v1/auth/signup`
- **Purpose**: Creates an Employee account.
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "securepassword123"
  }
  ```
- **Response**:
  ```json
  {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "EMPLOYEE",
    "token": "jwt_token_here"
  }
  ```

### 1.2. Login
- **Endpoint**: `POST /api/v1/auth/login`
- **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "securepassword123"
  }
  ```
- **Response**: Same as Signup.

### 1.3. Get Employees
- **Endpoint**: `GET /api/v1/users`
- **Purpose**: Fetch employee directory.
- **Response**:
  ```json
  [
    {
      "id": "uuid",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "department_id": "uuid",
      "role": "EMPLOYEE",
      "status": "ACTIVE"
    }
  ]
  ```

### 1.4. Update Employee Role (Admin Only)
- **Endpoint**: `PATCH /api/v1/users/:id/role`
- **Purpose**: Promote employee to Department Head or Asset Manager.
- **Request Body**:
  ```json
  {
    "role": "ASSET_MANAGER"
  }
  ```
- **Response**: Updated user object.

---

## 2. Organization Setup

### 2.1. Create Department (Admin Only)
- **Endpoint**: `POST /api/v1/departments`
- **Request Body**:
  ```json
  {
    "name": "IT Support",
    "head_id": "uuid_of_user",
    "parent_department_id": null
  }
  ```
- **Response**:
  ```json
  {
    "id": "uuid",
    "name": "IT Support",
    "status": "ACTIVE"
  }
  ```

### 2.2. Get Departments
- **Endpoint**: `GET /api/v1/departments`
- **Response**: Array of department objects.

### 2.3. Create Asset Category (Admin Only)
- **Endpoint**: `POST /api/v1/categories`
- **Request Body**:
  ```json
  {
    "name": "Electronics",
    "custom_fields": ["warranty_period"]
  }
  ```
- **Response**: Created category object.

---

## 3. Asset Management

### 3.1. Register Asset (Asset Manager)
- **Endpoint**: `POST /api/v1/assets`
- **Request Body**:
  ```json
  {
    "name": "MacBook Pro M2",
    "category_id": "uuid",
    "serial_number": "C02XYZ123",
    "acquisition_date": "2023-01-15",
    "acquisition_cost": 2000,
    "condition": "NEW",
    "location": "HQ - Floor 2",
    "is_bookable": false
  }
  ```
- **Response**:
  ```json
  {
    "id": "uuid",
    "asset_tag": "AF-0001",
    "name": "MacBook Pro M2",
    "status": "AVAILABLE"
  }
  ```

### 3.2. Get Assets
- **Endpoint**: `GET /api/v1/assets?status=AVAILABLE&category_id=uuid`
- **Response**: Array of asset objects with their current status and location.

### 3.3. Get Asset History
- **Endpoint**: `GET /api/v1/assets/:id/history`
- **Response**: Array of allocation and maintenance events for the asset.

---

## 4. Asset Allocation & Transfers

### 4.1. Allocate Asset (Asset Manager)
- **Endpoint**: `POST /api/v1/allocations`
- **Request Body**:
  ```json
  {
    "asset_id": "uuid",
    "assigned_to_user_id": "uuid",
    "assigned_to_department_id": null,
    "expected_return_date": "2024-12-31"
  }
  ```
- **Response**: (409 Conflict if already allocated)
  ```json
  {
    "id": "uuid",
    "status": "ALLOCATED"
  }
  ```

### 4.2. Request Transfer
- **Endpoint**: `POST /api/v1/transfers`
- **Purpose**: Request an asset currently held by someone else.
- **Request Body**:
  ```json
  {
    "asset_id": "uuid",
    "requested_by_user_id": "uuid",
    "reason": "Need for project X"
  }
  ```
- **Response**: Transfer request object (Status: REQUESTED).

### 4.3. Return Asset
- **Endpoint**: `PATCH /api/v1/allocations/:id/return`
- **Request Body**:
  ```json
  {
    "condition_notes": "Screen scratched slightly",
    "status_after_return": "AVAILABLE"
  }
  ```
- **Response**: Updated allocation object.

---

## 5. Resource Booking

### 5.1. Create Booking
- **Endpoint**: `POST /api/v1/bookings`
- **Request Body**:
  ```json
  {
    "asset_id": "uuid",
    "start_time": "2023-11-20T09:00:00Z",
    "end_time": "2023-11-20T10:00:00Z"
  }
  ```
- **Response**: (409 Conflict if overlapping)
  ```json
  {
    "id": "uuid",
    "status": "UPCOMING"
  }
  ```

### 5.2. Get Bookings
- **Endpoint**: `GET /api/v1/bookings?asset_id=uuid`
- **Response**: Array of bookings (used for rendering calendar views).

---

## 6. Maintenance Management

### 6.1. Raise Maintenance Request
- **Endpoint**: `POST /api/v1/maintenance`
- **Request Body**:
  ```json
  {
    "asset_id": "uuid",
    "issue_description": "Battery not holding charge",
    "priority": "HIGH",
    "photo_url": "https://..."
  }
  ```
- **Response**: Maintenance object (Status: PENDING).

### 6.2. Update Maintenance Status (Asset Manager)
- **Endpoint**: `PATCH /api/v1/maintenance/:id/status`
- **Request Body**:
  ```json
  {
    "status": "APPROVED", 
    "technician_assigned": "Bob Fixit"
  }
  ```
- **Response**: Updated maintenance object (Asset status auto-updates to UNDER_MAINTENANCE).

---

## 7. Asset Audits

### 7.1. Create Audit Cycle (Admin)
- **Endpoint**: `POST /api/v1/audits`
- **Request Body**:
  ```json
  {
    "name": "Q4 IT Audit",
    "department_id": "uuid",
    "auditor_ids": ["uuid1", "uuid2"],
    "start_date": "2023-12-01",
    "end_date": "2023-12-15"
  }
  ```
- **Response**: Audit cycle object.

### 7.2. Log Audit Item
- **Endpoint**: `POST /api/v1/audits/:id/items`
- **Purpose**: Auditor marking an individual asset's status.
- **Request Body**:
  ```json
  {
    "asset_id": "uuid",
    "status_found": "MISSING",
    "notes": "Not at assigned desk"
  }
  ```
- **Response**: Logged audit item.

### 7.3. Close Audit
- **Endpoint**: `PATCH /api/v1/audits/:id/close`
- **Purpose**: Locks the cycle and auto-updates asset statuses (e.g., to LOST).
- **Response**: Discrepancy report summary.

---

## 8. Dashboard & Analytics

### 8.1. Get KPIs
- **Endpoint**: `GET /api/v1/dashboard/kpis`
- **Response**:
  ```json
  {
    "assets_available": 120,
    "assets_allocated": 45,
    "maintenance_today": 3,
    "active_bookings": 8,
    "pending_transfers": 2,
    "upcoming_returns": 5
  }
  ```

### 8.2. Get Notifications
- **Endpoint**: `GET /api/v1/notifications`
- **Response**:
  ```json
  [
    {
      "id": "uuid",
      "type": "OVERDUE_RETURN",
      "message": "Asset AF-0001 is overdue for return.",
      "read": false,
      "created_at": "2023-11-19T10:00:00Z"
    }
  ]
  ```
