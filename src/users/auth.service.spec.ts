import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { UsersService } from './users.service';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    // Create fake copy of users service
    const users: User[] = [];
    fakeUsersService = {
      find: (email: string) => {
        const filteredUsers = users.filter((user) => user.email === email);
        return Promise.resolve(filteredUsers);
      },
      create: (email: string, password: string) => {
        const user = {
          id: Math.floor(Math.random() * 99999),
          email,
          password,
        } as User;
        users.push(user);
        return Promise.resolve(user);
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('creates new user with a salted and hashed password', async () => {
    const user = await service.signUp('nejc@gmail.com', '123456');
    expect(user.password).not.toEqual('123456');
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws an error if user signs up with email already in use', async (done) => {
    await service.signUp('nejc@gmail.com', '123456');
    try {
      await service.signUp('nejc@gmail.com', '123456');
    } catch (error) {
      done();
    }
  });

  it('throws if sign in is called with an unused email', async (done) => {
    try {
      await service.signIn('nejc@gmail.com', '123456');
    } catch (error) {
      done();
    }
  });

  it('throws if an invalid password is provided', async (done) => {
    await service.signUp('nejc@gmail.com', '123456');

    try {
      await service.signIn('nejc@gmail.com', '789123');
    } catch (error) {
      done();
    }
  });

  it('return a user if correct password is provided', async () => {
    await service.signUp('nejc@gmail.com', '123456');
    const user = await service.signIn('nejc@gmail.com', '123456');
    expect(user).toBeDefined();
  });
});
