import { initializeDataSource } from '../data-source';
import { User } from '../entities/user.entity';
import { Tender, TenderType, TenderStatus } from '../tender/tender.entity';
import { Bid, BidStatus } from '../bid/bid.entity';
import bcrypt from 'bcryptjs';
import { Role } from '../auth.stub';
import { encrypt } from '../crypto/encryption';

async function seed() {
  const ds = await initializeDataSource();
  const userRepo = ds.getRepository(User);
  const tenderRepo = ds.getRepository(Tender);
  const bidRepo = ds.getRepository(Bid);

  const existing = await userRepo.find();
  if (existing.length > 0) {
    console.log('DB already seeded');
    process.exit(0);
  }

  const password = 'Password123!';
  const hash = await bcrypt.hash(password, 10);

  // Create users
  const roles = [Role.Supplier, Role.PMU_Officer, Role.PRAZ_Regulator, Role.Public_Observer];
  let supplier: User | null = null;
  let pmuOfficer: User | null = null;

  for (const role of roles) {
    const user = userRepo.create({ 
      email: `${role.toLowerCase()}@example.com`, 
      passwordHash: hash, 
      role 
    });
    const savedUser = await userRepo.save(user);
    console.log('Created user', savedUser.email, 'with password:', password);
    
    if (role === Role.Supplier) supplier = savedUser;
    if (role === Role.PMU_Officer) pmuOfficer = savedUser;
  }

  if (!supplier || !pmuOfficer) {
    throw new Error('Failed to create required users');
  }

  // Create sample tenders
  try {
    const tender1Data = {
      title: 'Supply of office chairs',
      description: 'Procurement of 100 office chairs for government offices',
      tenderType: TenderType.Goods,
      procuringEntity: 'Ministry of Local Government',
      budget: 50000,
      currency: 'ZWL',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: TenderStatus.Published,
      publishedBy: pmuOfficer.id,
    };
    const tender1 = tenderRepo.create(tender1Data);
    const savedTender1 = await tenderRepo.save(tender1);
    console.log('Created tender:', savedTender1.title);

    const tender2Data = {
      title: 'Road maintenance works',
      description: 'Routine maintenance of rural district roads',
      tenderType: TenderType.Works,
      procuringEntity: 'Rural District Council',
      budget: 200000,
      currency: 'ZWL',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      status: TenderStatus.Published,
      publishedBy: pmuOfficer.id,
    };
    const tender2 = tenderRepo.create(tender2Data);
    const savedTender2 = await tenderRepo.save(tender2);
    console.log('Created tender:', savedTender2.title);

    // Create sample bids with encryption
    const encryptionSecret = process.env.ENCRYPTION_KEY || 'dev-encryption-secret';
    
    // Draft bid
    const draftBid = bidRepo.create({
      tenderId: savedTender1.id,
      supplierId: supplier.id,
      encryptedAmount: encrypt('45000', encryptionSecret),
      currency: 'ZWL',
      status: BidStatus.Draft,
      coiDeclaration: null,
    });
    await bidRepo.save(draftBid);
    console.log('Created draft bid for tender:', savedTender1.title);

    // Sealed bid (past deadline for testing)
    const sealedTenderData = {
      title: 'IT infrastructure upgrade',
      description: 'Implementation of new IT systems',
      tenderType: TenderType.IT,
      procuringEntity: 'Department of Health',
      budget: 500000,
      currency: 'ZWL',
      deadline: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      status: TenderStatus.Published,
      publishedBy: pmuOfficer.id,
    };
    const sealedTender = tenderRepo.create(sealedTenderData);
    const savedSealedTender = await tenderRepo.save(sealedTender);
    console.log('Created past-deadline tender:', savedSealedTender.title);

    const sealedBid = bidRepo.create({
      tenderId: savedSealedTender.id,
      supplierId: supplier.id,
      encryptedAmount: encrypt('480000', encryptionSecret),
      currency: 'ZWL',
      status: BidStatus.Sealed,
      sealedAt: new Date(),
      coiDeclaration: {
        supplierId: supplier.id,
        declaredCompany: 'ABC Tech Solutions',
        conflicts: 'None known',
        affiliations: [],
      },
    });
    await bidRepo.save(sealedBid);
    console.log('Created sealed bid for past-deadline tender');

    console.log('Sample tenders and bids created');
  } catch (e: any) {
    console.log('Failed to create sample tenders/bids:', e?.message || String(e));
    console.log(e);
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
