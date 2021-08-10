import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';
import { UsersService } from './users.service';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async signUp(email: string, password: string) {
    const users = await this.usersService.find(email);

    if (users.length) {
      throw new BadRequestException('User with this email already exists!');
    }

    // Generate salt
    const salt = randomBytes(8).toString('hex');

    // Hash the salt and password together
    const hash = (await scrypt(password, salt, 32)) as Buffer;

    // Join hashed result and the salt together
    const result = salt + '.' + hash.toString('hex');

    // Create new user and save it
    const user = await this.usersService.create(email, result);

    // return the user
    return user;
  }

  async signIn(email: string, password: string) {
    // Find user with email - find return array, and we only wont one
    const [user] = await this.usersService.find(email);

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    // Split password and salt on period
    const [salt, storedHash] = user.password.split('.');

    // Hash password
    const hash = (await scrypt(password, salt, 32)) as Buffer;

    // Comparison
    if (storedHash === hash.toString('hex')) {
      return user;
    } else {
      throw new BadRequestException('Password for this email is not correct.');
    }
  }
}
