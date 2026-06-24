import { initializeDataSource } from '../data-source';
import { User } from '../entities/user.entity';
import bcrypt from 'bcryptjs';
import { Role } from '../auth.stub';

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

  // Create sample tenders (best effort; may fail if tables not ready)
  try {
    const tenderRepo = ds.getRepository('tenders');
    await tenderRepo.save({ title: 'Supply of office chairs', tenderType: 'Goods', procuringEntity: 'Local Council', budget: 50000 });
    await tenderRepo.save({ title: 'Road maintenance works', tenderType: 'Works', procuringEntity: 'Rural District', budget: 200000 });
    console.log('Sample tenders created');
  } catch (e: any) {
    console.log('Failed to create sample tenders (ok if table not ready yet):', e?.message || String(e));
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
