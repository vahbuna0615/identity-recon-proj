# Project: Identity Reconciliation

## Overview
NestJS service with PostgreSQL and Prisma to handle identity reconciliation via a single endpoint.

## Technologies
- **NestJS**
- **PostgreSQL**
- **Prisma**

## Endpoint
### `POST /identify`
Receives a POST request to identify a contact.

#### Request Body
```json
{
  "email"?: "string",
  "phoneNumber"?: "number"
}
```
- `email`: (optional) Valid email.
- `phoneNumber`: (optional) Valid phone number.

#### Response
Returns HTTP 200 with consolidated contact info.

```json
{
  "contact": {
    "primaryContactId": "number",
    "emails": ["string"],
    "phoneNumbers": ["string"],
    "secondaryContactIds": ["number[]"]
  }
}
```

## Validation
- The request body is validated using class-validator to ensure the email addresses and phone numbers are valid.
- If validation fails, a BadRequestException (status code 400) is thrown with the errors in the response object.
- If neither email nor phoneNumber is provided, a BadRequestException is thrown with the message: Please provide values for any one of the two - email or phoneNumber.

## Logic
1. **Validation**: Validate request body.
2. **Retrieving Contacts**:
   - **Case 1**: No primary contact associated with either email or phone number.
   - **Case 2**: Primary contact exists for both email and phone number (either the same or separate contacts).
   - **Case 3**: Primary contact exists for either email or phone number.
3. **Handling Cases**:
   - If the combination of email and phoneNumber does not exist in the database at all, a primary contact is created.
   - If the combination exists in the database as a primary or secondary contact, the primary contact's information is returned without creating new contacts.
   - If either of the values exist in the database or both exist in separate contacts, a new secondary contact with the given combination is created.

## Errors
- **400 Bad Request**: On validation failure or missing `email`/`phoneNumber`.

## Examples

### Valid Request
```json
{
  "email": "example@example.com",
  "phoneNumber": "+91 1234567890"
}
```

### Invalid Request
```json
{
  "email": "invalid-email",
  "phoneNumber": "invalid-phone-number"
}
```

### Response Example
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["example@example.com"],
    "phoneNumbers": ["+91 1234567890"],
    "secondaryContactIds": [2, 3]
  }
}
```

## Conclusion
This service ensures efficient identity reconciliation by validating and consolidating contact information based on provided email and phone number. It handles various cases to either create new contacts or return existing primary contact information, maintaining data consistency and accuracy.
