import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { ValidPayloadDTO } from './utils/valid-payload.dto';
import validatePayload from './utils/validatePayload';


@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('identify')
  @HttpCode(HttpStatus.OK)
  async getContactInfo(@Body() body: ValidPayloadDTO) {

    // Payload validation
    const errors = (await validatePayload(body)).map((obj: any) => {
      return obj.constraints
    })
    if (errors.length > 0) throw new BadRequestException({
      error: errors
    });

    const { email, phoneNumber } = body
    if (!email && !phoneNumber) throw new BadRequestException({
      error: 'Please provide values for any one of the two - email or phoneNumber'
    })
    
    // Retrieves contact of primary precedence which has the given email id
    const primaryEmail = await this.appService.findPrimaryContact({ email: email })

    // Retrieves contact of primary precedence which has the given phoneNumber
    const primaryPhNumber = await this.appService.findPrimaryContact({ phoneNumber: phoneNumber })

    let primaryContact: any, exists: any;

    // Case 1 - Both email and phone number don't have a primary Contact in the DB
    if (!primaryEmail && !primaryPhNumber) {
      
      // Checks if either of the two values exist in the DB
      const emailExists = await this.appService.existsInDB({ email })
      const phoneNumExists = await this.appService.existsInDB({ phoneNumber })

      // Checks if there exists a contact with both of the given values
      exists = await this.appService.existsInDB({ email, phoneNumber })

      if (exists) {
        // Checks the contact it is linked to
        const contact = await this.appService.existsInDB({ id: exists.linkedId })

        // If linked contact is secondary, get its primary contact using the linkedId
        if (contact.linkPrecedence === 'secondary') {
          await this.appService.updateContact(exists.id, 'secondary', contact.linkedId)
          primaryContact = await this.appService.existsInDB({ id: contact.linkedId })
        }else {
          primaryContact = contact
        }
      } else if (emailExists || phoneNumExists) {

        // If either of the two given values exist in the DB, primary Contact is retrieved using the linkedId
        const linkedId = emailExists || phoneNumExists
        primaryContact = await this.appService.existsInDB({ id: linkedId.linkedId })

        //Secondary contact created using the given values
        await this.appService.createContact('secondary', primaryContact.id, email, phoneNumber)

      } else {
        // Creates a new contact of primary precedence
        primaryContact = await this.appService.createContact('primary', null, email, phoneNumber)
      }
    } // Case 2 - Both email and phone number exist in the DB
    else if (primaryEmail && primaryPhNumber) {
      
      // If both contacts share the same id, implies they belong to the same contact - return the same
      if (primaryEmail.id === primaryPhNumber.id) {
        primaryContact = primaryEmail
      } // Else set older contact as primary and the newer one as secondary 
      else if (primaryEmail.createdAt >= primaryPhNumber.createdAt) {
        primaryContact = primaryPhNumber
        await this.appService.updateContact(primaryEmail.id, 'secondary', primaryPhNumber.id)
      } else {
        primaryContact = primaryEmail
        await this.appService.updateContact(primaryPhNumber.id, 'secondary', primaryEmail.id)
      }

      // Checks if there exists a contact with both values 
      exists = await this.appService.existsInDB({ email, phoneNumber })

      // If no such contact exists, it creates a secondary contact of the same
      if (!exists) await this.appService.createContact('secondary', primaryContact.id, email, phoneNumber)

    } // Case 3 - Primary contact of either one of the two values exists in the DB 
    else {
      primaryContact = primaryEmail || primaryPhNumber

      exists = await this.appService.existsInDB({ email, phoneNumber })
      if (!exists) await this.appService.createContact('secondary', primaryContact.id, email, phoneNumber)
    }

    // Get all email ids, phone numbers and ids of all secondary contacts associated with the primary contact
    const emailIds = (await this.appService.getEmailIdsOrPhoneNumbers(primaryContact.id, { email: true })).map((obj: any) => obj.email)
    const phoneNumbers = (await this.appService.getEmailIdsOrPhoneNumbers(primaryContact.id, { phoneNumber: true })).map((obj: any) => obj.phoneNumber)
    const secondaryContactIds = (await this.appService.getEmailIdsOrPhoneNumbers(primaryContact.id, { id: true })).map((obj: any) => obj.id)
    
    return {
      contact: {
        primaryContactId: primaryContact.id,
        emails: [...new Set([primaryContact.email, ...emailIds])],
        phoneNumbers: [...new Set([primaryContact.phoneNumber, ...phoneNumbers])],
        secondaryContactIds
      }
    }
    
  }
}
