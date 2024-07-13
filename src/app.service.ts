import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from './database/database.service';

@Injectable()
export class AppService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findPrimaryContact(opt: any) {
    const options = {
      ...opt,
      linkPrecedence: 'primary'
    }
    return this.databaseService.contact.findFirst({
      where: options
    })
  }

  async createContact(linkPrecedence: 'primary' | 'secondary', linkedId?: number, email?: string, phoneNumber?: string) {
    return this.databaseService.contact.create({
      data: {
        linkedId,
        phoneNumber,
        email,
        linkPrecedence
      } 
    })
  }

  async updateContact(id: number, linkPrecedence: 'primary' | 'secondary', linkedId?: number, email?: string, phoneNumber?: string) {
    return this.databaseService.contact.update({
      where: {id},
      data: {
        linkedId,
        linkPrecedence,
        email,
        phoneNumber
      }
    })
  }

  async getEmailIdsOrPhoneNumbers(primaryId: number, selectedField: object){ 
    return this.databaseService.contact.findMany({
      where: {linkedId: primaryId},
      select: selectedField
    })
  }

  async existsInDB (selectedField: any) {
    return await this.databaseService.contact.findFirst({
      where: selectedField
    })
  }

}
