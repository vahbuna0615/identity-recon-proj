import { plainToClass } from "class-transformer";
import { ValidPayloadDTO } from "./valid-payload.dto";
import { validate } from "class-validator";

const validatePayload = async (obj: any) => {
  const payloadObj = plainToClass(ValidPayloadDTO, obj)

  const errors = await validate(payloadObj, { whitelist: true })

  return errors
}

export default validatePayload;