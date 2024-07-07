import { IsEmail, IsOptional, IsPhoneNumber } from "class-validator";

export class ValidPayloadDTO {
  @IsOptional()
  @IsEmail()
  email: string

  @IsOptional()
  @IsPhoneNumber()
  phoneNumber: string
}