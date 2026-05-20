# Security Specification: Barista.OS

## Data Invariants
1. A user can only access their own inventory and sales data.
2. Inventory items must have a valid name, non-negative quantity, and a threshold.
3. Sales records must contain at least one item and have a valid timestamp.
4. User IDs in paths MUST match the authenticated user's UID.

## The "Dirty Dozen" Payloads (Red Team Test Cases)

1. **Identity Spoofing**: Attempt to create an inventory item in another user's path.
2. **Identity Spoofing**: Attempt to read another user's sales history.
3. **Negative Stock**: Attempt to set inventory quantity to a negative number.
4. **Massive Payload**: Attempt to inject 1MB string into the `name` field of an inventory item.
5. **Shadow Update**: Attempt to add an `isAdmin: true` field to an inventory item.
6. **Orphaned Sale**: Attempt to create a sales record with an empty `itemsSold` array.
7. **Timestamp Fraud**: Attempt to set a `timestamp` in the future or past manually.
8. **Unauthorized Deletion**: Attempt to delete another user's inventory item.
9. **Type Poisoning**: Attempt to set `quantity` as a string instead of a number.
10. **ID Poisoning**: Attempt to use an extremely long or invalid character string as a document ID.
11. **PII Leak**: Attempt to list all users in the system.
12. **State Shortcutting**: Attempt to update a 'processed' sales record back to 'pending' without authorization.

## Test Runner (firestore.rules.test.ts)
(To be implemented if testing environment is available)
