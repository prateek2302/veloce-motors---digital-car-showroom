# Veloce Motors — Firestore Security Specification

## 1. Data Invariants
1. **Strict Ownership Isolation (PII Protection)**: Customer profiles (`/users/{userId}`), vehicle reservations (`/reservations/{reservationId}`), and private tour bookings (`/tourBookings/{bookingId}`) are strictly private to the owning authenticated, email-verified user (`request.auth.uid == ownerUid`).
2. **Identity Integrity**: Every write operation enforces `incoming().userId == request.auth.uid` (or `uid == request.auth.uid` on `/users`), preventing identity spoofing.
3. **Temporal Integrity**: `createdAt` and `updatedAt` must equal `request.time` on creation, `createdAt` is immutable on update, and `updatedAt` must equal `request.time` on update.
4. **Terminal State Locking**: Once a reservation reaches `reservationStatus == 'cancelled'` (with `paymentStatus == 'refunded'`) or a tour booking reaches `status == 'cancelled'`, no subsequent updates are permitted.
5. **No Shadow Fields**: Every collection uses `keys().hasAll(...) && keys().hasOnly(...)` on schema validation and `affectedKeys().hasOnly(...)` on updates.

## 2. Adversarial Payloads ("Dirty Dozen")
1. **Identity Spoofing on Reservation Create**: `userId: "other_user_uid"` -> `PERMISSION_DENIED`.
2. **Shadow Field Injection on Profile**: Adding `isAdmin: true` or `role: "admin"` -> `PERMISSION_DENIED` (rejected by `keys().hasOnly()`).
3. **Cross-User PII Read**: Authenticated user A requesting `get /users/userB` -> `PERMISSION_DENIED`.
4. **Unfiltered Collection Scraping**: `list /reservations` without `where('userId', '==', uid)` -> `PERMISSION_DENIED`.
5. **Unverified Email Write**: Token with `email_verified: false` creating a reservation -> `PERMISSION_DENIED`.
6. **Client Timestamp Forgery**: `createdAt: "2020-01-01T00:00:00Z"` instead of `request.time` -> `PERMISSION_DENIED`.
7. **State Shortcutting on Create**: Creating reservation with `reservationStatus: "cancelled"` or `paymentStatus: "refunded"` -> `PERMISSION_DENIED`.
8. **Post-Cancellation Mutation**: Updating a reservation whose existing `reservationStatus == "cancelled"` -> `PERMISSION_DENIED`.
9. **Price Tampering on Update**: Attempting to alter `vehiclePrice` or `depositAmount` during a reservation update -> `PERMISSION_DENIED` (rejected by `affectedKeys().hasOnly()`).
10. **ID Poisoning**: Document ID exceeding 128 chars or containing `$` / `/` / spaces -> `PERMISSION_DENIED` (`isValidId()`).
11. **String Exhaustion**: `notes` > 400 chars or `vehicleName` > 120 chars -> `PERMISSION_DENIED`.
12. **Direct Delete Bypass**: Attempting `delete /reservations/{id}` to erase financial trail -> `PERMISSION_DENIED`.
