import { Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class CommonService {
  getMessage(): Record<string, string> {
    return {
      message: 'Welcome to Fintrack App',
    };
  }

  getUuid(): Record<string, string> {
    const uuid = uuidv7();
    return {
      uuid: uuid,
    };
  }
}
