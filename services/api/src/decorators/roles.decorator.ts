import { SetMetadata } from '@nestjs/common';
import { Role } from '../auth.stub';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
