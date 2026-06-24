import { initializeDataSource } from '../src/data-source';
import { User } from '../src/entities/user.entity';
import bcrypt from 'bcryptjs';
import { Role } from '../src/../auth.stub';

async function seed() {
  const ds = await initializeDataSource();
  const userRepo = ds.getRepository(User);

  const existing = await userRepo.find();
  if (existing.length > 0) {
    console.log('DB already seeded');
    process.exit(0);
  }

  const password = 'Password123!';
  const hash = await bcrypt.hash(password, 10);

  const roles = [Role.Supplier, Role.PMU_Officer, Role.PRAZ_Regulator, Role.Public_Observer];

  for (const role of roles) {
    const user = userRepo.create({ email: `${role.toLowerCase()}@example.com`, passwordHash: hash, role });
    await userRepo.save(user);
    console.log('Created user', user.email, 'with password:', password);
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
